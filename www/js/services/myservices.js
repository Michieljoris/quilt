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
            console.log('removing cookie??');
            cookie.remove('corsConfigured');
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
angular.module("myApp").factory('state', function(defaults, config, persist) {
    var state = {};
    
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
        init().when(
            function() {
                state.initialized = true;
                state.connecting = false;
                $scope.$apply();
            }
        );
    };
    
    var init = function($scope) {
        var vow = VOW.make();
        var timer = setTimeout(function() {
            console.log('timedout');
            vow.keep();
            state.connected = false;
        }, defaults.timeout);
         
        couchapi.withCredentials(true);
        // console.log('$.couch.withcred', $.couch.withCredentials());
        VOW.first([tryUrl(config.couchDbUrl), tryUrl(config.corsProxy)]).when(
            function(url) {
                $.couch.urlPrefix = url;
                state.dbUrl = state.connected = url;
                return persist.init(url, 'create', state);
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
                return initScreen[activeScreen] ? initScreen[activeScreen]() : VOW.kept();
                // couchapi.withCredentials(false);
            }).when(
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
    }; 
    var initScreen = {};
    initScreen['#users'] = function() {
        console.log('initing #users');
        var vow = VOW.make();
        couchapi.docAll('_users').when(
            function(users) {
                var admins = Object.keys(
                    state.configAccessible ?
                        (state.configAccessible.admins ?
                         state.configAccessible.admins : {}) : {});
                // console.log('in initsrfeen', users , admins);
                state.users = users.rows.filter(function(doc) {
                    if (doc.id.startsWith('org.couchdb.user:') &&
                       admins.indexOf(doc.id.slice(17)) === -1) return true;
                    return false;
                }).map(function(user) {
                    return user.id;
                });
                // console.log(state.users);               
                vow.keep();
                
            },
            function(err) {
                state.users = null;
                // vow['break']();
                vow.keep();
                
            }
        );
        return vow.promise;
    };
    
    initScreen['#databases'] = function() {
        console.log('initing #databases');
        var vow = VOW.make();
        couchapi.dbAll().when(
            function(databases) {
                console.log(databases);
                state.databases = databases.filter(function(str) {
                    if (str.startsWith('_')) return false;
                    return true;
                // }).map(function(user) {
                //     return user.id;
                });
                
                vow.keep();
                
            },
            function(err) {
                console.log('ERROR: Couldn\'t get list of databases!!!', err);
                // state.users = null;
                // vow['break']();
                vow.keep();
                
            }
        );
        return vow.promise;
    };
    
    initScreen['#replications'] = function() {
        console.log('initing #reps');
        var vow = VOW.make();
        couchapi.docAllInclude('_replicator', { }).when(
            function(reps) {
                
                state.reps = reps.rows.filter(function(row) {
                    // console.log(row.id);
                    // return true;
                    return !(row.id.startsWith('_design'));
                }).map(function(row) {
                    return row.doc;
                });
                // console.log(state.users);               
                vow.keep();
            },
            function(err) {
                state.reps = null;
                // vow['break']();
                vow.keep();
            }
        );
        return vow.promise;
    };
    
    
    state.setActiveScreen = function($scope, screen) {
        state.activeScreen = screen;
        if (initScreen[screen])
            initScreen[screen]().when(
                function(data){
                    $scope.$apply();
                }
                ,function(err){
                    console.log(err);
                    
                }
            );
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
                            vow.keep(data);
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
            return persistDoc[key];
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
