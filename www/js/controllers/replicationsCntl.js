/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("replicationsCntl", function ($scope, $location, state, defaults, persist) {
    
    var screenState = {
        fieldGroup: 'Essential'
        ,filterState: 'triggered'
        ,grouped: false
    };
    
    console.log('In replicationsCntl');
    $scope.pickFieldsMenu = [
          "All","More","Essential"
    ];
    
    $scope.pickFields = function(sel) {
        // console.log(sel);
        sel = $scope.pickFieldsMenu.indexOf(sel);
        $scope.columnDefs.forEach(function(c){
            var visGroup = $scope.pickFieldsMenu.indexOf(c.visGroup);
            c.visible = sel <= visGroup;
            // console.log(c.field, sel, visGroup, c.visible);
        }); 
    };
    
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        row.entity[col.field] = !row.entity[col.field];
        row.entity.modified=true;
        
        endEdit( row.entity, col.field, !row.entity[col.field]);
        
    };
    
    
    $scope.modifiedCount = 0;
    function endEdit(rep, field, old) {
        
        if (rep[field] !== old) {
            console.log(rep, $scope.originalReps[rep._id]);
            delete rep.modified;
            if (!rep.cancel) delete rep.cancel;
            if (angular.equals(rep, $scope.originalReps[rep._id])) {
                rep.modified = false;
                $scope.modifiedCount++;
            }
            else {
                if (!$scope.originalReps[rep._id]) {
                    $scope.originalReps[rep._id] = angular.copy(rep); 
                    $scope.originalReps[rep._id][field] = old;
                    delete $scope.originalReps[rep._id].cancel;
                } 
                
                $scope.modifiedCount--;
                rep.modified = true;
            }
        }
    } 
    
    
    function defineGrid() {
       console.log('making grid');
        $scope.columnDefs = [{visGroup:'Essential', field:'_id', displayName:'id', enableCellEdit: true, visible:true},
                             {visGroup:'All', field:'_rev', displayName:'rev', enableCellEdit: false, visible:false},
                             // {visGroup:'Essential', field:'modified', displayName:'modified',
                             // enableCellEdit:false },
                             {visGroup:'All', field:'auth', displayName:'auth', enableCellEdit:true, width:100},
                             {visGroup:'Essential', field:'source', displayName:'source', enableCellEdit:true},
                             {visGroup:'Essential', field:'target', displayName:'target'},
                             {visGroup:'Essential', field:'continuous', displayName:'continuous', width:64,
                              cellTemplate: checkBoxTemplate, enableCellEdit:false},
                             {visGroup:'Essential', field:'create_target', displayName:'create_target', width: 77,
                              cellTemplate: checkBoxTemplate, enableCellEdit:false},
                             {visGroup:'More', field:'filter', displayName:'filter', visible:false},
                             {visGroup:'More', field:'query_params', displayName:'params', visible:false},
                             {visGroup:'More', field:'doc_ids', displayName:'doc_ids', visible:false},
                             {visGroup:'All', field:'owner', displayName:'owner', enableCellEdit:false, visible:false},
                             {visGroup:'More', field:'user_ctx', displayName:'user_ctx', visible:false},
                             {visGroup:'All', field:'_replication_id', displayName:'rep_id', enableCellEdit:false, visible:false},
                             {visGroup:'Essential', field:'_replication_state', displayName:'state', enableCellEdit:false, width:60},
                             {visGroup:'All', field:'_replication_state_time', displayName:'time', enableCellEdit:false, visible:false}
                             ,{visGroup:'Essential', field:'commit', displayName:'_rep',
                               cellTemplate: checkBoxTemplate, enableCellEdit:false, width:50, visible:true }
                             ,{visGroup:'Essential', field:'store', displayName:'quilt',
                               cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true }
                             // ,{visGroup:'Essential', field:'stop', displayName:'stop',
                             //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40 }
                             // ,{visGroup:'Essential', field:'cancel', displayName:'delete',
                             //   cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
                            ];
    
    
        $scope.gridOptions = { data: 'state.reps'
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
                               ,selectWithCheckboxOnly: true
                               ,enableCellEdit: true
                               ,showSelectionCheckbox: true
                               ,enableColumnResize: true
                               ,enableColumnReordering: true
                               ,enableRowReordering: true
                               ,showColumnMenu: true
                               ,showFilter: true
                               // ,showGroupPanel: true
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
    // makeGrid();
    
    $scope.originalReps = {};
    // $scope.$on('ngGridEventDigestGridParent', function(event, rep, field, old) {
    //     console.log('digest');
    // });
    // $scope.$on('ngGridEventDigestGrid', function(event, rep, field, old) {
    //     console.log('digest1');
    // });
    
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        console.log('edited', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
        endEdit(rep, field, old);
        $scope.$apply();
    });
    
    var grouped;
    $scope.groupByState = function() {
        console.log('groupbystate');
        
        $scope.gridOptions.groupBy(grouped ? '' : '_replication_state');
    }; 
    
    
    $scope.refresh = function() {
        console.log('refresh', state.reps);
        window.test = $scope.gridOptions;
        state.setActiveScreen($scope, '#replications');
        // defineGrid();
    }; 
    
    
    $scope.undo = function() {
        console.log('undo');
        var selReps = $scope.gridOptions.$gridScope.selectedItems;
        angular.forEach(selReps, function(selRep) {
            var originalRep = $scope.originalReps[selRep._id];
            if (originalRep) {
                state.reps.forEach(function(rep) {
                    if (rep._id === originalRep._id)
                        angular.copy(originalRep, rep);
                });
            }
        });
    }; 
    
    $scope.apply = function() {
        console.log('apply');
    };

    $scope.newRep = function() {
        state.reps.push({
            _id: prompt("Replication id?"),
            _replication_state: 'stored'
            ,store: true
            ,user_ctx: { "roles" :["_admin"]}
        });
    };
    
    $scope.viewState = function(repState) {
        console.log('------------------',repState);
        if (!repState || repState === 'all') repState = '';
        if (repState === 'stored') 
            $scope.gridOptions.$gridScope.filterText = "quilt:true";
        else $scope.gridOptions.$gridScope.filterText = "_replication_state:" + repState;
    };
    
    
    if (!state.repsDone) {
        state.repsDone = true;
        defineGrid();

        $scope.$on('initReps',
                   function() {
                       // dereg()
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       $scope.pickFields(screenState.fieldGroup);
                       // console.log($scope.columnDefs);
                   });
    } 
}); 
                                   