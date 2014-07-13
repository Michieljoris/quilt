/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("replicationsCntl", function ($scope, $location, state, defaults) {
    
    console.log('In activeTasksCntl');
    
    var checkBoxTemplate = '<input class="ngSelectionCheckbox" ng-click="row.entity[col.field] = !row.entity[col.field]" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    $scope.myData = [{name: "Moroni", age: true},
                     {name: "Tiancum", age: false},
                     {name: "Jacob", age: true},
                     {name: "Nephi", age: false},
                     {name: "Enos", age: true}];
    $scope.gridOptions = { data: 'state.reps'
                           ,rowHeight: 20 
                           ,columnDefs: [{field:'_id', displayName:'id'},
                                         {field:'_rev', displayName:'rev'},
                                         {field:'source', displayName:'source'},
                                         {field:'target', displayName:'target'},
                                         {field:'create_target', displayName:'create_target',
                                          cellTemplate: checkBoxTemplate
                                         },
                                         {field:'filter', displayName:'filter'},
                                         {field:'owner', displayName:'owner'},
                                         {field:'user_ctx', displayName:'user_ctx'},
                                         {field:'_replication_state', displayName:'state'},
                                         {field:'_replication_state_time', displayName:'time'}
                                          // cellTemplate: checkBoxTemplate
                                         ]
                           
                           ,enableCellSelection: true,
                           enableRowSelection: false,
                           // enableCellEditOnFocus: true
                           enableCellEdit: true
                           ,showSelectionCheckbox: true
                           ,enableColumnResize: true
                           ,enableColumnReordering: true
                           ,enableRowReordering: true
                           ,showColumnMenu: true
                           ,showFilter: true
                         };
    
    $scope.test = function(row, field) {
        console.log('----', row,field, row.getProperty(field));
        window.test = row;
        row.entity[field] = !row.entity[field];
        // row.setVars(field, 'false');
        // row[field] = !row[field];
    }; 
    
    
    $scope.read = function() {
        console.log($scope.myData);
        console.log(state);
    }; 
    
    $scope.update = function() {
        $scope.myData = [{name: "Peter", age: 50},
                         {name: "Tiancum", age: 43},
                         {name: "Jacob", age: 27},
                         {name: "Nephi", age: 29},
                         {name: "Enos", age: 34}];
    };
    
}); 
                                   