/*global VOW:false cookie:false $:false couchapi:false PBKDF2:false emit:false*/
/*jshint strict:true unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:4 maxcomplexity:7 maxlen:130 devel:true newcap:false*/


function managerCntl($scope, config, state, defaults) {
    "use strict" ;
    console.log('In managerCntl');

    var $window = $(window);
    $('.sidemenu').affix({
        offset: {
            top: function () { return $window.width() <= 980 ? 210 : 0; }
            // , bottom: 270
            , bottom:0 
        }
    });
    
    //-----------------------------------------------------
    // function makePureRep(rep) {
    //     var cleanRep = {
    //         _id: rep._id
    //         ,source: rep.source
    //         ,target: rep.target
    //         ,continuous: rep.continuous
    //         ,create_target: rep.create_target
    //         ,filter: rep.filter
    //         ,query_params: rep.query_params
    //         ,doc_ids: rep.doc_ids
    //         ,user_ctx: rep.user_ctx
    //     };
    //     Object.keys(cleanRep).forEach(function(k) {
    //         var val = cleanRep[k];
    //         if (!val ||
    //             ( angular.isArray(val) && val.length === 0 ) ||
    //             ( angular.isObject(val) && Object.keys(val).length === 0) ||
    //             ( typeof val === 'string' && val.length === 0)) 
    //             delete cleanRep[k]; 
    //     });
    //     return cleanRep;
    // }
    $scope.repApps = function() {
        console.log('Replicating apps..');
        var reps = [];
        reps.push({
            _id: 'pull_roster_app'
            ,source: 'http://multicapdb.iriscouch.com/roster_app'
            ,target: 'roster_app2'
            ,continuous: true
            ,create_target: true
            ,user_ctx: { roles: [ "_admin" ]}
        });
        reps.push({
            _id: 'pull_quilt_app'
            ,source: 'http://multicapdb.iriscouch.com/quilt_app'
            ,target: 'quilt_app2'
            ,continuous: true
            ,create_target: true
            ,user_ctx: { roles: [ "_admin" ]}
        });
        var vows = [];
        couchapi.docBulkRemove(reps, '_replicator').when(
            function() {
                vows.push(couchapi.config('vhosts', 'localhost:5984/quilt','/quilt_app/_design/app/_rewrite'));
                vows.push(couchapi.config('vhosts', 'localhost:5984/quilt/app','/quilt_app/_design/app/_rewrite'));
                vows.push(couchapi.docBulkSave(reps, '_replicator'));
                VOW.every(vows).when(
                    function(data) {
                        console.log(data);
                        alert('Triggered replications of both apps to your CouchDB instance'); },
                    function(err) {
                        alert('Error!!' + err.reason);
                        console.log('Error replicating apps', err);
                    }
                );
            }
        );
        
    };
    
    
    
    $scope.isActive = function(screen) {
        return screen === state.activeScreen ? 'active' : '';
    };
    
    $scope.config = config;
    $scope.state = state;
    $scope.defaults = defaults;
    console.log(config);
    console.log(state);
    if (!state.initialized) {
        state.initialize($scope);
    }
    
    $('#couchDBurl').editable({
        unsavedclass: null,
        type: 'text',
        mode:'inline',
        value: config.couchDbUrl,
        success: function(response, newValue) {
            config.set({ couchDbUrl: newValue });
            $scope.$apply();
        }
    });
    
    $('#corsProxy').editable({
        unsavedclass: null,
        type: 'text',
        mode:'inline',
        value: config.corsProxy,
        success: function(response, newValue) {
            config.set({ corsProxy: newValue });
            $scope.$apply();
        }
    });
    
    
    $scope.connect = function() {
        $scope.disconnected = false;
        state.initialize($scope);
        };
    
    $scope.isSetupConnectionHelpCollapsed = true;
    
    $scope.isAdminLoggedIn = function() {
        return state.configAccessible ||
            (state.user && state.user.roles && state.user.roles.indexOf('_admin') !== -1);
    };
    
    $scope.checkCors = function($event) {
        $event.preventDefault();
        cookie.remove('corsConfigured');
        state.initialize($scope);
    };
    
    $scope.done = function($event) {
        console.log('done enable cors');
        state.activeScreen = state.advanced ? cookie.get('quilt_activeScreen') || defaults.firstScreen : '#simple';
        // state.active = 
        console.log(state);
    };
    
    $scope.enableCors = function($event) {
        $event.preventDefault();
        var vows = [];
        var corsSettings = defaults.corsSettings;
        var settingKeys = Object.keys(corsSettings);
        for (var i=0; i< settingKeys.length; i++) {
            var setting = settingKeys[i];
            var optionKeys = Object.keys(corsSettings[setting]);
            for (var j=0; j< optionKeys.length; j++) {
                var option= optionKeys[j];
                var values = corsSettings[setting][option];
                console.log('applied:', setting, option, values.toString());
                vows.push(couchapi.config(setting, option, values.toString()));
            }
        }
        VOW.every(vows).when(
            function(data) {
                state.initialize($scope);
                console.log(data);
            },
            function(err) {
                console.log(err);
                state.initialize($scope);
                // alert('I wasn\'t able to update the CouchDB settings. Are you logged in with server admin credentials?');
            }); 
    };
    
    // $scope.screens = [
    //     // { name: 'info', menu: 'Info'},
    //     { name: 'serverAdmins', menu: 'Server admins'}
    //     ,{ name: 'users', menu: 'Users'}
    //     ,{ name: 'databases', menu: 'Databases'}
    //     ,{ name: 'scripts', menu: 'Scripts'}
    //     ,{ name: 'replications', menu: 'Replications'}
    //     // ,{ name: 'simple', menu: 'Simple setup'}
        

    //     ];
    
    
    
    
    

}
