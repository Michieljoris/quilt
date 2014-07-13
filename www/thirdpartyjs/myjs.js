// jQuery(document).ready(function(){
    // jQuery('#bla').click(function(){
    //     console.log('clicked scroll to top');
    //     jQuery("html, body").animate({
    //         scrollTop: 130
    //     }, 700);
    //     return false;
    // });

//     $(".scroll").click(function(event){
        
//         console.log('click on scroll');
//         //prevent the default action for the click event
//         event.preventDefault();
        
//         //get the full url - like mysitecom/index.htm#home
//         var full_url = this.href;
        
//         //split the url by # and get the anchor target name - home in mysitecom/index.htm#home
//         var parts = full_url.split("#");
//         // console.log(parts);
//         var trgt = parts[parts.length-1];
        
//         if (trgt[0] === '!') return;
//         //get the top offset of the target anchor
//         var target_offset = $("#"+trgt).offset();
//         if (target_offset) {
//             var target_top = target_offset.top-50;
//             console.log(target_offset);
//         //     //goto that anchor by setting the body scroll top to anchor top
//             $('html, body').animate({scrollTop:target_top }, 1000, 'easeOutQuad');
//         }
//     });
    
// });


// $('body').scrollspy({target: '#docmenu', offset:60});
// var $window = $(window);
// setTimeout(function () {
//       $('.bs-docs-sidenav').affix({
//         offset: {
//           top: function () { return $window.width() <= 980 ? 210 : 130 }
//         // , bottom: 270
//         , bottom:0 
//         }
//       })
//     }, 200)

//     jQuery('#bla').click(function(){
//         console.log('clicked scroll to top');
//         jQuery("html, body").animate({
//             scrollTop: 130
//         }, 700);
//         return false;
//     });

// jQuery(window).scroll(function(){
//     if (jQuery(this).scrollTop() > 100) {
//         jQuery('#scroll-to-top').fadeIn();
//     } else {
//         jQuery('#scroll-to-top').fadeOut();
//     }
// }); 

