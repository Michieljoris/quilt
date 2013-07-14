/*global VOW:false $:false angular:false cookie:false couchapi:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

//defaults
angular.module("myApp").factory('defaults', function() {
    return {
        couchDbUrl : "http://localhost:5984"
        ,corsProxy : "http://localhost:1234"
        ,timeout: 5000
    }; 
});


//config
angular.module("myApp").factory('config', function(defaults) {
    var values = {};
    var config = {
        set: function(obj) {
            Object.keys(obj).forEach(function(k) {
                if (obj) config[k] = obj[k];
                if (typeof config[k] !== 'function')
                    values[k] = config[k];
            });
            cookie.set('couchdb_config', JSON.stringify(values));
        }
    }; 
    var someConfig= cookie.get('couchdb_config');
    
    try {
        config.set(JSON.parse(someConfig));
    } catch(e) {
        config.set(defaults);
    }
    return config;
});

//state
angular.module("myApp").factory('state', function(defaults, config) {
    var state = {};
    function tryUrl(url) {
        console.log('trying ' , url);
        var vow = VOW.make();
        $.couch.urlPrefix = url;
        couchapi.dbAll().when(
            function(data) {
                state.allDbs = data;
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
         
        couchapi.withCredentials = false;
        VOW.first([tryUrl(config.couchDbUrl), tryUrl(config.corsProxy)]).when(
            function(url) {
                vow.keep(url);
                state.connected = url;
                if (url === config.corsProxy) state.maybeCors = true;
                clearTimeout(timer);
                couchapi.withCredentials = true;
            },
            function(err) {
                vow.keep(err);
                state.connected = false;
                clearTimeout(timer);
                couchapi.withCredentials = true;
            }
        );
        
        return vow.promise;
    }; 
    return state;   
});

