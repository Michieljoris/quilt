/*global myAppModule:false couchapi:false angular:false $:false jQuery:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

myAppModule.controller('TreeController', function ($scope, $timeout) {
    
    function parseObject(obj) {
        var values = [];
        Object.keys(obj).forEach(function(k) {
            var prop = { key: k };
            if (angular.isArray(obj[k])) {
                prop.type = 'array';   
                prop.children = parseArray(obj[k]);
            }
            else if (angular.isObject(obj[k])) {
                prop.type = 'object';   
                prop.children = parseObject(obj[k]);
            }
            else prop.value = obj[k];
            values.push(prop);
        });
        return values;
    }
    
    function parseArray(array) {
        var values = [];
        var i = 0;
        array.forEach(function(e) {
            var prop = { ord: i };
            if (angular.isArray(e)) {
                prop.type = 'array';   
                prop.children = parseArray(e);
            }
            else if (angular.isObject(e)) {
                prop.type = 'object';   
                prop.children = parseObject(e);
            }
            else prop.value = e;
            values.push(prop);
            i++;
        });
        return values;
    }
    
    function makeObject(props) {
        var obj = {};
        props.forEach(function(p) {
            if (p.type === 'object') obj[p.key] = makeObject(p.children);
            else if (p.type === 'array') obj[p.key] = makeArray(p.children);
            else obj[p.key] =  p.value;
        });
        return obj;
    }
    
    function makeArray(props) {
        var array = [];
        props.forEach(function(p) {
            if (p.type === 'object') array.push(makeObject(p.children));
            else if (p.type === 'array') array.push(makeArray(p.children));
            else array.push(p.value);
        });
        return array;   
    }
    
    // var obj = $scope.obj = { a:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } };
    var obj = $scope.obj =  [{ a:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } }];
    

    // $scope.data = {
    //     type:'array', 
    //     children: [{
    //         key: 'myobj',
    //         type:'object',
    //         value: obj,
    //         children: [
    //             { key: 'abc', value: obj.a }
    //             ,{ key: 'b', type: 'array', value:obj.b, children: [
    //                 {  ord: 0, value: obj.b[0] }
    //                 ,{  ord: 1, value: obj.b[1] }
    //                 ,{  ord: 2, type: 'array', value: obj.b[2], children: [
    //                 {ord:0, value: obj.b[2][0]} , {ord:1, value: obj.b[2][1]}]}
    //             ]}
    //             ,{ key: 'c', value: obj.c }
    //             ,{ key: 'd', type:'object', value: obj.d, children: [
    //                 { key: 'a', value: obj.d.a }
    //             ] }
    //         ]
    //     }]
    // };
    
    $scope.data = {
        type: 'array', children: parseObject(obj)
    };
    
    
    // $('#abc').editable({
    //     unsavedclass: null,
    //     type: 'text',
    //     // value: state.remoteUrl,
    //     value: "cba",
    //     success: function(response, newValue) {
    //         // config.set({ couchDbUrl: newValue });
    //         // $scope.$apply();
    //     }
    // });
    
    $scope.isNumber = function(thing) {
        // console.log(thing, typeof thing);
        return typeof thing === 'number';
    };

    $scope.toggleMinimized = function (child) {
        child.minimized = !child.minimized;
    };
    
    $scope.addObject = function (parent){
        addChild(parent, 'object');
    };

    $scope.addArray = function (parent){
        addChild(parent, 'array');
    };
    
    $scope.addValue = function (parent){
        addChild(parent);
    };

    function addChild(parent, type) {
        var child;
        if (type) child = { type: type, children: []};
        else child = {
            value: 'some value'
        };
        
        function isUniqueKey(key) {
            for( var i=0; i < parent.children.length; i++){
                if (parent.children[i].key === key) return false;
            }
            return true;
        }
        
        if (parent.type === 'object') {
            child.key = child.key || 'newKey';
            var u = 0;
            var key = child.key;
                while (!isUniqueKey(key)) { key = child.key + (++u); }
            child.key = key;
            delete child.ord;
        }

        console.log(parent);
        // parent.children = parent.children || [];
        parent.children.push(child);
        
        if (parent.type === 'array') {
            var i = 0;
            angular.forEach(parent.children, function(c) {
                c.ord = i++;
            });
        }
    }

    $scope.remove = function (child) {
        function walk(target) {
            var children = target.children,
            i;
            if (children) {
                i = children.length;
                while (i--) {
                    if (children[i] === child) {
                        return children.splice(i, 1);
                    } else {
                        walk(children[i]);
                    }
                }
            }
        }
        walk($scope.data);
    };
    
    
    $scope.update = function (event, ui) {
        var root = event.target,
        item = ui.item,
        parent = item.parent(),
        target = (parent[0] === root) ? $scope.data : parent.scope().child,
        child = item.scope().child,
        index = item.index();
        console.log('update',child, target, index);

        if (!target.children) target.children = [];

        function walk(target, child) {
            var children = target.children,
            i;
            if (children) {
                i = children.length;
                while (i--) {
                    if (children[i] === child) {
                        return children.splice(i, 1);
                    } else {
                        walk(children[i], child);
                    }
                }
            }
        }
        //remove from its old container:
        walk($scope.data, child);
        
        //make sure keys are unique in arrays and objects:
        
        function isUniqueKey(key) {
            for( var i=0; i < target.children.length; i++){
                if (target.children[i].key === key) return false;
            }
            return true;
        }
        
        if (target.type === 'object') {
            child.key = child.key || 'newKey';
            var u = 0;
            var key = child.key;
                while (!isUniqueKey(key)) { key = child.key + ++u; }
            child.key = key;
            delete child.ord;
        }

        target.children.splice(index, 0, child);
        if (target.type === 'array') {
            var i = 0;
            angular.forEach(target.children, function(c) {
                c.ord = i++;
            });
        }
        
        // $scope.obj = makeArray($scope.data.children);
        console.log(obj);
    };

    $scope.getObj = function() {
        return makeObject($scope.data.children);
    };
    
    $scope.test = function(event, ui) {
        console.log('test', event, ui);
    }      ;
    
    $scope.click = function(child) {
        $scope.partObj = child.value;
        console.log('click', child.value);
    }; 
    
    $scope.inputStyle = function(val) {
        var str = val + '';
        str = str || '';
        return  {"width": (str.length +1) * 7 + "px" };
    };

});



///////////////////////////////////////////////////////////////////////////////////////////////////////////
myAppModule.directive('yaTree', function () {

    return {
        restrict: 'A',
        transclude: 'element',
        priority: 1000,
        terminal: true,
        compile: function (tElement, tAttrs, transclude) {

            var repeatExpr, childExpr, rootExpr, childrenExpr, branchExpr;

            repeatExpr = tAttrs.yaTree.match(/^(.*) in ((?:.*\.)?(.*)) at (.*)$/);
            childExpr = repeatExpr[1];
            rootExpr = repeatExpr[2];
            childrenExpr = repeatExpr[3];
            branchExpr = repeatExpr[4];

            return function link(scope, element, attrs) {

                var rootElement = element[0].parentNode,
                    cache = [];

                // Reverse lookup object to avoid re-rendering elements
                function lookup(child) {
                    var i = cache.length;
                    while (i--) {
                        if (cache[i].scope[childExpr] === child) {
                            return cache.splice(i, 1)[0];
                        }
                    }
                }

                scope.$watch(rootExpr, function (root) {
                    // console.log('watch');

                    var currentCache = [];

                    // Recurse the data structure
                    (function walk(children, parentNode, parentScope, depth) {

                        var i = 0,
                            n = children.length,
                            last = n - 1,
                            cursor,
                            child,
                            cached,
                            childScope,
                            grandchildren;

                        // Iterate the children at the current level
                        for (; i < n; ++i) {

                            // We will compare the cached element to the element in 
                            // at the destination index. If it does not match, then 
                            // the cached element is being moved into this position.
                            cursor = parentNode.childNodes[i];

                            child = children[i];

                            // See if this child has been previously rendered
                            // using a reverse lookup by object reference
                            cached = lookup(child);

                            // If the parentScope no longer matches, we've moved.
                            // We'll have to transclude again so that scopes 
                            // and controllers are properly inherited
                            if (cached && cached.parentScope !== parentScope) {
                                cache.push(cached);
                                cached = null;
                            }

                            // If it has not, render a new element and prepare its scope
                            // We also cache a reference to its branch node which will
                            // be used as the parentNode in the next level of recursion
                            if (!cached) {
                                transclude(parentScope.$new(), function (clone, childScope) {

                                    childScope[childExpr] = child;

                                    cached = {
                                        scope: childScope,
                                        parentScope: parentScope,
                                        element: clone[0],
                                        branch: clone.find(branchExpr)[0]
                                    };

                                    // This had to happen during transclusion so inherited 
                                    // controllers, among other things, work properly
                                    if (!cursor) parentNode.appendChild(cached.element);
                                    else parentNode.insertBefore(cached.element, cursor);


                                });
                            } else if (cached.element !== cursor) {
                                if (!cursor) parentNode.appendChild(cached.element);
                                else parentNode.insertBefore(cached.element, cursor);

                            }

                            // Lets's set some scope values
                            childScope = cached.scope;

                            // Store the current depth on the scope in case you want 
                            // to use it (for good or evil, no judgment).
                            childScope.$depth = depth;

                            // Emulate some ng-repeat values
                            childScope.$index = i;
                            childScope.$first = (i === 0);
                            childScope.$last = (i === last);
                            childScope.$middle = !(childScope.$first || childScope.$last);

                            // Push the object onto the new cache which will replace
                            // the old cache at the end of the walk.
                            currentCache.push(cached);

                            // If the child has children of its own, recurse 'em.             
                            grandchildren = child[childrenExpr];
                            if (grandchildren && grandchildren.length) {
                                walk(grandchildren, cached.branch, childScope, depth + 1);
                            }
                        }
                    })(root, rootElement, scope, 0);

                    // Cleanup objects which have been removed.
                    // Remove DOM elements and destroy scopes to prevent memory leaks.
                    var i = cache.length;

                    while (i--) {
                        var cached = cache[i];
                        if (cached.scope) {
                            cached.scope.$destroy();
                        }
                        if (cached.element) {
                            cached.element.parentNode.removeChild(cached.element);
                        }
                    }

                    // Replace previous cache.
                    cache = currentCache;

                }, true);
            };
        }
    };
});



myAppModule.value('uiNestedSortableOptions',  {
    listType: 'ol',
    items: 'li',
    doNotClear: true,
    placeholder: 'ui-state-highlight',
    forcePlaceholderSize: true,
    toleranceElement: '> div',
    isAllowed: function(item, parent) {
        if (!parent) return false;
        var attrs = parent.context.attributes;
        if (attrs) {
            var objtype = attrs.getNamedItem('objtype');
            if (objtype && (objtype.value === 'object' || objtype.value === 'array')) return true;
        }
        return false;
    }
});

myAppModule.directive('uiNestedSortable', ['$parse', 'uiNestedSortableOptions',  function ($parse, options2) {

    'use strict';

    options2 = options2 || {};
    var eventTypes = 'Create Start Sort Change BeforeStop Stop Update Receive Remove Over Out Activate Deactivate'.split(' ');

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var options = attrs.uiNestedSortable ? $parse(attrs.uiNestedSortable)() : {};
            options = angular.extend(options, options2);

            angular.forEach(eventTypes, function (eventType) {

                var attr = attrs['uiNestedSortable' + eventType],
                    callback;

                if (attr) {
                    callback = $parse(attr);
                    options[eventType.charAt(0).toLowerCase() + eventType.substr(1)] = function (event, ui) {
                        scope.$apply(function () {

                            callback(scope, {
                                $event: event,
                                $ui: ui
                            });
                        });
                    };
                }

            });
            
            options.isAllowed = 
            element.nestedSortable(options);

        }
    };
}]);

myAppModule.directive("editInline", function(){
    return function(scope, element, attr){
        var inputW = (element.val().length+1) * 8;
        console.log(element.val(), inputW);
        element.css('width', inputW + 'px');
        element.bind("keyup keydown", function(){
            var inputW = (element.val().length+1) * 8;
            element.css('width', inputW + 'px');
        });
        
    };
});

myAppModule.directive('xeditable', function($timeout) {
    return {
        restrict: 'A',
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            var loadXeditable = function() {
                angular.element(element).editable({
                    display: function(value, srcData) {
                        ngModel.$setViewValue(value);
                        scope.$apply();
                    }
                });
            }
            $timeout(function() {
                loadXeditable();
            }, 10);
        }
    };
});
