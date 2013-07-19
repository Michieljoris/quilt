/*global myAppModule:false couchapi:false angular:false $:false jQuery:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

myAppModule.controller('TreeController', function ($scope, $timeout) {
    
   $scope.obj = { a:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } };
    
    var obj = $scope.obj;
    $scope.getObj = function() {
        var objects= [];
        var data = $scope.data;
        // data.children.forEach(function())
        
        return $scope.obj;
    };
    
    $scope.setObj = function(obj) {
        
    };

    $scope.data = {
        type:'array', 
        children: [{
            key: 'myobj',
            type:'object',
            value: obj,
            children: [
                { key: 'a', value: obj.a }
                ,{ key: 'b', type: 'array', value:obj.b, children: [
                    {  key: 0, value: obj.b[0] }
                    ,{  key: 1, value: obj.b[1] }
                    ,{  key: 2, type: 'array', value: obj.b[2], children: [
                    {key:0, value: obj.b[2][0]} , {key:1, value: obj.b[2][1]}]}
                ]}
                ,{ key: 'c', value: obj.c }
                ,{ key: 'd', type:'object', value: obj.d, children: [
                    { key: 'a', value: obj.d.a }
                ] }
            ]
        }]
    };
    
    $scope.isNumber = function(thing) {
        console.log(thing, typeof thing);
        return typeof thing === 'number';
    };

    $scope.toggleMinimized = function (child) {
        child.minimized = !child.minimized;
    };

    $scope.addChild = function (child) {
        var type;
        if (child.type === 'object')  {
             type = prompt(child.type + ': add array, object or literal?');
        }
        if (child.type === 'array')  {
             type = prompt(child.type + ': add array, object or value?');
        }
        var thing;
        if (type === 'array') {
            thing = {
                type: 'array',
                children: []
                ,key:child.type=== 'array' ? 1: 'newKey'
                };
        } 
        else if (type === 'object') {
            thing = {
                type: 'object',
                children: []
                ,key:child.type === 'array' ? 1: 'newKey'
                };
        } 
        else thing = {
            key:child.type === 'array' ? 1: 'newKey'
            ,value: 'newValue'
            ,children: []
        };
        console.log(child);
        child.children = child.children || [];
        child.children.push(thing);
    };

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
        console.log('update');
        var root = event.target,
            item = ui.item,
            parent = item.parent(),
            target = (parent[0] === root) ? $scope.data : parent.scope().child,
            child = item.scope().child,
            index = item.index();

        target.children || (target.children = []);

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
        walk($scope.data, child);

        target.children.splice(index, 0, child);
    };
    
    $scope.test = function(event, ui) {
        console.log('test', event, ui);
    }      ;
    
    $scope.click = function(child) {
        $scope.partObj = child.value;
        console.log('click', child.value);
       }; 

});
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
                    console.log('watch');

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




myAppModule.directive('uiNestedSortable', ['$parse', function ($parse) {

    'use strict';

    var eventTypes = 'Create Start Sort Change BeforeStop Stop Update Receive Remove Over Out Activate Deactivate'.split(' ');

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
console.log('aaaaaaaaaaaaaaaaaaaa',element, attrs);
            var options = attrs.uiNestedSortable ? $parse(attrs.uiNestedSortable)() : {};

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

            element.nestedSortable(options);

        }
    };
}]);