/*global console:false VOW:false $:false angular:false couchapi:false */


angular.module("myApp").controller("allUsersCntl", function ($scope, $location, state, defaults, persist) {
    
    "use strict";
    console.log('In allUsersCntl');
    
    $scope.fetchAllInfo = function() {
        var vows = [];
        $scope.rows.forEach(function(r) {
            vows.push(editUser(r, 'fetch'));
        });
        VOW.any(vows).when(function() {
            $scope.$apply();
        });
    };
    
    
    $scope.getGridWidth = function() {
        if ($scope.viewState.admins) return "narrow";
        return '';
    };
    
   $scope.gridClick = function(field, row) {
         editUser(row);
    };
    

    $scope.search = function (){
        console.log($scope.searchText);
        $scope.usersGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    };
    
    // var editableCellTemplate = '<input type="text" ui-select2="select2Options" ng-model="row.entity.roles" />';
    
    
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
            
            ,{visGroup:'UserOnly',
             cellTemplate : cellTemplate,
             field:'roles', displayName:'roles', enableCellEdit: false, visible:true}
            
            ,{visGroup:'UserOnly',
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
                                    
                                    ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                    '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                    '<div ng-cell></div>' +
                                    '</div></div>'
                                    
                                    // ,rowTemplate:'<div style="height: 100%" ng-class="{gray: row.getProperty(\'modified\')==true}"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                    // '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                    // '<div ng-cell></div>' +
                                    // '</div></div>'
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
                    delete $scope.originalRows[selRow._id];
                    // $scope.modifiedCount--;
                });
            }
        });
        $scope.selectedUser = false;
    };

    $scope.newRow = function() {
        $scope.rows.push({
            _id: prompt("User name?")
            ,pwd: ''
            ,"roles" :["_admin"]
        });
    }; 
    
    $scope.toggleSearch = function(type) {
        $scope.searchState = {};
        $scope.searchState[type] = 'active';
        localStorage.setItem('quilt_usersSearchState', type);
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
    var editUser = function(row, fetch) {
        var vow = VOW.make();
        if (!fetch) selectedRow = row;
        if (row.type === 'admin')  {
            vow.keep(row);
            if (fetch) return vow.promise;
            $scope.justPwd = true;
            $scope.newUserShouldBeOpen = true;
            $scope.userName = row._id;
        }
        else {
            couchapi.docGet(row._id, '_users').when(
                function(user) {
                    row.roles = user.roles.toString();
                    row.rolesArray = user.roles;
                    vow.keep(row);
                    if (fetch) return;
                    
                    $scope.edited = false;
                    $('#userRoles').editable('setValue', user.roles || [], false);
                    console.log('userroles ', user.roles);
                    $('#changeUserPwd').editable('setValue', '', false);
                    $scope.selectedUser = row;
                    $scope.$apply();
                
                },
                function(err) {
                    console.log(err);
                        vow.break(row);
                }
                );
        } 
        return vow.promise;
    };
    
    
    var setAdminUser = function(userName, password) {
        
        couchapi.config('admins', userName, password).when(
            function(data) {
                console.log(data);
                $scope.password = null;
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                $scope.password = null;
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
                $scope.password = null;
                //TODO bit overkill, only need to fetch updated user database, or just add to state.users..
                delete state.allUsers;
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                $scope.password = null;
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
    
    // $scope.removeUser = function(id) {
    //     console.log(id);
    //     if (confirm('Are you sure?'))
    //         couchapi.userRemove(id).when(
    //             function(data) {
    //                 console.log(data);
    //                 //TODO bit overkill, only need to fetch updated user database, or just remove from state.users..
    //                 state.users = state.users.filter(function(u) {
    //                     if (u!==id) return true;
    //                     return false;
    //                 });
    //                 $scope.$apply();
    //             },
    //             function(data) {
    //                 console.log("error",data);
    //                 alert('Not able to remove user..', data);
    //             }
    //         );
    // };
    
    
    $scope.apply = function ( ){
        var vows = [];
        if ($scope.viewState.admins) removeAdminUsers();
        else {
            // if (!confirm('Are you sure?')) return;
            $scope.rows.forEach(function(row) {
                if (!row.modified) return;
                if (row.delete === true)
                    vows.push(couchapi.userRemove(row._id));
                else {
                    var props = {};
                    if (row.rolesArray) props.roles = row.rolesArray;
                    if (row.newPwd) props.password = row.newPwd;
                    vows.push(couchapi.userUpdate(row._id.slice(17), props));
                } 
	    });
        
            if (vows.length > 0)
                VOW.every(vows).when(
                    function(data) {
                        console.log(data);
                        delete state.allUsers;
                        state.initialize($scope);
                        $scope.modifiedCount = 0;
                    },
                    function(err) {
                        alert('Error removing or updating at least one of the users..');
                        console.log(err);
                        $scope.modifiedCount = 0;
                        delete state.allUsers;
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
    
    $('#changeUserPwd').editable({
        type: 'password',
        value: 'whatever',
        emptytext: "[hidden]",
        emptyclass: "",
        unsavedclass: null,
        success: function(response, newValue) {
            // config.set({ couchDbUrl: newValue });
            console.log(newValue);
            selectedRow.newPwd = newValue;
            endEdit(selectedRow, 'pwd', '');
            $scope.$apply();
        }
    });
    
    $('#userRoles').editable({
        // value: [2, 3],    
        unsavedclass: null
        ,mode:'inline'
        ,inputclass:'userEditable' 
        ,showbuttons:'bottom'
        ,viewseparator: ' , '
        ,select2: {
            tags: ['read', 'write']
        }
        ,success: function(response, newRoles) {
            console.log($scope.selectedUser,newRoles);
            if ($scope.selectedUser.roles.toString() !== newRoles.toString()) {
                selectedRow.roles = newRoles.toString();
                endEdit(selectedRow, 'roles', selectedRow.rolesArray.toString());
                selectedRow.rolesArray = newRoles;
            }
            $scope.$apply();
        }
    });   
    
    
    $scope.viewState = 'admins';
    if (!state.usersDone) {
        
        defineGrid();
        state.usersDone = true;

        $scope.$on('initAllUsers',
                   function() {
                       console.log('initUsers event');
                       // dereg()
                       
                       $scope.toggleAdminsUsers(localStorage.getItem('quilt_usersViewState') || 'users');
                       var databaseRoles = [];
                       
                       state.databases.forEach(function(d) {
                           databaseRoles.push('read-' + d.name);
                           databaseRoles.push('write-' + d.name);
                           var moreRoles = [
                               "allow_" + d.name + "_type:'shift'"
                               ,"allow_" + d.name + "_type:'location'"
                               ,"allow_" + d.name + "_type:'person'"
                               ,"allow_" + d.name + "_type:'user'"
                               ,"allow_" + d.name + "_type:'settings'"
                           ];
                           databaseRoles = databaseRoles.concat(moreRoles);
                       }); 
                       var moreRoles = [
                           'read', 'write'
                           ,"allow_*_type:'shift'"
                           ,"allow_*_type:'location'"
                           ,"allow_*_type:'person'"
                           ,"allow_*_type:'user'"
                           ,"allow_*_type:'settings'"
                       ];
                       databaseRoles = databaseRoles.concat(moreRoles);
                       
                       $('#userRoles').editable('option', 'select2',
                                                    { tags: databaseRoles });
                       // $scope.rows = state.allUsers;

                       // defineGrid();
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // $scope.pickFields(screenState.fieldGroup);
                       // console.log($scope.columnDefs);
                   });
    }
    
});


