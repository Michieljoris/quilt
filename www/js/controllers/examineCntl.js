/*global VOW:false $:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/


angular.module("myApp").controller("examineCntl", function ($scope, $location, state, defaults, persist) {

    console.log('In examineCntl');

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

    $scope.tabSelected = function(tab) {
        if (typeof tab === 'string') {
            tab = tabsObj[tab];
        }
        console.log('tabSelected', tab.title);
        $scope.selectedExamineTab = tab.title;
        // persist.put('databasesSubTab', tab.title);
        console.log(tab);
        localStorage.setItem('quilt_selectedExamineTab', tab.title);
        if (initTab[tab.title])
            initTab[tab.title]();
    };
    
    $scope.isActiveTab = function(tabTitle) {
        // console.log(tabTitle, $scope.selectedExamineTab);
        if (tabTitle===$scope.selectedExamineTab)
            return 'active';
        else return '';
    };

    var initTab = {};
    
    
    initTab.Log = function() {
        
        // state.logRefresh = state.logRefresh || defaults.logRefresh;
        console.log('initing tab Log');
        // var vow = VOW.make();
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
                // vow.keep();
            },
            function(err) {
                console.log('Error getting couchDB log. ', err);
                state.log = "";
                $scope.$apply();
                // vow.keep();
            }
        );
        // return vow.promise;
    };
    // // initTab.Security = function() {
    // //     if (!$scope.selectedExamine) return;
    // //     couchapi.dbSecurity($scope.selectedExamine)
    // //         .when(
    // //             function(secObj) {
    // //                 console.log(secObj);
    // //                 $scope.secObj = secObj = secObj || {};

    // //                 $scope.securityError = false;
    // //                 $('#dbMemberNames').editable('setValue', secObj.members ? secObj.members.names: [], false);
    // //                 $('#dbMemberRoles').editable('setValue', secObj.members ? secObj.members.roles: [], false);
    // //                 $('#dbMemberRoles').editable('option', 'select2', { tags: ['opt1', 'opt2']});

    // //                 $scope.edited = false;

    // //                 newMemberNames = newMemberRoles = null;
    // //                 // newRoles = null, newPwd = null;
    // //                 $scope.$apply();

    // //             },
    // //             function(err) {
    // //                 if (err === 401) {
    // //                     $scope.securityError = "Unable to retrieve database info. Unauthorized";
    // //                 }
    // //                 else {
    // //                     $scope.securityError = "Unable to retrieve database security info. " + err;
    // //                 }
    // //                 console.log(err);
    // //                 $scope.$apply();
    // //             }
    // //         );
    // // };

    // // initTab.Design = function() {
    // //     console.log('in design');
    // //     if (!$scope.selectedExamine) return;
    // //     $scope.designDocs = {};
    // //     couchapi.docAllDesign($scope.selectedExamine).when(
    // //             function(data) {
    // //                 console.log(data);
    // //                 var ddocPromises = [];
    // //                 $scope.ddocs = data.rows.map(function(d) {
    // //                         ddocPromises.push(couchapi.docGet(d.id));
    // //                     return d.id;
    // //                 });
    // //                 return VOW.every(ddocPromises);
    // //             }).when(
    // //                 function(ddocs) {
    // //                     // designDocs = aggregrateDesignDocs(ddocs);
    // //                     $scope.designError = false;
    // //                     $scope.designDocs = ddocs;
    // //                     window.ddocs = ddocs;
    // //                     console.log('got all ddocs:', ddocs);
    // //                     $scope.$apply();

    // //                 },
    // //                 function(data) {
    // //                     if (data.length === 0) console.log('No design docs');
    // //                     else console.log('error', data);
    // //                     if (data === 401) {
    // //                         $scope.designError = "Unable to retrieve database design docs. Unauthorized";
    // //                     }
    // //                     else {
    // //                         $scope.designError = "Unable to retrieve database design docs" + data;
    // //                     }
    // //                     $scope.designDocs = [];
    // //                     $scope.$apply();
    // //                 }
    // //             );
    // // };


    // // function aggregrateDesignDocs(ddocs) {
    // //     var result =  { views:{}, shows: {}, lists: {}, updates: {},
    // //                       filters: {}, validate_doc_updates: []};
    // //     ddocs.forEach(function(d) {
    // //         if (d.validate_doc_update) result.validate_doc_updates.push(d.validate_doc_update);
    // //         // result.views
    // //     });
    // //     return result;

    // // }


    // // $scope.isActiveTabAndSelected = function(tabTitle) {
    // //     console.log(tabTitle, $scope.selectedExamineTab);
    // //     if (tabTitle===$scope.selectedExamineTab)
    // //         return 'active';
    // //     else return '';
    // // };

    // $scope.testurl = "test.html";
    // $scope.editDatabase = function(dbName) {
    //     $scope.selectedExamine = dbName;
    //     localStorage.setItem('quilt_selectedExamine', dbName);
    //     $scope.databaseError = false;
    //     console.log(dbName);
    //     couchapi.dbInfo(dbName).when(
    //         function(data) {
    //             $scope.dbInfo = data;
    //             console.log($scope.selectedExamineTab);

    //             $('#examineTabs a[href=#' + $scope.selectedExamineTab + ']').tab('show');
    //             initTab[$scope.selectedExamineTab]();
    //             $scope.$apply();
    //         }
    //         ,function(err) {
    //             $scope.dbInfo = null;

    //             if (err === 401) {
    //                 $scope.databaseError = "Unable to retrieve database info docs. Unauthorized";
    //             }
    //             else {
    //                 $scope.databaseError = "Unable to retrieve database info" + err;
    //             }

    //             console.log('database info error', err, $scope.databaseError);
    //             $scope.$apply();
    //             // localStorage.removeItem('quilt_selectedExamine');

    //         }
    //     );


    // };

    // $scope.addDatabase = function() {

    //     couchapi.dbCreate($scope.dbName).when(
    //         function(data) {
    //             console.log(data);
    //             $scope.newDatabaseShouldBeOpen = false;
    //             //TODO bit overkill, only need to fetch updated database list, or just add to state.databases..
    //             state.initialize($scope);
    //         },
    //         function(data) {
    //             console.log("error",data);
    //             alert('The database already exists probably. Anyway the database has not been created.', data);
    //         }
    //     );

    // };

    // $scope.addDatabaseDialog = function() {
    //     $scope.newDatabaseShouldBeOpen = true;
    // };

    // $scope.closeDatabase = function() {
    //     $scope.newDatabaseShouldBeOpen = false;
    // };


    // $scope.removeDatabase = function(id) {
    //     console.log(id);
    //     if (confirm('Are you sure?'))
    //         couchapi.dbRemove(id).when(
    //             function(data) {
    //                 console.log(data);
    //                 //TODO bit overkill, only need to fetch updated database list, or just remove from state.database..
    //                 state.databases = state.databases.filter(function(db) {
    //                     if (db!==id) return true;
    //                     return false;
    //                 });
    //                 localStorage.removeItem('quilt_selectedExamine');
    //                 $scope.selectedExamine = false;
    //                 state.initialize($scope);
    //             },
    //             function(data) {
    //                 console.log("error",data);
    //                 alert('Not able to remove database..', data);
    //             }
    //         );

    // };

    // $scope.edited = false;

    // var newMemberRoles, newMemberNames;

    // $('#dbMemberNames').editable({
    //     inputclass: 'input-large',
    //     value: [],
    //     unsavedclass: null,
    //     select2: {
    //         tags: [],
    //         tokenSeparators: [",", " "]
    //     }
    //     ,success: function(response, newValue) {
    //         newMemberNames = newValue;
    //         console.log(newMemberNames);
    //         $scope.secObj.members = $scope.secObj.members || {};
    //         $scope.secObj.members.names = newValue;
    //         //TODO don't set edited flag when no changes..
    //         // if ($scope.secObj.members.names.toString() !== newValue.toString())
    //         $scope.edited = true;
    //         $scope.$apply();
    //     }
    // });

    // $('#dbMemberRoles').editable({
    //     inputclass: 'input-large',
    //     value: ['bla'],
    //     unsavedclass: null,
    //     select2: {
    //         tags: ['read-users', 'write-users', 'read-persons', 'write-persons', 'read-locations', 'write-locations',
    //                'read-waterfordwest', 'write-waterfordwest'],
    //         tokenSeparators: [",", " "]
    //     }
    //     ,success: function(response, newValue) {
    //         newMemberRoles = newValue;
    //         console.log(newMemberNames);
    //         $scope.secObj.members = $scope.secObj.members || {};
    //         $scope.secObj.members.roles = newValue;
    //         //TODO don't set edited flag when no changes..
    //         // if ($scope.secObj.members.names.toString() !== newValue.toString())
    //         $scope.edited = true;
    //         $scope.$apply();
    //     }


    // });
    // // $('#dbMemberNames').editable({
    // //     value: [2, 3],
    // //     unsavedclass: null,
    // //     source: [
    // //         {value: 'read-user', text: 'read-user'},
    // //         {value: 'bla', text: 'bla'},
    // //         {value: 'write-users', text: 'write-users'},
    // //         {value: 'read-persons', text: 'read-persons'},
    // //         {value: 'write-persons', text: 'write-persons'}
    // //     ]
    // //     ,success: function(response, newValue) {
    // //         newMemberNames = newValue;
    // //         console.log(newMemberNames);
    // //         if ($scope.secObj && $scope.secObj.members) $scope.secObj.members.names = newValue;
    // //         // if ($scope.secObj.members.names.toString() !== newValue.toString())
    // //         $scope.edited = true;
    // //         $scope.$apply();
    // //         // $scope.$apply();
    // //     }
    // // });


    // // $('#dbMemberRoles').editable({
    // //     value: [2, 3],
    // //     unsavedclass: null,
    // //     source: [
    // //         {value: 'read-user', text: 'read-user'},
    // //         {value: 'bla', text: 'bla'},
    // //         {value: 'write-users', text: 'write-users'},
    // //         {value: 'read-persons', text: 'read-persons'},
    // //         {value: 'write-persons', text: 'write-persons'}
    // //     ]
    // //     ,success: function(response, newValue) {
    // //         newMemberRoles = newValue;
    // //         console.log(newMemberRoles);
    // //         if ($scope.secObj && $scope.secObj.members) $scope.secObj.members.roles = newValue;
    // //         // if ($scope.secObj.members.roles.toString() !== newValue.toString())
    // //         $scope.edited = true;
    // //         $scope.$apply();
    // //         // $scope.$apply();
    // //     }
    // // });

    // $scope.apply = function() {
    //     console.log('apply', newMemberNames, newMemberRoles, $scope.secObj);
    //     // var props = {};
    //     // if (newMemberNames || newMemberRoles) props.roles = newRoles;

    //     couchapi.dbSecurity($scope.secObj, $scope.selectedExamine).when(
    //         function(data) { console.log(data);
    //                          $scope.edited = false;
    //                          newMemberNames = newMemberRoles = null;
    //                          $scope.$apply();
    //                        }
    //         ,function(data) {
    //             alert('Unable to update the database\'s details. ' + data);
    //             console.log('error ', data); }
    //     );
    // };

    // $scope.styleSelectedDb = function(db) {
    //     if (db === $scope.selectedExamine)
    //         return { //"color" : "green"
    //             "border-bottom" :  "solid 1px black"
    //             //,padding: "1px"
    //         };
    //     return "";
    // };

    // // $scope.$watch("selectedExamine", function() {
    // //     console.log('watch', arguments);
    // // });

    // if (!state.examineDone) {
    //     state.examineDone = true;

    //     // var dereg =
    $scope.$on('initExamine',
               function() {
                   // dereg();
                   console.log("HELLO", $scope.selectedExamine, $scope.selectedExamineTab);
                   // $scope.editDatabase($scope.selectedExamine);

                   // if (initTab[$scope.selectedExamineTab]) initTab[$scope.selectedExamineTab]();
                   $('#examineTabs a[href=#' + $scope.selectedExamineTab + ']').tab('show');
                   $scope.tabSelected($scope.selectedExamineTab);
               });

    // }





});
