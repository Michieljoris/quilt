/*global console:false VOW:false $:false angular:false couchapi:false */


angular.module("myApp").controller("examineCntl", function ($scope, $location, state, defaults, persist) {
    "use strict";
    
    console.log('In examineCntl');
    
    $scope.search = function () {
        console.log($scope.searchText);
        $scope.dbGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    };

    $scope.tabs = [
        // { title:"Security", content:"Dynamic content 1" , url: "built/db_security.html"},
        // { title:"Design", content:"", url: "built/db_design.html" }
        { title:"Query", content:"", url: "built/ex_query.html" }
        ,{ title:"Conflicts", content:"", url: "built/ex_conflicts.html" }
        ,{ title:"Changes", content:"", url: "built/ex_changes.html" }
        ,{ title:"Test", content:"", url: "built/ex_test.html" }
        ,{ title:"Log", content:"", url: "built/ex_log.html" }
    ];
    
    var tabsObj = (function() {
        var obj = {};
        $scope.tabs.forEach(function(t) {
            obj[t.title] = t;
        });
        return obj;
    })(); 
    
    
    function defineDbGrid() {
        console.log('making dblist grid');
        $scope.dbColumnDefs =
            [
                {visGroup:'value', field:'name',
                 displayName:'Select database(s)', enableCellEdit: false,
                 // cellTemplate : cellTemplate,
                 visible:true, width:130}
            ];
            
        window.dbgrid = $scope.dbGridOptions = { data: 'state.databases'
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
    
    function showDbList(bool) {
        $scope.span = bool ? "span10" : "span12";
        $scope.showDbList = bool;
    }

    
    $scope.isActiveTab = function(tabTitle) {
        // console.log(tabTitle, $scope.selectedExamineTab);
        if (tabTitle===$scope.selectedExamineTab)
            return 'active';
        else return '';
    };

    var initTab = {};
    var dbSelChanged = {};
    
    function showSelectedDatabases(tab) {
        
        $scope.selDbs[tab] = $scope.selDbs[tab] || [];
        var saved = dbSelChanged[tab];
        delete dbSelChanged[tab];
        state.databases.forEach(function(db, i) {
            $scope.dbGridOptions.selectItem(i, $scope.selDbs[tab].indexOf(db.name) !== -1);
        });
        dbSelChanged[tab] = saved;
    }

    //Query
    initTab.Query = function() {
        showDbList(true);
        showSelectedDatabases('Query');
    };
    
    dbSelChanged.Query = function(selDbs) {
        console.log('setting and removing changes listeners for query');
        $scope.selDbs.Query = selDbs;
       }; 

    //Conflicts
    initTab.Conflicts = function() {
        showDbList(true);
        showSelectedDatabases('Conflicts');
    };
    
    dbSelChanged.Conflicts = function(selDbs) {
        console.log('setting and removing changes listeners for conflicts');
        $scope.selDbs.Conflicts = selDbs;
       }; 

    //Changes
    initTab.Changes = function() {
        showDbList(true);
        showSelectedDatabases('Changes');
    };
    
    dbSelChanged.Changes = function(selDbs) {
        console.log('setting and removing changes listeners for changes');
        $scope.selDbs.Changes = selDbs;
        selDbs.forEach(function(db) {
            if (!$scope.changes[db]) {
                $scope.changes[db] = {};
                $scope.listeners[db] =
                    couchapi.dbChanges(getCb(db), db, { include_docs: true });
            }
        });
        Object.keys($scope.listeners).forEach(function(l) {
            if (selDbs.indexOf(l) === -1) {
                $scope.listeners[l].stop();
                delete $scope.changes[l];
            }
        });
        
        function getCb(db) {
            return   function cb(changes) {
                console.log(changes);
                changes.results.forEach(function(r) {
                    $scope.changes[db][r.id] = $scope.changes[db][r.id] || [];
                    $scope.changes[db][r.id].push(r.doc); 
                });
                $scope.$apply();
            };
        }
    };
    
    //Test
    initTab.Test = function() {
        showDbList(false);
        showSelectedDatabases('Test');
       }; 
    
    dbSelChanged.Test = function(selDbs) {
        console.log('setting and removing changes listeners for test');
        $scope.selDbs.Test = selDbs;
       }; 
    
    //Log
    initTab.Log = function() {
        showDbList(false);
        console.log('initing tab Log');
        state.bytes = state.bytes || defaults.logBytes;
        couchapi.log(state.bytes, 0).when(
            function(data) {
                data = data.split('\n');
                data.reverse();
                data = data.filter(function(r) {
                    return r.indexOf('_log') === -1; 
                });
                data.slice(0, data.length-1);
                state.log = data.join('\n');
                $scope.$apply();
            },
            function(err) {
                console.log('Error getting couchDB log. ', err);
                state.log = "";
                $scope.$apply();
            }
        );
    };

    //-----------------------------
    function dbSelectionChanged() {
        var selRows = $scope.dbGridOptions.
            $gridScope.selectedItems;
        var selDatabases = [];
        selRows.forEach(function(r) {
            selDatabases.push(r.name);
        });
        
        var tab = $scope.selectedExamineTab;
        
        if (dbSelChanged[tab])
            dbSelChanged[tab](selDatabases);
    }        
    
    $scope.tabSelected = function(tab) {
        if (typeof tab === 'string') {
            tab = tabsObj[tab];
        }
        console.log('tabSelected', tab.title);
        $scope.selectedExamineTab = tab.title;
        // persist.put('databasesSubTab', tab.title);
        localStorage.setItem('quilt_selectedExamineTab', tab.title);
        if (initTab[tab.title])
            initTab[tab.title]();
    };
    
    if (!state.examineDone) {
        state.examineDone = true;
        defineDbGrid();
        
        $scope.changes = {};
        $scope.listeners = {};
        
        $scope.selDbs = {};
        
        $scope.$on('initExamine',
                   function() {
                       console.log("in initExamine", $scope.selectedExamineTab);

                       $('#examineTabs a[href=#' + $scope.selectedExamineTab + ']').tab('show');
                       $scope.tabSelected($scope.selectedExamineTab);
                   });

    }

});
