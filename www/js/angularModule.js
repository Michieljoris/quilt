/*global couchapi:false angular:false $:false jQuery:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var myAppModule = angular.module('myApp', ['ngView', 'ui',
                                           'ui.bootstrap',
                                           'ui.bootstrap.tabs'
                                           ,'ui.select2'
                                           ,'ngGrid'
                                           // ,'ui.ace'
                                           // ,'ui.codemirror'
                                          ]);

angular.module('myApp').run(function(state) {
    console.log('in run', state);
});




// myAppModule.value('ui.config', {
//    // The ui-jq directive namespace
//    jq: {
//       // The Tooltip namespace
//       tooltip: {
//          // Tooltip options. This object will be used as the defaults
//          placement: 'left'
//       }
//    }
// });


function DefaultCntl($scope) {
    console.log('In DefaultCntl');

   } 

// angular.module('myModule', []).
//   value('a', 123).
//   factory('a', function() { return 123; }).
//   directive('directiveName', ...).
//   filter('filterName', ...);
 
