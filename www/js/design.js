(function() {
    var filter = function (doc, req) {
        if (!req.query || doc._deleted) return true;
        var q = req.query;
        return Object.keys(q).some(function(k) {
            if (isArray(q[k]))
                return q[k].some(function(v) {
                    return v === doc[k];
                });
            else return q[k] === doc[k];
        }); 
    };

    var vdu = function (newDoc, oldDoc, userCtx, secObj){
        if (!secObj) return;
    
        secObj.members = secObj.members || {};
        secObj.members.roles = secObj.members.roles || [];
        secObj.members.names = secObj.members.names || [];
    
        function reportError(type, error_msg) {
            log('Error writing document `' + newDoc._id +
                '\' to the database: ' + error_msg);
            var errorObj = {};
            errorObj[type] = error_msg;
            throw(errorObj);
        }
        
        
        if (newDoc._deleted === true && !oldDoc) {
            reportError('forbidden', 'Do not create deleted docs');
        }
    
        var validator = require('lib/validator');
    
        try {
            validator = validator.init(secObj.members, userCtx);
        }  catch(e) {
            log('error initing validator', e);
            if (e.message) reportError('forbidden', 'Error initializing validator: \n' + e.message);
            else reportError('forbidden', 'Error initializing validator: \n' + e.source + '\n ' + e.error);
        }
        
        function is_admin(){
            return userCtx.roles.indexOf('_admin') !== -1;
        }
    
        function validateDoc(doc) {
            return validator.validateDoc(doc);
        }
    
        if (is_admin()) {
            if (newDoc._deleted) return;
            if (!validateDoc(newDoc)) 
                reportError('forbidden', 'Dear admin: This document does not pass the the validation rules for this database and and has not been saved');
            return;
        } 
    
        function hasReadPermission() {
            var roles = secObj.members.roles;
        
            for (var i = 0; i < roles.length; i++) {
                // if (roles[i].indexOf('read') === 0) {
                if (userCtx.roles.indexOf(roles[i]) !== -1) return true;
                // }
            }
            return false;
        }
    
        var name = userCtx.name || 'unknown';
        if (!hasReadPermission())
            reportError('unauthorized', 'User ' + userCtx.name  +
                        ' is not allowed to write to this database (no read permission).');
    
    
        if (newDoc._deleted) {
            if  (!validator.validateUser(oldDoc, {}) )
                reportError('unauthorized', 'User ' + name + ' is not allowed to delete this particular document from this database.');
        }
        else {
            if  (!validator.validateUser(newDoc, oldDoc) )
                reportError('unauthorized', 'User ' + name +
                            ' is not allowed to write to this database or not allowed to write this particular document or both.');
            if (!validator.validateDoc(newDoc))
                reportError('forbidden', 'This document does not pass the the validation rules for this database and and has not been saved.');
        }
    
    };


    var validator = function() {
        
        var validateDoc;
        var cachedRules;
            var validateUser;
        var cachedUserCtx;
        var cachedRoles;

        function isArray(value) {
            return Object.prototype.toString.apply(value) === '[object Array]';
        }

        function equals(o1, o2) {
            if (o1 === o2) return true;
            if (o1 === null || o2 === null) return false;
                if (o1 !== o1 && o2 !== o2) return true; 
            var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
            if (t1 === t2) {
                if (t1 === 'function') {
                    return t1.toString() === t2.toString();
                }
                else if (t1 === 'object') {
                    if (isArray(o1)) {
                        if (!isArray(o2)) return false;
                        if ((length = o1.length) === o2.length) {
                            for(key=0; key<length; key++) {
                                if (!equals(o1[key], o2[key])) return false;
                            }
                            return true;
                        
                        }
                    } else {
                        if (isArray(o2)) return false;
                        keySet = {};
                        for(key in o1) {
                            if (key[0] === '_') continue;
                            if (!equals(o1[key], o2[key])) return false;
                            keySet[key] = true;
                        }
                        for(key in o2) {
                            if (key[0] === '_') continue;
                            if (!keySet.hasOwnProperty(key) &&
                                o2[key] !== undefined ) return false;
                        }
                        return true;
                    }
                }
            }
            return false;
            }

        function defined(doc, key) { return typeof doc[key] !== 'undefined'; }
        function array(doc, key) { return isArray(doc[key]); }
        function string(doc, key) { return typeof doc[key] === 'string'; }
        function object(doc, key) {
            var toString = Object.prototype.toString.apply(doc[key]);
            return typeof doc[key] === 'object' &&
                toString !== '[object Array]' &&
                toString !== '[object Date]';}
        function number(doc, key) { return typeof doc[key] === 'number'; } 
        function notdefined(doc, key) { return typeof doc[key] === 'undefined'; }
        function illegal(doc, key) {
            if (doc.hasOwnProperty(key)) return false;
            return true;
        }

        function parseDbRule(rule) {
            rule = 'rule = {' + rule + '}';
            rule = rule.replace(/;/g, ',');
            try { eval(rule); } catch(e) {
                throw({ source: rule, error: e.message });
            }
    
            function makeTestFixedValueFunction(key, fixedValue) {
                return function(doc) {
                    return doc[key] === fixedValue;
                };
                }
    
            var bind = function(f, key) {
                return function(doc) {
                    return f(doc, key);
                };
            };
    
            for (var k in rule) {
                if (!rule.hasOwnProperty(k)) continue;
                if (typeof rule[k] !== 'function') 
                        rule[k] = makeTestFixedValueFunction(k, rule[k]);
                else
                    rule[k] =  bind(rule[k], k);
            }
    
            return rule;
        } 


        function combineRuleTests(tests) {
            var ruleAsOneTest = function(doc) {
                for (var key in tests) {
                    if (!tests.hasOwnProperty(key)) return;
                    if (!tests[key](doc)) return false; }
                return true;
            };
            return ruleAsOneTest;
        }

        function compileRules(rules) {
    
            cachedRules = rules;
            if (!isArray(rules)) rules = []; 
            var tests = rules.filter(function(r) {
                return r.indexOf('_') === 0;
            }).map(function(r) {
                r = parseDbRule(r.slice(1));
                return combineRuleTests(r);
            });
            validateDoc = function(doc) {
                for (var i = 0; i < tests.length; i++) {
                        if (tests[i](doc)) return true;
                }
                return false;
            };
            return validateDoc;
        }


        function parse(rule, user) {
            var dq = '"', ignoreQuote, inQuote, objStr, keysString, ch;
            for (var i=0; i < rule.length; i++) {
                ch = rule[i];
                if (ch === dq && !ignoreQuote) {
                    inQuote = !inQuote;
                } 
                else if (inQuote) {
                    if (ch === '\\') ignoreQuote = true;
                    else ignoreQuote = false;
                } 
                else if (ch === '|'  && !inQuote) {
                    objStr = rule.slice(0, i);
                    keysString = rule.slice(i + 1);
                    break;
                }
            }
    
            if (!objStr && !keysString && !inQuote) {
                objStr = rule;   
            }
    
            var obj;
            var str = 'obj = {' + objStr + '}';
            str = str.replace(/;/g, ',');
            try { eval(str); } catch(e) {
                throw({ source: rule , error: e.message });
            }
            keysString = keysString || "";
            var colonPos = keysString.indexOf(':');
            if (keysString.length > 0 && colonPos === -1)
                throw { source: rule, error: 'colon missing after ONLY or NOT'};
            var type = keysString.slice(0, colonPos).
                indexOf('ONLY') === -1 ? 'not': 'only';
            keysString = keysString.slice(colonPos + 1);
    
            var keys = [];
            var key = [];
            var state = 'waitingForNextKey';
    
            for (i=0; i < keysString.length; i++) {
                ch = keysString[i];
                if (state === 'readLiteral') {
                    state = 'parsingQuotedKey';
                    key.push(ch);   
                }
                else if (state === 'parsingQuotedKey') {
                        if (ch === '\\') state = "readLiteral";
                    else if (ch === dq) {
                        keys.push(key.join(''));
                        state = 'waitingForNextKey';
                    }
                    else key.push(ch); } 
                else if (state === 'parsingKey') {
                    if (ch === ' ' || ch === ',' || ch === ';') {
                        keys.push(key.join(''));
                        state = 'waitingForNextKey';
                    }
                    else key.push(ch); 
                } 
                else if (state === 'waitingForNextKey') {
                    if (ch === ' ') ;
                    else { key = [];
                           if (ch === dq) state = 'parsingQuotedKey';
                           else { key.push(ch);
                                  state = 'parsingKey';   
                                }
                         }
                }
            }
    
            if (state === 'parsingQuotedKey')
                throw { source: rule, error: 'ending quote missing' };
            if (state === 'parsingKey') keys.push(key.join(''));
    
            return { rule: rule, fixedValues: obj, type: type, keys: keys };
        }

        function getAllowedRules(array, currentDb, dbRoles) {
            if (!isArray(array)) array = []; 
            var rules = [];
            array.forEach(function(r) {
                var isRule =  r.indexOf( 'allow_') === 0;
                if (isRule) {
                    var nextUnderScore = r.indexOf('_', 7);
                    var db = r.slice(6,nextUnderScore);
                    if (nextUnderScore === -1 || db.indexOf(':') !== -1 || db.indexOf('\'') !== -1) {
                        throw({ source: r, error: 'database missing'});
                    }
                    if (db === '*' || db === currentDb || dbRoles.indexOf(db) !== -1 )
                        rules.push(r.slice(nextUnderScore + 1));
                }
            });
            return rules;
        } 


        function getUserTest(r) {
            var test = {};
            var key;
            test.only = function(newDoc, oldDoc) {
                var fixedKey;
                for (fixedKey in r.fixedValues) {
                    if (!r.fixedValues.hasOwnProperty(fixedKey)) continue;
                    oldDoc[fixedKey] = r.fixedValues[fixedKey];
                    }
                for (var i = 0; i < r.keys.length; i++) {
                    key = r.keys[i];
                    oldDoc[key] = newDoc[key];
                }
                return equals(newDoc, oldDoc);
            };
    
            test.not = function(newDoc, oldDoc) {
                var key;
                for (key in r.fixedValues) {
                    if (!r.fixedValues.hasOwnProperty(key)) continue;
                    if (!equals(newDoc[key], r.fixedValues[key])) return false;
                }
                for (var i=0; i < r.keys.length; i++) {
                    key = r.keys[i];
                    if (!equals(newDoc[key], oldDoc[key])) return false;
                } 
        
                return true;
            };
    
            return test[r.type];
        }

        function compileUserCtx(userCtx, dbRoles) {
            cachedUserCtx =userCtx;
            cachedRoles = dbRoles;
    
            userCtx = userCtx || {};
            dbRoles = dbRoles || [];
            var user = userCtx.name;
            var allowedRules = getAllowedRules(userCtx.roles, userCtx.db, dbRoles);
    
            allowedRules = allowedRules.map(function(r) {
                var parsed = parse(r, user);
                parsed.test = getUserTest(parsed);
                return parsed;
            });
    
            validateUser = function(newDoc, oldDoc) {
        
                if (!oldDoc) oldDoc = {};
                for (var i = 0; i < allowedRules.length; i++) {
                    if (allowedRules[i].test(newDoc, oldDoc)) return true;
                }
                return false;
            };
            return validateUser;
        }

        function init(dbSecObjMembers, userCtx) {
            var dbRules = dbSecObjMembers.names, dbRoles = dbSecObjMembers.roles;
            var rulesAreSame = equals(dbRules, cachedRules),
            userCtxIsSame = equals(userCtx, cachedUserCtx),
            dbRolesAreSame = equals(dbRoles, cachedRoles);
    
            return {
                cached: (rulesAreSame ? 'dbRules,' : '') +
                    (userCtxIsSame ? 'userCtx,' : '') +
                    (dbRolesAreSame ? 'dbRoles' : ''),
                validateDoc: rulesAreSame  ? validateDoc : compileRules(dbRules),
                validateUser: userCtxIsSame && dbRolesAreSame ?
                    validateUser : compileUserCtx(userCtx, dbRoles)
            };
        }

        exports['init'] = init;

    };
    
    validator = validator.toString();
    
    window.quilt = {
        filter : filter.toString()
        ,vdu : vdu.toString()
        ,validator : validator.slice(14, validator.length-2)
    };
        
})();
