/*global myAppModule:false scrollSpy:false $:false couchapi:false PBKDF2:false emit:false*/
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
    
    $scope.click = function(event) {
        event.preventDefault();
        state.activeScreen = event.currentTarget.hash;
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
        type: 'text',
        value: config.couchDbUrl,
        success: function(response, newValue) {
            config.set({ couchDbUrl: newValue });
            $scope.$apply();
        }
    });
    
    $('#corsProxy').editable({
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
        return (state.user && state.user.roles && state.user.roles.indexOf('_admin') !== -1);
    };

}
