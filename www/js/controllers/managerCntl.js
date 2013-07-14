/*global scrollSpy:false $:false couchapi:false PBKDF2:false emit:false*/
/*jshint strict:true unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:4 maxcomplexity:7 maxlen:130 devel:true newcap:false*/

$.couch.urlPrefix = "http://localhost:5984";
function managerCntl($scope, $timeout) {
    "use strict" ;
    console.log('In managerCntl');

    var $window = $(window);
    $('.sidemenu').affix({
        offset: {
            top: function () { return $window.width() <= 980 ? 210 : 60; }
            // , bottom: 270
            , bottom:0 
        }
    });
    
    scrollSpy('#manmenu');
    
    //-----------------------------------------------------
    
    $scope.couchDBurl = 'http://localhost:5984';
    
    $('#couchDBurl').editable({
        type: 'text',
        title: 'Enter username',
        // value: $scope.couchDBurl,
        value: $scope.couchDBurl,
        success: function(response, newValue) {
            $scope.couchDburl = newValue;
            $scope.$apply();
        }
    });

}
