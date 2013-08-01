/*global ace:false angular:false couchapi:false VOW:false*/

angular.module("myApp").controller("designCntl", function ($scope, $location, state) {
    "use strict";
    
    console.log('In designCntl');
    
    $scope.search = function () {
        console.log($scope.searchText);
        $scope.dbGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    };
    
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    
    var cellTemplate =
        '<div ng-click="designGridClick(col.field, row.entity, !row.selected)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
    
    var rowInAce;
    $scope.designGridClick = function(field, row, isSelected) {
        
        console.log(field, row, isSelected);
        // editor.getSession().on('change', function(e) {
        //     row.modified = true;
        //     row.value = editor.session.getValue();
        //     // $scope.$apply();
        // });
        
        if (isSelected) {
            editor.session.setValue(row.value);   
            rowInAce = row;
        }
        else {
            rowInAce = undefined;
            editor.session.setValue(editorFiller);   
        }
    };

    $scope.funcTypes = [
        'validate', 'views', 'shows', 'lists', 'updates', 'filters'
    ];
    
    $scope.toggleViewStateGroup = function(someFuncType) {
        $scope.funcType = someFuncType;
        $scope.viewStateGroup = {};
        $scope.viewStateGroup[someFuncType] = 'active';
        if ($scope.viewState1.values)   
            $scope.designGridOptions.$gridScope.filterText =
            'type:value;funcType:' + $scope.funcType + ';';
    };
    
    function addRowsByFuncType(d, funcType, row) {
        if (funcType === 'validate' && d.validate_doc_update) {
            $scope.designRows.push(
                angular.extend({
                    type:'value'
                    ,name: 'validate'
                    ,funcType: 'validate'
                    ,value:  d.validate_doc_update
                }, row));
        }
        else if (d[funcType] && angular.isArray(d[funcType])) {
            Object.keys(d[funcType]).forEach(function(n) {
                $scope.designRows.push(
                    angular.extend({
                        type: 'value'
                        ,name: n
                        ,funcType: funcType
                        ,value: d[funcType][n]
                    }, row));
            });
        }
    } 
    
    
    function addToDesignRows(dbName) {
        if (!dbName) return;
        var docs = $scope.designDocs[dbName];
        console.log(docs);
        var row = { database: dbName };
        docs.forEach(function(d) {
            row.design = d._id.slice(8);
            $scope.designRows.push(
                angular.extend({ type:'doc' }, row));
            $scope.funcTypes.forEach(function(funcType) {
                addRowsByFuncType(d, funcType, row);   
            });
        });
    }
    
    
    function dbSelectionChanged() {
        var designDocs = $scope.designDocs;
        var selRows = $scope.dbGridOptions.
            $gridScope.selectedItems;
        var selDatabases = [];
        selRows.forEach(function(r) {
            selDatabases.push(r.name);
        });
        console.log(selDatabases);
        
        //add rows for every newly selected database
        var vows = [];
        angular.forEach(selDatabases, function(dbName) {
            if (!designDocs[dbName]) {
                vows.push(getDesignDocs(dbName) );
            }});
        VOW.any(vows).when(
            function(array){
                console.log('adding design rows', array);
                array.forEach(addToDesignRows);
                $scope.$apply();
            });
        
        //Remove database from designDocs and take out the rows of non
        //selected databases
        Object.keys($scope.designDocs).forEach(function(dbName) {
            if (selDatabases.indexOf(dbName) === -1)
                delete designDocs[dbName];
        });
        
        $scope.designRows = $scope.designRows.filter(function(row) {
            return selDatabases.indexOf(row.database) !== -1;
        });
        
    } 
    
    function getDesignDocs(dbName) {
        var vow = VOW.make();
        if (!dbName) return vow['break']('Error: no db passed in');
        console.log('getting design docs for ' , dbName);
        couchapi.docAllDesignInclude(dbName).when(
            function(data) {
                var designDocs = data.rows.map(function(r) {
                    return r.doc;
                });
                $scope.designDocs[dbName] = designDocs;
                vow.keep(dbName);
            }
            ,function(err) {
                console.log('error', err);
                if (err === 401) {
                    $scope.designError = "Unable to retrieve database design docs. Unauthorized";
                }
                else {
                    $scope.designError = "Unable to retrieve database design docs" + err;
                }
                vow['break']('$scope.designError');
            }
        );
        
        return vow.promise;
    }
    
    
    
    
    function defineDbGrid() {
        console.log('making dblist grid');
        $scope.dbColumnDefs =
            [
                {visGroup:'value', field:'name',
                 displayName:'Select database(s)', enableCellEdit: false,
                 // cellTemplate : cellTemplate,
                 visible:true, width:130}
            ];
            
        $scope.dbGridOptions = { data: 'state.databases'
                                 ,columnDefs: "dbColumnDefs"
                                 // ,columnDefs: $scope.columnDefs
                                 ,rowHeight:25 
                                 ,headerRowHeight: 30
                                 ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                 '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                 '<div ng-cell></div>' +
                                 '</div></div>'
                                 ,enableRowSelection: true
                                 ,enableCellEditOnFocus: false
                                 ,selectWithCheckboxOnly: false
                                 ,enableCellEdit: false
                                 ,showSelectionCheckbox: true
                                 ,enableColumnResize: false
                                 ,enableColumnReordering: true
                                 ,enableRowReordering: true
                                 ,showColumnMenu: false
                                 ,showFilter: false
                                 ,showGroupPanel: false
                                 ,multiSelect: true
                                 ,keepLastSelected: false
                                 ,afterSelectionChange: dbSelectionChanged
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
        console.log('Done making dblist grid');
       
    }
    
    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs =
            [
                {visGroup:'hidden', field:'type', displayName:'type', enableCellEdit: true, visible:true, width:40}
                ,{visGroup:'hidden', field:'funcType', displayName:'funcType', enableCellEdit: true, visible:true, width:70} //toggle
                
                ,{visGroup:'both', field:'database', displayName:'database', enableCellEdit: true, visible:true, cellTemplate: cellTemplate}
                ,{visGroup:'both', field:'design', displayName:'design', enableCellEdit: true, visible:true, cellTemplate: cellTemplate}
                ,{visGroup:'value', field:'name', displayName:'name', enableCellEdit: true, visible:true, cellTemplate: cellTemplate } //toggle
                ,{visGroup:'both', field:'copy', displayName:'copy',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
                ,{visGroup:'doc', field:'paste', displayName:'paste',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true} 
                ,{visGroup:'both', field:'delete', displayName:'delete',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
            ];
    
    
        // $scope.designRows =  [
        //     { type:'value', database: 'db1', design: 'ddoc', group: 'views', name: 'myview', value: 'this is the value'}
        //     ,{ type:'key',  designPath: 'db2/ddoc2' , value: 'some ddoc' }
        //     ,{ type:'key',  groupPath:'db2/ddoc2/views', value: 'some view' }
        // ];
            
        $scope.designGridOptions = { data: 'designRows'
                                     ,columnDefs: "columnDefs"
                                     // ,columnDefs: $scope.columnDefs
                                     ,rowHeight:25 
                                     ,headerRowHeight: 30
                                     ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                     '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                     '<div ng-cell></div>' +
                                     '</div></div>'
                                     ,enableRowSelection: true
                                     ,enableCellEditOnFocus: false
                                     ,selectWithCheckboxOnly: false
                                     ,enableCellEdit: true
                                     ,showSelectionCheckbox: true
                                     ,enableColumnResize: true
                                     ,enableColumnReordering: true
                                     ,enableRowReordering: true
                                     ,showColumnMenu: true
                                     ,showFilter: true
                                     ,showGroupPanel: true
                                     ,multiSelect: true
                                     ,keepLastSelected: false
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
    
    // var screenState = {
    //     fieldGroup: 'Copy'
    //     ,filterState: 'values'
    // };
    
    
    
    $scope.modifiedCount = 0;
    // $scope.originalRows = {};
    function endEdit(row, field, old) {
        if (!row.original) row.original = (function() {
            var original = angular.copy(row);  
            original[field] = old;
            console.log(JSON.stringify(original,null, ' '));
            return original;
        })();
        console.log(row, field, old);
        var different = Object.keys(row).some(function(e) {
            if (e === 'modified' || e === 'original' || (!row[e] && !row.original[e]) ||
                angular.equals(row[e], row.original[e])) return false; 
            return true;
        });
        console.log(different);
        
        if (different && !row.modified) {
            console.log(1);
            row.modified = true;   
            $scope.modifiedCount++;
        }
        
        if (!different && row.modified) {
            
            console.log(2);
            row.modified = false;
            $scope.modifiedCount--;   
        }
        // if (row[field] !== row.original[field]) {
        //     console.log(row, $scope.originalRows[row._id]);
        //     delete row.modified;
        //     if (angular.equals(row, $scope.originalRows[row._id])) {
        //         row.modified = false;
        //         $scope.modifiedCount++;
        //     }
        //     else {
        //         if (!$scope.originalRows[row._id]) {
        //             $scope.originalRows[row._id] = angular.copy(row); 
        //             $scope.originalRows[row._id][field] = old;
        //         } 
                
        //         $scope.modifiedCount--;
        //         row.modified = true;
        //     }
        // }
    } 
    
    $scope.undo = function() {
        console.log('undo');
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        angular.forEach(selRows, function(selRow) {
            var originalRow = selRow.original;
            if (originalRow) {
                delete selRow.original;
                delete selRow.modified;
                angular.copy(originalRow, selRow);
                // $scope.designRows.forEach(function(row) {
                //     if (row.path === originalRow._id)
                //         angular.copy(originalRow, row);
                // });
            }
        });
        
        $scope.designGridOptions.selectVisible(false);
        editor.session.setValue(editorFiller);
    }; 
    
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        console.log('edited design row', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
        endEdit(rep, field, old);
        $scope.$apply();
    });
    
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        row.entity[col.field] = !row.entity[col.field];
        
        endEdit( row.entity, col.field, !row.entity[col.field]);
    };
    
    // var grouped;
    // $scope.groupByState = function() {
    //     console.log('groupbystate');
        
    //     $scope.gridOptions.groupBy(grouped ? '' : '_replication_state');
    // }; 
    
    
    $scope.refresh = function() {
        console.log('refresh', state.reps);
        window.test = $scope.designGridOptions;
        state.setActiveScreen($scope, '#databases');
    }; 
    
    
    
    $scope.apply = function() {
        
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        
        console.log('selrows',selRows);
        // $scope.designGridOptions.selectItem(1, true);
        console.log('apply2');
        
        $scope.designGridOptions.selectVisible(false);
    };

    $scope.newRow = function() {
        $scope.designRows.push({
            // _id: prompt("Replication id?"),
            // _replication_state: 'stored'
            // ,store: true
            // ,user_ctx: { "roles" :["_admin"]}
        });
    };
    
    
    
    function setDocsFunctionsState() {
        var filter = '';
        if (!$scope.viewState1.all) filter = 'type:' +
            ($scope.viewState1.docs ? 'doc' : 'value');
        $scope.designGridOptions.$gridScope.filterText = filter;
        console.log('applying filter:', filter);
        
        $scope.toggleViewStateGroup($scope.funcType);
        
        $scope.columnDefs.forEach(function(c){
            //hidden, both, doc or  value
            c.visible = $scope.viewState1.all || c.visGroup === 'both' ||
                ($scope.viewState1.docs && c.visGroup === 'doc') ||
                ($scope.viewState1.values && c.visGroup === 'value') ? true : false;
        }); 
        
    }
    
    $scope.toggleDocsFunctions = function(toggle) {
        $scope.viewState1 = {};
        $scope.viewState1[toggle] = 'active';
        setDocsFunctionsState();
    };
    
    $scope.toggleViewState2 = function(toggle) {
        $scope.viewState2 = {};
        $scope.viewState2[toggle] = 'active';
    }; 
    
    var editorFiller = "Please select a database on the far left. After that select a design function\n edit it here.\n\nThe editor uses vim style editing.\n\nIn normal mode press q to toggle full screen.\n\nIn insert mode press F10 to do the same.\n\nTo save the edits to the selected design function press F8 in normal mode. ";
    
    var editor = ace.edit("editor");
    function init() {
    
        editor.setTheme("ace/theme/twilight");
        editor.session.setMode("ace/mode/javascript");
        window.editor = editor;
        // var $ = document.getElementById.bind(document);
        var dom = ace.require("ace/lib/dom");
        var vim = ace.require("ace/keyboard/vim");
        console.log(vim);
        editor.setKeyboardHandler(vim.handler);
    
        editor.commands.addCommand({
            name: 'save data',
            bindKey: {win: 'F8',  mac: 'Command-M'},
            exec: function(editor) {
                console.log('saving data into row');
                var value = editor.session.getValue();
                var oldValue = rowInAce.value;
                rowInAce.value = value;
                endEdit(rowInAce, 'value', oldValue);
                // console.log('change', rowInAce.value);
                $scope.$apply();
                
           
                //  row.modified = true;
                // console.log('change', row.value);
                // $scope.$apply();
            }
        });
    
        editor.commands.addCommand({
            name: 'full screen',
            bindKey: {win: 'F10',  mac: 'Command-M'},
            //I modified keybinding-vim.js so q in normal mode does the same
            exec: function(editor) {
                console.log('full?');
                dom.toggleCssClass(document.body, "fullScreen");
                dom.toggleCssClass(editor.container, "fullScreen");
                editor.resize();
            }
        });
        
        
    }
    
    // $scope.toggleMultipleSingle = function(toggle) {
    //     $scope.multipleSingle = {};
    //     $scope.multipleSingle[toggle] = 'active';
    // }; 

    console.log('end of design cntl', $scope.designGridOptions);
    if (!state.designDone) {
        init();
        state.designDone = true;
        defineGrid();
        defineDbGrid();
        $scope.designDocs = {};
        $scope.designRows = [];
        $scope.funcType = 'validate';
        
        $scope.viewStateGroup = {}       ;
        $scope.viewState1 = { values: 'active' };
        // $scope.viewState2 = { table: 'active' };
        // $scope.viewStateGroup.validate = 'active';
        editor.setValue(editorFiller);
        
        console.log('in design done', $scope.designGridOptions);
        
        $scope.$on('initDesign',
                   function() {
                       // setValueDocState();
                       $scope.toggleDocsFunctions('values');
                       // $scope.toggleViewStateGroup('validate');
                       console.log('in initDesign');
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // console.log($scope.columnDefs);
                   });
    } 
}); 
                                   