/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("mainCntl", function ($scope, $location, state) {
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
    $scope.reset = function() {
        state.connected = false;
        $scope.disconnected = true;
    };
    $scope.getResetText = function() {
        if (state.connected) return 'Disconnect';
        if (state.connecting) return 'Connecting..';
        return '';
    };
    $scope.disconnected = false;
    
    $scope.login = function() {
        $scope.shouldBeOpen = true;
        console.log('login');
    };

   
    $scope.logout = function() {
        console.log('logout');
        couchapi.logout();
        delete state.user;
    };
    
    $scope.close = function () {
        // $scope.closeMsg = 'I was closed at: ' + new Date();
        $scope.shouldBeOpen = false;
    };
    
    $scope.logopts = {
        backdropFade: true
        // dialogFade:true
    };
});