/*global initPersona:false filepicker:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


window.mainCntl = function ($location, $scope, $http) {
    console.log('in main');
    $scope.connected = false;
    
    $scope.isManagerView = function() {
        return $location.$$url !== '/manager';
    };
    var pageTitleMap = {
        "/manager" : 'Manage',
        "/help" : "Help"
    };
    
    $scope.getPage = function() {
        // console.log($location);
        return pageTitleMap[$location.$$path];
    };

   
    
};