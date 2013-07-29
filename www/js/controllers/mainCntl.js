/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("mainCntl", function ($scope, $location, state, defaults) {
    // window.mainCntl = function ($location, $scope, $http) {
    console.log('in main');
    $scope.connected = false;
    $scope.state = state;
    
    $scope.changeCouchDbUrl = function(url) {
      console.log("Switching to different couchDB url", url)  ;
    };
    
    $scope.changeUser = function(userName) {
      console.log("Switching to different user", userName)  ;
    };
    
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
        return state.connected ? "" + state.connected : "Connect to CouchDB";
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
        couchapi.login('____', '_____').when(
            function() {
                console.log('What????');
                alert("No! There isn't a user ____ with pwd ____. Can't be!!!");
            },function() {
                console.log("Logged out..");
                state.initialize($scope);
                delete state.user;
            }
        );
    };
    
    $scope.login = function () {
        couchapi.login($scope.loginText, $scope.passwordText).when(
            function(data) {
                console.log(data);
                state.user = data;
                $scope.passwordText = null;
                state.initialize($scope);
                // $scope.$apply();
            },
            function(data) {
                $scope.passwordText = null;
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
    
    
    $scope.screens = [
        // { name: 'info', menu: 'Info'},
        { name: 'allUsers', menu: 'Users'}
        // ,{ name: 'serverAdmins', menu: 'Server admins'}
        // ,{ name: 'users', menu: 'Users'}
        ,{ name: 'databases', menu: 'Databases'}
        // ,{ name: 'scripts', menu: 'Scripts'}
        ,{ name: 'design', menu: 'Design'}
        ,{ name: 'replications', menu: 'Replications'}
        ,{ name: 'examine', menu: 'Examine'}
        // ,{ name: 'log', menu: 'Log'}
        // ,{ name: 'test', menu: 'Test'}
        ,{ name: 'futon', menu: 'Futon'}
        // ,{ name: 'simple', menu: 'Simple setup'}
        ];
    
    $scope.click = function(event) {
        event.preventDefault();
        if (event.currentTarget.hash === '#futon') {
            window.open(state.connected + "/_utils", '_blank');
            return;
        }
        // state.activeScreen = event.currentTarget.hash;
        state.setActiveScreen( $scope, event.currentTarget.hash );
        cookie.set('quilt_activeScreen', state.activeScreen);
        if (state.activeScreen === "#simple") {
            cookie.remove("quilt_advanced");
            state.advanced = false;
        }
    };
    
    
    $scope.isActive = function(screen) {
        // console.log('screen=',screen, state.activeScreen);
        return screen === state.activeScreen ? 'active' : '';
    };
    
});