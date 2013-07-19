/*global $:false couchapi:false PBKDF2:false emit:false*/
/*jshint strict:true unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:4 maxcomplexity:7 maxlen:130 devel:true newcap:false*/

$.couch.urlPrefix = "http://localhost:5984";
function testCntl($scope, $timeout) {
    "use strict" ;
    console.log('in manager controller');
    $scope.info = function () {
        console.log('info');
        $.couch.info({
            success: function(data) {
                console.log(data);
            }
        });
    };
    
    $scope.allDbs = function() {
        console.log('allDbs');
        $.couch.allDbs({
            success: function(data) {
                console.log(data);
            }
        
        });
    }; 

    $scope.signup = function() {
        couchapi.userAdd($scope.name, $scope.pwd, ["newrole"]).when(
            function(data) {
                console.log(data);
            }
        );
        // var userDoc = {
        //     // _id: "org.couchdb.user:" + $scope.name,
        //     name: $scope.name
        //     ,roles:['somerole']
        // };
        // $.couch.signup(userDoc, $scope.pwd, {
        //     success: function(data) {
        //         console.log(data);
        //     },
        //     error: function(status) {
        //         console.log(status);
        //     }
        // });
    };
    $scope.login = function() {
        $.couch.login({
            // url: 'http://127.0.0.1:5984',
            name: $scope.name,
            password: $scope.pwd,
            withCredentials:true,
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
        });
    };
    $scope.session = function(){
        couchapi.session().when( function(data) {
            console.log(data);
        });
    };
    
    $scope.dbInfo = function() {
        couchapi.dbInfo($scope.dbName).when(
            function(data) {
                console.log(data);
            },function(data) {
                console.log(data);
            }
        );
    };
    
    $scope.logout = function() {
        $.couch.logout({
            success: function(data) {
                console.log(data);
            }
        });
    };
    $scope.setDbProperty = function() {
        $.couch.db('atest').setDbProperty('_security', {}, {
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
            
        });
    }; 
    $scope.getDbProperty = function() {
        $.couch.db('atest').getDbProperty('_security', {
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
            
        });
    }; 
    $scope.config = function() {
        $.couch.config({
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
        });
    };
    $scope.salt = '77bac623e30d91809eecbc974aecf807';
    $scope.pwd = 'password';
    $scope.hash = function() {
        var key = new PBKDF2($scope.pwd, $scope.salt, 10, 20).deriveKey();
        console.log('result =' + key);
    };
    $scope.active = function() {
        couchapi.activeTasks().when(
            function(data) {
                console.log(data); 
            } 
            ,function(data) {
                console.log(data); 
            } 
        );
    }; 
    $scope.replicateRemove = function() {
        couchapi.replicationRemove($scope.repId).when(
            function(data) {
                console.log(data);
            }
            ,function(data) {
                console.log(data);
            }
        );
    }; 
    $scope.docId = 'bla';
    $scope.params = "";
    //open_revs=all rev=asdfasf4333 conflicts=true
    $scope.docGet = function() {
        var options = {};
        var params = $scope.params.split('&');
        params.forEach(function(p) {
            var pair = p.split('=');
            options[pair[0]] = pair[1];
        });
        couchapi.docGet($scope.docId, options, 'b').when(
            function(data) {
                console.log(data);
            },
            function(data) {
                console.log(data);
            }
        );
    };
    $scope.replicateStop = function() {
        couchapi.replicateStop($scope.repId).when(
            function(data) {
                console.log(data);
            }
            ,function(data) {
                console.log(data);
            }
        );
    };
    
    $scope.replicateDo = function() {
        couchapi.replicateDo($scope.source, $scope.target, {
            create_target: true,
            continuous: $scope.continuous
        }).when(
            function(data) {
                console.log(data);
            }
            ,function(data) {
                console.log(data);
            }
        );
    };
    
    $scope.replicate = function() {
        console.log('replicate');
        couchapi.replicationAdd($scope.repId, {
            source: $scope.source
            ,target: $scope.target
            ,create_target: true
            ,continuous: $scope.continuous
            ,role: '_admin'
        }).when(
            function(data) {
                console.log(data);
            }
            ,function(data) {
                console.log(data);
            }
        );
    };
    
    var fun = function(doc) {
            if (doc._conflicts) {
                emit(null, [doc._rev].concat(doc._conflicts));
            }
        };
    var conflicts =
        {"map" : fun.toString()};
    
    $scope.addView = function() {
        console.log(conflicts);
        console.log(JSON.stringify(conflicts));
        // console.log($scope.viewFun);
        // var obj = JSON.parse($scope.viewFun);
        // console.log(obj)
        couchapi.dbDesignDoc($scope.viewGroup, $scope.viewFunName, conflicts, $scope.dbName).
            when(
                function(data) {
                    console.log(data);
                }
                ,function(data) {
                    console.log(data);
                }
            );
    };
    
    // $scope.acetext = "hello!!!";
    
    // // Editor part
    // var _editor = window.ace.edit("acediv");
    // var _session = _editor.session;
    // var _renderer = _editor.renderer;

    // // Options
    // _editor.setReadOnly(false);
    // // _session.setUndoManager(new UndoManager());
    // // _renderer.setHighlightActiveLine(false);
    // _editor.session.setMode('ace/mode/javascript');
    // // Events
    // _editor.on("changeSession", function(){ console.log('changeSession');  });
    // _session.on("change", function(){ console.log($scope.acetext); });

}
