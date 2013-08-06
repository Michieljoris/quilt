/*global VOW:false $:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/


angular.module("myApp").controller("databasesCntl", function ($scope, $location, state, defaults, persist) {

    console.log('In databasesCntl');
    
    
    $scope.fetchAllInfo = function() {
        var vows = [];
        $scope.rows.forEach(function(r) {
            vows.push(editRow(r, 'fetch'));
        });
        VOW.any(vows).when(function() {
            $scope.$apply();
        });
    };

    $scope.getGridWidth = function() {
        // if ($scope.viewState.admins) return "narrow";
        return '';
    };
    
    $scope.getRowClass = function(row) {
        // console.log('row', row);
        if (row.selected && row.getProperty('modified')) return 'selectedAndModified';
        if (row.getProperty('modified')) return 'modified';
        return '';
    }; 
    
    $scope.gridClick = function(field, row) {
         editRow(row);
    };
    

    $scope.search = function (){
        console.log($scope.searchText);
        $scope.databaseGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
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
console.log(row, field, old, row[field]);
        if (row[field] !== old) {
            console.log(row, $scope.originalRows[row.name]);
            delete row.modified;
            if (!row.cancel) delete row.cancel;
            if (angular.equals(row, $scope.originalRows[row.name])) {
                row.modified = false;
                $scope.modifiedCount--;
            }
            else {
                if (!$scope.originalRows[row.name]) {
                    $scope.originalRows[row.name] = angular.copy(row);
                    $scope.originalRows[row.name][field] = old;
                    delete $scope.originalRows[row.name].cancel;
                }
                $scope.modifiedCount++;
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
             field:'names', displayName:'users', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate,
             field:'roles', displayName:'roles', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate, width:50,
             field:'count', displayName:'count', enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate, width:70,
              field:'size', displayName:'size',
              enableCellEdit: false, visible:true}
            
            ,{visGroup:'Essential',
             cellTemplate : cellTemplate, width:70,
              field:'update_seq', displayName:'update_seq',
              enableCellEdit: false, visible:true}
            
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


        $scope.databaseGridOptions = { data: 'rows'
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

    //     $scope.databaseGridOptions.groupBy(grouped ? '' : '_replication_state');
    // };


    // $scope.refresh = function() {
    //     console.log('refresh' state.reps);
    //     window.test = $scope.databaseGridOptions;
    //     state.setActiveScreen($scope, '#replications');
    //     // defineGrid();
    // };


    $scope.undo = function() {
        console.log('undo');
        var selRows = $scope.databaseGridOptions.$gridScope.selectedItems;
        // var selRows = $scope.rows;
        angular.forEach(selRows, function(selRow) {
            var originalRow = $scope.originalRows[selRow.name];
            if (originalRow) {
                $scope.rows.forEach(function(row) {
                    if (row.name === originalRow.name)
                        angular.copy(originalRow, row);
                    delete $scope.originalRows[selRow.name];
                    // $scope.modifiedCount--;
                });
            }
        });
        $scope.selectedUser = false;
    };

    
    var selectedRow;
    var editRow = function(row, fetch) {
        var vow = VOW.make(); 
        if (!fetch) $scope.selectedDatabase = row;
        console.log(row);
        if (!fetch) selectedRow = row;
        var done = 0;
        $scope.databaseError = false;
        couchapi.dbInfo(row.name).when(
            function(data) {
                row.update_seq = data.update_seq;
                row.count = data.doc_count;
                row.size = data.disk_size;
                var suffix = " bytes";
                if (row.size > 1024) {
                    row.size = Math.floor(((row.size/1024)*10))/10;
                    suffix = " KB";
                    if (row.size > 1024) {
                        row.size = Math.floor(((row.size/1024)*10))/10;
                        suffix = " MB";
                    }
                }
                row.size = row.size + suffix;
                if (!fetch) {
                    $scope.$apply();
                    $scope.dbInfo = data;
                    console.log(data);
                }
                else {
                    done++;
                    if (done === 2) vow.keep();
                }
            }
            ,function(err) {
                if (fetch) {
                    done++;
                    if (done === 2) vow.break();
                    return;
                }
                $scope.dbInfo = null;
                if (err === 401) {
                    $scope.databaseError = "Unable to retrieve database info docs. Unauthorized";
                }
                else {
                    $scope.databaseError = "Unable to retrieve database info" + err;
                }
                
                console.log('database info error', err, $scope.databaseError);
                $scope.$apply();

            }
        );
        
        
        
        // if (row.rolesArray) {
        //     $('#dbMemberNames').editable('setValue', row.namesArray || [], false);
        //     $('#dbMemberRoles').editable('setValue', row.rolesArray || [], false);
        //     return;
        // }
        
        couchapi.dbSecurity(row.name)
            .when(
                function(secObj) {
                    console.log('secObj for ' , row.name, secObj);
                    // $scope.secObj = secObj = secObj || {};

                    $scope.securityError = false;
                    row.namesArray = secObj.members ? secObj.members.names: [];
                    row.rolesArray = secObj.members ? secObj.members.roles: [];
                    $('#dbMemberNames').editable('setValue', row.namesArray, false);
                    $('#dbMemberNames').editable('option', 'select2',
                                                 { tags: state.allUsersArray});
                    $('#dbMemberRoles').editable('setValue', row.rolesArray, false);
                    $('#dbMemberRoles').editable('option', 'select2',
                                                 { tags: ['read-' + row.name, 'write-' + row.name]});
                    row.names = row.namesArray ? row.namesArray.toString() : 'error';
                    row.roles = row.rolesArray ? row.rolesArray.toString() : 'error';

                    if (fetch) {
                        done++;
                        if (done === 2) vow.keep();
                        return;
                    }
                    $scope.$apply();

                },
                function(err) {
                    if (fetch) {
                        done++;
                        if (done === 2) vow.break();
                        return;
                    }
                    if (err === 401) {
                        $scope.securityError = "Unable to retrieve database info. Unauthorized";
                    }
                    else {
                        $scope.securityError = "Unable to retrieve database security info. " + err;
                    }
                    console.log(err);
                    $scope.$apply();
                }
            );
        return vow.promise;
    };
    
    
    $scope.addDatabase = function() {

        couchapi.dbCreate($scope.dbName).when(
            function(data) {
                console.log(data);
                $scope.newDatabaseShouldBeOpen = false;
                //TODO bit overkill, only need to fetch updated database list, or just add to state.databases..
                delete state.databases;
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The database already exists probably. Anyway the database has not been created.', data);
            }
        );

    };
    
    $scope.addDatabaseDialog = function() {
        $scope.newDatabaseShouldBeOpen = true;
    };

    $scope.closeDatabase = function() {
        $scope.newDatabaseShouldBeOpen = false;
    };
    
    
    $scope.apply = function ( ){
        var vows = [];
        // if (!confirm('Are you sure?')) return;
        $scope.rows.forEach(function(row) {
            if (!row.modified) return;
            if (row.delete === true)
                vows.push(couchapi.dbRemove(row.name));
            else {
                var secObj = { members: {} };
                if (row.rolesArray) secObj.members.roles = row.rolesArray;
                if (row.namesArray) secObj.members.names = row.namesArray;
                vows.push(couchapi.dbSecurity(secObj, row.name).when(
                    function(data) { console.log(data);
                                     $scope.$apply();
                                   }
                    ,function(data) {
                        alert('Unable to update the database\'s details. ' + data);
                        console.log('error ', data); }
                ));
            } 
	});
        
        if (vows.length > 0)
            VOW.every(vows).when(
                function(data) {
                    console.log(data);
                    delete state.databases;
                    state.initialize($scope);
                    $scope.modifiedCount = 0;
                },
                function(err) {
                    alert('Error removing or updating at least one of the users..');
                    console.log(err);
                    $scope.modifiedCount = 0;
                    delete state.databases;
                    state.initialize($scope);
                }
            );
    };
        
    
    $('#dbMemberNames').editable({
        unsavedclass: null
        ,select2: {
            tags: ['read-_users', 'write-_users']
        }
        ,success: function(response, newValue) {
            console.log(newValue);
            selectedRow.namesArray = newValue;
            var oldValue = selectedRow.names; 
            selectedRow.names = newValue.toString();
            endEdit(selectedRow, 'names', oldValue);
            $scope.$apply();
        }
    });


    $('#dbMemberRoles').editable({
        unsavedclass: null
        ,select2: {
            tags: ['read-_users', 'write-_users']
        }
        ,success: function(response, newValue) {
            console.log(newValue);
            selectedRow.rolesArray = newValue;
            var oldValue = selectedRow.roles;
            selectedRow.roles = newValue.toString();
            endEdit(selectedRow, 'roles', oldValue);
            $scope.$apply();
        }
    });
    
    if (!state.databasesDone) {
        defineGrid();
        state.databasesDone = true;
        $scope.$on('initDatabases',
                   function() {
                       console.log('initDatabases event');
                       // dereg()
                       
                       // $scope.toggleAdminsUsers(localStorage.getItem('quilt_usersViewState') || 'users');
                       $scope.rows = state.databases;

                       // defineGrid();
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // $scope.pickFields(screenState.fieldGroup);
                       // console.log($scope.columnDefs);
                   });
    }

});
