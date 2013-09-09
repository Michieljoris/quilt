/*global alert:false angular:false VOW:false couchapi:false console:false  $:false*/

function multicapCntl($scope, config, state, defaults, persist) {
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
        secObj.members.roles.push("read_" + locationName);
        secObj.members.roles.push("write_" + locationName);
        var modified = false;
        couchapi.dbSecurity("location-" + locationName).when(
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
                couchapi.dbSecurity(secObj, "location-" + locationName).when(
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
    
    $scope.createLocationDb = function() {
        var locationName = $scope.locationName;
        if (!locationName) return;
        var match = locationName.match(/[a-zA-Z 0-9]+/);
        if (!match || match[0].length !== locationName.length) {
            $scope.error = 'Illegal character. Use only alphabetical, numeral or space';
            setTimeout(function() {
                $scope.error = "";
            },3000);
            return;
        }
        var dbName = locationName.replace(/ /g, '-').toLowerCase();
        couchapi.dbCreate('location-' + dbName).when(
            function(data) {
                console.log(data);
                $scope.newLocationShouldBeOpen = false;
                addToLocationDoc(dbName, locationName).when(
                    function() {
                        $scope.refreshDatabases();
                        // $scope.$apply();
                    }
                    ,function(err) {
                        console.log('Error adding ' + locationName +
                                    'to the locationListDoc', err);
                        
                        // $scope.error = 'Error adding ' + locationName +
                        //     ' to the locationListDoc';
                        // setTimeout(function() {
                        //     $scope.error = "";
                        // },3000);
                        // $scope.$apply();
                    }
                );
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
    
    
    function getLocationDoc() {
        function getDoc(vow) {
            couchapi.docGet('locations', 'multicap').when(
                function(data) {
                    console.log('found locations doc', data);
                    vow.keep(data);
                },
                function(err) {
                    console.log("Couldn't find locationsDoc so returning fresh one",err);
                    var locationsDoc = {
                        _id: 'locations'
                    };
                    vow.keep(locationsDoc);
                }
            );
        }
        
        var vow = VOW.make();
        couchapi.dbInfo('multicap').when(
            function(data) {
                getDoc(vow);
            }
            ,function(err) {
                couchapi.dbCreate('multicap').when(
                    function(data) {
                        console.log('multicap database created');
                        getDoc(vow);
                    }
                    ,function(err) {
                        console.log("Couldn't create multicap database");
                        vow.breek(err);
                    }
                );
            }
        );
        return vow.promise;
    }
    
    
    function addToLocationDoc(dbName, name) {
        var vow = VOW.make();
        getLocationDoc().when(
            function(locationsDoc) {
                locationsDoc[dbName] = {
                    name: name
                };
                couchapi.docSave(locationsDoc, 'multicap').when(
                    function(data) {
                        $scope.locationsDoc = locationsDoc;
                        console.log('locations doc saved', data);
                        vow.keep();
                    },
                    function(err) {
                        console.log('Error: locations doc not saved', err);
                        vow.breek();
                    }
                );
            },
            function(err) {
                console.log("Error trying to add " + name + " to the location doc", err);
                vow.breek(err);
            });
        return vow.promise;
    }
    
    
    
    function updateLocationDoc() {
        $scope.locationNames = state.databases.filter(function(db) {
            return db.name.startsWith('location-');
        }).map(function(db) {
            setSecObj(db.name.slice(9));
            return db.name.slice(9);
        });
        
        getLocationDoc().when(
            function(locationsDoc) {
                console.log('MULTICAP===========', locationsDoc);
                $scope.locationNames.forEach(function(locationName) {
                    if (!locationsDoc[locationName]) {
                        locationsDoc[locationName] = {
                            name: locationName.replace(/_/g, ' ')
                        };
                        modified = true;
                    }
                });
                var modified;
                Object.keys(locationsDoc).forEach(function(k) {
                    if (!k.startsWith('_')) {
                        if ($scope.locationNames.indexOf(k) === -1) {
                            modified = true;
                            delete locationsDoc[k];
                        }
                    }
                });
                
                $scope.locationsDoc = locationsDoc;
                if (modified)
                    couchapi.docSave(locationsDoc, 'multicap').when(
                        function(data) {
                            console.log('locations doc saved', data);
                        },
                        function(err) {
                            console.log('Error: locations doc not saved', err);
                        }
                    );
                $scope.$apply();
            },
            function(err) {
                console.log(err);
                state.locations = {};
                $scope.$apply();
            }
        );
    }
    
    
    $scope.refreshDatabases = function() {
        state.databases = false;
        state.setActiveScreen($scope, '#simple');
    };
    
    $scope.addLocationDialog = function() {
        
        $scope.newLocationShouldBeOpen = true;
    };
    
    $scope.closeLocation = function() {
        $scope.newLocationShouldBeOpen = false;
    };
    
    function getDbInfo(allDbs) {
        var vows = [];
        allDbs.filter(function(dbName) {
            return dbName === 'locations' || dbName === 'persons' ||
                dbName.startsWith('location-');
        }).forEach(function(locationName) {
            vows.push(couchapi.dbInfo(locationName));
        });
        return VOW.any(vows);
    }
    
    function getSession(userName, userPwd) {
        var vow = VOW.make();
        if (userName && userName.length > 0 &&
            userPwd && userPwd.length > 0) {
            couchapi.login(userName, userPwd).when(
                function(data) {
                    console.log('logged in successfully', data);
                    vow.keep(data);
                },
                function(err) {
                    console.log('error logging in', err);
                    vow.breek(err);
                });
        }
        else couchapi.session().when(
            function(data) {
                console.log(data);
                vow.keep(data.userCtx);
                $('#remoteUserName').editable(
                    'setValue'
                    ,data.userCtx.name
                    , false);
            },
            function(err) {
                console.log('error getting session', err);
                vow.breek(err);
            });
        return vow.promise;
    } 
    
    function getSecObjs(dbNames) {
        var vows = [];
        dbNames.forEach(function(dbName) {
            vows.push(couchapi.dbSecurity(dbName));
        });
        return VOW.any(vows);
    }

    function getWritableDbs(dbNames, userCtx) {
        var roles = userCtx.roles || [];
        var writeAll = roles.indexOf('write') !== -1;
        dbNames = dbNames.filter(function(dbName) {
            if (writeAll || roles.indexOf('write_' + dbName) !== -1) {
                for (var r in roles) {
                    if (roles[r].startsWith('allow_*') ||
                        roles[r].startsWith('allow_' + dbName )) return true;
                }
            }
            return false;       
        });
        return dbNames;
    }
    
    function getRemoteLocationsDoc() {
        var vow = VOW.make();
        couchapi.docGet('locations', 'multicap').when(
            function(data) {
                vow.keep(data);
            },
            function(err) {
                console.log("Couldn't find location doc on remote url", err);
                vow.keep({});
            }
        );
        return vow.promise;
    }
    
    $scope.getDbs = function() {
        $scope.connectedToSource = true;
        var urlPrefix = $('#remoteUrl').editable('getValue').remoteUrl;
        var userName = $('#remoteUserName').editable('getValue').remoteUserName;
        var userPwd = $('#remotePassword').editable('getValue').remotePassword;
        if (!urlPrefix || urlPrefix.length === 0) {
            alert('Please provide the url of the source CouchDB instance.');
            return;
        }
        getLocationsToSync(urlPrefix, userName, userPwd).when(
            function(data) {
                $scope.setup.databasesToSync = data;
                $scope.setup.locationsToSync = data.filter(function(db) {
                    
                    return db.dbName !== 'locations' && db.dbName !== 'persons';
                });
                $scope.$apply();
            }
            ,function(error) {
                alert("Couldn't fetch info. " +
                     "\n\nError:\n\n" + (error.reason || ""));
                console.log(error);
                $scope.connectedToSource = false;
                $scope.$apply(); 
            }
        );
    };
    
    
    function getLocationsToSync(urlPrefix, userName, userPwd) {
        var vow = VOW.make();
        var  oldUrlPrefix = $.couch.urlPrefix;
        $.couch.urlPrefix = urlPrefix;
        console.log('getDbs', urlPrefix);
        var sessionInfo;
        var readableDbs, writableDbs;
        getSession(userName, userPwd)
            .when(
                function(data) {
                    sessionInfo = data;
                    console.log('sessioninfo', sessionInfo);
                    return couchapi.dbAll();
                })
            .when(
                function(data) {
                    console.log('success loading alldbs for ' + urlPrefix, data);
                    return getDbInfo(data);
                })
            .when(
                function(data) {
                    readableDbs = data.map(function(d) {
                        return d.db_name;
                    });
                    console.log('readable:',readableDbs);
                    if (readableDbs.indexOf('locations') === -1 ||
                        readableDbs.indexOf('persons') === -1)
                        return VOW.broken({ reason:'You have no read permission for the locations and/or persons database. Or they might not exist.'});
                        
                    else return getSecObjs(readableDbs);
                })
            .when(
                function(data) {
                    console.log('secObjs', data);
                    writableDbs = getWritableDbs(readableDbs, sessionInfo);
                    console.log('writable:',writableDbs);
                    return getRemoteLocationsDoc();
                    
                })
            .when(
                function(locationsDoc) {
                    console.log('locations doc:', locationsDoc);
                        
                    var databasesToSync = readableDbs.map(function(dbName) {
                        var result =  locationsDoc[dbName.slice(9)] || {};
                        result.dbName = dbName;
                        result.name = result.name || dbName;
                        result.sync =  writableDbs.indexOf(dbName) !== -1 ? "sync" : "replicate";
                        return result;
                    });
                        
                    $scope.writable = writableDbs;
                    $scope.readable = readableDbs;
                        
                    $.couch.urlPrefix = oldUrlPrefix;
                    vow.keep(databasesToSync);
                },
                function(error) {
                    // console.log('error retrieving all dbs for ' + urlPrefix, error);
                    $.couch.urlPrefix = oldUrlPrefix;
                    // alert(error);
                    vow.breek(error);
                }
            );
        return vow.promise;
    }
    
    function makeRep(id, local, remote, dir, params) {
        
    }
    
    $scope.setupSimple = function() {
        console.log('Setting up CouchDB', $scope.setup);
        //TODO take http(s):// from remoteUrl
        var remoteUrl = 'http://' + $scope.setup.remoteUserName + ':' +
            $scope.setup.remotePwd + '@' + $scope.setup.remoteUrl;
        //remove targetDatabase
        //remove reps that start with targetDatabase_
        //make targetDatabase, set permissions and roles
        
        //reps: id=targetDatabase
        //id_users: targetDatabase > local _users (filter type=user)
        
        //id_pull_locations: remote locations > targetDatabase (filter requested locations)
        //id_push_locations: targetDatabase > remote locations (if sync= "sync", filter requested locations)
        
        //id_pull_persons: remote persons > targetDatabase 
        //id_push_persons: targetDatabase > remote persons (if sync= "sync", use filter for type=user,person,setting)
        
        //id_pull_houseName1: remote house database1 > targetDatabase
        //id_push_houseName1: targetDatabase > remoteHouseDatabase1 ( if sync="sync" filter=shift)
        
        //id_pull_houseName2: remote house database2 > targetDatabase
        //id_push_houseName2: targetDatabase > remoteHouseDatabase2 ( if sync="sync" filter=shift)
        // etc
   }; 
    
    $('#remoteUrl').editable({
        unsavedclass: null,
        type: 'text',
        // value: state.remoteUrl,
        // value: "http://multicapdb.iriscouch.com",
        value: "http://localhost:5984",
        success: function(response, newValue) {
            persist.put('setupCouchRemoteUrl', newValue);
            $scope.getDbs();
            $scope.$apply();
        }
    });
    
    $('#targetDatabase').editable({
        unsavedclass: null,
        type: 'text',
        // value: state.remoteUrl,
        // value: "http://multicapdb.iriscouch.com",
        value: "database",
        success: function(response, newValue) {
            $scope.setup.targetDatabase = newValue;
            persist.put('setupCouchTarget', newValue);
            $scope.$apply();
        }
    });
    
    $('#remoteUserName').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remoteUserName,
        success: function(response, newValue) {
            $scope.setup.remoteUserName = newValue;
            persist.put('setupCouchUserName', newValue);
        }
    });
    
    $('#remotePassword').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remotePassword
        ,success: function(response, newValue) {
            $scope.setup.remotePwd = newValue;
        }
    });
    
    if (!state.multicapDone) {
        state.multicapDone = true;
        $('#multicapTabs a[href="#setupCouch"]').tab('show');
        $scope.setup = {};
        $scope.$on('initMulticap',
                   function() {
                       updateLocationDoc();
                       $scope.setup.remoteUrl =
                           persist.get('setupCouchRemoteUrl') || 'http://localhost:5984';
                       $('#remoteUrl').editable(
                           'setValue'
                           ,$scope.setup.remoteUrl
                           , false);
                       $scope.setup.remoteUserName =
                           persist.get('setupCouchUserName') || '';
                       $('#remoteUserName').editable(
                           'setValue'
                           ,$scope.setup.remoteUserName
                           , false);
                       $scope.setup.targetDatabase =
                           persist.get('setupCouchTarget') || 'database';
                       $('#targetDatabase').editable(
                           'setValue'
                           ,$scope.setup.targetDatabase
                           , false);
                   });
    }
    
    
}

