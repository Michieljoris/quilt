/*global VOW:false $:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("databasesCntl", function ($scope, $location, state, defaults, persist) {
    
    console.log('In databasesCntl');
    
    $scope.tabs = [
        { title:"Security", content:"Dynamic content 1" , url: "built/db_security.html"},
        { title:"Design documents", content:"", url: "built/db_ddocs.html" }
        ,{ title:"Conflicts", content:"", url: "built/db_conflicts.html" }
        ,{ title:"Playground", content:"", url: "built/db_test.html" }
        // ,{ title:"", content:"", url: "test.html" }
        // ,{ title:"", content:"", url: "test.html" }
    ];

    $scope.tabSelected = function(tab) {
        console.log(tab.title);
        persist.put('databasesSubTab', tab.title);    
        if (initTab[tab.title]) 
            initTab[tab.title]();
    };
    
    var initTab = {};
    initTab.Security = function() {
        if (!$scope.selectedDatabase) return;
        couchapi.dbSecurity($scope.selectedDatabase)
            .when(
                function(secObj) {
                    console.log(secObj);
                    $scope.secObj = secObj = secObj || {};
                    $('#dbMemberNames').editable('setValue', secObj.members ? secObj.members.names: [], false);
                    $('#dbMemberRoles').editable('setValue', secObj.members ? secObj.members.roles: [], false);
                    $('#dbMemberRoles').editable('option', 'select2', { tags: ['opt1', 'opt2']});
                
                    $scope.edited = false;
    
                    newMemberNames = newMemberRoles = null;
                    // newRoles = null, newPwd = null;
                    $scope.$apply();
                
                    //TODO inittab of the selected subtab
                },
                function(err) {
                    if (err === 401) 
                        alert('Unable to retrieve database info. Unauthorized');
                    else alert('Unable to retrieve database security info. ' + err);
                    console.log(err);
                
                }
            );
    };
    
    // function aggregrateDesignDocs(ddocs) {
    //     var result =  { views:{}, shows: {}, lists: {}, updates: {},
    //                       filters: {}, validate_doc_updates: []};
    //     ddocs.forEach(function(d) {
    //         if (d.validate_doc_update) result.validate_doc_updates.push(d.validate_doc_update);
    //         // result.views
    //     });
    //     return result;
        
    // }
    
    $scope.testurl = "test.html";
    $scope.editDatabase = function(dbName) {
        $scope.selectedDatabase = dbName;
        
        console.log(dbName);
        couchapi.dbInfo(dbName).when(
            function(data) {
                $scope.dbInfo = data;
                localStorage.setItem('quilt_selectedDatabase', dbName);
            }
            ,function(err) {
                // if (err === 401) 
                $scope.dbInfo = null;
                alert('Unable to retrieve database info. Unauthorized');
                // else alert('Unable to retrieve database security info. ' + err);
                localStorage.removeItem('quilt_selectedDatabase');
                console.log(err);
                
            }
        );
        
        var designDocs = $scope.designDocs = {};
        couchapi.docAllDesign(dbName).when(
            function(data) {
                console.log(data);
                var ddocPromises = [];
                $scope.ddocs = data.rows.map(function(d) {
                    ddocPromises.push(couchapi.docGet(d.id));
                    return d.id;
                });
                return VOW.every(ddocPromises);
            }).when(
                function(ddocs) {
                    // designDocs = aggregrateDesignDocs(ddocs);
                    $scope.designDocs = ddocs;
                    window.ddocs = ddocs;
                    console.log('got all ddocs:', ddocs);
                    $scope.$apply();
                
                },
                function(data) {
                    console.log('error', data);
                
                }
            );
        
        
    };
    // $scope.designDocs = 'fetching..';
    
    $scope.addDatabase = function() {
        
        couchapi.dbCreate($scope.dbName).when(
            function(data) {
                console.log(data);
                $scope.newDatabaseShouldBeOpen = false;
                //TODO bit overkill, only need to fetch updated database list, or just add to state.databases..
                state.initialize($scope);
            },
            function(data) {
                console.log("error",data);
                alert('The database already exists probably. Anyway the database has not been created.', data);
            }
        );
        
    };
    
    $scope.addDatabaseDialog = function() {
        $scope.newDatabaseShouldBeOpen = true;
    };
    
    $scope.closeDatabase = function() {
        $scope.newDatabaseShouldBeOpen = false;
    };
    
    
    $scope.removeDatabase = function(id) {
        console.log(id);
        if (confirm('Are you sure?'))
            couchapi.dbRemove(id).when(
                function(data) {
                    console.log(data);
                    //TODO bit overkill, only need to fetch updated database list, or just remove from state.database..
                    state.databases = state.databases.filter(function(db) {
                        if (db!==id) return true;
                        return false;
                    });
                    $scope.$apply();
                },
                function(data) {
                    console.log("error",data);
                    alert('Not able to remove database..', data);
                }
            );
        
    };
    
    $scope.edited = false;
    
    var newMemberRoles, newMemberNames;
    
    $('#dbMemberNames').editable({
        inputclass: 'input-large',
        value: [],
        unsavedclass: null,
        select2: {
            tags: [],
            tokenSeparators: [",", " "]
        }
        ,success: function(response, newValue) {
            newMemberNames = newValue;
            console.log(newMemberNames);
            $scope.secObj.members = $scope.secObj.members || {};
            $scope.secObj.members.names = newValue;
            //TODO don't set edited flag when no changes..
            // if ($scope.secObj.members.names.toString() !== newValue.toString())
            $scope.edited = true;
            $scope.$apply();
        }
    });   
    
    $('#dbMemberRoles').editable({
        inputclass: 'input-large',
        value: ['bla'],
        unsavedclass: null,
        select2: {
            tags: ['read-users', 'write-users', 'read-persons', 'write-persons', 'read-locations', 'write-locations',
                  'read-waterfordwest', 'write-waterfordwest'],
            tokenSeparators: [",", " "]
        }
        ,success: function(response, newValue) {
            newMemberRoles = newValue;
            console.log(newMemberNames);
            $scope.secObj.members = $scope.secObj.members || {};
            $scope.secObj.members.roles = newValue;
            //TODO don't set edited flag when no changes..
            // if ($scope.secObj.members.names.toString() !== newValue.toString())
            $scope.edited = true;
            $scope.$apply();
        }
    });   
    // $('#dbMemberNames').editable({
    //     value: [2, 3],    
    //     unsavedclass: null,
    //     source: [
    //         {value: 'read-user', text: 'read-user'},
    //         {value: 'bla', text: 'bla'},
    //         {value: 'write-users', text: 'write-users'},
    //         {value: 'read-persons', text: 'read-persons'},
    //         {value: 'write-persons', text: 'write-persons'}
    //     ]
    //     ,success: function(response, newValue) {
    //         newMemberNames = newValue;
    //         console.log(newMemberNames);
    //         if ($scope.secObj && $scope.secObj.members) $scope.secObj.members.names = newValue;
    //         // if ($scope.secObj.members.names.toString() !== newValue.toString())
    //         $scope.edited = true;
    //         $scope.$apply();
    //         // $scope.$apply();
    //     }
    // });   
    
    
    // $('#dbMemberRoles').editable({
    //     value: [2, 3],    
    //     unsavedclass: null,
    //     source: [
    //         {value: 'read-user', text: 'read-user'},
    //         {value: 'bla', text: 'bla'},
    //         {value: 'write-users', text: 'write-users'},
    //         {value: 'read-persons', text: 'read-persons'},
    //         {value: 'write-persons', text: 'write-persons'}
    //     ]
    //     ,success: function(response, newValue) {
    //         newMemberRoles = newValue;
    //         console.log(newMemberRoles);
    //         if ($scope.secObj && $scope.secObj.members) $scope.secObj.members.roles = newValue;
    //         // if ($scope.secObj.members.roles.toString() !== newValue.toString())
    //         $scope.edited = true;
    //         $scope.$apply();
    //         // $scope.$apply();
    //     }
    // });   
    
    $scope.apply = function() {
        console.log('apply', newMemberNames, newMemberRoles, $scope.secObj);
        // var props = {};
        // if (newMemberNames || newMemberRoles) props.roles = newRoles;
        
        couchapi.dbSecurity($scope.secObj, $scope.selectedDatabase).when(
            function(data) { console.log(data);
                             $scope.edited = false;    
                             newMemberNames = newMemberRoles = null;
                             $scope.$apply();
                           }
            ,function(data) {
                alert('Unable to update the database\'s details. ' + data);
                console.log('error ', data); }
        );
    };
    
    $scope.styleSelectedDb = function(db) {
        if (db === $scope.selectedDatabase)
            return { //"color" : "green"
                     "border-bottom" :  "solid 1px black"
                     //,padding: "1px"
                   };
        return "";
    }; 
    
}); 
                                   