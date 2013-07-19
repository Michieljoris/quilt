/*global ace:false angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("scriptsCntl", function ($scope, $location, state, defaults) {
    
    console.log('In scriptsCntl');
    
    
    // $scope.acetext = "hello!!!";
    
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/javascript");
    window.editor = editor;
    // var $ = document.getElementById.bind(document);
    // var dom = ace.require("ace/lib/dom");
    var vim = ace.require("ace/keyboard/vim");
    console.log(vim);
    editor.setKeyboardHandler(vim.handler);
    
    

    //add command to all new editor instaces
    // ace.require("ace/commands/default_commands").commands.push({
    //     name: "Toggle Fullscreen",
    //     bindKey: "F11",
    //     exec: function(editor) {
    //         console.log('F11????');
    //         dom.toggleCssClass(document.body, "fullScreen");
    //         dom.toggleCssClass(editor.container, "fullScreen");
    //         editor.resize();
    //     }
    // });
    
    editor.commands.addCommand({
        name: 'full screen',
        bindKey: {win: 'F11',  mac: 'Command-M'},
        exec: function(editor) {
            dom.toggleCssClass(document.body, "fullScreen");
            dom.toggleCssClass(editor.container, "fullScreen");
            editor.resize();
        }
        // exec: function(editor) {
        //     console.log('hello');
        //     //...
        // }
        // ,
        // readOnly: true // false if this command should not apply in readOnly mode
    });
    
    
    $scope.setDesign = function()    {
            var fun = function(doc) {
                if (doc._conflicts) {
                    emit(null, [doc._rev].concat(doc._conflicts));
                }
                };
        var conflicts =
            {"map" : editor.getValue() };
    
        // $scope.addView = function() {
            console.log(conflicts);
            console.log(JSON.stringify(conflicts));
            // console.log($scope.viewFun);
            // var obj = JSON.parse($scope.viewFun);
            // console.log(obj)
            couchapi.dbDesignDoc('group', 'fun', conflicts, 'aaa').
                when(
                    function(data) {
                        console.log(data);
                    }
                    ,function(data) {
                        console.log(data);
                    }
                );
        // };
    };
    // $scope.full=function() {
        
    //     dom.toggleCssClass(document.body, "fullScreen");
    //     dom.toggleCssClass(editor.container, "fullScreen");
    //     editor.resize();
    //     editor.setTheme("ace/theme/twilight");
       
    // };
    
    $scope.getContent = function() {
        
    };
    // Editor part
    // var _editor = window.ace.edit("acediv");
    // var _session = _editor.session;
    // var _renderer = _editor.renderer;

    // // Options
    // _editor.setReadOnly(false);
    // // _session.setUndoManager(new UndoManager());
    // // _renderer.setHighlightActiveLine(false);
    // _editor.session.setMode('ace/mode/javascript');
    // editor.setTheme("ace/theme/monokai");
    // // Events
    // _editor.on("changeSession", function(){ console.log('changeSession');  });
    // _session.on("change", function(){ console.log($scope.acetext); });
    
    
        
    
    
    // var config;
    
    // $scope.getUserNames = function() {
        
    //     // var admins =  state.configAccessible ? state.configAccessible.admins : {};
    //     // admins = admins || {};
    //     // admins = Object.keys(admins);
    //     // return admins;
    //     return ['pete'];
    // };
    
    
    // $scope.addUser = function() {
        
    //     couchapi.config('admins', $scope.userName, $scope.password).when(
    //         function(data) {
    //             console.log(data);
    //             $scope.newAdminShouldBeOpen = false;
    //             state.initialize($scope);
    //         },
    //         function(data) {
    //             console.log("error",data);
    //             alert('The admin user already exists probably. Anyway the admin user has not been added.', data);
    //         }
    //     );
        
    // };
    
    // $scope.addUserDialog = function() {
    //     $scope.newAdminShouldBeOpen = true;
    // };
    
    // $scope.closeUser = function() {
    //     $scope.newAdminShouldBeOpen = false;
    // };
    
    
    // $scope.removeUser = function(name) {
    //     if (confirm('Are you sure?\n\nIf you remove an admin user you\'re logged in as you will be logged out. If you don\'t know the password to one of the remaining admins you will have to manually edit the CouchDB config file on your computer to regain access. \n\nIf you\'re removing the last admin there\'s no problem, but your CouchDB will be unsecured then of course. '))
    //         couchapi.config('admins', name, null).when(
    //             function(data) {
    //                 state.initialize($scope);
    //                 console.log(data);
    //             },
    //             function(data) {
    //                 console.log("error",data);
    //             }
    //         );
        
    // };
}); 
                                   