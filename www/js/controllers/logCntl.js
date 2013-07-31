/*global angular:false couchapi:false */
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 


angular.module("myApp").controller("logCntl", function ($scope, state, defaults, persist) {
    
    console.log('In logCntl');
    var mult = 1;
    
    
    $scope.refresh = function() {
        $scope.tabSelected('Log');
    };
    
    $scope.more = function() {
        mult *= 2;
        state.bytes = mult * defaults.logBytes;
        console.log(state.bytes);
        $scope.tabSelected('Log');
    };
    
    $scope.less = function() {
        mult /=2;
        if (mult<1) mult = 1;
        state.bytes = mult * defaults.logBytes;
        console.log(state.bytes);
        $scope.tabSelected('Log');
        
    };
    
}); 
                                   