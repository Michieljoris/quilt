/*global confirm:false prompt:false quilt:false alert:false angular:false VOW:false couchapi:false console:false  $:false*/

function multicapCntl($scope, config, state, defaults, persist) {
    "use strict" ;
    console.log('In multicapCntl');
    
    var locationSecObj = {
        members: {
            names: [ "_type:'shift'" ]
            ,roles: [ "read", "write" ]
        }
    };
    
    $scope.createServerAdmin = function() {

        var pwd = prompt('Password?');
        if (!pwd) return;
        var pwd2 = prompt('Type your password again:');
        if (pwd !== pwd2) {
            alert('Passwords don\'t match. Server admin not created');
            return;
        }
        var result = confirm('When you click OK a server admin will be created. ');
        if (!result) return;
        couchapi.config('admins', 'admin', pwd).when(
            function(data) {
                console.log(data);
                // $scope.password = null;
                state.initialize($scope);
                alert('Server admin created. Log in as \'admin\' and use the password you just entered.');
            },
            function(data) {
                console.log("error",data);
                $scope.password = null;
                alert('The admin user already exists probably. Anyway the admin user has not been added.', data);
            }
        );
    };
    
    $scope.createPersonsDb = function() {
        createDb('persons', ["_type:'person'", "_type:'settings'", "_type:'user'"])
            .when(
                function(data) {
                    console.log('Created persons database', data );
                    return couchapi.docRemoveById('persons_push_users', '_replicator');
                })
            .when(
                function(data) {
                    console.log('Removed persons to _users replication', data);
                    var rep = {
                        _id: 'persons_push_users'
                        ,source: 'persons'
                        ,target: '_users'
                        ,continuous: true
                        ,filter: 'design/filter'
                        ,query_params: { type: 'user' }
                        ,user_ctx: { "roles": [ "_admin" ]} 
                    }; 
                    return couchapi.docSave(rep, '_replicator');
                })
            .when(
                function(data) {
                    alert('Created/configured persons database', data);
                }
                ,function(error) {
                    alert("Couldn't create or setup persons database");
                    console.log('Failed to create or setup persons database', error ); }
            );
        
    };
    
    $scope.createLocationsDb = function() {
        createDb('locations', ["_type:'location'"]).when(
            function(data) {
                alert('Created/configured locations database');
                console.log('Created location database', data ); }
            ,function(error) {
                alert("Couldn't create or setup location database");
                console.log('Failed to create or setup location database', error ); }
        );
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
        createDb('location-' + dbName, ["_type:'shift',location:'" + locationName + "'"] ).when(
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
                    name: name,
                    dbName: 'location-' + dbName
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
                $scope.setup.remoteUserName = data.userCtx.name;
                $scope.$apply();
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
        $scope.connectingToSource = true;
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
                $scope.connectedToSource = true;
                
                $scope.connectingToSource = false;
                $scope.$apply();
            }
            ,function(error) {
                alert("Couldn't fetch info. " +
                      "\n\nError:\n\n" + (error.reason || ""));
                console.log(error);
                $scope.connectedToSource = false;
                $scope.connectingToSource = false;
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
                    //TODO uncomment, just for testing
                    if (readableDbs.indexOf('locations') === -1 ||
                        readableDbs.indexOf('persons') === -1)
                        return VOW.broken({ reason:'You have no read permission for the locations and/or persons database. Or they might not exist.'});
                        
                    // else
                        return getSecObjs(readableDbs);
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
    
    
    // function makePureRep(rep) {
    //     var cleanRep = {
    //         _id: rep._id
    //         ,source: rep.source
    //         ,target: rep.target
    //         ,continuous: rep.continuous
    //         ,create_target: rep.create_target
    //         ,filter: rep.filter
    //         ,query_params: rep.query_params
    //         ,doc_ids: rep.doc_ids
    //         ,user_ctx: rep.user_ctx
    //     };
    //     Object.keys(cleanRep).forEach(function(k) {
    //         var val = cleanRep[k];
    //         if (!val ||
    //             ( angular.isArray(val) && val.length === 0 ) ||
    //             ( angular.isObject(val) && Object.keys(val).length === 0) ||
    //             ( typeof val === 'string' && val.length === 0)) 
    //             delete cleanRep[k]; 
    //     });
    //     return cleanRep;
    // }
    
    function validateSetup(setup) {
        console.log('validating setup:', setup);
        if (!setup.targetDatabase) {
            alert('Target database not set!!');
            return false;
        }
        if (!setup.remoteUserName) {
            alert('Remote user name not set!!');
            return false;
        }
        if (!setup.remotePwd) {
            setup.remotePwd = setup.remoteUserName;
            // alert('Remote pwd not set!!');
            return true;
        }
        if (setup.databasesToSync.length === 0) {
            alert('Nothing to do!!!');
            return false;
        }
        return true;
    }
    
    function removeDb(name) {
        var vow = VOW.make();
        couchapi.dbRemove(name).when(
            function(data) {
                console.log('removed database:' + name);
                vow.keep(data);
            }
            ,function(error) {
                console.log('Doesn\'t exist:' + name);
                vow.keep(error);
            }
        );
            return vow.promise;
    }
    
    
    function setDesign(dbName) {
        var docName = "design";
        function update(ddoc) {
            ddoc.validate_doc_update = quilt.vdu;
            ddoc.lib = ddoc.lib || {};
            ddoc.lib.validator = quilt.validator;
            ddoc.filters = ddoc.filters || {};
            ddoc.filters.filter = quilt.filter;
            return ddoc;
        }
        var vow = VOW.make();
        function save(designDoc) {
            console.log('saving design doc', designDoc);
            couchapi.docSave(designDoc, dbName).when(
                vow.keep,
                vow.breek
            );
        }
        couchapi.docGet('_design/' + docName, dbName).when(
            function(designDoc) {
                save(update(designDoc));
            },
            function() {
                    save(update({ _id: '_design/' + docName }));
            }
        );
        return vow.promise;
    }
    
    function createDb(dbName, rules, roles) {
        var vows = [];
        vows.push(couchapi.dbCreate(dbName));
        vows.push(couchapi.dbInfo(dbName));
        return VOW.first(vows).when(
            function() {
                var secObj = {
                    members: {
                        names: rules
                        ,roles: roles || [ "read_all",  "" + dbName ]
                    }
                };
                return couchapi.dbSecurity(secObj, dbName);
            }
        ).when(
            function() {
                return setDesign(dbName);
            }
        );
    }
    
    function makeReplications(setup) {
        var id = setup.targetDatabase + '_';
        var remoteUrl = setup.url.protocol + setup.remoteUserName + ":" +
            setup.remotePwd + '@' + setup.url.path + '/';
        var reps = [];
        console.log('HOUSES so SYNC', setup.locationsToSync);
        
        var locations = setup.locationsToSync.filter(function(l) {
            return l.checked;
        });
        if (locations.length === 0) {
            var response = confirm('No locations selected. If you click OK, only the persons database will be replicated/synced');
            if (!response) return reps;
        }
        setup.databasesToSync.forEach(function(db) {
            var rep = {
                _id: id + 'pull_' + db.dbName
                ,source: remoteUrl + db.dbName
                ,target: setup.targetDatabase
                ,continuous: true
                ,user_ctx: { "roles": [ "_admin" ]}
            };
            var repPush = angular.copy(rep);
            
            if (db.dbName === 'locations') {
                if (locations.length === 0) return;
                repPush.doc_ids = rep.doc_ids = locations.map(function(l) {
                    return l.name;
                });
            }
            else if (db.dbName === 'persons') {
                repPush.filter = 'design/filter';
                repPush.query_params = { "type": [ "user", "person" , "settings"] };
            }
            else {
                if (!db.checked) return;
                repPush.filter = 'design/filter';
                repPush.query_params = { type:'shift' , location: '"' + db.name + '"'};
            }
            
            reps.push(rep);
            if (db.sync === 'sync') {
                repPush._id = id + 'push-' + db.dbName;
                repPush.source = rep.target;
                repPush.target = rep.source;
                reps.push(repPush);
            }
        });
        
        reps.push({
            _id: id + 'push_users'
            ,source: setup.targetDatabase
            ,target: '_users'
            ,continuous: true
            ,filter: 'design/filter'
            ,query_params: { type: 'user' }
            ,user_ctx: { "roles": [ "_admin" ]}
        });
        return reps;
    }
    
    function removeReps(setup) {
        var vow = VOW.make();
        
        couchapi.docAllInclude('_replicator', { }).when(
            function(reps) {
                reps = reps.rows.map(function(r) {
                    return r.doc;
                }).filter(
                    function(r) {
                        if (r._id.startsWith('_design')) return false;
                        return setup.removeAllReps ||
                            setup.targetDatabase === r.source ||
                            setup.targetDatabase === r.target ||
                            $scope.state.connected + '/' + setup.targetDatabase === r.source ||
                            $scope.state.connected + '/' + setup.targetDatabase === r.target;
                    }
                );
                console.log('removing the following reps:', reps);
                var vows = [];
                reps.forEach(function(r) {
                    vows.push(couchapi.docRemoveById(r._id));
                });
                return VOW.every(vows);
            }).when(
                function(data) {
                    vow.keep(data);
                }
                ,function(err) {
                    console.log('ERROR: Couldn\'t fetch current reps...');
                    vow.breek(err);
                }
            );
        return vow.promise;
    }
    
    $scope.setupSimple = function() {
        console.log('Setting up CouchDB', $scope.setup);
        var setup = $scope.setup;
        if (!validateSetup(setup)) return;
        var url = validateUrl(setup.remoteUrl);
        if (!url) {
            alert('url is not valid');
            return;   
        }
        
        var repsToCommit = makeReplications(setup);
        if (repsToCommit.length === 0) return;
        
        var remoteUrl = url.protocol+ setup.remoteUserName + ':'+
            setup.remotePwd + '@' + url.path;
        console.log(remoteUrl);
        
        var vows = [];
        vows.push(removeDb(setup.targetDatabase));
        vows.push(removeReps(setup));
        VOW.every(vows)
            .when(
                function(data) {
                    console.log('Removed target database and replications', data);
                    var roles = [];
                    setup.locationsToSync.filter(function(l) {
                        return l.checked;
                    }).forEach(function(l) {
                        // roles.push("" + l.dbName);
                        roles.push("write_" + l.dbName);
                    });
                    roles.push("read"); roles.push("write");
                    return createDb(setup.targetDatabase, [ "_type:'shift'", "_type:'location'", "_type:'person'",
                                                            "_type:'user'", "_type:'settings'"],
                                    roles
                                   );
                }
            ).when(
                function(data) {
                    console.log('Created target database:', data);
                    return couchapi.docBulkSave(repsToCommit, '_replicator');
                }
            ).when(
                function(data) {
                    alert('Done!!');
                    console.log('Successfully setup database', data );
                }
                ,function(error) {
                    console.log('ERROR', error);
                }
            );
        
    }; 
    
    function validateUrl(url) {
        var parsed = {};
        if (url.startsWith('https://'))  {
            parsed.protocol = 'https://';   
            parsed.path = url.slice(8);
            if (!parsed.path) return null;
            return parsed;
        }
        else if (url.startsWith('http://'))  {
            parsed.protocol = 'http://';   
            parsed.path = url.slice(7);
            if (!parsed.path) return null;
            return parsed;
        }
        return null;
    }
    
    $('#remoteUrl').editable({
        unsavedclass: null,
        type: 'text',
        // value: state.remoteUrl,
        // value: "http://multicapdb.iriscouch.com",
        value: "https://ssl.axion5.net",
        success: function(response, newValue) {
            var url = validateUrl($scope.setup.remoteUrl);
            if (!url) {
                alert('Invalid url');
                return;
            }
            persist.put('setupCouchRemoteUrl', newValue.trim());
            $scope.setup.remoteUrl = newValue.trim();
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
            if (!newValue) {
                alert('No value entered!!!');
                return;
            }
            $scope.setup.targetDatabase = newValue.trim();
            persist.put('setupCouchTarget', newValue.trim());
            $scope.$apply();
        }
    });
    
    $('#remoteUserName').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remoteUserName,
        success: function(response, newValue) {
            if (!newValue) {
                alert('No value entered!!!');
                return;
            }
            $scope.setup.remoteUserName = newValue.trim();
            persist.put('setupCouchUserName', newValue.trim());
            $scope.$apply();
        }
    });
    
    $('#remotePassword').editable({
        unsavedclass: null,
        type: 'text',
        value: state.remotePassword
        ,success: function(response, newValue) {
            if (!newValue) {
                alert('No value entered!!!');
                return;
            }
            $scope.setup.remotePwd = newValue;
            $scope.$apply();
        }
    });
    
    if (!state.multicapDone) {
        state.multicapDone = true;
        $('#multicapTabs a[href="#setupCouch"]').tab('show');
        $scope.setup = {};
        $scope.$on('initMulticap',
                   function() {
                       console.log('INIT MULTICAP');
                       updateLocationDoc();
                       $scope.setup.remoteUrl =
                           persist.get('setupCouchRemoteUrl') || 'https://ssl.axion5.net';
                       $scope.setup.url = validateUrl($scope.setup.remoteUrl);
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
                       // $scope.setup.remotePwd = $scope.setup.remoteUserName;
                       // $('#remotePassword').editable(
                       //     'setValue'
                       //     ,$scope.setup.remotePwd
                       //     , false);
                       $scope.setup.targetDatabase =
                           persist.get('setupCouchTarget') || 'roster_data';
                       $('#targetDatabase').editable(
                           'setValue'
                           ,$scope.setup.targetDatabase
                           , false);
                           
                       // $scope.setup.removeAllReps = true;
                       $scope.repToUsers = true;
                       $scope.$apply();
                   });
    }
    
    
    
    
}

