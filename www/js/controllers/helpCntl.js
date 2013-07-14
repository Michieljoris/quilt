/*global scrollSpy:false angular:false $:false jQuery:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

function helpCntl($scope) {
    console.log('In HelpCntl');
    // console.log('Targets', $('body').find("#menu-- .nav li > a"));
    // initScrollToTop();
    
    //any href with class scroll with smoothly scroll to the #target
    // scrollOnClick(); 
    
    //Fix menu, but let it scroll to the top
    var $window = $(window);
    $('.sidemenu').affix({
        offset: {
            top: function () { return $window.width() <= 980 ? 210 : 60; }
            // , bottom: 270
            , bottom:0 
        }
    });
    
    scrollSpy('#helpmenu');
}
