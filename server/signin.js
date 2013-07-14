/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var https = require('https');
var querystring = require('querystring');
var VOW = require('./vow').VOW;
var audience = process.env.AUDIENCE;

var server = require('nano')('http://localhost:5984');
// var db = server.use('personalinfo');

var db = require('nano')(
  { "url"             : "http://localhost:5984/personalinfo_users"
  // { "url"             : "http://michieljoris.iriscouch.com/personalinfo_users"
  // , "request_defaults" : { "proxy" : "http://someproxy" }
  , "log"             : function (id, args) { 
      console.log(id, args);
    }
  });

var options = {
    hostname: 'verifier.login.persona.org',
    port: 443,
    path: '/verify',
    method: 'POST'
};

function verifyReq(assertion) {
    var vow = VOW.make();
    var data = querystring.stringify({
        assertion: assertion,
        audience: audience ? audience : 'localhost'
    });
    
    options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
    };
    
    var req = https.request(options, function(res) {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        var data = "";
        res.on('data', function (chunk) { data += chunk; });
        res.on('end', function () { 
            // console.log('BODY: ' + data);
            try {
                data = JSON.parse(data);
                vow.keep(data);
            } catch(e) {
                console.log("non-JSON response from verifier");
                // bogus response from verifier!
                vow['break']("bogus response from verifier!");
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message, e);
        vow['break']('problem with request: ' + e.message);
    });
    
    req.write(data);
    req.end();
    return vow.promise;
}

function sendResponse(res, obj) {
    var headers = {'Content-Type': 'text/html'};
    var returnCode = 403;
    var descr = obj.reason;
    if (obj.success) {
        var expireDate = new Date(new Date().getTime() + 24*60*60).toUTCString();
        // headers['Set-Cookie'] = 'persona=' +obj.email + '; expires=' + expireDate;
        returnCode = 200; 
        descr = "OK";
    }
    res.writeHead(returnCode, descr, headers);
    res.write(JSON.stringify(obj));
    res.end();
}

function isValid(data, session) {
    var vow = VOW.make();
    console.log(data);
    var valid = data && data.status === 'okay';
    var email = valid ? data.email : null;
    if (valid) {
        console.log('assertion verified succesfully for email:', email);
        if (session) {
            session.set({
                email: email,
                verified: true
            }, function(err) {
                if (!err) {
                    // sendResponse(res, { success: true, email: email});   
                    vow.keep(email);
                }
                else {
                    vow['break']('Could not save session data!!');
                }
            });
        } 
    }
    else {
        console.log("failed to verify assertion:", data.reason);   
        // sendResponse(res, { success: false, reason: data.reason});
        vow['break'](data.reason);
    }
    return vow.promise;
}

function saveUser(email) {
    var vow = VOW.make();
    
    db.get(email, function(err, doc, header) {
        if (err) {
            db.insert({ lastLogin: new Date() }, email, function(err, body, header) {
                if (err) { vow['break']("Couldn't add ' + email ' to the user database!! ' + err.reaon"); } 
                else vow.keep(email);
            });
        }
        else {
            doc.lastLogin = new Date();
            db.insert(doc, email, function(err, doc, header) {
                if (err) { vow['break']("Couldn't add ' + email ' to the user database!! ' + err.reaon"); } 
                else vow.keep(email);
            });
        }
    });
    
    return vow.promise;
}

function verify(session, assertion, res) {
    verifyReq(assertion).when(
        function(data) {
            return isValid(data, session, res);
        }).when (
            saveUser
        ).when(
            function(email) {
                sendResponse(res, { success: true, email: email });
            },
            function(error) {
                sendResponse(res, { success: false, reason: error });
            }
        );
}

exports.handlePost= function(req, res) {
    console.log('Signin is handling post!!');
    console.log('x-forwarded-for:' + req.headers['x-forwarded-for']);
    
    // console.log('session email is: ' , req.session.get('email'));
    
    var data = '';
    req.on('data', function(chunk) {
        data+=chunk;
    });
    
    req.on('end', function() {
        try {
            data = JSON.parse(data);
            verify(req.session, data.assertion, res);
        } catch(e) {
            sendResponse(res, { success:false, error:'non-JSON received!!!' });
            // res.end();
        } 
    });
        
    req.on('error', function(e) {
        sendResponse(res, { success: false, reason: e });
    });
    
    console.log('Verifying assertion!!!');
};