/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("conflictsCntl", function ($scope, $location, state, defaults, persist) {
    
    console.log('In conflictsCntl');
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-model="row.entity[col.field]"></input>';
    
    // $scope.search = function() {
    //     console.log('search');
    //     $scope.docsGridOptions.$gridScope.filterText = "id:" + $scope.searchText;
    // };
    
    
    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs =
            [
                {visGroup:'value', field:'id', displayName:'id', enableCellEdit: false, visible:true, width:105} //toggle
                ,{visGroup:'value', field:'path', displayName:'path', enableCellEdit: false, visible:true, width:105} //toggle
                ,{visGroup:'value', field:'rev', displayName:'rev', enableCellEdit: false, visible:true, width:40} //toggle
                ,{visGroup:'value', field:'value', displayName:'value', enableCellEdit: false, visible:true } //toggle
                // ,{visGroup:'value', field:'commit', displayName:'commit',
                //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:50, visible:true }
                // ,{visGroup:'value', field:'copy', displayName:'copy',
                //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true }
                // ,{visGroup:'key', field:'paste', displayName:'paste',
                //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:false } //toggle
                ,{visGroup:'value', field:'pick', displayName:'pick',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
            ];
    
    
        $scope.docsGridOptions = { data: 'docs'
                                   ,columnDefs: "columnDefs"
                                   // ,columnDefs: $scope.columnDefs
                                   ,rowHeight:25 
                                   ,headerRowHeight: 30
                                   // ,rowTemplate:'<div style="height: 100%" ng-class="{gray: row.getProperty(\'modified\')==true}"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                                   // '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                                   // '<div ng-cell></div>' +
                                   // '</div></div>'
                                   
                                   
                                   
                                   
                                   ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
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
                                   // ,showColumnMenu: true
                                   // ,showFilter: true
                                   ,showGroupPanel: false
                                   ,multiSelect: true
                                   ,keepLastSelected: false
                                   ,afterSelectionChange: docSelected
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
    
    
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        endEdit(row.entity);
    };
    
    
    $scope.modifiedCount = 0;
    function endEdit(row) {
        console.log('endEdit', row);
        var different = Object.keys(row).some(function(e) {
            if (e === 'modified' || e === 'original' || (!row[e] && !row.original[e]) ||
                angular.equals(row[e], row.original[e])) return false; 
            return true;
        });
        
        if (different && !row.modified) {
            row.modified = true;   
            $scope.modifiedCount++;
        }
        
        if (!different && row.modified) {
            row.modified = false;
            $scope.modifiedCount--;   
        }
    } 
    
    
    $scope.originalRows = {};
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        console.log('edited doc row', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
        endEdit(rep, field, old);
        $scope.$apply();
    });
    
    $scope.undo = function() {
        var selRows = $scope.docsGridOptions.$gridScope.selectedItems;
        angular.forEach(selRows, function(selRow) {
            if (selRow.modified) {
                angular.copy(selRow.original, selRow);
                selRow.original = angular.copy(selRow);
                console.log(selRow);
            }
        });
        
        // $scope.docsGridOptions.selectVisible(false);
    }; 
    
    // $scope.undo = function() {
    //     console.log('undo');
    //     var selRows = $scope.designGridOptions.$gridScope.selectedItems;
    //     console.log(selRows);
    //     angular.forEach(selRows, function(selRow) {
    //         var originalRow = $scope.originalRows[selRow.path];
    //         if (originalRow) {
    //             $scope.designRows.forEach(function(row) {
    //                 if (row.path === originalRow._id)
    //                     angular.copy(originalRow, row);
    //             });
    //         }
    //     });
    // }; 
    
    $scope.apply = function() {
        console.log('apply');
    };

    
    $scope.newRow = function() {
        couchapi.dbConflicts(true, $scope.selDb).when(
            function(data) {
                console.log(data);  
                 
            },
            function(err) {
                console.log(err);
                
            }
        );
    };
    
    function onChangeSelDbs(updated, old) {
        if (angular.equals(updated, old)) return;
        if (updated.length === 0) {
            $scope.docs = [];   
            return; 
        }
        
        $scope.selDb = updated[0];
        console.log($scope.selDb);
        couchapi.docAll($scope.selDb).when(
            function(data) {
                // $scope.docs = data.rows.map(function(d) {
                //     return { id: d._id}
                // });
                $scope.docs = data.rows;
                $scope.docs.forEach(function(d) {
                    d.original = angular.copy(d);
                });
                $scope.$apply();
            }
            ,function(err) {
                console.log(err);
                $scope.docs = [];
                $scope.$apply();
            }
        );
    }
    
    
    var docSelected = function(selRow) {
        
        $scope.selRow = selRow.entity;
        console.log(selRow);
        if ($scope.selRow.doc) {
            
            if ($scope.deregDoc) $scope.deregDoc();
            $scope.doc = $scope.selRow.doc;
            
            watchDoc();
            return;
        }
        // $scope.selectedRow = row;
        // $('#testDocName').editable('setValue', row.doc|| [], false);
        
        // $('#docName').editable('setValue', selRow.entity.id);
        couchapi.docGet($scope.selRow.id, $scope.selDb).when(
            function(data) {
                if ($scope.deregDoc) $scope.deregDoc();
                
                $scope.selRow.doc = data;
                delete $scope.selRow.original;
                delete $scope.selRow.modified;
                $scope.selRow.original = angular.copy($scope.selRow);
                $scope.doc = data;
                $scope.$apply();
                watchDoc();
            },
            function(err) {
                $scope.doc = {};
                $scope.$apply();
                console.log('oops',err);
            }
        );
    };
    
    $scope.$watch("selDbs.Query", onChangeSelDbs);
    
    function watchDoc() {
        setTimeout(function() {
            $scope.deregDoc = $scope.$watch("doc", function(updated, old) {
                if (angular.equals(updated, old)) return;
                $scope.selRow.doc = $scope.doc;
                endEdit($scope.selRow);
                // $scope.selRow.modified = true;
                console.log(arguments);
            });
            
        }, 100);
        
    }
    
    $scope.docs = [];
    defineGrid();
    $scope.doc = {};
    
    console.log('end of query cntl', $scope.docsGridOptions);
    if (!state.queryDone) {
        state.queryDone = true;
        
        console.log('in query done', $scope.docsGridOptions);
        
        $scope.$on('initQuery',
                   function() {
                       // console.log($scope.columnDefs);
                   });
    } 
    
}); 
                                   