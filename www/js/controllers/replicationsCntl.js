/*global VOW:false couchapi:false $:false angular:false couchpi:false */
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
        localStorage.setItem('quilt_fieldGroup', sel);
        sel = $scope.pickFieldsMenu.indexOf(sel);
        
        $scope.columnDefs.forEach(function(c){
            var visGroup = $scope.pickFieldsMenu.indexOf(c.visGroup);
            c.visible = sel <= visGroup;
            // c.width = c.w || 100; 
            // console.log(c.field, sel, visGroup, c.visible, c.width);
        }); 
        
        // $scope.viewStateSet('all');
    };
    
    var buttonTemplate = '<div style="margin-left:5px;margin-top:5px"><a  class="ngLink" ng-click="editRep(row.entity)" href="" >edit</a></div>';
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-checked="row.getProperty(col.field)"></input>';
    $scope.checkBoxClicked = function ( row, col) {
        // console.log($scope, row, col.field);
        row.entity[col.field] = !row.entity[col.field];
        row.entity.modified=true;
        
        endEdit( row.entity, col.field, !row.entity[col.field]);
        
    };
    
    function getUniqueId(id) {
        var uniqueId = id;
        function isUnique(id) {
            for( var i=0; i < state.reps.length; i++){
                if (state.reps[i]._id === id) return false;
            }
            return true;
        }
        var u = 1;
        while (!isUnique(uniqueId)) { uniqueId  = id + (++u); }
        return uniqueId;
    }
    
    
    $scope.modifiedCount = 0;
    function endEdit(row, field, old) {
        if (field === '_id') {
            var newId = row._id;
            row._id = old;
            row._id = getUniqueId(newId);
        }
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
    $scope.editRep = function(rep) {
        $scope.editMode = true;
        $scope.rep = rep;
        console.log(rep);  
    };

    $scope.editMode = true;
    $scope.rep = {
        "_id": "pull_waterfordwest2",
        "_rev": "64-f8b32510693b7a78cf151001c1dc8527",
        "source": "db1",
        "target": "url1",
        "continuous": true,
        "user_ctx": {
            "roles": [
                "_admin"
            ]
        },
        filter: "myfilter",
        doc_ids: ['a', 'b'],
        "owner": "_admin",
        "_replication_state": "triggered",
        "_replication_state_time": "2013-07-30T09:52:45+10:00",
        "_replication_id": "43345201b8b61db47a85bde99d8a0e66",
        "couch": true,
        "original": {
            "_id": "pull_waterfordwest",
            "_rev": "64-f8b32510693b7a78cf151001c1dc8527",
            "source": "http://multicap.ic.ht:5984/waterfordwestrep",
            "target": "waterfordwest",
            "continuous": true,
            "user_ctx": {
                "roles": [
                    "_admin"
                ]
            },
            "owner": "_admin",
            "_replication_state": "triggered",
            "_replication_state_time": "2013-07-30T09:52:45+10:00",
            "_replication_id": "43345201b8b61db47a85bde99d8a0e66",
            "couch": true
        },
        "modified": true
    };
    $scope.done = function() {
        $scope.editMode = false;
    };
    
    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs = [
            {visGroup:'Essential', field:'edit', displayName:'edit', enableCellEdit:false, visible:false
             ,cellTemplate: buttonTemplate, width:30
            }
            ,{visGroup:'Essential', field:'_id', displayName:'id', enableCellEdit: true, visible:true},
            {visGroup:'All', field:'_rev', displayName:'rev', enableCellEdit: false, visible:false},
            // {visGroup:'Essential', field:'modified', displayName:'modified',
            // enableCellEdit:false },
            // {visGroup:'All', field:'auth', displayName:'auth', enableCellEdit:false, width:100},
            {visGroup:'Essential', field:'source', displayName:'source', enableCellEdit:true},
            {visGroup:'Essential', field:'target', displayName:'target'},
            {visGroup:'Essential', field:'continuous', displayName:'continuous', width:64, w:64 ,
             cellTemplate: checkBoxTemplate, enableCellEdit:false},
            {visGroup:'Essential', field:'create_target', displayName:'create_target', width: 77, w:77,
             cellTemplate: checkBoxTemplate, enableCellEdit:false},
            {visGroup:'More', field:'filter', displayName:'filter', visible:false},
            {visGroup:'More', field:'query_params', displayName:'params', visible:false, enableCellEdit:false},
            {visGroup:'More', field:'doc_ids', displayName:'doc_ids', visible:false, enableCellEdit:false},
            {visGroup:'More', field:'user_ctx', displayName:'user_ctx', visible:false, enableCellEdit:false},
            {visGroup:'All', field:'owner', displayName:'owner', enableCellEdit:false, visible:false},
            {visGroup:'All', field:'_replication_id', displayName:'rep_id', enableCellEdit:false, visible:false},
            {visGroup:'Essential', field:'_replication_state', displayName:'state', enableCellEdit:false, width:60},
            {visGroup:'All', field:'_replication_state_time', displayName:'time', enableCellEdit:false, visible:false}
            ,{visGroup:'Essential', field:'couch', displayName:'couch',
              cellTemplate: checkBoxTemplate, enableCellEdit:false, width:50, w:50, visible:true }
            ,{visGroup:'Essential', field:'quilt', displayName:'quilt',
              cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, w:40,  visible:true }
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
                               ,rowTemplate:'<div style="height: 100%" ng-class="getRowClass(row)"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
                               '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
                               '<div ng-cell></div>' +
                               '</div></div>'
                               ,enableRowSelection: true
                               ,enableCellEditOnFocus: true
                               ,selectWithCheckboxOnly: true
                               ,enableCellEdit: false
                               ,showSelectionCheckbox: true
                               ,enableColumnResize: true
                               ,enableColumnReordering: true
                               ,enableRowReordering: true
                               ,showColumnMenu: true
                               ,showFilter: true
                               ,afterSelectionChange: selChange
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
    
    function selChange(row) {
        console.log(row);
    }
    
    // $scope.$on('ngGridEventDigestGridParent', function(event, rep, field, old) {
    //     console.log('digest');
    // });
    // $scope.$on('ngGridEventDigestGrid', function(event, rep, field, old) {
    //     console.log('digest1');
    // });
    
    $scope.$on('ngGridEventEndCellEdit', function(event, rep, field, old) {
        // console.log('edited', $scope, 'field:', field, 'old:'+old,'rep:'+ rep);
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
        var selRows = $scope.gridOptions.$gridScope.selectedItems;
        angular.forEach(selRows, function(selRow) {
            if (selRow.modified) {
                angular.copy(selRow.original, selRow);
                selRow.original = angular.copy(selRow);
                console.log(selRow);
            }
        });
        
        $scope.gridOptions.selectVisible(false);
    }; 
    
    function storeInQuilt(rep) {
        state.quilt_reps =  state.quilt_reps || {};
        if (rep.quilt) {
            state.quilt_reps[rep._id] = {
                _id: rep._id
                ,source: rep.source
                ,target: rep.target
                ,continuous: rep.continuous
                ,create_target: rep.create_target
                ,params: rep.params
                ,doc_ids: rep.doc_ids
                ,user_ctx: rep.user_ctx
                ,quilt:true
            };
        }
        else {
            delete state.quilt_reps[rep._id];
        }
    }
    
    $scope.apply = function() {
        var repsToRemove = [];
        var selRows = $scope.gridOptions.$gridScope.selectedItems;
        state.reps.filter(function(r) {
            return r.modified;
        }).forEach(function(r) {
            storeInQuilt(r);
            if (!r.couch) repsToRemove.push(r);
        });
        persist.put('reps', state.quilt_reps);
        couchapi.docBulkRemove(repsToRemove, '_replicator').when(
            function(data) {
                console.log('success', data);
                $scope.refresh();
            },
            function(err) {
                console.log('error',err);
                $scope.refresh();
            }
        );
        console.log('apply');
    };

    $scope.newRep = function() {
        var newRep = {
            _id: prompt("Replication id?"),
            _replication_state: 'stored'
            ,store: true
            ,user_ctx: { "roles" :["_admin"]}
        };
        newRep.original = angular.copy(newRep);
        state.reps.push(newRep);
    };
    
    $scope.viewStateSet = function(repState) {
        localStorage.setItem('quilt_repsViewState', repState);
        $scope.viewState = {};
        $scope.viewState[repState] = 'active';
        console.log('------------------',repState);
        if (!repState || repState === 'all') repState = '';
        if (repState === 'quilt') 
            $scope.gridOptions.$gridScope.filterText = "quilt:true";
        else if (repState === 'couch') 
            $scope.gridOptions.$gridScope.filterText = "couch:true";
        else $scope.gridOptions.$gridScope.filterText = "_replication_state:" + repState;
    };
    
    //----------------------------edit rep------------------------------------------
    
    $scope.change = function(data) {
        if (data === 'sourceType') {
            
            
        }
        console.log('change:', data, $scope.rep);
        $scope.rep.doc_ids = $scope.filter = "";
        $scope.fetchedFilters = $scope.fetchedDocIds = false;
        $('#repIds').editable('option', 'disabled', true);
        
        
    };
    
    $('#repRoles').editable({
        // value: [2, 3],    
        unsavedclass: null,
        placement:'right',
        select2: {
            tags: ['read-_users', 'write-_users']
        }
        ,success: function(response, newRoles) {
            console.log($scope.rep.user_ctx.roles, newRoles);
            $scope.rep.user_ctx = $scope.rep.user_ctx || {};
            if ($scope.rep.user_ctx && $scope.rep.user_ctx.roles.toString() === newRoles.toString()) return;
            $scope.rep.user_ctx.roles = newRoles;
            $scope.$apply();
        }
    });   
    
    $('#repNames').editable({
        // value: [2, 3],    
        unsavedclass: null,
        placement:'right',
        select2: {
            tags: ['read-_users', 'write-_users']
        }
        ,success: function(response, newNames) {
            console.log($scope.rep.user_ctx.names, newNames);
            $scope.rep.user_ctx = $scope.rep.user_ctx || {};
            if ($scope.rep.user_ctx.names && $scope.rep.user_ctx.names.toString() === newNames.toString()) return;
            $scope.rep.user_ctx.names = newNames;
            $scope.$apply();
        }
    });   
    
    
    $('#repIds').editable({
        // value: [2, 3],    
        unsavedclass: null,
        placement:'right',
        disabled:true,
        select2: {
            tags: ['read-_users', 'write-_users']
        }
        ,success: function(response, newNames) {
            console.log($scope.rep.doc_ids, newNames);
            if ($scope.rep.doc_ids && $scope.rep.doc_ids.toString() === newNames.toString()) return;
            $scope.rep.doc_ids = newNames;
            // }
            $scope.$apply();
        }
    });   
    
    function makeUrl(user, pwd, url) {
        if (!pwd || !user || user.length === 0 || pwd.length === 0) return url;
        var i = 0;
        var prefix = "";
        if (url.startsWith('http://')) i = 7;
        else if (url.startsWith('https://')) i = 8;
        else prefix = "http://";
        return prefix + url.slice(0, i) + user + ":" + pwd + "@" + url.slice(i);
    }
    
    
    function getDesignDocs(dbName) {
        var vow = VOW.make();
        if (!dbName) return vow['break']('Error: no db passed in');
        console.log('getting design docs for ' , dbName);
        couchapi.docAllDesignInclude(dbName).when(
            function(data) {
                var designDocs = data.rows.map(function(r) {
                    console.log('r.doc =', r.doc);
                    return r.doc;
                });
                vow.keep(designDocs);
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
    
    $scope.fetchDocIds = function() {
        console.log('in fetchDocsIds');
        
        $scope.fetchedDocIds = true;
        $('#repIds').editable('option', 'disabled', false);
        
        
        var url, urlPrefix, oldUrlPrefix, db;
        if ($scope.sourceType === 'remote') {
            url = makeUrl($scope.rep.sourceUser, $scope.rep.sourcePwd, $scope.rep.sourceUrl);
            oldUrlPrefix = $.couch.urlPrefix;
            urlPrefix = url.slice(0, url.lastIndexOf('/'));
            db = url.slice(url.lastIndexOf('/')+1);
            $.couch.urlPrefix = urlPrefix;
        }
        else db = $scope.rep.sourceLocal;
        if (!db || db.length === 0) {
            $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
            console.log('no valid db');
            return;
        }
        
        couchapi.docAll(db).when(
            function(data) {
                console.log('docIds:', data);
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
                // var docs = [];
                var rows = data.rows; 
                // var docs = rows.reduce(function(prev, row) {
                //     if (angular.isArray(row)) return row.concat(prev);
                //     else return prev;
                // }, []);
                var docs = rows.map(function(r) {
                    return r.id;
                }, []);
                console.log('rows' ,docs);
                $('#repIds').editable('option', 'select2',
                                      { tags: docs});
                
                $scope.$apply();
            },
            function(err) {
                console.log(err);  
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
            }
        );
    };
    
    
    $scope.fetchFilters = function(urlPrefix, db) {
        var vow = VOW.make();
        console.log('in fetchFilters');
        
        // var urlPrefix, oldUrlPrefix, db;
        // if ($scope.sourceType === 'remote') {
        //     url = makeUrl($scope.rep.sourceUser, $scope.rep.sourcePwd, $scope.rep.sourceUrl);
        //     oldUrlPrefix = $.couch.urlPrefix;
        //     urlPrefix = url.slice(0, url.lastIndexOf('/'));
        //     db = url.slice(url.lastIndexOf('/')+1);
        //     $.couch.urlPrefix = urlPrefix;
        // }
        // else db = $scope.rep.sourceLocal;
        // if (!db || db.length === 0) {
        //     $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
        //     console.log('no valid db', db);
        //     return;   
        // }
        var  oldUrlPrefix = $.couch.urlPrefix;
       $.couch.urlPrefix = urlPrefix;
        
        $scope.fetchedFilters = true;
        
        getDesignDocs(db).when(
            function(ddocs) {
                console.log('designdocs:', ddocs);
                $.couch.urlPrefix = oldUrlPrefix;
                var allFilters = [];
                ddocs.forEach(function(dd) {
                    if (dd.filters) {
                        var filterNames = Object.keys(dd.filters).map(function(f) {
                            return dd._id.slice(8) + '/' + f;
                        }); 
                        allFilters = allFilters.concat(filterNames);
                    }
                    
                }); 
                $scope.filters = allFilters;
                console.log('all filters', allFilters);
                $scope.$apply();
            },
            function(err) {
                console.log('Error', err);  
                $.couch.urlPrefix = oldUrlPrefix;
            }
        );
        return vow.promise;
    };
    
    
    // $('#rep_id').editable({
    //     unsavedclass: null,
    //     type: 'text',
    //     // value: state.remoteUrl,
    //     value: "http:multicapdb.iriscouch.com",
    //     success: function(response, newValue) {
    //         $scope.$apply();
    //     }
    // });
    
    // $('#repTarget').editable({
    //     unsavedclass: null,
    //     type: 'text',
    //     placement:'right',
    //     value: "http:multicapdb.iriscouch.com",
    //     success: function(response, newValue) {
    //         $scope.rep.target = newValue;
    //         $scope.$apply();
    //     }
    // });
    
    
    // function initXEditable(id, list, value) {
    //     var i = 0;
    //     var sel = 0;
    //     list = list.map(function(l) {
    //         if (value === l) sel = i;
    //         return { id: i++, text: l };
    //     });
    //     console.log('XEDITABLE', list);
         
    //     $('#' + id).editable('destroy');
    //     $('#' + id).editable({
    //         value: sel,
    //         unsavedclass: null,
    //         mode:'inline',
    //         placement:'right',
    //         source: list,
    //         select2: {
    //         }
    //         ,success: function(response, data) {
                
    //             console.log(data);
    //         }
    //     });   
        
    // }
    
    // $('#repdb').editable({
    //     source: [
    //           {id: 'gb', text: 'Great Britain'},
    //           {id: 'us', text: 'United States'},
    //           {id: 'ru', text: 'Russia'}
    //        ],
    //     placement:'right',
    //     select2: {
    //        multiple: false
    //     }
    // });
    
    // $scope.query_params = { "hello": "world"};
    if (!state.repsDone) {
        state.repsDone = true;
        defineGrid();

        $scope.$on('initReps',
                   function() {
                       var viewState = localStorage.getItem('quilt_repsViewState');
                       var fieldGroup = localStorage.getItem('quilt_fieldGroup');
                       $scope.viewStateSet(viewState);
                       $scope.pickFields(fieldGroup || 'Essential') ;
                       
                       $scope.localDatabases  = state.databases.map(function(db) {
                           return db.name;
                       });
                       
                       $scope.docIds = ['a', 'b'];
                       // initXEditable('targetdb', $scope.sources, $scope.rep.target);
                       
                       $scope.sourceType = 'remote';
                       $scope.targetType = 'remote';
        
                       $scope.sourceSelect2Options = {
                           width:"60%"
                       };
                       $scope.targetSelect2Options = {
                           width:200
                       };
                       
                       $scope.rep.user_ctx = $scope.rep.user_ctx || {};
                       
                       $('#repRoles').editable('setValue', $scope.rep.user_ctx.roles, false);
                       $('#repRoles').editable('option', 'select2',
                                               { tags: ['read-',  'write-']});
                       
                       $('#repNames').editable('setValue', $scope.rep.user_ctx.names, false);
                       $('#repNames').editable('option', 'select2',
                                               { tags: ['read-',  'write-']});
                       $('#repIds').editable('setValue', $scope.rep.doc_ids, false);
                       $('#repIds').editable('option', 'select2',
                                             { tags: ['read-',  'write-']});
                       $scope.filters = [ $scope.rep.filter ];
                       $scope.rep.query_params  = $scope.rep.query_params || { p1: 'v1', p2: 'v2'};
                   });
    } 
}); 
                                   