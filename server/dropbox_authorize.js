/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var dbox  = require("dbox");
var fs = require('fs');
var dropboxApp = require("./dropboxApp");
    
exports.handleGet = function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
	// 'last-modified': GMTdate
    });
    
    var app_key= dropboxApp.data.app_key;
    var app_secret = dropboxApp.data.app_secret;

    var app   = dbox.app({ "app_key": app_key, "app_secret": app_secret });

    app.requesttoken(function(status, request_token){
        console.log(request_token);
        
        fs.writeFile("./request_token.json", JSON.stringify(request_token), function(err) {
            if(err) {
                console.log(err);
                res.end("Couldn't store request_token...");
            } else {
                res.write('<a target="_blank" href="' + request_token.authorize_url + '">Authorize</a>');
                
                res.end('<p>Click the authorize link, this will open dropbox in a new tab. Go through the hoops and when finished come back to this page and click the following link: <p>' +
                        '<a href="/dropbox_connect">Connect</a>');
                console.log("Request token was saved!");
                
            }
        }); 
        
        
        
    });
};







