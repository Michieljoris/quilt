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
    
    // scrollSpy('#manmenu');
    
    //-----------------------------------------------------
    $scope.isActive = function(screen) {
        return screen === state.activeScreen ? 'active' : '';
    };
    
    
    // $scope.click = function(event) {
    //     event.preventDefault();
    //     // state.activeScreen = event.currentTarget.hash;
    //     state.setActiveScreen( $scope, event.currentTarget.hash );
    //     cookie.set('quilt_activeScreen', state.activeScreen);
    //     if (state.activeScreen === "#simple") {
    //         cookie.remove("quilt_advanced");
    //         state.advanced = false;
    //     }
    // };
    
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
        value: config.couchDbUrl,
        success: function(response, newValue) {
            config.set({ couchDbUrl: newValue });
            $scope.$apply();
        }
    });
    
    $('#corsProxy').editable({
        unsavedclass: null,
        type: 'text',
        value: config.corsProxy,
        success: function(response, newValue) {
            config.set({ corsProxy: newValue });
            $scope.$apply();
        }
    });
    
    
    $scope.connect = function() {
        state.initialize($scope);
        $scope.disconnected = false;
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
    
    
    $('#remoteUrl').editable({
        unsavedclass: null,
        type: 'text',
        // value: state.remoteUrl,
        value: "http:multicapdb.iriscouch.com",
        success: function(response, newValue) {
            config.set({ couchDbUrl: newValue });
            $scope.$apply();
        }
    });
    
    $('#remoteUserName').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remoteUserName,
        success: function(response, newValue) {
            // config.set({ corsProxy: newValue });
            // $scope.$apply();
        }
    });
    
    $('#remotePassword').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remotePassword,
        success: function(response, newValue) {
            // config.set({ corsProxy: newValue });
            // $scope.$apply();
        }
    });
    
    $('#locationsToSync').editable({
        unsavedclass: null,
        // type: 'checklist',
        value: [2, 3],    
        source: [
              {value: 1, text: 'Waterford West'},
              {value: 2, text: 'Runcorn 9'},
              {value: 3, text: 'Rubicon'}
           ],
        success: function(response, newValue) {
            console.log(newValue);
            // config.set({ corsProxy: newValue });
            
            // $scope.$apply();
        }
    });
    
    
    

}
