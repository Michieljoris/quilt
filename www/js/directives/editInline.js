myAppModule.directive("editInline", function(){
    return function(scope, element, attr){
        var inputW = (element.val().length+1) * 8;
        console.log(element.val(), inputW);
        element.css('width', inputW + 'px');
        element.bind("keyup keydown", function(){
            var inputW = (element.val().length+1) * 8;
            element.css('width', inputW + 'px');
        });
        
    };
});
