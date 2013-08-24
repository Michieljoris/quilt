/*global $:false VOW:false couchapi:false angular:false console:false*/


angular.module("myApp").controller("testCntl", function ($scope, state, defaults, persist) {
    "use strict";
    
    $scope.parentModel =  { myobject: { one:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } }};
    
    console.log('In testCntl');

    // $scope.search = function () {
    //     console.log($scope.searchText);
    //     $scope.dbGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    // };
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    
    var cellTemplate =
        '<div ng-click="designGridClick(col.field, row.entity, !row.selected)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
   
    var passCellTemplate =
        '<div ng-class="{highlight:row.entity.pass==\'No\'}" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
    
    
    var testDocCellTemplate =
        '<div ng-click="testDocClick(col.field, row.entity, !row.selected)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
    
    $scope.testDocClick = function(field, row) {
        // console.log('click', field, row);
        $scope.selectedRow = row;
        $('#testDocName').editable('setValue', row.doc|| [], false);
    };
    
    $scope.changeDropbox = function(row, field, old) {
        row.pass = row.result = row.reason = '';
        endEdit(row, field, old);
        // console.log('change!!', row, field, old);
    };
    $scope.testclick = function(row) {
        console.log(row.database);
    };
    
    var userCellTemplate =
        '<div> <select class="cellSelect" ng-model="COL_FIELD"> <option ng-repeat="status in statuses">{{status}}</option> </select> </div>';
    
    var editableCellTemplateUsers = '<select ng-change="changeDropbox(row.entity,\'user\', \'\')" id="comboSelect" class="cellSelect" ng-index="COL_FIELD" ng-combobox ng-options="s.name as s.name for s in state.allUsers" list="items" ng-model="row.entity.user"> </select>';
    var editableCellTemplateDatabases = '<select ng-change="changeDropbox(row.entity,\'database\', \'\')" id="comboSelect1" class="cellSelect" ng-index="COL_FIELD" ng-combobox ng-options="db.name as db.name for db in state.databases" list="items" ng-model="row.entity.database"> </select>';
    var editableCellTemplateResult = '<select ng-change="changeDropbox(row.entity,\'expexted\', \'\')" id="comboSelect2" class="cellSelect" ng-index="COL_FIELD" ng-combobox ng-options="r.name as r.name for r in results" list="items" ng-model="row.entity.expected"> </select>';
    var editableCellTemplateTestDocs = '<select ng-change="changeDropbox(row.entity,\'doc\', \'\')" id="comboSelect3" class="cellSelect" ng-index="COL_FIELD" ng-combobox ng-options="r.doc as r.doc for r in state.testDocs" list="items" ng-model="row.entity.doc"> </select>';
    
    $scope.results = [{name: "Success", value: true }, { name: "Failure", value: false }];
    // var rowInAce;
    // $scope.designGridClick = function(field, row, isSelected) {
        
    //     console.log(field, row, isSelected);
    //     // editor.getSession().on('change', function(e) {
    //     //     row.modified = true;
    //     //     row.value = editor.session.getValue();
    //     //     // $scope.$apply();
    //     // });
        
    //     if (isSelected) {
    //         editor.session.setValue(row.value);   
    //         rowInAce = row;
    //     }
    //     else {
    //         rowInAce = undefined;
    //         editor.session.setValue(editorFiller);   
    //     }
    // };

    $scope.toggleViewStateGroup = function(someFuncType) {
        $scope.funcType = someFuncType;
        $scope.viewStateGroup = {};
        $scope.viewStateGroup[someFuncType] = 'active';
        if ($scope.viewState1.values)   
            $scope.designGridOptions.$gridScope.filterText =
            'type:value;funcType:' + $scope.funcType + ';';
    };
    function defineGrid() {
        // console.log('making test grid');
        $scope.columnDefs =
            [
                {visGroup:'value', field:'pass', displayName:'pass', enableCellEdit: false, visible:true
                 ,width:50
                  ,cellTemplate: passCellTemplate
                } 
                ,{visGroup:'both', field:'database', displayName:'database', enableCellEdit: true, visible:true
                  ,editableCellTemplate: editableCellTemplateDatabases
                  ,width:120
                  // ,cellTemplate: cellTemplate
                 }
                ,{visGroup:'both', field:'user', displayName:'user', enableCellEdit: true, visible:true
                  // ,cellTemplate: cellTemplate,
                  // ,editableCellTemplate: userCellTemplate
                  ,width:120
                  ,editableCellTemplate: editableCellTemplateUsers
                 }
                ,{visGroup:'value', field:'pwd', displayName:'password', enableCellEdit: true, visible:true,
                  width:80,
                  cellTemplate: cellTemplate } //toggle
                
                ,{visGroup:'value', field:'doc', displayName:'doc', enableCellEdit: true, visible:true,
                  editableCellTemplate: editableCellTemplateTestDocs
                  ,width:150
                  // cellTemplate: cellTemplate
                 } //toggle
                ,{visGroup:'both', field:'expected', displayName:'expected'
                  // ,cellTemplate: checkBoxTemplate
                  ,editableCellTemplate: editableCellTemplateResult
                  ,enableCellEdit:true, width:80, visible:true}
                ,{visGroup:'value', field:'result', displayName:'result', enableCellEdit: false
                  ,width:80
                  ,visible:true, cellTemplate: cellTemplate } //toggle
                ,{visGroup:'value', field:'reason', displayName:'(reason)', enableCellEdit: false, visible:true, cellTemplate: cellTemplate } //toggle
                ,{visGroup:'both', field:'quilt', displayName:'quilt',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
            ];
    
    
        // $scope.designRows =  [
        //     { type:'value', database: 'db1', design: 'ddoc', group: 'views', name: 'myview', value: 'this is the value'}
        //     ,{ type:'key',  designPath: 'db2/ddoc2' , value: 'some ddoc' }
        //     ,{ type:'key',  groupPath:'db2/ddoc2/views', value: 'some view' }
        // ];
            
        $scope.testGridOptions = { data: 'state.tests'
                                   ,columnDefs: "columnDefs"
                                   // ,columnDefs: $scope.columnDefs
                                   ,rowHeight:25 
                                   ,headerRowHeight: 30
                                   ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                   '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                   '<div ng-cell></div>' +
                                   '</div></div>'
                                   ,enableRowSelection: true
                                   ,enableCellEditOnFocus: true
                                   ,selectWithCheckboxOnly: true
                                   ,enableCellEdit: true
                                   ,enableCellSelection: true
                                   ,showSelectionCheckbox: true
                                   ,enableColumnResize: true
                                   ,enableColumnReordering: true
                                   ,enableRowReordering: true
                                   ,showColumnMenu: false
                                   ,showFilter: false
                                   ,showGroupPanel: true
                                   ,multiSelect: true
                                   ,keepLastSelected: false
                                   ,init:function(grid, scope) {
                                       // console.log(grid, scope);
                                       // $scope.$gridScope = scope;
                                       window.grid = grid;
                                       window.gridScope = scope;
                                       window.appScope = $scope;
                                       // $scope.pickFields(screenState.fieldGroup);
                                       // $scope.viewState(screenState.filterState);
                                   }
                                 };
        // console.log('Done making grid');
       
    }
    
    function defineDocGrid() {
        // console.log('making test grid');
        $scope.docsColumnDefs =
            [
                {visGroup:'value', field:'doc', displayName:'doc', enableCellEdit: false, visible:true
                 // editableCellTemplate: editableCellTemplateTestDocs,
                 ,cellTemplate: testDocCellTemplate
                 // ,width:150
                 // cellTemplate: cellTemplate
                } //toggle
                ,{visGroup:'both', field:'quilt', displayName:'quilt',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
            ];
    
    
        // $scope.designRows =  [
        //     { type:'value', database: 'db1', design: 'ddoc', group: 'views', name: 'myview', value: 'this is the value'}
        //     ,{ type:'key',  designPath: 'db2/ddoc2' , value: 'some ddoc' }
        //     ,{ type:'key',  groupPath:'db2/ddoc2/views', value: 'some view' }
        // ];
            
        $scope.testDocsGridOptions = { data: 'state.testDocs'
                                       ,columnDefs: "docsColumnDefs"
                                       // ,columnDefs: $scope.columnDefs
                                       ,rowHeight:25 
                                       ,headerRowHeight: 30
                                       ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                       '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                       '<div ng-cell></div>' +
                                       '</div></div>'
                                       ,enableRowSelection: true
                                       ,enableCellEditOnFocus: true
                                       ,selectWithCheckboxOnly: false
                                       // ,enableCellEdit: true
                                       // ,enableCellSelection: false
                                       ,showSelectionCheckbox: true
                                       ,enableColumnResize: true
                                       ,enableColumnReordering: true
                                       ,enableRowReordering: true
                                       ,showColumnMenu: false
                                       ,showFilter: false
                                       ,showGroupPanel: false
                                       ,multiSelect: true
                                       ,keepLastSelected: false
                                       // ,init:function(grid, scope) {
                                       //     console.log(grid, scope);
                                       //     // $scope.$gridScope = scope;
                                       //     window.grid = grid;
                                       //     window.gridScope = scope;
                                       //     window.appScope = $scope;
                                       //     // $scope.pickFields(screenState.fieldGroup);
                                       //     // $scope.viewState(screenState.filterState);
                                       // }
                                     };
        // console.log('Done making testdoc grid');
       
    } 
    
    // var screenState = {
    //     fieldGroup: 'Copy'
    //     ,filterState: 'values'
    // };
    
    
    
    $scope.modifiedCount = 0;
    // $scope.originalRows = {};
    function endEdit(row, field, old) {
        console.log(row, field, old);
        if ($scope.editDocs && field === 'doc') {
            var newName = row.doc;
            row.doc = old;
            row.doc = getUniqueTestDocName(newName);
        }
        if (!row.original) row.original = (function() {
            var original = angular.copy(row);  
            original[field] = old;
            // console.log(JSON.stringify(original,null, ' '));
            return original;
        })();
        // console.log(row, field, old);
        var different = Object.keys(row).some(function(e) {
            if (e === 'modified' || e === 'original' || (!row[e] && !row.original[e]) ||
                angular.equals(row[e], row.original[e])) return false; 
            return true;
        });
        // console.log(different);
        
        if (different && !row.modified) {
            // console.log(1);
            row.modified = true;   
            $scope.modifiedCount++;
        }
        
        if (!different && row.modified) {
            
            // console.log(2);
            row.modified = false;
            $scope.modifiedCount--;   
        }
            
    } 
    
    $scope.undo = function() {
        // console.log('undo');
        var selRows = $scope.editDocs ?
            $scope.testDocsGridOptions.$gridScope.selectedItems :
            $scope.testGridOptions.$gridScope.selectedItems;
        if (selRows.length === 0) alert('Please select rows to undo');
        angular.forEach(selRows, function(selRow) {
            var originalRow = selRow.original;
            if (originalRow) {
                if (selRow.dereg) selRow.dereg();
                delete selRow.dereg;
                delete selRow.original;
                delete selRow.modified;
                angular.copy(originalRow, selRow);
                if (!$scope.editDocs) return;
                selRow.dereg = $scope.$watch(function() { return selRow; }, function(updated, old) {
                    if (angular.equals(updated.value, old.value)) return;
                    endEdit(updated, 'value', old.value);
                    // console.log('change', updated, old);
                }, true);
                
                // $scope.designRows.forEach(function(row) {
                //     if (row.path === originalRow._id)
                //         angular.copy(originalRow, row);
                // });
            }
        });
        
        
        if ($scope.editDocs) $('#testDocName').editable('setValue', $scope.selectedRow.doc || [], false);
        
        if ($scope.editDocs) 
            $scope.testDocsGridOptions.selectVisible(false);
        else $scope.testGridOptions.selectVisible(false);
    }; 
    
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        // console.log('edited design row', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
        endEdit(rep, field, old);
        $scope.$apply();
    });
    
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        row.entity[col.field] = !row.entity[col.field];
        
        endEdit( row.entity, col.field, !row.entity[col.field]);
    };
    
    $scope.apply = function() {
        var array = [];
        if ($scope.editDocs) {
            state.testDocs.forEach(function(t) {
                delete t.original;
                delete t.modified;
                if (t.quilt) {
                    array.push(t);    
                }
            }); 
            persist.put("quilt_testDocs", array);
            
            return;
        }
        state.tests.forEach(function(t) {
            delete t.original;
            delete t.modified;
            if (t.quilt) {
                array.push(t);    
            }
        }); 
        persist.put("quilt_tests", array);
        var selRows = $scope.testGridOptions.$gridScope.selectedItems;
        
        // console.log('apply to selrows',selRows);
        wipeAllTestDocs(state.tests).when(
            function() {
                return doAllTests(state.tests);
            }).when(
                function(tests) {
                    $scope.$apply();
                    state.user.pwd = state.user.pwd || state.user.name;
                    couchapi.login(state.user.name, state.user.pwd).when(
                        function() {
                        },
                        function(data) {
                            state.user.pwd = prompt('Please enter your server admin password so I can log you back in now the tests are done. I will remember this password till you refresh the page');
                            couchapi.login(state.user.name, state.user.pwd);
                        }  
                    );
                    
                    state.tests.forEach(function(t) {
                        delete t.reason;
                        delete t.result;
                        delete t.modified;
                        delete t.original;
                        delete t.pass;
                        t.original = angular.copy(t);
                    }); 
                    
                    console.log('all tests done:', tests);
                },
                function(error) {
                    console.log('shouldnt happen.. Error:', error);
                }
            );
        
        // $scope.testGridOptions.selectVisible(false);
    };

    function getUniqueTestDocName(name) {
        var uniqueName = name;
        function isUnique(name) {
            for( var i=0; i < state.testDocs.length; i++){
                if (state.testDocs[i].doc === name) return false;
            }
            return true;
        }
        var u = 1;
        while (!isUnique(uniqueName)) { uniqueName  = name + (++u); }
        return uniqueName;
    }
        
    
    $scope.newRow = function() {
        var newRow;
        if ($scope.editDocs) {
            newRow = {
                doc: getUniqueTestDocName("New test doc"),
                value: {  },
                quilt: true
            };
            state.testDocs.push(newRow);
            state.testDocsMap[newRow.doc] = newRow.value;
            
            endEdit(newRow, "quilt", false);
            $scope.testDocsGridOptions.selectVisible(false);
            // console.log('index', state.testDocs.length);
            $scope.selectedRow = newRow;
            setTimeout(function() {
                $scope.testDocsGridOptions.selectItem(state.testDocs.length-1, true);
                $scope.$apply();
            });
            window.mygrid = $scope.testDocsGridOptions;
            
            return;
        }
        
        // console.log('adding new test', $scope.selDbs.Test);
        if (true || $scope.selDbs.Test && $scope.selDbs.Test[0]) {
            newRow = {
                database: $scope.selDbs.Test[0] || ''
            };
            state.tests.push(newRow);
            newRow.original = angular.copy(newRow);
            newRow.quilt = true;
            endEdit(newRow, "quilt", false);
        }
    };
    
    $scope.test = function() {
        // console.log('hello', state.user.name);
    };
    
    
    $scope.togglePassed = function(toggle) {
        $scope.passed = {};
        $scope.passed[toggle] = 'active';
        
        if (toggle === 'all') {
            $scope.testGridOptions.$gridScope.filterText = '';
            return;
        }
        
        $scope.testGridOptions.$gridScope.filterText = "pass:" +
            (toggle === 'passed' ? 'Yes' : (toggle === 'indeterminate' ? '?' :  'No'));
    }; 
    
    
    function doTest(test) {
        function probe(test, vow) {
            if (!test.database) {
                test.result = "Failure";
                test.reason = "No database given";
                if (test.expected === 'Failure')
                    test.pass = 'Yes';
                else test.pass = 'No';
                vow.keep(test);
                return;
            }
            if (test.doc && !state.testDocsMap[test.doc] ) {
                test.result = "Failure";
                test.reason = "Can\'t find doc in test docs"; 
                if (test.expected === 'Failure')
                    test.pass = 'Yes';
                else test.pass = 'No';
                vow.keep(test);
                return;
                
            }
            console.log('about to do action');
            var action;
            if (test.doc) {
                var docToSave = angular.copy(state.testDocsMap[test.doc]);
                docToSave._id = 'quilt_' + test.doc;
                action = couchapi.docSave(docToSave, test.database);
            }
            else action = couchapi.dbInfo(test.database);
            action.when(
                function(data) {
                    console.log('successfully done action', data);
                    test.result = 'Success';
                    if (test.expected === 'Success')
                        test.pass = 'Yes';
                    else test.pass = 'No';
                    delete test.reason;
                    // test.data = data;
                    vow.keep(test);
                },
                function(err) {
                    console.log(err);
                    test.result = 'Failure';
                    test.reason = err.reason;
                    if (test.expected === 'Failure')
                        test.pass = 'Yes';
                    else test.pass = 'No';
                    vow.keep(test);  
                }
            );
        }
        
        var vow = VOW.make();
        test.pwd = test.pwd || test.user;
        couchapi.login(test.user, test.pwd).when(
            function() {
                console.log('Successfully logged in as ' + test.user);
                probe(test, vow);            
            },
            function(data) {
                test.result = "?";
                test.reason = "Login failed. " + data.toString();
                test.pass = '?';
                console.log('error logging in for ', test);
                vow.keep(test);
            }  
        );
        return vow.promise;
    }
    
    function doAllTests(tests) {
        var vow = VOW.make();
        var remaining = tests.length;
        var counter = 0;
        function recur() {
            doTest(tests[counter++]).when(
                function() {
                    remaining--;
                    if (remaining) recur();
                    else vow.keep(tests);
                }
                ,function(error) {
                    vow.break(error);
                }
            );
        }
        recur();
        return vow.promise;
    }
    
    function wipeAllTestDocs(tests) {
        console.log('wiping all test docs', tests);
        var vow = VOW.make();
        var vows = [];
        tests.forEach(function(t) {
            vows.push(couchapi.docRemoveById('quilt_' + t.doc, t.database));
        }); 
        VOW.any(vows).when(
            function(arr) {
                console.log('done wiping', arr);
                vow.keep(tests);
                arr.forEach(function(e, i) {
                    if (!e) console.log('Couldn\'t wipe ' + tests[i].doc);
                });
                
            }
        );
        return vow.promise;
        
    }
    
    defineGrid();
    defineDocGrid();
    $scope.passed = { all: 'active' };
    
    $('#testDocName').editable({
        unsavedclass: null,
        type: 'text',
        value: '',
        success: function(response, newValue) {
            var oldValue = $scope.selectedRow.doc;
            $scope.selectedRow.doc = newValue;
            endEdit($scope.selectedRow, 'doc', oldValue);
            $scope.$apply();
        }
    });
    
    
    
    $scope.selectedRow = { value: {} };
    if (!state.testDone) {
        state.testDone = true;
        state.testDocsMap = {};
        state.testDocs.forEach(function(t) {
            t.value = t.value || {};
            state.testDocsMap[t.doc] = t.value;
            t.dereg = $scope.$watch(function() { return t; }, function(updated, old) {
                console.log('change!!!');
                if (angular.equals(updated.value, old.value)) return;
                // dereg();
                endEdit(updated, 'value', old.value);
                console.log('change', updated, old); }, true);
        }); 
        // console.log('in test done', $scope.testGridOptions);
        // $scope.$watch('state.testDocs', function() { console.log('change', arguments); }, true);
        
        // console.log('allusers:', state.allUsers);
        // console.log('databases', state.databases);
        $scope.$on('initTest',
                   function() {
                       // setValueDocState();
                       // $scope.toggleDocsFunctions('values');
                       // $scope.toggleViewStateGroup('validate');
                       console.log('in initTest');
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // console.log($scope.columnDefs);
                   });
    } 
    
    
}); 
                                   