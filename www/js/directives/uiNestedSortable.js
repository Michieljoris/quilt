myAppModule.directive('uiNestedSortable', ['$parse', 'uiNestedSortableOptions',  function ($parse, options2) {

    'use strict';

    options2 = options2 || {};
    var eventTypes = 'Create Start Sort Change BeforeStop Stop Update Receive Remove Over Out Activate Deactivate'.split(' ');

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var options = attrs.uiNestedSortable ? $parse(attrs.uiNestedSortable)() : {};
            options = angular.extend(options, options2);

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

