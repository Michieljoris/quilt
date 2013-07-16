/*global VOW:false $:false angular:false cookie:false couchapi:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

//defaults
angular.module("myApp").factory('defaults', function() {
    return {
        couchDbUrl : "http://localhost:5984"
        ,corsProxy : "http://localhost:1234"
        ,timeout: 5000
        ,firstScreen: '#help'
        ,corsSettings : {
            cors: {
                headers:["accept", "origin", "authorization", "content-type",
                         "X-CouchDB-WWW-Authenticate", "X-Couch-Full-Commit"]
                ,methods:["DELETE", "GET", "HEAD", "POST", "OPTIONS", "PUT"]
                ,credentials:['true']
                ,origins:['*']
            }
            ,httpd: {
                enable_cors:['true']
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
angular.module("myApp").factory('state', function(defaults, config) {
    var state = {};
    
    function checkSetting(setting, data)  {
        var value = data[setting[0]] ? data[setting[0]][setting[1]] : '';
        value = value || '';
        return value.indexOf(setting[2]) !== -1;
    }
    
    function checkCors() {
        var corsSettings = defaults.corsSettings;
        console.log(corsSettings);
        console.log('checking cors config');
        var vow = VOW.make();
        couchapi.config().when(
            function(data) {
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
                console.log('cors configured properly.');
                cookie.set('corsConfigured', true);
                state.corsConfigured = true;
                vow.keep();
            }, 
            function(data) {
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
    
    var init = function() {
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
                state.connected = url;
                // couchapi.withCredentials(false);
                return couchapi.session();
            }
        ).when(
           function(sessionInfo) {
               if (sessionInfo && sessionInfo.userCtx && sessionInfo.userCtx.name)
                   state.user = sessionInfo.userCtx;
               console.log(sessionInfo, state.user);
               return VOW.kept();
           } 
        ).when(
            function() {
               return checkCors(); 
            }
        ).when(
            function() {
                vow.keep();
                console.log('cors configured?', state.corsConfigured);
                var url = state.connected; 
                state.activeScreen = defaults.firstScreen;   
                if (url === config.corsProxy ||
                    url.indexOf('1234') !== -1)  {
                    state.maybeCors = true;
                    state.activeScreen = '#enableCors';
                    
                }
                if (!state.corsConfigured) 
                    state.activeScreen = '#enableCors';
                clearTimeout(timer);
                // couchapi.withCredentials(false);
            },
            function(err) {
                vow.keep(err);
                state.connected = false;
                clearTimeout(timer);
                // couchapi.withCredentials(false);
            }
        );
        
        return vow.promise;
    }; 
    return state;   
});

