/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 
var server = require('nano')('http://localhost:5984');
// var db = server.use('personalinfo');

var db = require('nano')(
  { "url"             : "http://localhost:5984/personalinfo"
  // { "url"             : "http://michieljoris.iriscouch.com/personalinfo"
  // , "request_defaults" : { "proxy" : "http://someproxy" }
  , "log"             : function (id, args) { 
      console.log(id, args);
    }
  });

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

function operate(res, data) {
    console.log('To be saved: ', data);
    db.get('rabbit2', function(err, body, header) {
        if (err) sendResponse(res, { success:false, reason: err});
        else sendResponse(res, { success:true, body: body});
    });
    // db.insert(data, 'rabbit2', function(err, body, header) {
    //     if (err) sendResponse(res, { success:false, reason: err});
    //     else sendResponse(res, { success:true, body: body});
    // });
}


exports.handlePost = function(req, res) {
    console.log('query:', req.url.query);
    console.log('Save is handling post!!');
    
    
    var data = '';
    req.on('data', function(chunk) {
        data+=chunk;
    });
    
    req.on('end', function() {
        try {
            data = JSON.parse(data);
           operate(res, data);
        } catch(e) {
            sendResponse(res, {success:false, reason: 'Could not parse JSON!!'});
        }
        
    });
    
    req.on('error', function(e) {
        res.write(JSON.stringify({ success:false, error:e }));
        res.end();
    });
    var session = req.session;
    
    
}; 
