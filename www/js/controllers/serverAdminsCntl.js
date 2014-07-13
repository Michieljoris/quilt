/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("serverAdminsCntl", function ($scope, $location, state, defaults) {
    
    console.log('In serverAdminsCntl');
    
    var config;
    
    $scope.getAdminNames = function() {
        
        var admins =  state.configAccessible ? state.configAccessible.admins : {};
        admins = admins || {};
        admins = Object.keys(admins);
        return admins;
    };
    
    $scope.setPwd = function(admin) {
        console.log(admin);
        $scope.userName = admin; 
        $scope.newAdminShouldBeOpen = true;
        $scope.justPwd = true;
    };
    
    $scope.addAdminUser = function() {
        
        couchapi.config('admins', $scope.userName, $scope.password).when(
            function(data) {
                console.log(data);
                $scope.newAdminShouldBeOpen = false;
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The admin user already exists probably. Anyway the admin user has not been added.', data);
            }
        );
        
    };
    
    $scope.addAdminUserDialog = function() {
        $scope.justPwd = false;
        $scope.newAdminShouldBeOpen = true;
    };
    
    $scope.closeAdmin = function() {
        $scope.newAdminShouldBeOpen = false;
    };
    
    
    $scope.removeAdminUser = function(name) {
        if (confirm('Are you sure?\n\nIf you remove an admin user you\'re logged in as you will be logged out. If you don\'t know the password to one of the remaining admins you will have to manually edit the CouchDB config file on your computer to regain access. \n\nIf you\'re removing the last admin there\'s no problem, but your CouchDB will be unsecured then of course. '))
            couchapi.config('admins', name, null).when(
                function(data) {
                    state.initialize($scope);
                    console.log(data);
                },
                function(data) {
                    console.log("error",data);
                }
            );
        
    };
}); 
                                   
