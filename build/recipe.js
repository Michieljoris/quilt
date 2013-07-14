/*global process:false*/

var mainMenuTree = [
    // { label: 'Home', icon: '', route: 'home'
    //    // sub: [
    //    //     { label: 'Contact us', route: 'contactus', scroll: true}
    //    //     ]
    // }
];


var exports = {
    verbose: true
    ,monitor: true
    
    ,prettyPrintHtml: false
    // ,tagIdPostfix: '__' //can be overridden per template
    ,paths: {
        root: process.cwd()
        //relative to this root:
        ,partials: 'build/'  //can be overridden per template
        ,out:'www/built' 
        ,js: 'www/js'
    }
    ,routes : [
        ['manager', '/built/managerView.html', 'managerCntl'],
        ['help', '/built/helpView.html', 'helpCntl']
        ,['test', '/built/testView.html', 'testCntl']
    ]
    
    //Every partial generates a string. How the partial is generated
    //depends on its type. Each type can define more than one partial
    //of that type by assigning an array of definitions instead of
    //just one (object) definition to that type. These partials are
    //identified by their id. This enables them to uses as the source in
    //later defined templates. They don't need an id if you just want
    //to generate a string to save to the file defined in 'out'.
    ,partials: {
        ids: {
            title: '<title>CouchDB manager</title>'
            ,skewer:'<script src="http://localhost:9090/skewer"></script>'
            // ,filepicker: '<script type="text/javascript" src="//api.filepicker.io/v1/filepicker.js"></script>'
            // ,filepicker: '<script type="text/javascript" src="js/filepicker.js"></script>'
        }
        ,metaBlock : {
            id: 'meta',
            tags: [ { charset:'utf-8' },
                    { name: "viewport"
                      ,content: "width=device-width, initial-scale=1, maximum-scale=1"
                    },
                    //stops IE using compatibility mode, important for Persona
                    { 'http-equiv':"X-UA-Compatible", 'content':"IE=Edge"
                    }
                  ]
        }
        ,linkBlock:  {
            id: 'myLinkBlock',
            files:  [
                'bootstrap'
                ,'bootstrap-responsive'
                ,'jquery-ui-1.10.2.custom'
                ,'angular-ui'
                ,'checkboxes'
                ,'bootstrap-editable.css'
                ,'main'
                // ,'../thirdpartyjs/bower_components/codemirror/lib/codemirror'
                ,'mycss'
            ]
            ,path: 'css/'
        }
        ,scriptBlock: [
            {
                id: 'headJsBlock',
                files: [
                ],
                path: 'js/'
            },
            {
                id: 'thirdpartyjs',
                files: [
                    'jquery-1.8.3.min.js'
                    ,'jquery-ui-1.10.2.custom.min'
                    ,'bootstrap'
                    ,'angular.min'
                    ,'angular-ui'
                    ,'ui-bootstrap-tpls-0.4.0.min'
                    ,'modernizr'
                    // ,'bower_components/codemirror/lib/codemirror'
                    // ,'bower_components/angular-ui-codemirror/ui-codemirror'
                    ,'bootstrap-editable/js/bootstrap-editable.min.js'
                    
                    ,'bower_components/ace-builds/src-min-noconflict/ace'
                    ,'bower_components/angular-ui-ace/ui-ace'
                    ,'jquery.couch'
                    ,'vow'
                    ,'couchapi'
                    ,"scrollspy"
                    ,"cookie"
                ],
                path: 'thirdpartyjs/'
            },
            {
                id: 'myJsBlock',
                files: [
                    'myjs'
                    ,'angularModule'
                    ,'router'
                    ,'services/myservices'
                    ,'controllers/managerCntl'
                    ,'controllers/mainCntl'
                    ,'controllers/helpCntl'
                    ,'controllers/testCntl'
                    // ,'directives/compile'
                    
                ],
                path: 'js/'
            }
        ]
        // ,slideShow: [{ type: 'flex',
        //                id: 'flex',
        //                slides: slides
        //              }
        // ]
        ,menu: [
            // { type: 'superfish',
            //       tree: mainMenuTree,
            //       id: 'superfish'
            //     },
        ]
        ,template: [
            { src: 'html/manager.html' 
              ,id: "manager"
              ,tagIdPostfix: '--' //can be overridden per template
              // ,out: 'helpView.html'
              ,mapping: {
                  setupConnection: 'markdown/setupConnection.md',
                  setupConnectionDisconnected: 'markdown/setupConnectionDisconnected.md',
                  setupConnectionHelp: 'markdown/setupConnectionHelp.md',
                  enableCors: 'markdown/enableCors.md'
              }
            },
            { src: 'views/help.html' 
              ,tagIdPostfix: '--' //can be overridden per template
              ,out: 'helpView.html'
              ,mapping: {
                  menu: 'html/helpmenu',
                  doc: 'markdown/help.md'
              }
            }
            ,{ src: 'views/manager.html' 
              ,tagIdPostfix: '--' //can be overridden per template
              ,out: 'managerView.html'
              ,mapping: {
                   manmenu: 'html/manmenu',
                   manager: 'manager'
              }
            }
            ,{ src: 'views/test.html' 
              ,tagIdPostfix: '--' //can be overridden per template
              ,out: 'testView.html'
              ,mapping: {
              }
            }
            //Main layout
            ,{// id: 'page' 
                pathOut: 'www/'
                ,out: 'index.html' //optional, relative to root
                ,src: 'html/basicPage.html'
                //Maps tag ids to partial ids. Tag ids have to be
                //postfixed with two dashes in the template. Partials
                //with an extension will be loaded from the partials
                //folder for this template. Markdown files will be
                //converted to html. Partials in an array will be
                //concatenated before inserted at the tag id element
                ,mapping: {
                    head: ['title', 'meta', 'html/ieshim',  'skewer'
                           ,'headJsBlock', 'myLinkBlock'
                           // ,'_linkBlock'
                          ],
                    wrapper: [
                        'html/body'
                        ,'thirdpartyjs'
                        ,'myJsBlock'
                        // ,'_scriptBlock'
                    ]
                }
            }
            
        ] 
        
    }
};

