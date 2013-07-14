/*global Cookie:false $:false VOW:false PBKDF2:false isc:false define:false emit:false*/
/*jshint strict:true unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:10 maxcomplexity:7 maxlen:130 devel:true newcap:false*/

if (!window.define) {
    window.define = function (obj) {
        window.couchapi = obj.factory();
    };
}

define(
    { inject: [], 
      factory: function() 
      { "use strict";
        // var log = logger('couchapi');
        var api = {};
        var defaultDesignDocName = 'auth';
        
        api.init = function(url, aDefaultDesignDocName) {
            $.couch.urlPrefix = url;
            defaultDesignDocName = aDefaultDesignDocName || defaultDesignDocName;
        };
        
        api.config = function(section, option, value){
            var vow = VOW.make(); 
            $.couch.config({
                success: vow.keep,
                error: vow.break
            },section, option, value);
            return vow.promise;
        };
        
        //---------------------sessions
        api.login = function(name, pwd) {
            var vow = VOW.make(); 
            $.couch.login({
                name: name,
                password: pwd,
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.logout = function() {
            var vow = VOW.make(); 
            $.couch.logout({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.session = function() {
            var vow = VOW.make(); 
            $.couch.session({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        
        //----------------------Databases
        api.dbAll = function() {
            var vow = VOW.make(); 
            $.couch.allDbs({
                success: vow.keep,
                error: vow.break
            });
            
            return vow.promise;
        };
        
        var dbName;
        api.dbSet = function(name) {
            dbName = name;
        };
        
        api.dbRemove = function(name) {
            if (name) dbName = name;
            var vow = VOW.make(); 
            $.couch.db(dbName).drop({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.dbCreate = function(name) {
            if (name) dbName = name;
            var vow = VOW.make(); 
            $.couch.db(dbName).create({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        
        api.dbCompact = function(name) {
            if (name) dbName = name;
            var vow = VOW.make(); 
            $.couch.db(dbName).compact({
                success: vow.keep,
                error: vow.break
            });
            
            return vow.promise;
        };
        
        //call returned object.stop to finish receiving changes
        api.dbChanges = function(cb, aDbName) {
            if (aDbName) dbName = aDbName;
            var changes = $.couch.db(dbName).changes();
            changes.onChange(
                cb 
            );
            return changes;
        };
        
        api.dbInfo = function(name) {
            if (name) dbName = name;
            var vow = VOW.make(); 
            $.couch.db(dbName).info({
                success: function(data) {
                    data.uri = $.couch.db(dbName).uri;
                    vow.keep(data);
                },
                error: vow.break
            });
            
            return vow.promise;
        };
        
        api.dbSecurity = function(securityObj, aDbName) {
            var vow = VOW.make(); 
            if (typeof securityObj === 'object') {
                if (aDbName) dbName = aDbName;
                $.couch.db(dbName).setDbProperty('_security', securityObj, {
                    success: vow.keep,
                    error: vow.break
                });
                
            }
            else  {
                aDbName = securityObj;
                if (aDbName) dbName = aDbName;
                $.couch.db(dbName).getDbProperty('_security', {
                    success: vow.keep,
                    error: vow.break
                });
                
            }
            return vow.promise;
        };
        
        //set group to create object to hold funName
        //set funStr to null to delete it the key and value
        //set funStr to ? to get the content of funName
        api.dbDesign = function(docName, group, funName, funStr, aDbName) {
            var vow = VOW.make();
            if (aDbName) dbName = aDbName;
            function save(designDoc) {
                if (group) {
                    designDoc[group] = designDoc[group] || {};
                    if(funStr) designDoc[group][funName] = funStr;
                    else delete designDoc[group][funName];
                }
                else {
                    if (funStr) designDoc[funName] = funStr;   
                    else delete designDoc[funName];
                }
                api.docSave(designDoc).when(
                    vow.keep,
                    vow.break
                );
            }
            api.docGet('_design/' + docName).when(
                function(designDoc) {
                    if (funStr === "?")
                        vow.keep(designDoc[group] ? designDoc[group][funName] : designDoc[funName]);
                    else save(designDoc);
                },
                function() {
                    if (funStr === '?') vow['break'](funName  + "doesn't exist");
                    else {
                        var designDoc = {
                            _id : '_design/' + docName
                        };
                        save(designDoc);
                    }
                }
            );
            return vow.promise;
            
        };
        
        
        api.dbDesignDoc = function(group, funName, funStr, aDbName) {
            return api.dbDesign(defaultDesignDocName, group, funName, funStr, aDbName);
        };
        
        api.dbFilter = function(filterName, funStr, aDbName) {
            return api.dbDesignDoc('filters', filterName, funStr, aDbName);
        };
        
        //---------------------------docs
        //options is optional and can contain key value query params
        //for instance: open_revs=all rev=asdfasf4333 conflicts=true
        api.docGet = function(id, options, aDbName) {
            if (typeof options !== 'object') {
                aDbName = options;   
                options = undefined;
            }
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            options = $.extend({
                success: vow.keep
                ,error: function(status) {
                    vow['break']({ id: id, options: options, status: status});
                }
            },options);
            $.couch.db(dbName).openDoc(id, options);
            return vow.promise;
        };
        
        //Implemention of http://wiki.apache.org/couchdb/Replication_and_conflicts
        // 1. GET docid?conflicts=true
        // 2. For each member in the _conflicts array:
        //      GET docid?rev=xxx
        //    If any errors occur at this stage, restart from step 1.
        //    (There could be a race where someone else has already resolved this
        //    conflict and deleted that rev)
        // 3. Perform application-specific merging
        // 4. Write _bulk_docs with an update to the first rev and deletes of
        //    the other revs.
        api.docConflicts = function(id, aDbName) {
            if (aDbName) dbName = aDbName;
            var result = [];
            var vow = VOW.make();
            var retries = 0;
            
            function getRevsVow(revs) {
                var revGetters = [];
                revs.forEach(function(rev) {
                    revGetters.push(api.docGet(id, { rev: rev}));
                });
                return VOW.every(revGetters);
            }
            
            function getRevs(revs) {
                getRevsVow(revs).when(
                    function(data) {
                        vow.keep(result.concat(data));
                    },
                    function(data) {
                        if (retries++ < 5) getRevs(revs);
                        else vow['break']({ error: "Couldn't find at least one of the conflicting revs of doc with id " + id,
                                            data:data });
                    }
                );
            }
            
            function getRevIds(id) {
                api.docGet(id, { conflicts: true }).when(
                    function(doc) {
                        var revs = doc._conflicts;
                        delete doc._conflicts;
                        result.push(doc);
                        if (revs) getRevs(revs); 
                        else vow.keep(result);
                    },
                    function(data) {
                        //couldn't find the doc, give up
                        vow['break']({ error: "Couldn't find doc with id " + id, data:data });
                    });
            }
            
            getRevIds(id);
            return vow.promise;
        };
        
        //pass in a doc or id you suspect has conflicts.
        //resolver is called to decide between conflicting revs
        //if resolver is left out, a promise is returned with the revs to
        //choose from, and a continuing function to call when you've decided
        //which is the winning rev, pass in its index. Again a promise
        //is returned of good things achieved..
        api.docResolveConflicts = function(doc, resolver, aDbName) {
            var vow = VOW.make();
            if (typeof resolver !== 'function') aDbName = resolver;
            if (aDbName) dbName = aDbName;
            var id = doc.id ? doc.id : doc;
            
            function prepRevs(revs, winningRev) {
                for (var i=0; i<revs.length; i++) {
                    if (i !== winningRev) {
                        var r = revs[i];
                        revs[i] = { _id: r._id, _rev: r._rev,  _deleted : true };
                    }
                }
            }
            
            api.docConflicts(id).when(
                function(revs) {
                    if (revs.length === 1) {
                        if (typeof resolver === 'function')
                            vow.keep(revs[0]);   
                        else {
                            vow.keep({
                                revs: revs,
                                fun: function() { return VOW.kept(); }
                            });
                        }
                    }
                    else {
                        if (typeof resolver === 'function') {
                            prepRevs(revs, resolver(revs));
                            api.docBulkSave(revs).when(
                                function(data) { vow.keep(data); },
                                function(data) { vow['break'](data); }
                            );
                        }
                        else vow.keep(
                            { revs: revs,
                              fun: function(winningRev) {
                                  prepRevs(revs, winningRev);
                                  return api.docBulkSave(revs);
                              }
                            }
                        );
                    }
                }, 
                function(data) { vow['break'](data); }
            );
            return vow.promise;
        };
        //------------------------------------------------------
        
        api.docRemove = function(doc, aDbName) {
            if (typeof doc === 'string')
                return api.docRemoveById(doc, aDbName);
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).removeDoc(doc, {
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.docRemoveById = function(id, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make();
            api.docGet(id).when(
                function(doc) {
                    api.docRemove(doc).when(
                        vow.keep,
                        vow.break
                    );
                },
                vow.keep
            );
            return vow.promise;
        };
        
        api.docBulkRemove = function(docs, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).bulkRemove({"docs": docs }, {
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.docBulkSave = function(docs, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).bulkSave({"docs": docs }, {
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.docAll= function(aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).allDocs({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.docAllDesign= function(aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).allDesignDocs({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        //not working under cors at least: XMLHttpRequest cannot load
        // http://localhost:5984/b/asdfasf. Method COPY is not allowed
        // by Access-Control-Allow-Methods.
        api.docCopy = function(id, newId, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).copyDoc(id, {
                success: vow.keep,
                error: vow.break
            }, {
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Destination", newId);
                }
            });
            return vow.promise;
        };
        
        api.docSave = function(doc, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).saveDoc(doc, {
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        //-----------------misc 
        api.list = function(designDoc, listName, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).list(designDoc + '/' + listName,'all', {
                success: vow.keep,
                error: vow.break,
                reduce: false
            });
            return vow.promise;
        };
        
        api.viewCompact = function(aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = vow.make(); 
            $.couch.db(dbName).compactView({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.viewCleanup = function(aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = vow.make(); 
            $.couch.db(dbName).viewCleanup({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.view = function(designDoc, viewName, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).view(designDoc + '/' + viewName , {
                success: vow.keep,
                error: vow.break,
                reduce: false
            });
            return vow.promise;
        };
        
        api.viewTemp = function(map, aDbName) {
            if (aDbName) dbName = aDbName;
            var vow = VOW.make(); 
            $.couch.db(dbName).query(map,"_count", "javascript", {
                success: vow.keep,
                error: vow.break,
                reduce: false
            });
            return vow.promise;
        };
        
        api.activeTasks = function() {
            var vow = VOW.make(); 
            $.couch.activeTasks({
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        var conflictsMap = function(doc) {
            if (doc._conflicts) {
                emit(null, [doc._rev].concat(doc._conflicts));
            }
        };
        
        var conflictsView = {"map" : conflictsMap.toString()};
        
        function checkForConflictsView() {
            var vow = VOW.make();
                api.dbDesign('couchapi', 'views', 'conflicts', "?").
                when(
                    vow.keep
                    ,function() {
                        api.dbDesign('couchapi', 'views', 'conflicts', conflictsView).
                            when(
                                vow.keep,
                                vow.break
                            );
                    }
                );
            return vow.promise;
        }
        
        function getRevs(ids) {
            var vow = VOW.make();
            var getters = {};
            var idVows = [];
            Object.keys(ids).forEach(function(id) {
                getters[id] = [];
                var revs = ids[id]; 
                revs.forEach(function(rev) {
                    getters[id].push(api.docGet(id, { 'rev': rev}));
                });
                idVows.push(VOW.every(getters[id]));
            });
            if (idVows.length === 0) vow.keep([]);
            else VOW.every(idVows).when(
                function(data) {
                    var conflicts = {};
                    data.forEach(function(doc) {
                        conflicts[doc[0]._id] = doc;
                    });
                    
                    vow.keep(conflicts);
                },
                vow.break
            );
            return vow.promise;
        }
        
        api.dbConflicts = function(fetchDocs, aDbName) {
            var vow = VOW.make();
            if (typeof fetchDocs !== 'boolean') {
                aDbName = fetchDocs;   
                fetchDocs = false;
            }
            if (aDbName) dbName = aDbName;
            checkForConflictsView().when(
                function() {
                    return api.view('couchapi', 'conflicts');
                }
            ).when(
                function(data) {
                    console.log(data);
                    var idsWithConflicts = {};
                    data.rows.forEach(function(r){
                        idsWithConflicts[r.id] = r.value; 
                    });
                    if (!fetchDocs) return VOW.kept(idsWithConflicts);
                    else return getRevs(idsWithConflicts);
                }).when(
                    vow.keep,
                    vow.break
                );
            return vow.promise;
        };
        
        //not tested yet
        api.replicateStop = function(repId) {
            var repOptions = repOptions || {};
            repOptions.cancel = true;
            repOptions.replication_id = repId;
            var vow = VOW.make(); 
            $.couch.replicate('', '', {
                success: vow.keep,
                error: vow.break
            }, repOptions);
            return vow.promise;
        };
        
        api.replicateDo = function(db1, db2, repOptions) {
            var vow = VOW.make(); 
            $.couch.replicate(db1, db2, {
                success: vow.keep,
                error: vow.break
            }, repOptions);
            return vow.promise;
        };
        
        // "source", "target", "create_target", "continuous", "doc_ids", "filter", "query_params", "user_ctx"
        api.replicationAdd = function(id, repDoc) {
            repDoc._id = id || api.UUID();
            if (repDoc.role)
                repDoc.user_ctx = { "roles": [repDoc.role] };
            if (repDoc.filterName)
                repDoc.filter = defaultDesignDocName + '/' + repDoc.filterName;
            return api.docSave(repDoc, '_replicator');
        };
        
        api.replicationRemove = function(id) {
            return api.docRemove(id, '_replicator');
        }; 
        
        
        api.UUID = function() {
            return $.couch.newUUID();
        };
        
        
        //------------------------users
        api.userAdd = function(name, pwd, roles) {
            var vow = VOW.make(); 
            var userDoc = {
                name: name
                ,roles: roles
            };
            $.couch.signup(userDoc, pwd, {
                success: vow.keep,
                error: vow.break
            });
            return vow.promise;
        };
        
        api.userRemove = function(name) {
            var vow = VOW.make(); 
            $.couch.userDb(function(data) {
                var dbName = data.name;
                $.couch.db(dbName).removeDoc(name, {
                    success: vow.keep,
                    error: vow.break
                });
            });
            return vow.promise;
        };
        
        api.userGet = function(name) {
            var vow = VOW.make(); 
            $.couch.userDb(function(data) {
                var dbName = data.name;
                $.couch.db(dbName).openDoc('org.couchdb.user:' +name, {
                    success: vow.keep,
                    error: vow.break
                });
            });
            return vow.promise;
        };
        
        
        api.userUpdate = function(name, props) {
            var vow = VOW.make(); 
            $.couch.userDb(function(data) {
                var dbName = data.name;
                $.couch.db(dbName).openDoc('org.couchdb.user:' + name, {
                    success: function(data) {
                        Object.keys(props).forEach(function(p) {
                            data[p] = props[p]; 
                        });
                        $.couch.db(dbName).saveDoc(data, {
                            success: vow.keep,
                            error: vow.break
                        });
                    },
                    error: vow.break
                });
            });
            return vow.promise;
        };
        
        api.userRoles = function(name, roles) {
            var vow = VOW.make(); 
            if (roles) {
                api.userUpdate(name, {roles:roles}).when(
                    vow.keep,
                    vow.break
                );
            }
            else api.userGet(name).when(
               vow.keep,
                vow.break
            );
            return vow.promise;
        };
        
        api.userRemoveRole = function(name, role) {
            var vow = VOW.make(); 
            $.couch.userDb(function(data) {
                var dbName = data.name;
                $.couch.db(dbName).openDoc('org.couchdb.user:' + name, {
                    success: function(data) {
                        if (data.roles.indexOf(role) !== -1) {
                            data.roles = data.filter(
                                function(e){ return e !==role; });
                            $.couch.db(dbName).saveDoc(data, {
                                success: function(data) {
                                    vow.keep(data);
                                },
                                error: function(status) {
                                    vow['break'](status);
                                }
                            });
                        }
                        else vow.keep(data);
                        
                    },
                    error: vow.break
                });
            });
            return vow.promise;
        }; 
        
        api.userAddRole = function(name, role) {
            var vow = VOW.make(); 
            $.couch.userDb(function(data) {
                var dbName = data.name;
                $.couch.db(dbName).openDoc('org.couchdb.user:' + name, {
                    success: function(data) {
                        if (data.roles.indexOf(role) === -1) {
                            data.roles.push(role);
                            $.couch.db(dbName).saveDoc(data, {
                                success: function(data) {
                                    vow.keep(data);
                                },
                                error: function(status) {
                                    vow['break'](status);
                                }
                            });
                        }
                        else vow.keep(data);
                        
                    },
                    error: vow.break
                });
            });
            return vow.promise;
        }; 
        
        api.test = function() {
            api[arguments[0]].apply(api, Array.prototype.slice.call(arguments, 1)).
                when(
                    function(data) {
                        console.log("SUCCESS!!");
                        console.log(data);
                    },
                    function(data) {
                        console.log('FAIL');
                        console.log(data);
                    }
                );
            return 'Wait for it...';
        };

        return api;
      }});


