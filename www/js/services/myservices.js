/*global VOW:false $:false angular:false cookie:false couchapi:false*/

/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

//defaults
angular.module("myApp").factory('defaults', function() {
    return {
        couchDbUrl : "http://localhost:5984"
        ,corsProxy : "http://localhost:1234"
        ,timeout: 5000
        ,firstScreen: '#info'
        ,logBytes: 3000
        // ,logRefresh: 2000 //in ms
        ,corsSettings : {
            httpd: {
                enable_cors:['true']
            } 
            ,cors: {
                origins:['*']
                ,headers:["accept", "origin", "authorization", "content-type",
                         "X-CouchDB-WWW-Authenticate", "X-Couch-Full-Commit"]
                ,methods:["DELETE", "GET", "HEAD", "POST", "OPTIONS", "PUT"]
                ,credentials:['true']
            }
        }
    }; 
});


//config
angular.module("myApp").factory('config', function(defaults) {
    function setSettings(obj) {
        Object.keys(obj).forEach(function(k) {
            if (obj) config[k] = obj[k];
            if (typeof config[k] !== 'function')
                values[k] = config[k];
        });
    }
    var values = {};
    var config = {
        set: function(obj) {
            setSettings(obj);
            // console.log('removing cookie??');
            // cookie.remove('corsConfigured');
            cookie.set('couchdb_config', JSON.stringify(values));
        }
    }; 
    var someConfig= cookie.get('couchdb_config');
    
    try {
            setSettings(JSON.parse(someConfig));
    } catch(e) {
        config.set(defaults);
    }
    return config;
});

//state
angular.module("myApp").factory('state', function(defaults, config, persist, $rootScope) {
    var state = {};
    state.pwds = {};
    function checkSetting(setting, data)  {
        var value = data[setting[0]] ? data[setting[0]][setting[1]] : '';
        value = value || '';
        return value.indexOf(setting[2]) !== -1;
    }
    
    function checkCors() {
        var corsSettings = defaults.corsSettings;
        console.log(corsSettings);
        // console.log('checking cors config');
        var vow = VOW.make();
        couchapi.config().when(
            function(data) {
                state.configAccessible = data;
                var settingKeys = Object.keys(corsSettings);
                for (var i=0; i< settingKeys.length; i++) {
                    var setting = settingKeys[i];
                    var optionKeys = Object.keys(corsSettings[setting]);
                    for (var j=0; j< optionKeys.length; j++) {
                        var option= optionKeys[j];
                        var values = corsSettings[setting][option];
                        for (var v=0; v<values.length; v++) {
                            var value = values[v];
                            var set = checkSetting([setting, option, value], data);
                            if (!set) {
                                state.corsConfigured = false;
                                console.log('cors not configured properly..');
                                cookie.remove('corsConfigured');
                                vow.keep();
                                return;
                            }
                            
                        }
                    }
                }
                // console.log('cors configured properly.');
                cookie.set('corsConfigured', true);
                state.corsConfigured = true;
                vow.keep();
            }, 
            function(data) {
                state.configAccessible = false;
                state.corsConfigured = cookie.get('corsConfigured');
                console.log('cors configured properly? Can\'t tell. What does cookie say?' + state.corsConfigured );
                vow.keep(data);
            }
        );
        return vow.promise;
    }
    
    function tryUrl(url) {
        console.log('trying ' , url);
        var vow = VOW.make();
        $.couch.urlPrefix = url;
        couchapi.info().when(
            function(data) {
                // state.allDbs = data;
                vow.keep(url);
            },
            function(err) {
                vow.break(err);
            }
        );
        return vow.promise;
    }
    
    state.initialize = function($scope) {
        state.connecting = true;
        init($scope).when(
            function() {
                state.initialized = true;
                state.connecting = false;
                $scope.$apply();
            }
        );
    };
    
    function init() {
        var vow = VOW.make();
        var timer = setTimeout(function() {
            console.log('timedout');
            vow.keep();
            state.connected = false;
        }, defaults.timeout);
         
        couchapi.withCredentials(true);
        VOW.first([tryUrl(config.couchDbUrl), tryUrl(config.corsProxy)]).when(
            function(url) {
                $.couch.urlPrefix = url;
                state.dbUrl = state.connected = url;
                // return persist.init(url, 'create', state);
                return persist.init(url, false, state);
            }
        ).when(
            function() {
                state.couchDbUrlShortList = persist.get('couchDbUrlShortList') || [];
                if (state.couchDbUrlShortList.indexOf(state.dbUrl) === -1) {
                    state.couchDbUrlShortList.push(state.dbUrl);
                    persist.put('couchDbUrlShortList', state.couchDbUrlShortList);
                }
                return couchapi.session();
            } 
        ).when(
            function(sessionInfo) {
                if (sessionInfo && sessionInfo.userCtx && sessionInfo.userCtx.name) {
                    state.user = sessionInfo.userCtx;
                    state.userShortList = persist.get('userShortList') || [];
                    if (state.userShortList.indexOf(state.user.name) === -1) {
                        state.userShortList.push(state.user.name);
                        persist.put('userShortList', state.userShortList);
                    }
                }
                console.log(sessionInfo, state.user);
                return VOW.kept();
            } 
        ).when(
            function() {
                return checkCors(); 
            }
        ).when(
            function() {
                console.log('cors configured?', state.corsConfigured);
                var url = state.connected; 
                state.advanced = cookie.get('quilt_advanced');
                    var activeScreen;
                if (url.indexOf('1234') !== -1)  {
                    state.maybeCors = true;
                    activeScreen = '#enableCors';
                }
                else if (!state.corsConfigured) {
                    activeScreen = '#enableCors';
                }
                else {  activeScreen = cookie.get('quilt_activeScreen');
                        activeScreen =
                        ( state.advanced ? (activeScreen ? activeScreen :defaults.firstScreen) : '#simple' );
                     }
                
                clearTimeout(timer);
                state.activeScreen = activeScreen;
                
                return initScreen['#allUsers']();
                // couchapi.withCredentials(false);
            }).when(
                function() {
                    return initScreen['#databases']();
                }).when(
                    function() {
                        if (state.activeScreen !== '#allUsers' &&
                            state.activeScreen !== '#databases' &&
                            initScreen[state.activeScreen])
                            return initScreen[state.activeScreen]();
                        else return VOW.kept();
                    }
                ).when(
                    function(data) {
                        console.log('All good!!!' , data);
                        clearTimeout(timer);
                        vow.keep(data);
                    },
                    function(err) {
                        state.connected = false;
                        clearTimeout(timer);
                        vow.keep(err);
                        // couchapi.withCredentials(false);
                    }
                );
        
            return vow.promise;
    } 
    //end of init
    
    var initScreen = {};
    
    initScreen['#allUsers']  = function() {
        
        console.log('initing #users');
        if (state.allUsers) return VOW.kept();
        var vow = VOW.make();
            
        var admins = Object.keys(
            state.configAccessible ?
                (state.configAccessible.admins ?
                 state.configAccessible.admins : []) : []);
        
        couchapi.docAll('_users').when(
            function(users) {
                // console.log('in initsrfeen', users , admins);
                state.allUsersArray = [];
                users = users.rows.filter(function(doc) {
                    if (doc.id.startsWith('org.couchdb.user:') &&
                        admins.indexOf(doc.id.slice(17)) === -1) return true;
                    return false;
                }).map(function(user) {
                    state.allUsersArray.push(user.id.slice(17));
                    return { _id: user.id, pwd: '***', type:'user', roles:"?" };
                });
                
                admins.forEach(function(a) {
                    users.push( {
                        _id: a, pwd: '', type: 'admin', name: a
                    });
                });
                console.log('USERS:', users);               
                
                // users.forEach()
                state.allUsers = users;
                return VOW.kept();
                
                //are we fetching the user docs here?
                //could be troublesome with 1000 users or more..
            }).when(
                function() {
                    // state.allUsers = users;
                    vow.keep();
                    $rootScope.$broadcast('initAllUsers');
                    
                }
                ,function(err) {
                    console.log('ERROR', err);
                    state.allUsers = [];
                    
                    $rootScope.$broadcast('initAllUsers');
                    vow.keep();
                
                }
            );
        return vow.promise;
    };
    
    initScreen['#design'] = function() {
       var vow = VOW.make(); 
        initScreen['#databases']().when(
            function() {
                $rootScope.$broadcast('initDesign');
                vow.keep();
            },
            function() {
                $rootScope.$broadcast('initDesign');
                vow.keep();
            });
        return vow.promise;
       };
    
    initScreen['#databases'] = function() {
        console.log('initing #databases');
        var vow = VOW.make();
        if (state.databases) vow.keep();
        else couchapi.dbAll().when(
            function(databases) {
                console.log(databases);
                state.databases = databases.filter(function(str) {
                    if (str.startsWith('_')) return false;
                    return true;
                }).map(function(db) {
                    return {
                        name: db, names: '?', roles: '?', count: '?', update_seq: '?'
                    };
                });
                
                console.log('broadcasting');
                $rootScope.$broadcast('initDatabases');
                // $rootScope.$broadcast('initDesign');
                // $rootScope.$broadcast('initExamine');
                
                vow.keep();
                
            },
            function(err) {
                console.error('ERROR: Couldn\'t get list of databases!!!', err);
                state.databases = [];
                $rootScope.$broadcast('initDatabases');
                // $rootScope.$broadcast('initDesign');
                // state.users = null;
                // vow['break']();
                vow.keep();
                
            }
        );
        return vow.promise;
    };
    
    initScreen['#replications'] = function() {
        console.log('initing #reps');
        state.quilt_reps = persist.get('reps') || {};
        var vow = VOW.make();
        initScreen['#databases']().when(
            function() {
                return couchapi.docAllInclude('_replicator', { });
            }).when(
                function(reps) {
                    console.log('received reps', reps);
                    state.reps = reps.rows.filter(function(row) {
                        // console.log(row.id);
                        // return true;
                        return !(row.id.startsWith('_design'));
                    }).map(function(row) {
                        row.doc.couch = true;
                        if (state.quilt_reps[row.doc._id]) {
                            row.doc.quilt = true;   
                            state.quilt_reps[row.doc._id].live = true;
                        }
                        row.doc.original = angular.copy(row.doc);
                        if (!row.doc._replication_state)
                            row.doc._replication_state = "none";
                        return row.doc;
                    });
                    // console.log(state.users);               
                    Object.keys ( state.quilt_reps ).forEach(function(k) {
                        var rep = state.quilt_reps[k];
                        if (rep.live) delete rep.live;
                        else {
                            rep.quilt = true;
                            rep.original = angular.copy(rep);
                            rep._replication_state = 'inactive';
                            state.reps.push(rep);   
                        }
                    });
                    $rootScope.$broadcast('initReps');
                    vow.keep();
                },
                function(err) {
                    state.reps = null;
                
                    $rootScope.$broadcast('initReps');
                    // vow['break']();
                    vow.keep();
                }
            );
        return vow.promise;
    };
    
    initScreen['#examine'] = function() {
        var vow = VOW.make();
        $rootScope.selectedExamineTab = localStorage.getItem('quilt_selectedExamineTab') ||
            'Query';
        state.tests = persist.get("quilt_tests") || [];
        
        state.tests.forEach(function(t) {
            t.original = angular.copy(t);
        }); 
        
        state.testDocs = persist.get("quilt_testDocs") || [];
        
        initScreen['#databases']().when(
            function() {
                $rootScope.$broadcast('initExamine');
                vow.keep();
            },
            function() {
                $rootScope.$broadcast('initExamine');
                vow.keep();
            });
        return vow.promise;
    };
    
    state.setActiveScreen = function($scope, screen) {
        // var timer;
        state.activeScreen = screen;
        console.log('screen =', screen);
        
        if (initScreen[screen]) {
            // if (screen === '#log' && !timer) {
            //     state.logRefresh = state.logRefresh || defaults.logRefresh;
            //     console.log('initing #log 1', state.logRefresh , state.autoRefresh);
            //     timer = setInterval(function() {
            //         if (!state.autoRefresh) {
            //             clearInterval(timer);
            //             timer = false;
            //             return;
            //         }
            //         initScreen[screen]().when(
            //             function(){
            //                 $scope.$apply();
            //             }
            //             ,function(err){
            //                 console.log(err);
            //                 clearInterval(timer);
            //                 timer = false;
            //             }
            //         );
                 
            //     }, state.logRefresh);
            // }
            // else{
            // clearInterval(timer);
            // timer = false;
            initScreen[screen]().when(
                function(data){
                    console.log( 'done with setActiveScreen, $applying');
                    $scope.$apply();
                }
                ,function(err){
                    console.log(err);
                }
            );
             
            // }  
        }
    };
    return state;   
});



angular.module("myApp").factory('persist', function() {

    var persistDoc; 
    var api = {};
    var state;
    
    function getDatabase(url, create) {
        var vow = VOW.make();
        couchapi.dbInfo('quilt', url)
            .when(
                function(data) {
                    vow.keep(data);
                }
                ,function(error) {
                    if (create)  couchapi.dbCreate('quilt').when(
                        function(data) {
                            vow.keep(data);
                        }
                        ,function(error) {
                            console.log('Not able to create database quilt', error);
                            vow.break();
                        }
                    );
                    else {
                        console.log('Not able to open database quilt and not creating one. ', error);
                        vow.break();
                    }
                });
        return vow.promise;
    }
    
    function getPersistDoc() {
        var vow = VOW.make();
        couchapi.docGet('persist')
            .when(
                function(data) {
                    vow.keep(data);
                }
                ,function(error) {
                    console.log("Not able to open doc with id 'persist'. Creating one..", error);
                    couchapi.docSave({ _id: 'persist'}).when(
                        function(data) {
                            vow.keep({ _id: 'persist', _rev: data.rev});
                        }
                        ,function(error) {
                            console.log("Not able to write doc with id 'persist' to quilt database", error);
                            vow.break();
                        }
                    );
                });
        return vow.promise;
    }
    
    api.init = function(url, create, state) {
        var vow = VOW.make();
        state.persisting = false;
        getDatabase(url, create)
            .when(
                function() {
                    return getPersistDoc();
                })
            .when(
                function(doc) {
                    state.persisting = true;
                    console.log('Read persistDoc from database quilt. Using CouchDB as backend.');
                    persistDoc = doc;
                    vow.keep(doc);
                }
                ,function() {
                    vow.keep();
                    console.log('CouchDB is not an option. Falling back to localStorage');
                });
        return vow.promise;
    };
    
    
    api.get = function(key) {
        if (persistDoc) {
            return angular.copy(persistDoc[key]);
        }
        var item = localStorage.getItem(key);
        try {
            item = JSON.parse(item);
        } catch(e) {  console.log('Error JSON parsing of local storage item'); }
        return item;
    };
    
    api.put = function(key, value) {
        if (persistDoc) {
            persistDoc[key] = value;
            couchapi.docSave(persistDoc, 'quilt')
                .when(
                    function(data) {
                        console.log('Saved persistDoc to couchDB', data);
                    }
                    ,function(error) {
                        state.persisting = false;
                        console.log('Unable to save persistDoc to database quilt at couchDB', error);
                    });
        }
        value = JSON.stringify(value);
        localStorage.setItem(key, value);
    };
    
    return api;
   }); 
