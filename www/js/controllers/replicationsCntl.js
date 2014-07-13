/*global VOW:false couchapi:false $:false angular:false couchpi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("replicationsCntl", function ($scope, $location, state, defaults, persist) {
    
    
    
    $scope.getActiveTasks = function (id) {
        console.log('activetasks for ', id);
        couchapi.activeTasks().when(
            function(data) {
                console.log('active tasks', data);
                if (id) {
                    $scope.activeTasks = "not active";
                    data.some(function(t) {
                        if (t.doc_id === id) {
                            $scope.activeTasks = t;
                            return true;
                        }
                        return false;
                    }); 
                }
                else $scope.activeTasks = data;
                $scope.$apply();
            },
            function(error) {
                $scope.activeTasks = error;
                $scope.$apply();
            }
        );
    };
    
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
        console.log('endEdit', row, field, old);
        var different = Object.keys(row).some(function(e) {
            if (e === 'modified' || e === 'original' || e === 'quilt' ||
                e === '_replication_state' || 
                e === 'sourceParsed' || e === 'targetParsed' || 
                (!row[e] && !row.original[e]) ||
                angular.equals(row[e], row.original[e])) return false; 
            return true;
        });
        
        if (different && !row.modified) {
            row.modified = true;   
            $scope.modifiedCount++;
        }
        if (!row.quilt) delete row.quilt;
        if (!different && row.quilt !== row.original.quilt)  {
            row.modified = 'quilt';
            $scope.modifiedCount--;   
        }
        else if (!different && row.modified) {
            row.modified = false;
            $scope.modifiedCount--;   
        }
    } 
    
    function parseUrl(url) {
        var parsed = {};
        if (url) {
                if (url.startsWith('http')) {
                    var creds = url.match(/(http[s]?:\/\/)(.+):(.+)@(.+)/);
                    if (creds) {
                        parsed.user = creds[2];
                        parsed.pwd = creds[3];
                        var domain = creds[4].slice(0, creds[4].lastIndexOf('/'));
                        parsed.remoteDb = creds[4].slice(creds[4].lastIndexOf('/') + 1);
                        parsed.url = creds[1] + domain;
                    }
                    else {
                        parsed.url = url.slice(0, url.lastIndexOf('/'));
                        parsed.remoteDb = url.slice(url.lastIndexOf('/') + 1);
                    }
                }
            else  {
                parsed.localDb = url;
            }
        }
        
        return parsed;
    }
    
    $scope.editRep = function(rep) {
        $scope.editMode = true;
        rep.sourceParsed = parseUrl(rep.source);
        if (rep.sourceParsed.url) $scope.sourceType = 'remote';
        else $scope.sourceType = 'local';
        rep.targetParsed = parseUrl(rep.target);
        if (rep.targetParsed.url) $scope.targetType = 'remote';
        else $scope.targetType = 'local';
        
        
        $scope.rep = rep;
        
        $('#repId').editable('setValue', rep._id, false);
        $('#sourceUrl').editable('setValue', rep.sourceParsed.url, false);
        $('#sourceUser').editable('setValue', rep.sourceParsed.user, false);
        $('#sourcePwd').editable('setValue', rep.sourceParsed.pwd, false);
        $('#targetUrl').editable('setValue', rep.targetParsed.url, false);
        $('#targetUser').editable('setValue', rep.targetParsed.user, false);
        $('#targetPwd').editable('setValue', rep.targetParsed.pwd, false);
        $scope.target_to_create = rep.target;
        $('#target_to_create').editable('setValue', $scope.target_to_create, false);
        var done;
        if ($scope.sourceType === 'remote') {
            done = fetchAllDb('source');
        }
        else done = VOW.kept();
        done.when(
            function() {
                if ($scope.targetType === 'remote') {
                    return fetchAllDb('target');
                }
                return VOW.kept();
            }
        ).when(
            function() {
                $scope.getActiveTasks(rep._id);
                $scope.$apply();
            }
        );
        
        
        $scope.fetchedFilters = $scope.fetchedDocIds = false;
        
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
        $scope.rep.query_params  = $scope.rep.query_params || {};
        console.log(rep);  
    };

    // $scope.editMode = true;
    // $scope.rep = {
    //     "_id": "pull_waterfordwest2",
    //     "_rev": "64-f8b32510693b7a78cf151001c1dc8527",
    //     "source": "db1",
    //     "target": "url1",
    //     "continuous": true,
    //     "user_ctx": {
    //         "roles": [
    //             "_admin"
    //         ]
    //     },
    //     filter: "myfilter",
    //     doc_ids: ['a', 'b'],
    //     "owner": "_admin",
    //     "_replication_state": "triggered",
    //     "_replication_state_time": "2013-07-30T09:52:45+10:00",
    //     "_replication_id": "43345201b8b61db47a85bde99d8a0e66",
    //     "couch": true,
    //     "original": {
    //         "_id": "pull_waterfordwest",
    //         "_rev": "64-f8b32510693b7a78cf151001c1dc8527",
    //         "source": "http://multicap.ic.ht:5984/waterfordwestrep",
    //         "target": "waterfordwest",
    //         "continuous": true,
    //         "user_ctx": {
    //             "roles": [
    //                 "_admin"
    //             ]
    //         },
    //         "owner": "_admin",
    //         "_replication_state": "triggered",
    //         "_replication_state_time": "2013-07-30T09:52:45+10:00",
    //         "_replication_id": "43345201b8b61db47a85bde99d8a0e66",
    //         "couch": true
    //     },
    //     "modified": true
    // };
    $scope.done = function() {
        $scope.editMode = false;
        if ($scope.sourceType === 'local')
            $scope.rep.source = $scope.rep.sourceParsed.localDb;
        else {
            if ($scope.rep.sourceParsed.url)
                $scope.rep.source = makeUrl(
                    $scope.rep.sourceParsed.user, $scope.rep.sourceParsed.pwd,
                    $scope.rep.sourceParsed.url) + '/' +
                $scope.rep.sourceParsed.remoteDb;
            else $scope.rep.source = "";
        }
        if ($scope.rep.create_target) {
            $scope.rep.target = $scope.target_to_create;
        }
        else {
            if ($scope.targetType === 'local')
                $scope.rep.target = $scope.rep.targetParsed.localDb;
            else {
                if ($scope.rep.targetParsed.url)
                    $scope.rep.target = makeUrl(
                        $scope.rep.targetParsed.user, $scope.rep.targetParsed.pwd,
                        $scope.rep.targetParsed.url) + '/' +
                    $scope.rep.targetParsed.remoteDb;
                else $scope.rep.target = "";
            }
        }
        
        Object.keys($scope.rep).forEach(function(k) {
            var val = $scope.rep[k];
            if (!val ||
                ( angular.isArray(val) && val.length === 0 ) ||
                ( angular.isObject(val) && Object.keys(val).length === 0) ||
                ( typeof val === 'string' && val.length === 0)) 
                delete $scope.rep[k]; 
        });
        
        // var couch = $scope.rep.couch;
        // var quilt  = $scope.rep.quilt;
        // var original = $scope.rep.original;
        // angular.copy(makePureRep($scope.rep), $scope.rep);
        // $scope.rep.original = original;
        // $scope.rep.couch = couch;
        // $scope.rep.quilt = quilt;
        endEdit($scope.rep);
        // if ($scope.targetType === 'local') $scope.rep.target = $scope.rep.targetLocalDb;
        // else {
        //     if ($scope.rep.targetUrl)
        //         $scope.rep.target = makeUrl(
        //             $scope.rep.targetUser, $scope.rep.targetPwd,
        //             $scope.rep.targetUrl) + '/' +
        //         $scope.rep.targetRemoteDb;
        //     else $scope.rep.target = "";
        // } 
    };
    
    function defineGrid() {
        console.log('making grid');
        $scope.columnDefs = [
            {visGroup:'Essential', field:'edit', displayName:'edit', enableCellEdit:false, visible:false
             ,cellTemplate: buttonTemplate, width:30
            }
            ,{visGroup:'Essential', field:'_id', displayName:'id', enableCellEdit: false, visible:true},
            {visGroup:'All', field:'_rev', displayName:'rev', enableCellEdit: false, visible:false},
            // {visGroup:'Essential', field:'modified', displayName:'modified',
            // enableCellEdit:false },
            // {visGroup:'All', field:'auth', displayName:'auth', enableCellEdit:false, width:100},
            {visGroup:'Essential', field:'source', displayName:'source', enableCellEdit:false},
            {visGroup:'Essential', field:'target', displayName:'target', enableCellEdit:false},
            {visGroup:'Essential', field:'continuous', displayName:'continuous', width:64, w:64 ,
             cellTemplate: checkBoxTemplate, enableCellEdit:false},
            {visGroup:'More', field:'create_target', displayName:'create_target', width: 77, w:77,
             cellTemplate: checkBoxTemplate, enableCellEdit:false},
            // {visGroup:'More', field:'target_to_create', displayName:'target to create', enableCellEdit:false},
            {visGroup:'More', field:'filter', displayName:'filter', visible:false, enableCellEdit:false},
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
                               ,selectWithCheckboxOnly: false
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
        if ($scope.editMode) return;
        console.log(row);
        if (row && row.entity) {
            $scope.stats = {
                state: row.entity._replication_state
                ,time: row.entity._replication_state_time
                ,id: row.entity._replication_id
                ,stats: row.entity._replication_stats
            };
            // row.entity._replication_stats;
            $scope.getActiveTasks(row.entity._id);
        }
        else $scope.stats = $scope.activeTasks = "select a replication..";
    }

    $scope.getReps = function() {
        if (!angular.isArray(state.reps)) return "";
        return state.reps.map(function(r) {
            var rep = angular.copy(r);
            delete rep.original;
            return rep;
        });
    };
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
    
    $scope.togglePolling = function() {
        console.log('polling');
        if (!$scope.polling) {
            state.setActiveScreen($scope, '#replications');
            $scope.polling = setInterval(function() {
                if (state.activeScreen === '#replications') {
                    state.setActiveScreen($scope, '#replications');
                    $scope.$apply();
                    return;
                }
                clearTimeout($scope.polling);
                $scope.polling = false;
            }, 3000);
        }
        else {
            clearTimeout($scope.polling);   
            $scope.polling = false;
        }
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
    
    function makePureRep(rep) {
        var cleanRep = {
            _id: rep._id
            ,source: rep.source
            ,target: rep.target
            ,continuous: rep.continuous
            ,create_target: rep.create_target
            ,filter: rep.filter
            ,query_params: rep.query_params
            ,doc_ids: rep.doc_ids
            ,user_ctx: rep.user_ctx
        };
        Object.keys(cleanRep).forEach(function(k) {
            var val = cleanRep[k];
            if (!val ||
                ( angular.isArray(val) && val.length === 0 ) ||
                ( angular.isObject(val) && Object.keys(val).length === 0) ||
                ( typeof val === 'string' && val.length === 0)) 
                delete cleanRep[k]; 
        });
        return cleanRep;
        
    }
    
    $scope.apply = function() {
        console.log('apply');
        var repsToRemove = [];
        var repsToCommit = []; 
        // var selRows = $scope.gridOptions.$gridScope.selectedItems;
        // if (selRows.length === 0) {
        //     alert('Nothing to do!!!\nPlease (control) select some rows to apply.');
        //     return;
        // }
        state.quilt_reps =  {};
        state.reps.filter(function(r) {
            if (!r._id || r._id.length === 0)
                r._id = couchapi.UUID();
            if (r.quilt) {
                state.quilt_reps[r._id] = makePureRep(r);
                // state.quilt_reps[r._id].target_to_create = r.target_to_create;
            }
            else delete state.quilt_reps[r._id];
            var valid = (r.source && r.source.length>0) &&
                (r.target && r.target.length>0); 
            if (!valid && r.couch) alert("Make sure source and target are filled in for rep with id: " + r._id +
                                         "\n\nRep not applied to couchdb");
            return r.modified !== 'quilt' && valid;
        }).forEach(function(r) { 
            repsToRemove.push(r.original);   
            if (r.couch) {
                r.sourceParsed = parseUrl(r.source);
                r.targetParsed = parseUrl(r.target);
                if (r.sourceParsed.pwd === "_prompt_") {
                    r.sourceParsed.pwd = prompt('Please enter password for: ' +
                                                r.sourceParsed.url);
                    if (!r.sourceParsed.pwd) return;
                    r.source = makeUrl(r.sourceParsed.user, r.sourceParsed.pwd,
                                       r.sourceParsed.url);
                }
                if (r.targetParsed.pwd === "_prompt_") {
                    r.targetParsed.pwd = prompt('Please enter password for: ' +
                                                r.targetParsed.url);
                    if (!r.targetParsed.pwd) return;
                    r.target = makeUrl(r.targetParsed.user, r.targetParsed.pwd,
                                       r.targetParsed.url);
                }

                repsToCommit.push(makePureRep(r));       
            }
        });
        
        persist.put('reps', state.quilt_reps);
        console.log('reps to remove', repsToRemove);
        console.log('reps to commit', repsToRemove);
        couchapi.docBulkRemove(repsToRemove, '_replicator')
            .when(
                function() {
                    return couchapi.docBulkSave(repsToCommit, '_replicator');
                })
            .when(
                function(data) {
                    // if (!$scope.polling) {
                    //     //$scope.togglePolling(); 
                    //     var polling = $scope.polling;
                    //     setTimeout(function() {
                    //         clearTimeout(polling);
                    //         $scope.polling = false;
                    //         $scope.$apply();
                    //     },5000);
                    // }
                    // else {
                        $scope.refresh();
                    // }
                    console.log('success save reps', data);
                
                },
                function(error) {
                    $scope.refresh(); 
                    console.log('error save or removing reps: ', error);
                }
            );
    };

    $scope.newRep = function() {
        var newRep = {
            // _id: 'newRep',
            // _replication_state: 'stored'
            user_ctx: { "roles" :["_admin"]}
        };
        newRep.original = angular.copy(newRep);
        newRep.quilt = true;
        state.reps.push(newRep);
        endEdit(newRep, 'quilt', false);
        $scope.editRep(newRep);
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
    
    function fetchAllDb(type) {
        var vow = VOW.make();
        var urlPrefix = $scope.rep[type + 'Parsed'].url; 
        var  oldUrlPrefix = $.couch.urlPrefix;
        $.couch.urlPrefix = urlPrefix;
        console.log('fetchAllDb', type, urlPrefix);
        couchapi.dbAll().when(
            function(data) {
                console.log('success loading alldbs for ' + urlPrefix);
                $.couch.urlPrefix = oldUrlPrefix;
                $scope[type].RemoteDatabases = data;  
                $scope.$apply();
                vow.keep();
            },
            function(error) {
                console.log('error retrieving all dbs for ' + urlPrefix, error);
                $.couch.urlPrefix = oldUrlPrefix;
                $scope[type].RemoteDatabases = [];  
                $scope[type].RemoteError = "  invalid url";
                setTimeout(function() {
                    $scope[type].RemoteError = false;
                    $scope.$apply();
                    
                }, 10000);
                $scope.$apply();
                vow.keep();
                
            }
        );
        return vow.promise;
    }
    
    $scope.change = function(delta) {
        if (!$scope.editMode) return;
        console.log('change:',  delta);
        if (($scope.sourceType === 'remote') &&
            (delta === 'sourceUrl' || delta === 'sourceType')) {
            fetchAllDb('source');
        }
        else if (($scope.targetType === 'remote') &&
            (delta === 'targetUrl' || delta === 'targetType')) {
            fetchAllDb('target');
        }
        if (delta === 'sourceLocalDb' || delta === 'sourceRemoteDb') {
            $scope.rep.doc_ids =[];
            $('#repIds').editable('setValue', $scope.rep.doc_ids, false);
            $('#repIds').editable('option', 'select2',
                                  { tags: ['read-',  'write-']});
            $scope.rep.filter = "";
            $scope.fetchedFilters = $scope.fetchedDocIds = false;
            $('#repIds').editable('option', 'disabled', true);
        }
        // console.log('change:', data, $scope.rep);
        
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
    
    
    $('#sourceUrl').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.sourceParsed.url = newValue;
            $scope.change('sourceUrl');
            $scope.$apply();
        }
    });
    $('#sourceUser').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.sourceParsed.user = newValue;
            $scope.change('sourceUser');
            $scope.$apply();
        }
    });
    
    $('#sourcePwd').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.sourceParsed.pwd = newValue;
            $scope.change('sourcePwd');
            $scope.$apply();
        }
    });
    
    $('#targetUrl').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.targetParsed.url = newValue;
            $scope.change('targetUrl');
            $scope.$apply();
        }
    });
    $('#targetUser').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.targetParsed.user = newValue;
            $scope.change('targetUser');
            $scope.$apply();
        }
    });
    
    $('#targetPwd').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep.targetParsed.pwd = newValue;
            $scope.change('targetPwd');
            $scope.$apply();
        }
    });
    
    
    $('#target_to_create').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.target_to_create = newValue;
            $scope.$apply();
        }
    });
    
    $('#repId').editable({
        unsavedclass: null,
        placement:'right',
        type: 'text',
        success: function(response, newValue) {
            $scope.rep._id = newValue;
            $scope.$apply();
        }
    });
    
    function makeUrl(user, pwd, url) {
        if (!url || url.length === 0) return "";
        if (!user || user.length === 0) return url;
        if (!pwd || pwd.length === 0) {
            pwd = "_prompt_";
        }
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
        var timer = setTimeout(function() {
            $scope.designError = "Unable to retrieve database design docs";
            vow['break']('timeout');
            vow = false;
        },5000);
        couchapi.docAllDesignInclude(dbName).when(
            function(data) {
                var designDocs = data.rows.map(function(r) {
                    console.log('r.doc =', r.doc);
                    return r.doc;
                });
                clearTimeout(timer);
                if (vow) vow.keep(designDocs);
            }
            ,function(err) {
                console.log('error', err);
                if (err === 401) {
                    $scope.designError = "Unable to retrieve database design docs. Unauthorized";
                }
                else {
                    $scope.designError = "Unable to retrieve database design docs" + err;
                }
                
                clearTimeout(timer);
                if (vow) vow['break']('$scope.designError');
            }
        );
        
        return vow.promise;
    }
    
    $scope.fetchDocIds = function() {
        console.log('in fetchDocsIds');
        
        $('#repIds').editable('option', 'disabled', false);
        
        
        var urlPrefix, oldUrlPrefix, db;
        if ($scope.sourceType === 'remote') {
            urlPrefix = makeUrl($scope.rep.sourceParsed.user, $scope.rep.sourceParsed.pwd,
                                $scope.rep.sourceParsed.url);
            oldUrlPrefix = $.couch.urlPrefix;
            $.couch.urlPrefix = urlPrefix;
            db = $scope.rep.sourceParsed.remoteDb;
        }
        else db = $scope.rep.sourceParsed.localDb;
        if (!db || db.length === 0) {
            $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
            console.log('no valid db', db);
            $scope.idsError = "no valid source db";
            setTimeout(function() {
                $scope.idsError = false;
                $scope.$apply();
            }, 3000);
            console.log('no valid db');
            return;
        }
        
        couchapi.docAll(db).when(
            function(data) {
                console.log('docIds:', data);
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
                var rows = data.rows; 
                var docs = rows.map(function(r) {
                    return r.id;
                }, []);
                console.log('rows' ,docs);
                if (docs.length > 0) {
                    $('#repIds').editable('option', 'select2',
                                          { tags: docs});
                    $scope.fetchedDocIds = true;
                }
                else {
                    $scope.idsError = "source db contains no documents";
                    setTimeout(function() {
                        $scope.dbsError = false;
                        $scope.$apply();
                    }, 3000);
                    
                }
                $scope.$apply();
            },
            function(err) {
                $scope.idsError = "error retrieving docs from source db";
                setTimeout(function() {
                    $scope.dbsError = false;
                    $scope.$apply();
                }, 3000);
                console.log(err);  
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
                $scope.$apply();
            }
        );
    };
    
    
    $scope.fetchFilters = function() {
        var vow = VOW.make();
        console.log('in fetchFilters');
        var urlPrefix, oldUrlPrefix, db;
        if ($scope.sourceType === 'remote') {
            urlPrefix = makeUrl($scope.rep.sourceParsed.user, $scope.rep.sourceParsed.pwd,
                                $scope.rep.sourceParsed.url);
            oldUrlPrefix = $.couch.urlPrefix;
            db = $scope.rep.sourceParsed.remoteDb;
            $.couch.urlPrefix = urlPrefix;
        }
        else db = $scope.rep.sourceParsed.localDb;
        if (!db || db.length === 0) {
            $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
            console.log('no valid db', db);
            $scope.filterError = "no valid source db";
            setTimeout(function() {
                $scope.filterError = false;
                $scope.$apply();
            }, 3000);
            return vow['break'];   
        }
        
        console.log('getting designdocs for ' , $.couch.urlPrefix, db);
        getDesignDocs(db).when(
            function(ddocs) {
                console.log('designdocs:', ddocs);
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
                    var allFilters = [];
                ddocs.forEach(function(dd) {
                    if (dd.filters) {
                            var filterNames = Object.keys(dd.filters).map(function(f) {
                                return dd._id.slice(8) + '/' + f;
                            }); 
                        allFilters = allFilters.concat(filterNames);
                    }
                    
                }); 
                if (allFilters.length > 0 ) {
                    $scope.filters = allFilters;
                    $scope.fetchedFilters = true;
                }
                else {
                    $scope.filterError = "source db has no filters defined";
                    setTimeout(function() {
                        $scope.filterError = false;
                        $scope.$apply();
                    }, 3000);
                }
                console.log('all filters', allFilters);
                $scope.$apply();
            },
            function(err) {
                $scope.filterError = "error retrieving desing docs for source db";
                setTimeout(function() {
                    $scope.filterError = false;
                    $scope.$apply();
                }, 3000);
                $scope.fetchedFilters = false;
                console.log('Error', err);  
                $.couch.urlPrefix = oldUrlPrefix || $.couch.urlPrefix;
                $scope.$apply();
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
                       console.log('in initReps');
                       var viewState = localStorage.getItem('quilt_repsViewState') || 'all';
                       var fieldGroup = localStorage.getItem('quilt_fieldGroup') || 'Essential';
                       
                       $scope.source = {};
                       $scope.target = {};
                       
                       $scope.viewStateSet(viewState);
                       $scope.pickFields(fieldGroup || 'Essential') ;
                       
                       $scope.localDatabases  = state.databases.map(function(db) {
                           return db.name;
                       });
                       
                       $scope.docIds = ['a', 'b'];
                       // initXEditable('targetdb', $scope.sources, $scope.rep.target);
                       
                       // $scope.sourceType = 'local';
                       // $scope.targetType = 'local';
        
                       $scope.sourceSelect2Options = {
                           width:"60%"
                       };
                       $scope.targetSelect2Options = {
                           width:200
                       };
                       

                       // if ($scope.polling) {
                       //     $scope.polling = setInterval(function() {
                       //         $scope.refresh();
                       //         $scope.$apply();
                       //     }, 3000);
                       // }
                   });
    } 
}); 
                                   