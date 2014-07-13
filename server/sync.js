/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var htmlBuilder = require('html-builder');
var fs = require('fs');
var dbox  = require("dbox");
var dropboxApp = require("./dropboxApp");

var client;
    

function getModTime(path) {
    try {
        var stats = fs.statSync(process.cwd() + path);
        return stats.mtime;
    } catch(e) {
        return null;
    }
}

var allMetaData = {};

function getMetaData( path, callback) {
    var options = {
        file_limit         : 10000,              // optional
        hash               : allMetaData[path] ? allMetaData[path].hash : '',
        list               : true,               // optional
        include_deleted    : false              // optional
        // ,rev                : 7,                  // optional
        // locale:            : "en",               // optional
        // root:              : "sandbox"           // optional
    };

    client.metadata(path, options, function(status, reply){
        if (status === 304) {
            callback(allMetaData[path]);
            return;   
        }
        if (status !== 200)  {
            console.log("error in retrieving metadata for " + path);
            callback();
            return;
        }
        if (!reply.is_dir) {
            console.log("Retrieved metadata for file " + path);
            callback();
            return;
        }
        allMetaData[path] = reply;
        callback(reply);
    });
}

function buildMetaData(path, done) {
    
    getMetaData(path, function(metaData) {
        if (metaData && metaData.contents) {
            var dirCount = 0;
            metaData.contents.forEach(function(c) {
                if (c.is_dir) dirCount++;
            });
            metaData.contents.forEach(function(c) {
                if (c.is_dir) {
                     buildMetaData(c.path, function() {
                         dirCount--;
                         if (!dirCount) done(); 
                     });
                }
            });
            
            
        } 
        else done();
    });
}
    
exports.handleGet = function(req, res) {
    
    var fileMap  = fs.readFileSync("./server/DropboxToServerMap.json", 'utf8');
    
    fileMap = JSON.parse(fileMap);
    console.log(fileMap);
    res.writeHead(200, {
        'Content-Type': 'text/html'
	// 'last-modified': GMTdate
    });
    
    var app_key= dropboxApp.data.app_key;
    var app_secret = dropboxApp.data.app_secret;

    var app   = dbox.app({ "app_key": app_key, "app_secret": app_secret });
    var access_token;
    console.log(req.url.query);
    try {
        access_token  = fs.readFileSync("./access_token.json", 'utf8');
        access_token = JSON.parse(access_token);
    } catch(e) {
        res.end("Can't find access token. Maybe try to authorize " +
                '<a target="_blank" href="' + "/dropbox_authorize" + '">dropbox</a>' +
                " first");
        return;
       
    } 
    // console.log(access_token);
    
    client = app.client(access_token);
    
    // getMetaData(client, '/');
    buildMetaData('/', function() {
       console.log("Done!!!");
        console.log(allMetaData);
    });
    // client.account(function(status, reply){
    //     // console.log(status, reply);
    //     if (status !== 200) {
    //         res.end("I am supposed to have access, but still can't connect!!");
    //         return;
    //     }
    //     res.write("Now connected with " + reply.display_name);
    //     res.write("<p>I can access the following folder: Apps/");
    //     res.end('<p>Thank you!!');
    // });
    

    // client.readdir('/', function(status, reply){
    //     console.log(reply)
    // });
    
    var options = {
        file_limit         : 10000,              // optional
        include_deleted    : false,              // optional
        locale            : "en"                // optional
    };
    // client.get("aboutus.md", function(status, reply, metadata){
    //     console.log(reply.toString(), metadata);
    // });

    // client.search("/",".md", options, function(status, reply){
    //     console.log(reply);
    // });
    // htmlBuilder.build();
};