/*global $:false console:false cookie:false angular:false couchapi:false */


angular.module("myApp").controller("mainCntl", function ($scope, $location, config, state, persist, defaults) {
   // window.mainCntl = function ($location, $scope, $http) {
    "use strict";
    
    console.log('in main');
    $scope.connected = false;
    $scope.state = state;
     
    $scope.getRowClass = function(row) {
        // console.log('row', row);
        if (row.selected && row.getProperty('modified')) return 'selectedAndModified';
        if (row.getProperty('modified')) return 'modified';
        return '';
    }; 
    
    
    $scope.changeCouchDbUrl = function(url) {
        console.log("Switching to different couchDB url", url)  ;
        config.set({ couchDbUrl: url });
        $('#couchDBurl').editable('setValue', url, false);
        delete state.databases;
        delete state.allUsers;
        state.initialize($scope);
    };
    
    $scope.changeUser = function(userName) {
        if (state.pwds[userName] && userName !== 'Other.') {
            $scope.passwordText = state.pwds[userName];
            $scope.login();
        }
        else {
            $scope.shouldBeOpen = true;
            state.pwds[userName] = 'record..';
        }
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
        console.log('RESET');
        if ($event) $event.preventDefault();
        state.connected = false;
        state.disconnected = true;
        delete state.user;
    };
    
    $scope.getResetText = function() {
        if (state.connected) return 'disconnect';
        if (state.connecting) return 'Connecting..';
        return '';
    };
    state.disconnected = false;
    
    $scope.openLogin = function() {
        if ($scope.loginText === 'Other..') $scope.loginText = "";
        $scope.shouldBeOpen = true;
        delete state.pwds[$scope.loginText];
    };

   
    $scope.logout = function() {
        console.log('logout');
        if (state.user)
            delete state.pwds[state.user.name];
        // couchapi.logout();
        
        //the above gives error in firefox, but not chrome, so using
        //nonsense login instead.
        couchapi.login('____', '_____').when(
            function() {
                console.log('What????');
                alert("No! There isn't a user ____ with pwd ____. Can't be!!!");
            },function() {
                
                // if (state.user)  {
                //    var index = state.userShortList.indexOf(state.user.name);
                //     if (index !== -1) {
                //         state.userShortList.splice(index, 1);
                //         persist.put('userShortList', state.userShortList);
                //     }
                // }
                console.log("Logged out..");
                state.initialize($scope);
                delete state.user;
            }
        );
    };
    
    $scope.login = function () {
        if ($scope.loginText === 'Other..') return;
        state.allUsers = null;
        state.databases = null;
        couchapi.login($scope.loginText, $scope.passwordText).when(
            function(data) {
                console.log('DATA from login', data);
                state.user = data;
                if (state.pwds[$scope.loginText]) {
                    state.pwds[$scope.loginText] = $scope.passwordText;
                }
                delete $scope.passwordText;
                state.initialize($scope);
                // $scope.$apply();
                $scope.shouldBeOpen = false;
            },
            function(data) {
                // delete $scope.passwordText;
                // delete state.pwds[$scope.loginText];
                console.log('error loggin in', arguments);
                $scope.loginError = data.reason || data.status;
                setTimeout(function() {
                    $scope.loginError = "";
                    $scope.$apply();
                }, 3000);
                $scope.$apply();
            }  
        );
    };
    
    $scope.close = function () {
        $scope.shouldBeOpen = false;
    };
    
    
    $scope.cancel = function () {
        console.log('deleting user pwd', $scope.loginText, state.pwds);
        var index = state.userShortList.indexOf($scope.loginText);
        if (index !== -1 && $scope.loginText !== 'Other..') {
            state.userShortList.splice(index, 1); 
            persist.put('userShortList', state.userShortList);
        }
        delete $scope.passwordText;
        delete state.pwds[$scope.loginText];
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
        // if (state.activeScreen === '#enableCors') return;
        state.oldActive = state.activeScreen;
        state.activeScreen = "#simple";
        state.initialize($scope);
    };
    
    $scope.advancedSetup = function($event) {
        $event.preventDefault();
        state.advanced = true;
        cookie.set('quilt_advanced', 'true');
        // if (state.activeScreen === '#enableCors') return;
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
        // ,{ name: 'quilt', menu: 'Quilt'}
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