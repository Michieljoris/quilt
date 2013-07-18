/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("mainCntl", function ($scope, $location, state, defaults) {
    // window.mainCntl = function ($location, $scope, $http) {
    console.log('in main');
    $scope.connected = false;
    $scope.state = state;
    
    $scope.isManagerView = function() {
        return $location.$$url !== '/manager';
    };
    var pageTitleMap = {
        "/manager" : 'Manage',
        "/help" : "Help"
    };
    
    $scope.getPage = function() {
        // console.log($location);
        return pageTitleMap[$location.$$path];
    };
    
    $scope.getTitle = function() {
        return state.connected ? "Connected to " + state.connected : "Connect to CouchDB";
    };
    $scope.reset = function($event) {
        if ($event) $event.preventDefault();
        state.connected = false;
        $scope.disconnected = true;
        delete state.user;
    };
    $scope.getResetText = function() {
        if (state.connected) return 'disconnect';
        if (state.connecting) return 'Connecting..';
        return '';
    };
    $scope.disconnected = false;
    
    $scope.openLogin = function() {
        $scope.shouldBeOpen = true;
    };

   
    $scope.logout = function() {
        console.log('logout');
        
        // couchapi.logout();
        
        //the above gives error in firefox, but not chrome, so using
        //nonsense login instead.
        couchapi.login('____', '_____');
        delete state.user;
    };
    
    $scope.login = function () {
        couchapi.login($scope.loginText, $scope.passwordText).when(
            function(data) {
                console.log(data);
                state.user = data;
                state.initialize($scope);
                // $scope.$apply();
            },
            function(data) {
                console.log('error', data);
            }  
        );
        $scope.shouldBeOpen = false;
    };
    
    $scope.close = function () {
        $scope.shouldBeOpen = false;
    };
    
    $scope.logopts = {
        backdropFade: true
        // dialogFade:true
    };
    
    $scope.simpleSetup = function($event) {
        $event.preventDefault();
        state.advanced = false;
        cookie.remove('quilt_advanced');
        if (state.activeScreen === '#enableCors') return;
        state.oldActive = state.activeScreen;
        state.activeScreen = "#simple";
    };
    
    $scope.advancedSetup = function($event) {
        $event.preventDefault();
        state.advanced = true;
        cookie.set('quilt_advanced', 'true');
        if (state.activeScreen === '#enableCors') return;
        state.activeScreen = state.oldActive || defaults.firstScreen;
    };
});