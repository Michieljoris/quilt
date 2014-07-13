/*global myAppModule:false couchapi:false angular:false $:false jQuery:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

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


myAppModule.controller('TreeController', function ($scope, $timeout) {
    
    
    $scope.obj =  [{ okthen:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } }];
    
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
    
    $scope.setData = function(obj) {
        $scope.data = {
            type: 'array', children: parseObject($scope.obj)
        };
    };
    
    $scope.setData($scope.obj);
    
    $scope.bla = function() {
        $scope.obj =  [{ reset:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } }];
    }
    
    // var obj = $scope.obj = { a:1, b:[1,2,['a', 'b']], c:"a string"  ,d: { a:1 } };
    

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
        $scope.sync();
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
        $scope.sync();
        console.log($scope.obj);
    };
    
    // $scope.mytest = function() {
    //     console.log('mystes');
    // }
    $scope.$watch('obj', function(newVal, oldVal) {
        if (!$scope.data.isInSync) {
            $scope.data = {
                type: 'array', children: parseObject($scope.obj)
            };
        } else {
            $scope.data.isInSync = false;
            return;   
        }
    });
    
    $scope.sync = function sync() {
        // console.log('sync');
        $scope.obj = makeArray($scope.data.children);
        $scope.data.isInSync= true;
        // console.log('sync', $scope.obj);
    }

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
    
    $scope.lineStyle = function(child) {
        if (!child.children || child.children.length === 0)
            return  {"margin-left":"7px", "padding-left": "10px", "border-left":"0px solid black" };
    };

});



///////////////////////////////////////////////////////////////////////////////////////////////////////////


