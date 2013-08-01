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
        ,{ title:"Log", content:"", url: "built/ex_log.html" }
        ,{ title:"Test", content:"", url: "built/ex_test.html" }
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
    
    initTab.Test = function() {
        showDbList(false);
       }; 
    
    initTab.Conflicts = function() {
        showDbList(true);
        $scope.conflictsSelDbs = $scope.conflictsSelDbs || [];
        var saved = dbSelChanged.Conflicts;
        delete dbSelChanged.Conflicts;
        state.databases.forEach(function(db, i) {
            $scope.dbGridOptions.selectItem(i, $scope.conflictsSelDbs.indexOf(db.name) !== -1);
        });
        dbSelChanged.Conflicts = saved;
    };
    
    dbSelChanged.Conflicts = function() {
        console.log('setting and removing changes listeners for conflicts');
        $scope.conflictsSelDbs = $scope.selDatabases;
       }; 
    
    
    
    initTab.Query = function() {
        showDbList(true);
        $scope.querySelDbs = $scope.querySelDbs || [];
        var saved = dbSelChanged.Query;
        delete dbSelChanged.Query;
        state.databases.forEach(function(db, i) {
            $scope.dbGridOptions.selectItem(i, $scope.querySelDbs.indexOf(db.name) !== -1);
        });
        dbSelChanged.Query = saved;
    };
    
    dbSelChanged.Query = function() {
        console.log('setting and removing changes listeners for query');
        $scope.querySelDbs = $scope.selDatabases;
       }; 
    
    initTab.Changes = function() {
        showDbList(true);
        $scope.changesSelDbs = $scope.changesSelDbs || [];
        var saved = dbSelChanged.Changes;
        delete dbSelChanged.Changes;
        state.databases.forEach(function(db, i) {
            $scope.dbGridOptions.selectItem(i, $scope.changesSelDbs.indexOf(db.name) !== -1);
        });
        dbSelChanged.Changes = saved;
    };
    
    dbSelChanged.Changes = function() {
        console.log('setting and removing changes listeners for changes');
        $scope.changesSelDbs = $scope.selDatabases;
        $scope.selDatabases.forEach(function(db) {
            if (!$scope.changes[db]) {
                $scope.changes[db] = {};
                $scope.listeners[db] =
                    couchapi.dbChanges(getCb(db), db, { include_docs: true });
            }
        });
        Object.keys($scope.listeners).forEach(function(l) {
            if ($scope.selDatabases.indexOf(l) === -1) {
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
    
    function dbSelectionChanged() {
        var selRows = $scope.dbGridOptions.
            $gridScope.selectedItems;
        var selDatabases = [];
        selRows.forEach(function(r) {
            selDatabases.push(r.name);
        });
        // console.log(selDatabases);
        
        // var added = [];
        // var removed = [];
        // selDatabases.forEach(function(db) {
        //     if ($scope.selDatabases.indexOf(db) === -1) added.push(db);
        // });
        // $scope.selDatabases.forEach(function(db) {
        //    if (selDatabases.indexOf(db) === -1) removed.push(db); 
        // });
        
        // $scope.added = added;
        // $scope.removed = removed;
        $scope.selDatabases = selDatabases;
        
        var tab = $scope.selectedExamineTab;
        // console.log(tab, dbSelChanged);
        
        if (dbSelChanged[tab])
            dbSelChanged[tab]();
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
        $scope.selDatabases = [];
        $scope.listeners = {};
        
        $scope.$on('initExamine',
                   function() {
                       console.log("in initExamine", $scope.selectedExamineTab);

                       $('#examineTabs a[href=#' + $scope.selectedExamineTab + ']').tab('show');
                       $scope.tabSelected($scope.selectedExamineTab);
                   });

    }

});
