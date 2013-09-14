/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var dev = process.env.BB_SERVER_DEV;

console.log(dev);

if (dev) console.log('\n------Server running with development settings------\n');

var server = require('bb-server')
,sendMail = require("./sendMail.js")
,sync = require("./sync.js")
,signin = require("./signin.js")
,signout = require("./signout.js")
,dropbox_authorize = require("./dropbox_authorize.js")
,dropbox_connect = require("./dropbox_connect.js")
,debug = require("./debug.js")
,db = require("./db.js")
// db = require("./db")
;

var options = { 
        root: './www'
    // "forward": [
    //     { "prefix": "local",
    //       "target": "http://localhost:5984" },
    //     { "prefix": "iris",
    //       "target": "https://michieljoris.iriscouch.com"}
// ]
    ,"dir": dev
    ,"index": !dev
    ,"silent": false
    ,"port": 6005
    ,postHandlers: {
        // "/" : db
        "/sendmail" : sendMail
        ,"/signin": signin
        ,"/signout": signout
        ,"/db": db
        }
    ,getHandlers: {
        "/debug": debug,
        "/sync": sync,
        "/dropbox_authorize": dropbox_authorize,
        "/dropbox_connect": dropbox_connect
    }
    ,sessions: {
        expires: 30*24*60*60  //one month
    }
};

server.go(options);

