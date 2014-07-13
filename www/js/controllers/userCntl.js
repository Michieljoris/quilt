/*global $:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("usersCntl", function ($scope, $location, state, defaults) {
    
    console.log('In userCntl');
    
    var config;
    
    // $scope.getUserNames = function() {
    //     if (!state.configAccessible) return [];
        
    //     // var admins =  state.configAccessible ? state.configAccessible.admins : {};
    //     // admins = admins || {};
    //     // admins = Object.keys(admins);
    //     // return admins;
    //     return ['pete'];
    // };
    
    var currentUser;
    $scope.editUser = function(userId) {
        console.log(userId);
        couchapi.docGet(userId, '_users').when(
            function(user) {
                console.log(user);
                $('#userRoles').editable('setValue', user.roles || [], false);
                $('#changeUserPwd').editable('setValue', '', false);
                $scope.selectedUser = user;
                
                $scope.edited = false;
    
                newRoles = null, newPwd = null;
                $scope.$apply();
                
            },
            function(err) {
                console.log(err);
                
            }
        );
        
    };
    
    $scope.addUser = function() {
        
        couchapi.userAdd($scope.userName, $scope.password, []).when(
            function(data) {
                console.log(data);
                $scope.newUserShouldBeOpen = false;
                //TODO bit overkill, only need to fetch updated user database, or just add to state.users..
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The user already exists probably. Anyway the user has not been added.', data);
            }
        );
        
    };
    
    $scope.addUserDialog = function() {
        $scope.newUserShouldBeOpen = true;
    };
    
    $scope.closeUser = function() {
        $scope.newUserShouldBeOpen = false;
    };
    
    
    $scope.removeUser = function(id) {
        console.log(id);
        if (confirm('Are you sure?'))
            couchapi.userRemove(id).when(
                function(data) {
                    console.log(data);
                    //TODO bit overkill, only need to fetch updated user database, or just remove from state.users..
                    state.users = state.users.filter(function(u) {
                        if (u!==id) return true;
                        return false;
                    });
                    $scope.$apply();
                },
                function(data) {
                    console.log("error",data);
                    alert('Not able to remove user..', data);
                }
            );
        
    };
    
    $scope.edited = false;
    
    var newRoles, newPwd;
    
    $('#changeUserPwd').editable({
        type: 'password',
        value: 'whatever',
        emptytext: "[hidden]",
        emptyclass: "",
        unsavedclass: null,
        success: function(response, newValue) {
            // config.set({ couchDbUrl: newValue });
            console.log(newValue);
            newPwd = newValue;
            $scope.edited = true;
            $scope.$apply();
        }
    });
    
    // $('#userRoles').editable({
    //     inputclass: 'input-large',
    //     value: [],
    //     select2: {
    //         tags: ['read-users', 'write-users', 'read-persons', 'write-persons', 'read-locations', 'write-locations',
    //               'read-waterfordwest', 'write-waterfordwest'],
    //         tokenSeparators: [",", " "]
    //     }
    //     ,success: function(response, newValue) {
    //         newRoles = newValue;
    //         if ($scope.selectedUser.roles.toString() !== newValue.toString()) $scope.edited = true;
    //         $scope.$apply();
    //         // $scope.$apply();
    //     }
    // });   
    
    $('#userRoles').editable({
        value: [2, 3],    
        unsavedclass: null,
        source: [
            {value: 'read-user', text: 'read-user'},
            {value: 'write-users', text: 'write-users'},
            {value: 'read-persons', text: 'read-persons'},
            {value: 'write-persons', text: 'write-persons'}
        ]
        ,success: function(response, newValue) {
            newRoles = newValue;
            console.log(newRoles);
            if ($scope.selectedUser.roles.toString() !== newValue.toString()) $scope.edited = true;
            $scope.$apply();
            // $scope.$apply();
        }
    });   
    
    $scope.apply = function() {
        console.log(newRoles);
        var props = {};
        if (newRoles) props.roles = newRoles;
        if (newPwd) props.password = newPwd;
        couchapi.userUpdate($scope.selectedUser._id.slice(17), props ).when(
            function(data) { console.log(data);
                             $scope.edited = false;    
                             newRoles = null; newPwd = null;
                             $scope.$apply();
                           }
            ,function(data) {
                alert('Unable to update the user\'s details. ' + data);
                console.log('error ', data); }
        );
    };
    
}); 
                                   
