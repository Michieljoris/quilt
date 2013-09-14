/*global EpicCntl:false HomeCntl:false DefaultCntl:false EpicEditor:false $:false angular:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/

var ngView = angular.module('ngView', [], function($routeProvider, $locationProvider) {
    
    // var baseDir = '/built/';
    var mapping =
        [
            ["manager", "/built/managerView.html", managerCntl]

            // ['home', '/built/view-home.html', HomeCntl],
            // ['aboutus', '/build/markdown/aboutus.md'],
            // ['pd', '/built/view-pd.html'],
            // ['resources', '/build/markdown/resources.md'],
            // ['courses', '/built/view-courses.html'],
            // ['quiz', '/build/markdown/quiz.md'],
            // ['blog', '/build/markdown/blog.md'],
            // ['epic', '/built/view-epic.html', EpicCntl]

        ];
    
    mapping.forEach(function(m) {
        $routeProvider.when(m[0], { 
            templateUrl: m[1], controller: m[2] ? m[2] : DefaultCntl });
    });
    
    $routeProvider.otherwise( { 
        templateUrl: 
           'built/managerView.html', controller: managerCntl });
    
    $locationProvider.html5Mode(false);
    // console.log($locationProvider.hashPrefix());
    $locationProvider.hashPrefix( '!');
    // console.log($locationProvider.hashPrefix());
});
 

