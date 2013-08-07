/*global myAppModule:false angular:false console:false */

myAppModule.directive('xeditable', function($timeout) {
    "use strict";
    return {
        restrict: 'A',
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            var loadXeditable = function() {
                // console.log('x attrs', attrs);
                angular.element(element).editable({
                    display: function(value, srcData) {
                        ngModel.$setViewValue(value);
                        if (attrs.update) scope[attrs.update](value);
                        scope.$apply();
                    }
                    ,mode:'inline'
                });
            };
            $timeout(function() {
                loadXeditable();
            }, 10);
        }
    };
});