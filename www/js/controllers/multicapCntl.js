/*global angular:false alert:false prompt:false couchapi:false console:false  $:false*/

function multicapCntl($scope, config, state, defaults) {
    "use strict" ;
    console.log('In multicapCntl');
    
    var locationSecObj = {
        members: {
            names: [ "_type:'shift'" ]
            ,roles: [ "read", "write" ]
        }
    };
    
    function setSecObj(locationName) {
        var secObj = angular.copy(locationSecObj);
        secObj.members.roles.push("read-" + locationName);
        secObj.members.roles.push("write-" + locationName);
        var modified = false;
        couchapi.dbSecurity("location_" + locationName).when(
            function(data) {
                console.log(data);
                if (data && data.members) {
                    if (data.members.names &&
                        Object.keys(data.members.names).length > 0) {
                        secObj.members.names = data.members.names;
                    }
                    else {
                        modified = true;
                    }
                    if (data.members.roles &&
                        Object.keys(data.members.roles).length > 0) {
                        secObj.members.roles = data.members.roles;
                    }
                    else {
                        modified = true;
                    }
                }
                else modified = true;
                if (modified) {
                    couchapi.dbSecurity(secObj, "location_" + locationName).when(
                        function(data) {
                            console.log('SecObj of location ' +
                                        locationName + " has been set.", data);
                        },
                        function(err) {
                            console.log("Couldn't set secObj of location!!", err);
                        }
                    );
                }
                
                
            },
            function(err) {
                console.log('Database doesn\'t exist:' + locationName, err);
                $scope.$apply();
            }
        );
    }
    $scope.test = function() {
        setSecObj('bla');
    };
    
    $scope.createLocationDb = function() {
        var locationName = $scope.locationName;
        if (!locationName) return;
        var dbName = locationName.replace(/ /g, '_').toLowerCase();
        var match = dbName.match(/[a-zA-Z _0-9]+/);
        if (!match || match[0].length !== dbName.length) {
            $scope.error = 'Illegal character. Use only alphabetical, numeral, underscore or space';
            setTimeout(function() {
                $scope.error = "";
            },3000);
            return;
        }
        couchapi.dbCreate('location_' + dbName).when(
            function(data) {
                console.log(data);
                $scope.newLocationShouldBeOpen = false;
                addToLocationList(dbName, locationName);
                $scope.refresh();
                $scope.$apply();
            },
            function(err) {
                console.log(err); 
                $scope.error = 'Database not created. It exists already probably';
                setTimeout(function() {
                    $scope.error = "";
                },3000);
                $scope.$apply();
            }
        );
    };
    
    function addToLocationList(dbName, name) {
        couchapi.docGet('houses', 'multicap').when(
            function(locationListObj) {
                locationListObj[dbName] = {
                    name: name
                };
                
                couchapi.docSave(locationListObj, 'multicap').when(
                    function(data) {
                        $scope.locationListObj = locationListObj;
                        console.log('houses.json saved', data);
                    },
                    function(err) {
                        console.log('Error: houses.json not saved', err);
                    }
                );
            },
            function(err) {
                
            });
    }
    
    function updateLocationList() {
        couchapi.docGet('houses', 'multicap').when(
            function(locationListObj) {
                $scope.locationListObj = locationListObj;
                console.log('MULTICAP===========', locationListObj);
                $scope.locationNames.forEach(function(locationName) {
                    if (!locationListObj[locationName]) {
                        locationListObj[locationName] = {
                            name: locationName.replace(/_/g, ' ')
                        };
                        modified = true;
                    }
                });
                var modified;
                Object.keys(locationListObj).forEach(function(k) {
                    if (!k.startsWith('_')) {
                        if ($scope.locationNames.indexOf(k) === -1) {
                            modified = true;
                            delete locationListObj[k];
                        }
                    }
                });
                if (modified)
                    couchapi.docSave(locationListObj, 'multicap').when(
                        function(data) {
                            console.log('houses.json saved', data);
                        },
                        function(err) {
                            console.log('Error: houses.json not saved', err);
                        }
                    );
                $scope.$apply();
            },
            function(err) {
                console.log(err);
                state.houses = {};
                $scope.$apply();
            }
        );
    }
    
    function updateLocationDbs() {
        $scope.locationNames = state.databases.filter(function(db) {
            return db.name.startsWith('location_');
        }).map(function(db) {
            setSecObj(db.name.slice(9));
            return db.name.slice(9);
        });
        updateLocationList();
    }
    
    $scope.refresh = function() {
        
        state.databases = false;
        state.setActiveScreen($scope, '#simple');
        // getHouses();
        
    };
    
    $scope.addLocationDialog = function() {
        
        $scope.newLocationShouldBeOpen = true;
    };
    
    $scope.closeLocation = function() {
        $scope.newLocationShouldBeOpen = false;
    };
    
    
    $('#remoteUrl').editable({
        unsavedclass: null,
        type: 'text',
        // value: state.remoteUrl,
        value: "http:multicapdb.iriscouch.com",
        success: function(response, newValue) {
            config.set({ couchDbUrl: newValue });
            $scope.$apply();
        }
    });
    
    $('#remoteUserName').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remoteUserName,
        success: function(response, newValue) {
            // config.set({ corsProxy: newValue });
            // $scope.$apply();
        }
    });
    
    $('#remotePassword').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remotePassword,
        success: function(response, newValue) {
            // config.set({ corsProxy: newValue });
            // $scope.$apply();
        }
    });
    
    $('#locationsToSync').editable({
        unsavedclass: null,
        // type: 'checklist',
        value: [2, 3],    
        source: [
              {value: 1, text: 'Waterford West'},
              {value: 2, text: 'Runcorn 9'},
              {value: 3, text: 'Rubicon'}
           ],
        success: function(response, newValue) {
            console.log(newValue);
            // config.set({ corsProxy: newValue });
            
            // $scope.$apply();
        }
    });
    
    
    
    if (!state.multicapDone) {
        state.multicapDone = true;
        $('#multicapTabs a[href="#createLocation"]').tab('show');
        $scope.$on('initMulticap',
                   function() {
                       updateLocationDbs();
                   });
    }
    
    
   }

