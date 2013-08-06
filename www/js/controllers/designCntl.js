/*global prompt:false alert:true console:false ace:false angular:false couchapi:false VOW:false*/

angular.module("myApp").controller("designCntl", function ($scope, $location, state) {
    "use strict";
    
    console.log('In designCntl');
    
    $scope.search = function () {
        console.log($scope.searchText);
        $scope.dbGridOptions.$gridScope.filterText = "name:" + $scope.searchText;
    };
    
    $scope.changeDropbox = function(row, field, old) {
        endEdit(row, field, old);
        // console.log('change!!', row, field, old);
    };
    
    var editableCellTemplateDesignDoc = '<select ng-change="changeDropbox(row.entity,\'design\', \'\')" id="comboSelect" class="cellSelect" ng-index="COL_FIELD" ng-combobox ' +
        'ng-options="s.name as s.name for s in designDocs[row.entity.database]" list="items" ng-model="row.entity.design"> </select>';
    
    var checkBoxTemplate = '<input style="margin-left:5px;margin-top:5px" class="ngSelectionCheckbox" ng-click="checkBoxClicked(row, col)" ' +
        'type="checkbox" ng-model="row.entity[col.field]"></input>';
    
    var cellTemplate =
        '<div ng-click="designGridClick(col.field, row.entity, !row.selected)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{COL_FIELD}}</span></div>';
    
    $scope.designGridClick = function(field, row, isSelected) {
        
        console.log('designgridclick', field, row, isSelected);
        // editor.getSession().on('change', function(e) {
        //     row.modified = true;
        //     row.value = editor.session.getValue();
        //     // $scope.$apply();
        // });
        
        if (isSelected) {
            editor.session.setValue(row.value);   
            $scope.rowInAce2 = row;
            console.log('$scope.rowInAce = ' , $scope, $scope.rowInAce2);
        }
        else {
            $scope.rowInAce2 = undefined;
            console.log('deselected. $scope.rowInAce = ' , $scope.rowInAce2);

            editor.session.setValue(editorFiller);   
        }
    };

    $scope.funcTypes = [
        'docs', 'validate', 'views', 'shows', 'lists', 'updates', 'filters'
    ];
    
    $scope.toggleViewStateGroup = function(someFuncType) {
        if (someFuncType === 'docs') {
            $scope.toggleDocsFunctions('docs');
        }
        else $scope.toggleDocsFunctions('values');
        
        $scope.funcType = someFuncType;
        $scope.viewStateGroup = {};
        $scope.viewStateGroup[someFuncType] = 'active';
        
        var type = $scope.viewState1.values ? 'value' : 'doc';
        if ($scope.viewState1.values)   
            $scope.designGridOptions.$gridScope.filterText =
            'type:' + type + ';funcType:' + $scope.funcType + ';';
        if (someFuncType === 'validate' || $scope.viewState1.docs) $scope.nameField.visible = false;
        else $scope.nameField.visible = true;
    };
    
    function addRowsByFuncType(d, funcType, row) {
        var newValue = angular.copy(row);
        newValue.type = 'value';
        if (funcType === 'validate') {
            newValue.funcType = 'validate';
            
            if (d.validate_doc_update) {
                newValue.value = d.validate_doc_update;
                newValue.couch = true;
                newValue.original = angular.copy(newValue);
                $scope.designRows.push(newValue);
            } 
            else {
                newValue.value = '';
                newValue.couch = false;
                newValue.original = angular.copy(newValue);
                $scope.designRows.push(newValue);
            }
        }
        else  {
            newValue.funcType = funcType;
            if (d[funcType] && angular.isObject(d[funcType])) {
                newValue.couch = true;
                Object.keys(d[funcType]).forEach(function(n) {
                    var newRow = angular.copy(newValue);
                    newRow.name = n;
                    newRow.value = d[funcType][n];
                    newRow.original = angular.copy(newRow);
                    $scope.designRows.push(newRow);
                });
            }
            else {
                newValue.value = '';
                newValue.couch = false;
                newValue.name = funcType.slice(0, funcType.length -1) + ' name', 
                newValue.original = angular.copy(newValue);
                $scope.designRows.push(newValue);
            }
        }
    } 
    
    
    function addToDesignRows(dbName) {
        if (!dbName) {
            alert('this should not happen...');
            return;   
        }
        var docs = $scope.designDocs[dbName];
        var row = { database: dbName };
        if (docs.length === 0) {
            row.design = 'design',
            row.type = 'doc';
            row.couch = false;
            row.original = angular.copy(row);
            $scope.designRows.push(row);
            $scope.funcTypes.forEach(function(funcType) {
                if (funcType === 'docs') return;
                addRowsByFuncType({}, funcType, row);   
            });
        }
        // else
        docs.forEach(function(d) {
            row.design = d._id.slice(8);
            row.couch = true;
            var newRow = angular.extend({ type:'doc'}, row);
            newRow.original = angular.copy(newRow);
            $scope.designRows.push(newRow);
            $scope.funcTypes.forEach(function(funcType) {
                if (funcType === 'docs') return;
                addRowsByFuncType(d, funcType, row);   
            });
        });
    }
    
    function dbSelectionChanged(selRow) {
        console.log(arguments);
        $scope.selectedDatabase = selRow.selected ?
            selRow.entity.name : undefined;
        loadDesignsForDatabases();
    }
    
    function loadDesignsForDatabases() {
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
            }
        });
        VOW.every(vows).when(
            function(array){
                console.log('adding design rows', array);
                array.forEach(addToDesignRows);
                $scope.$apply();
            },
            function(err) {
                if (vows.length > 0) {
                    alert('unable to get all design docs. Are you logged in as a server admin?');
                    console.log(err);
                }
            });
        
        // Remove database from designDocs and take out the rows of non
        // selected databases
        Object.keys($scope.designDocs).forEach(function(dbName) {
            if (selDatabases.indexOf(dbName) === -1) {
                delete $scope.designDocsObj[dbName];
                delete designDocs[dbName];
            }
        });
        
        $scope.designRows = $scope.designRows.filter(function(row) {
            return selDatabases.indexOf(row.database) !== -1;// || row.modified;
        });
        
    } 
    
    function getDesignDocs(dbName) {
        var vow = VOW.make();
        if (!dbName) return vow['break']('Error: no db passed in');
        console.log('getting design docs for ' , dbName);
        couchapi.docAllDesignInclude(dbName).when(
            function(data) {
                var designDocs = data.rows.map(function(r) {
                    // r.doc.name = r.doc._id.slice(8);
                    console.log('r.doc =', r.doc);
                    return r.doc;
                });
                // if (designDocs.length > 0) {
                $scope.designDocs[dbName] = designDocs;
                $scope.designDocsObj[dbName] = (function() {
                    var obj = {};
                    $scope.designDocs[dbName].forEach(function(d) {
                        obj[d._id.slice(8)] = d;
                    });
                    return obj;
                })();
                // }
                vow.keep(dbName);
            }
            ,function(err) {
                console.log('error', err);
                // alert('unable to get database design docs');
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
                                 ,noCtrlMulti: true
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
        
        $scope.nameField = {visGroup:'value', field:'name', displayName:'name', enableCellEdit: true, visible:true, cellTemplate: cellTemplate };
        $scope.columnDefs =
            [
                {visGroup:'hidden', field:'type', displayName:'type', enableCellEdit: true, visible:true, width:40}
                ,{visGroup:'hidden', field:'funcType', displayName:'funcType', enableCellEdit: true, visible:true, width:70} //toggle
                
                ,{visGroup:'both', field:'database', displayName:'database', enableCellEdit: false, visible:true, cellTemplate: cellTemplate}
                ,{visGroup:'both', field:'design', displayName:'_design/', enableCellEdit: false, visible:true //cellTemplate: cellTemplate,
                  // ,editableCellTemplate: editableCellTemplateDesignDoc
                 }
                ,$scope.nameField
                ,{visGroup:'value', field:'copy', displayName:'copy',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true}
                ,{visGroup:'doc', field:'paste', displayName:'paste',
                  cellTemplate: checkBoxTemplate, enableCellEdit:false, width:40, visible:true} 
                ,{visGroup:'both', field:'couch', displayName:'couch',
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
    
    // var screenState = {
    //     fieldGroup: 'Copy'
    //     ,filterState: 'values'
    // };
    
    
    
    $scope.modifiedCount = 0;
    function endEdit(row) {
        
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
    
    $scope.undo = function() {
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        angular.forEach(selRows, function(selRow) {
            if (selRow.modified) {
                angular.copy(selRow.original, selRow);
                selRow.original = angular.copy(selRow);
                console.log(selRow);
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
        
        if ( col.field === 'paste'  && row.entity.paste && row.entity.copy) {
            delete row.entity.paste;
            return;
        }
        if ( col.field === 'copy'  && row.entity.paste && row.entity.copy) {
            delete row.entity.copy;
            return;
        }
        
        if ( col.field === 'paste'  && row.entity.paste && !row.entity.couch) {
            row.entity.couch = true;
        }
        
        if ( col.field === 'couch'  && !row.entity.couch) {
            if (row.entity.type === 'doc') {
                
                var notEmpty = $scope.designRows.some(function(r) {
                    return r.database === row.entity.database &&
                        r.design === row.entity.design && r.type === 'value' && r.couch;
                }); 
                console.log('notEmpty', notEmpty);
                if (notEmpty) row.entity.couch = true;
            }
            
            if (!row.entity.couch) delete row.entity.paste;
        }
        
        if ( col.field === 'copy'  && row.entity.copy && row.entity.funcType === 'validate') {
            $scope.designRows.forEach(function(d) {
                if (d.funcType === 'validate') {
                    delete d.copy;   
                    endEdit(d);
                }
            });
            row.entity.copy = true;
        }
        
        if ( col.field === 'couch'  &&  row.entity.couch && row.entity.type === 'value') {
            $scope.designRows.some(function(r) {
                if (r.database === row.entity.database &&
                    r.design === row.entity.design && r.type === 'doc') {
                    r.couch = true;   
                    endEdit(r);
                    return true;
                }
                return false;
            }); 
            
        } 
        
        endEdit( row.entity);
    };
    
    $scope.refresh = function() {
        console.log('refresh', state.reps);
        window.test = $scope.designGridOptions;
        state.setActiveScreen($scope, '#databases');
    }; 
    
    $scope.apply = function() {
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        // console.log('selrows',selRows);
        
        console.log('ddocs', JSON.stringify($scope.designDocsObj, null, ' '));
        
        var actions = {};
        var docsToWrite = {};
        var docsToRemove = {};
        var ddocs = angular.copy($scope.designDocsObj);
        
        function getDoc(database, design) {
            if (ddocs[database][design]) {
                docsToWrite[database] = docsToWrite[database] || {};
                docsToWrite[database][design] = ddocs[database][design];
                delete ddocs[database][design];
            } 
            if (!docsToWrite[database][design]) {
                console.error("ERROR, my design doc does not exist!!!");
            }
            return docsToWrite[database][design];
        }
    
        function process(actions) {
            actions.create = actions.create || {};
            actions.create.doc = actions.create.doc || [];
            actions.remove = actions.remove || {};
            actions.remove.doc = actions.remove.doc || [];
            actions.create = actions.create || {};
            actions.create.func = actions.create.func || [];
            actions.remove = actions.remove || {};
            actions.remove.func = actions.remove.func || [];
            actions.copy = actions.copy || {};
            actions.copy.func = actions.copy.func || [];
            actions.paste = actions.paste || {};
            actions.paste.doc = actions.paste.doc || [];
        
            console.log(actions.create.doc);
            actions.create.doc.forEach(function(r) {
                docsToWrite[r.database] = docsToWrite[r.database] || {};
                docsToWrite[r.database][r.design] = {
                    _id : '_design/' + r.design
                };
            });
            console.log('TO WRITE',JSON.stringify(docsToWrite, null, ' '));
            
            actions.remove.doc.forEach(function(r) {
                var doc = getDoc(r.database, r.design);
                doc._deleted = true;
                // docsToRemove[r.database] = docsToRemove[r.database] || [];
                // docsToRemove[r.database].push(doc);
            });
            console.log('TO REMOVE', JSON.stringify(docsToRemove, null, ' '));
        
            actions.create.func.forEach(function(r) {
                var doc = getDoc(r.database, r.design);
                if (r.funcType === 'validate') {
                    doc.validate_doc_update = r.value || "";
                } 
                else {
                    doc[r.funcType] = doc[r.funcType] || {};
                    doc[r.funcType][r.name] = r.value;
                }
            });
            actions.remove.func.forEach(function(r) {
                if (docsToRemove[r.database] &&
                    docsToRemove[r.database].indexOf("_design/" + r.design) !== -1) return;
                var doc = getDoc(r.database, r.design);
                if (r.funcType === 'validate') {
                    delete doc.validate_doc_update;
                } 
                else {
                    if (doc[r.funcType]) delete doc[r.funcType][r.name];
                }
            });
        
            actions.copy.func.forEach(function(rc) {
                if (rc.funcType === 'validate') {
                    actions.paste.doc.forEach(function(rp) {
                        var doc = getDoc(rp.database, rp.design);
                        doc.validate_doc_update = rc.value;
                    });
                } 
                else {
                    actions.paste.doc.forEach(function(rp) {
                        var doc = getDoc(rp.database, rp.design);
                        doc[rc.funcType] = doc[rc.funcType] || {};
                        doc[rc.funcType][rc.name] = rc.value;
                    });
                }
            });
        
        }
    
        
        function isPathModified(row) {
            return row.database + row.design + row.name !==
                row.original.database + row.original.design + row.original.name;
        }
        
        function isNew(row) {
            var ddocs = $scope.designDocsObj;
            var design = ddocs[row.database][row.design];
            if (!design) return true;
            if (row.type === 'doc') return false;
            if (row.funcType === 'validate') {
                if ( typeof design.validate_doc_update !== undefined) return false;
                else return true;
            } 
            if (design[row.funcType] && typeof design[row.funcType][row.name] !== undefined) return false;
            return true;
        }
        
        
        function makeAction(a,t,r) {
            console.log('making action');
            actions[a] = actions[a] || {};
            if (t === 'value') t = 'func';
            actions[a][t] = actions[a][t] || [];
            
            var action  = {
                database: r.database,
                design: r.design
            };
            if (t === 'func') {
                action.name = r.name,
                action.funcType = r.funcType;
                if (a !== 'remove' && a !== 'paste')
                    action.value = r.value;
            }
            actions[a][t].push(action);
            console.log('actions', actions);
        }
        
        function removeEmptyObjects(d) {
            console.log('removing empty obj for ' , d);
            $scope.funcTypes.forEach(function(t) {
                console.log(t, d[t]);
                if (d[t] && Object.keys(d[t]).length === 0) {
                    console.log('deleting', t, d[t]);
                    delete d[t];
                }
            });
        }
        
        $scope.designRows.filter(function(r) {
            return r.modified;
        }).forEach(function(r) {
            console.log('modified row', r, isNew(r.original));
            if (!r.couch && !isNew(r.original)) {
                makeAction('remove', r.type, r.original);
            } 
            
            if (r.copy && !r.paste) makeAction('copy', r.type, r);
            
            if (r.paste && !r.copy) makeAction('paste', r.type, r);
            console.log(r, isPathModified(r), isNew(r.original));
            if (r.couch) {
                if (!isNew(r.original)) {
                    if (isPathModified(r)) {   
                        makeAction('remove', r.type, r.original);   
                        makeAction('create', r.type, r);
                    }
                    else if (r.value !== r.original.value || !r.original.couch) {
                        makeAction('create', r.type, r);
                    }
                }
                else makeAction('create', r.type, r);
            }
        });
        
        console.log('ACTIONS', JSON.stringify(actions, null, ' '));
        process(actions);
        
        console.log('TO WRITE',JSON.stringify(docsToWrite, null, ' '));
        console.log('TO REMOVE', JSON.stringify(docsToRemove, null, ' '));
        var vows = [];
        Object.keys(docsToWrite).forEach(function(db) {
            var objects = docsToWrite[db];
            var docs = Object.keys(objects).map(function(d) {
                removeEmptyObjects(objects[d]);
                return objects[d];
            });
            vows.push(couchapi.docBulkSave(docs, db));
            console.log(docs, db);
        });
        VOW.every(vows).when(
            function(data) {
                console.log('bulksave done', data); 
                var error = data.some(function(db) {
                    return db.some(function(d) {
                        if (d.error) {
                            alert('Not saving ' +
                                  d.id + '\nError:' + d.error + '\nReason:' + d.reason);
                            console.log(d.id, d.error, d.reason);
                            return true;
                        }
                        return false;
                    }); 
                });
                if (error) {
                    console.log(JSON.stringify(data, null, ' '));
                    return;
                }
                // $scope.designGridOptions.selectVisible(false);
                $scope.designDocs = {};
                $scope.designRows = [];
                loadDesignsForDatabases();
                $scope.$apply();
            },
            function(err) {
                console.log('err', err);
                alert('error bulk saving design documents');
                console.log(JSON.stringify(err, null, ' '));
            }
        );
        
    };

    $scope.newRow = function() {
        console.log('new row');
         
        var selRows = $scope.designGridOptions.$gridScope.selectedItems;
        if (selRows.length !== 1) {
            alert('Please select one and only one row to copy database/_design from for the new row.');
            return;
        }
        var newRow = angular.copy(selRows[0]);
        delete newRow.original;
        delete newRow.modified;
        delete newRow.couch;
        delete newRow.paste;
        delete newRow.copy;
        var notUnique;
        if ($scope.viewState1.docs) {
            angular.extend(newRow, {
                design: prompt("New design document name ?")
            });
            if (!newRow.design) return;
            notUnique = $scope.designRows.some(function(d) {
                return d.database === newRow.database && d.design === newRow.design && d.type === 'doc';
            });
            
            if (notUnique) {
                alert('Cancelled. Not unique!!!');
                return;
            }
            
            $scope.funcTypes.forEach(function(funcType) {
                if (funcType === 'docs') return;
                addRowsByFuncType({}, funcType, newRow);   
            });
        
        }
        else {
            angular.extend(newRow, {
                name: prompt("New " + newRow.funcType.slice(0, newRow.funcType.length -1 ) + " name ?")
            });
            if (!newRow.name) return;
            notUnique = $scope.designRows.some(function(d) {
                return d.database === newRow.database && d.design === newRow.design &&
                    d.type === 'value' && newRow.name === d.name && newRow.funcType === d.funcType;
            });
            
            if (notUnique) {
                alert('Cancelled. Not unique!!!');
                return;
            }
        }
        
        newRow.original = angular.copy(newRow);
        newRow.couch = true;
        $scope.designRows.push(newRow);
        
        endEdit(newRow);
        
        $scope.designGridOptions.selectVisible(false);
        setTimeout(function() {
            $scope.designGridOptions.selectItem($scope.designRows.length-1, true);
            $scope.$apply();
        });
        
        editor.session.setValue(newRow.value);   
        $scope.rowInAce2 = newRow;
    };
    
    
    
    function setDocsFunctionsState() {
        var filter = '';
        if (!$scope.viewState1.all) filter = 'type:' +
            ($scope.viewState1.docs ? 'doc' : 'value');
        $scope.designGridOptions.$gridScope.filterText = filter;
        // console.log('applying filter:', filter);
        
        // $scope.toggleViewStateGroup($scope.funcType);
        
        $scope.columnDefs.forEach(function(c){
            //hidden, both, doc or  value
            c.visible = c.visGroup === 'both' ||
                ($scope.viewState1.docs && c.visGroup === 'doc') ||
                ($scope.viewState1.values && c.visGroup === 'value') ? true : false;
        }); 
        // if ($scope.viewStateGroup.validate)  $scope.nameField.visible = false;
        
    }
    
    $scope.toggleDocsFunctions = function(toggle) {
        $scope.viewState1 = {};
        $scope.viewState1[toggle] = 'active';
        setDocsFunctionsState();
    };
    
    function validateFunc(s) {
        var old = window.test;
        var result;
        s = 'test=' + s;
        try {
            result = eval(s);
        } catch (e) {
            console.log(e.name, e.message);
            window.test = old;
            return false;
        }
        window.test = old;
        if ( typeof result === 'function') return true;
        console.log('Error: not a function');
        return false;
    }
    
    // $scope.toggleViewState2 = function(toggle) {
    //     $scope.viewState2 = {};
    //     $scope.viewState2[toggle] = 'active';
    // }; 
    
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
                console.log('saving data into row', $scope, $scope.rowInAce2);
                var value = editor.session.getValue();
                var oldValue = $scope.rowInAce2.value;
                if (!validateFunc(value)) {
                    alert('Error in validating function');
                    return;
                }
                $scope.rowInAce2.value = value;
                endEdit($scope.rowInAce2, 'value', oldValue);
                // console.log('change', rowInAce2.value);
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
    init();
    if (!state.designDone) {
        state.designDone = true;
        defineGrid();
        defineDbGrid();
        window.ddocs = $scope.designDocs ={};
        window.ddocsObj = $scope.designDocsObj = {};
        
        $scope.designRows = [];
        
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
                       $scope.toggleViewStateGroup('validate');
                       console.log('in initDesign');
                       // console.log("REPS", state.reps);
                       // makeGrid();
                       // console.log($scope.columnDefs);
                   });
    } 
}); 
                                   