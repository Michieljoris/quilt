/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("changesCntl", function ($scope, $location, state, defaults, persist) {
    
    console.log('In changesCntl');
    
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/javascript");
    window.editor = editor;
    // var $ = document.getElementById.bind(document);
    var dom = ace.require("ace/lib/dom");
    var vim = ace.require("ace/keyboard/vim");
    console.log(vim);
    editor.setKeyboardHandler(vim.handler);
    
    editor.commands.addCommand({
        name: 'full screen',
        bindKey: {win: 'F10',  mac: 'Command-M'},
        exec: function(editor) {
            console.log('full?');
            dom.toggleCssClass(document.body, "fullScreen");
            dom.toggleCssClass(editor.container, "fullScreen");
            editor.resize();
        }
        // exec: function(editor) {
        //     console.log('hello');
        //     //...
        // }
        // ,
        // readOnly: true // false if this command should not apply in readOnly mode
    });
    
    
    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs =
            [
                // {visGroup:'value', field:'type', displayName:'type', enableCellEdit: true, visible:true, width:40}
                {visGroup:'value', field:'database', displayName:'database', enableCellEdit: false, visible:true, width:60}
                ,{visGroup:'value', field:'design', displayName:'design', enableCellEdit: true, visible:true, width:70}
                ,{visGroup:'key', field:'designPath', displayName:'designPath', enableCellEdit: true, visible:false, width:130}
                ,{visGroup:'key', field:'groupPath', displayName:'groupPath', enableCellEdit: true, visible:false, width:130}
                ,{visGroup:'value', field:'group', displayName:'group', enableCellEdit: true, visible:true, width:60}
                ,{visGroup:'value', field:'name', displayName:'name', enableCellEdit: true, visible:true, width:70} //toggle
                // ,{visGroup:'value', field:'commit', displayName:'commit',
                //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:50, visible:true }
                ,{visGroup:'value', field:'copy', displayName:'copy',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true }
                ,{visGroup:'key', field:'paste', displayName:'paste',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:false } //toggle
                ,{visGroup:'value', field:'delete', displayName:'delete',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
            ];
    
    
        $scope.designRows =  [
            { type:'value', database: 'db1', design: 'ddoc', group: 'views', name: 'myview', value: 'this is the value'}
            ,{ type:'key',  designPath: 'db2/ddoc2' , value: 'some ddoc' }
            ,{ type:'key',  groupPath:'db2/ddoc2/views', value: 'some view' }
        ];
            
        $scope.designGridOptions = { data: 'designRows'
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
    
    var screenState = {
        fieldGroup: 'Copy'
        ,filterState: 'values'
    };
    
    
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
    
    
    $scope.originalRows = {};
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        console.log('edited design row', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
        endEdit(rep, field, old);
        $scope.$apply();
    });
    
    var grouped;
    // $scope.groupByState = function() {
    //     console.log('groupbystate');
        
    //     $scope.gridOptions.groupBy(grouped ? '' : '_replication_state');
    // }; 
    
    
    $scope.refresh = function() {
        console.log('refresh', state.reps);
        window.test = $scope.designGridOptions;
        state.setActiveScreen($scope, '#databases');
    }; 
    
    
    $scope.undo = function() {
        console.log('undo');
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        console.log(selRows);
        angular.forEach(selRows, function(selRow) {
            var originalRow = $scope.originalRows[selRow.path];
            if (originalRow) {
                $scope.designRows.forEach(function(row) {
                    if (row.path === originalRow._id)
                        angular.copy(originalRow, row);
                });
            }
        });
    }; 
    
    $scope.apply = function() {
        console.log('apply');
    };

    $scope.newRow = function() {
        $scope.designRows.push({
            // _id: prompt("Replication id?"),
            // _replication_state: 'stored'
            // ,store: true
            // ,user_ctx: { "roles" :["_admin"]}
        });
    };
    
    
    $scope.viewState1 = { values: 'active' };
    $scope.viewState2 = { table: 'active' };
    
    function setValueKeyAllState() {
        var filter = '';
        if (!$scope.viewState1.all) filter = 'type:' +
            ($scope.viewState1.keys ? 'key' : 'value');
        $scope.designGridOptions.$gridScope.filterText = filter;
        console.log('applying filter:', filter);
        
        $scope.columnDefs.forEach(function(c){
            c.visible = $scope.viewState1.all ||
                ($scope.viewState1.keys && c.visGroup === 'key') ||
                ($scope.viewState1.values && c.visGroup === 'value') ? true : false;
            // console.log(c);
        }); 
        
    }
    
    $scope.toggleValueKeyAll = function(toggle) {
        $scope.viewState1 = {};
        $scope.viewState1[toggle] = 'active';
        setValueKeyAllState();
    };
    
    $scope.toggleViewState2 = function(toggle) {
        $scope.viewState2 = {};
        $scope.viewState2[toggle] = 'active';
    }; 
    
    $scope.toggleMultipleSingle = function(toggle) {
        $scope.multipleSingle = {};
        $scope.multipleSingle[toggle] = 'active';
    }; 

    defineGrid();
    console.log('end of design cntl', $scope.designGridOptions);
    if (!state.designDone) {
        state.designDone = true;
        
        console.log('in design done', $scope.designGridOptions);
        
        $scope.$on('initDesign',
                   function() {
                       setValueKeyAllState();
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // console.log($scope.columnDefs);
                   });
    } 
}); 
                                   