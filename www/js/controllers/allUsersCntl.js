/*global $:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/


angular.module("myApp").controller("allUsersCntl", function ($scope, $location, state, defaults, persist) {
    
    $scope.list_of_string = ['tag1', 'tag2'];
    
    $scope.gridClick = function(field, row) {
        if (field === 'roles')
        console.log('click', field, row);
        // row.name = 'okthen';
         editUser(row);

    };
    
    $scope.select2Options = {
        'multiple': true,
        'simple_tags': true,
        'tags': ['tag1', 'tag2', 'tag3', 'tag4']  // Can be empty list.
    };

    var screenState = {
        type: 'users'
    };

    console.log('In allUsersCntl');
    
    $scope.search = function (text){
        console.log($scope.searchText);
        $scope.usersGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    };
    
    var editableCellTemplate = '<input type="text" ui-select2="select2Options" ng-model="row.entity.roles" />';
    
    
  var cellTemplate =
        '<div ng-click="gridClick(col.field, row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
    
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        row.entity[col.field] = !row.entity[col.field];
        row.entity.modified=true;

        endEdit( row.entity, col.field, !row.entity[col.field]);

    };


    $scope.modifiedCount = 0;
    function endEdit(row, field, old) {

        if (row[field] !== old) {
            console.log(row, $scope.originalRows[row._id]);
            delete row.modified;
            if (!row.cancel) delete row.cancel;
            if (angular.equals(row, $scope.originalRows[row._id])) {
                row.modified = false;
                $scope.modifiedCount++;
            }
            else {
                if (!$scope.originalRows[row._id]) {
                    $scope.originalRows[row._id] = angular.copy(row);
                    $scope.originalRows[row._id][field] = old;
                    delete $scope.originalRows[row._id].cancel;
                }

                $scope.modifiedCount--;
                row.modified = true;
            }
        }
    }
    

    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs = [
            {visGroup:'Essential',
             // editableCellTemplate : editableCellTemplate,
             cellTemplate : cellTemplate, width:120,
             field:'name', displayName:'name', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate,
             field:'roles', displayName:'roles', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate, width:50,
             field:'pwd', displayName:'pwd', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential', field:'delete', displayName:'delete',
              cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true }
            // {visGroup:'Essential', field:'pwd', displayName:'password', enableCellEdit: true, visible:true},
            // {visGroup:'UserOnly', field:'roles', displayName:'roles', enableCellEdit: true, visible:true},
            // {visGroup:'Essential', field:'type', displayName:'type', enableCellEdit: false, visible:true},
            // ,{visGroup:'Essential', field:'stop', displayName:'stop',
            //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40 }
            // ,{visGroup:'Essential', field:'cancel', displayName:'delete',
            //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
        ];


        $scope.usersGridOptions = { data: 'rows'
                                    ,columnDefs: "columnDefs"
                                    // ,columnDefs: $scope.columnDefs
                                    ,rowHeight:25
                                    ,headerRowHeight: 30
                                    ,rowTemplate:'<div style="height: 100%" ng-class="{gray: row.getProperty(\'modified\')==true}"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                    '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                    '<div ng-cell></div>' +
                                    '</div></div>'
                                    ,enableRowSelection: true
                                    ,enableCellEditOnFocus: true
                                    ,selectWithCheckboxOnly: false
                                    ,enableCellEdit: true
                                    ,showSelectionCheckbox: true
                                    ,enableColumnResize: true
                                    ,enableColumnReordering: true
                                    ,enableRowReordering: true
                                    ,showColumnMenu: false
                                    ,showFilter: false
                                    ,multiSelect: true
                                    // ,showGroupPanel: true
                                    // ,afterSelectionChange: function(row) {
                                    //     editUser(row.entity);
                                    // }
                                    ,init:function(grid, scope) {
                                        console.log(grid, scope);
                                        // $scope.$gridScope = scope;
                                        window.grid = grid;
                                        window.gridScope = scope;
                                        window.appScope = $scope;
                                        // $scope.pickFields(screenState.fieldGroup);
                                        // $scope.viewState(screenState.filterState);
                                    }
                                  };
        console.log('Done making grid');

    }
    // // makeGrid();

    $scope.originalRows = {};
    // // $scope.$on('ngGridEventDigestGridParent', function(event, rep, field, old) {
    // //     console.log('digest');
    // // });
    // // $scope.$on('ngGridEventDigestGrid', function(event, rep, field, old) {
    // //     console.log('digest1');
    // // });

    $scope.$on('ngGridEventEndCellEdit', function(event, row, field, old) {
        console.log('edited', $scope, 'field:', field, 'old:'+old,'row:'+ row);
        endEdit(row, field, old);
        $scope.$apply();
    });

    // var grouped;
    // $scope.groupByState = function() {
    //     console.log('groupbystate');

    //     $scope.usersGridOptions.groupBy(grouped ? '' : '_replication_state');
    // };


    // $scope.refresh = function() {
    //     console.log('refresh' state.reps);
    //     window.test = $scope.usersGridOptions;
    //     state.setActiveScreen($scope, '#replications');
    //     // defineGrid();
    // };


    $scope.undo = function() {
        console.log('undo');
        var selRows = $scope.usersGridOptions.$gridScope.selectedItems;
        // var selRows = $scope.rows;
        angular.forEach(selRows, function(selRow) {
            var originalRow = $scope.originalRows[selRow._id];
            if (originalRow) {
                $scope.rows.forEach(function(row) {
                    if (row._id === originalRow._id)
                        angular.copy(originalRow, row);
                });
            }
        });
        $scope.selectedUser = false;
    };

    // $scope.apply = function() {
    //     console.log('apply');
    // };

    $scope.newRow = function() {
        $scope.rows.push({
            _id: prompt("User name?")
            ,pwd: ''
            ,"roles" :["_admin"]
        });
    }; 
    
    
    $scope.toggleAdminsUsers = function(type) {
        $scope.viewState = {};
        $scope.viewState[type] = 'active';
        localStorage.setItem('quilt_usersViewState', type);
        // console.log($scope.columnDefs);
        $scope.columnDefs.forEach(function(c){
            c.visible = true;
            if (c.visGroup === 'UserOnly' && type !== 'users')
                c.visible = false;
        });
        $scope.rows = state.allUsers.filter(function(u) {
            if ($scope.viewState.admins)
                return u.type === 'admin';
            else return u.type === 'user';
        }).map(function(u) {
            // console.log(u);
            if (u._id.startsWith('org.couchdb.user:')) u.name = u._id.slice(17);
            else u.name = u._id;
            return u;
        });
    };
    
    
    var selectedRow;
    var editUser = function(user) {
        
        selectedRow = user;
        // console.log(userId);
        if (user.type === 'admin')  {
            $scope.justPwd = true;
            $scope.newUserShouldBeOpen = true;
            $scope.userName = user._id;
        }
        else couchapi.docGet(user._id, '_users').when(
            function(user) {
                $('#userRoles').editable('setValue', user.roles || [], false);
                $('#changeUserPwd').editable('setValue', '', false);
                $scope.selectedUser = user;
                selectedRow.roles = user.roles.toString();
                selectedRow.rolesArray = user.roles;
                $scope.edited = false;
    
                newRoles = null, newPwd = null;
                $scope.$apply();
                
            },
            function(err) {
                console.log(err);
                
            }
        );
        
    };
    
    
    var setAdminUser = function(userName, password) {
        
        couchapi.config('admins', userName, password).when(
            function(data) {
                console.log(data);
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The admin user already exists probably. Anyway the admin user has not been added.', data);
            }
        );
        
    };
    
    $scope.addUser = function() {
        if ($scope.viewState.admins) 
            setAdminUser($scope.userName, $scope.password);
        else couchapi.userAdd($scope.userName, $scope.password, []).when(
            function(data) {
                console.log(data);
                //TODO bit overkill, only need to fetch updated user database, or just add to state.users..
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The user already exists probably. Anyway the user has not been added.', data);
            }
        );
        $scope.newUserShouldBeOpen = false;
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
    
    $scope.apply = function ( ){
        var vows = [];
        if ($scope.viewState.admins) removeAdminUsers();
        else {
            if (!confirm('Are you sure?')) return;
            $scope.rows.forEach(function(row) {
                if (row.delete === true)
                    vows.push(couchapi.userRemove(row._id));
	    });
        
            VOW.every(vows).when(
                function(data) {
                    console.log(data);
                    state.initialize($scope);
                },
                function(err) {
                    alert('Error removing at least some of the user..');
                    console.log(err);
                    state.initialize($scope);
                }
            );
        }
    };
        
    var removeAdminUsers = function(name) {
        if (!confirm('Are you sure?\n\nIf you remove an admin user you\'re logged in as you will be logged out. If you don\'t know the password to one of the remaining admins you will have to manually edit the CouchDB config file on your computer to regain access. \n\nIf you\'re removing the last admin there\'s no problem, but your CouchDB will be unsecured then of course. ')) return;
        var vows = [];
        $scope.rows.forEach(function(row) {
	    if (row.delete) vows.push(couchapi.config('admins', row._id, null));
	});

        VOW.every(vows).when(
            function(data) {
                state.initialize($scope);
                console.log(data);
            },
            function(data) {
                console.log("Error removing at least one of the server admins selected",data);
                state.initialize($scope);
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
            selectedRow.applyPwd = newValue;
            endEdit(selectedRow, 'applyPwd', '');
            newPwd = newValue;
            $scope.$apply();
        }
    });
    
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
            console.log($scope.selectedUser,newRoles);
            if ($scope.selectedUser.roles.toString() !== newValue.toString()) {
                selectedRow.roles = newRoles.toString();
                endEdit(selectedRow, 'roles', selectedRow.rolesArray.toString());
                selectedRow.rolesArray = newRoles;
            }
            $scope.$apply();
            // $scope.$apply();
        }
    });   
    
    $scope.applySingle = function() {
        
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
    
    $scope.viewState = 'admins';
    if (!state.usersDone) {
        
        defineGrid();
        state.usersDone = true;

        $scope.$on('initAllUsers',
                   function() {
                       console.log('initUsers event');
                       // dereg()
                       
                       $scope.toggleAdminsUsers(localStorage.getItem('quilt_usersViewState') || 'users');
                       // $scope.rows = state.allUsers;

                       // defineGrid();
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // $scope.pickFields(screenState.fieldGroup);
                       // console.log($scope.columnDefs);
                   });
    }
});


