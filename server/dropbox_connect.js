/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var dbox  = require("dbox");
var dropboxApp = require("./dropboxApp");

var fs = require('fs');
    
exports.handleGet = function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
	// 'last-modified': GMTdate
    });
    // htmlBuilder.build();
    
    var app_key= dropboxApp.data.app_key;
    var app_secret = dropboxApp.data.app_secret;
    
    var app   = dbox.app({ "app_key": app_key, "app_secret": app_secret });

    console.log('in connect!!');
    
    
    // var request_token = { oauth_token_secret: 'cwp6bJQVaF0PP96O',
    //                       oauth_token: 'NunLFKf0yjvVA7KB',
    //                       authorize_url: 'https://www.dropbox.com/1/oauth/authorize?oauth_token=NunLFKf0yjvVA7KB' };
    var request_token;
    try {
        request_token  = fs.readFileSync("./request_token.json", 'utf8');
        request_token = JSON.parse(request_token);
    } catch(e) {
        res.end("Can't find request_token. Maybe try to authorize " +
                '<a target="_blank" href="' + "/dropbox_authorize" + '">dropbox</a>' +
                " first");
        return;
       
    } 
    console.log(request_token);

    app.accesstoken(request_token, function(status, access_token){
        console.log(status, access_token);
        if (status !== 200) {
            // res.end("" access_token.toString());
            console.log(Object.keys(access_token)[0].toString());
            // res.write(Object.keys(access_token)[0].toString());
            res.write("No luck, I got an error back.");
            res.end("<p>It timed out or you might have waited too long before clicking on the connect link..<p>" +
                    "Try again: " +
                    '<a target="_blank" href="' + "/dropbox_authorize" + '">dropbox</a>'
                   );
        }
        else {
                
            fs.writeFile("./access_token.json", JSON.stringify(access_token), function(err) {
                if(err) {
                    console.log(err);
                    res.end("ERROR: Couldn't store access_token..." + err.toString());
                } else {
                    var client = app.client(access_token);
                    client.account(function(status, reply){
                        console.log(status, reply);
                        if (status !== 200) {
                            res.end("I am supposed to have access, but still can't connect!!");
                            return;
                        }
                        res.write("Now connected with " + reply.display_name);
                        res.write("<p>I can access the following folder: Apps/firstdoor");
                        res.end('<p>Thank you!!');
                    });
                    console.log("Access token was saved!");
                
                }
            }); 
                
            
        }
    });
    
};







