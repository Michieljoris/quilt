function initScrollToTop() {
    
    jQuery('#bla').click(function(){
        console.log('clicked scroll to top');
        jQuery("html, body").animate({
            scrollTop: 110
        }, 700);
        return false;
    });

    jQuery(window).scroll(function(){
        if (jQuery(this).scrollTop() > 100) {
            jQuery('#scroll-to-top').fadeIn();
        } else {
            jQuery('#scroll-to-top').fadeOut();
        }
    }); 
    
    
}


function scrollSpy(menu)  {
    
    var lastId,
    topMenu = $(menu),
    // topMenuHeight = topMenu.outerHeight()+15,
    topMenuHeight = 200,
    // All list items
    menuItems = topMenu.find("a"),
    // Anchors corresponding to menu items
    scrollItems = menuItems.map(function(){
            var item = $($(this).attr("href"));
        if (item.length) { return item; }
        return undefined;
    });
    
    // Bind click handler to menu items
    // so we can get a fancy scroll animation
    menuItems.click(function(e){
        var href = $(this).attr("href"),
        offsetTop = href === "#" ? 0 : $(href).offset().top - 45; 
            $('html, body').stop().animate({ 
                    scrollTop: offsetTop
            }, 300);
        e.preventDefault();
    });
    // Bind to scroll
    $(window).scroll(function(){
        // Get container scroll position
        var fromTop = $(this).scrollTop()+topMenuHeight;
        
        // Get id of current scroll item
        var cur = scrollItems.map(function(){
            if ($(this).offset().top < fromTop)
                return this;
            else return undefined;
        });
        // Get the id of the current element
        cur = cur[cur.length-1];
        var id = cur && cur.length ? cur[0].id : "";
        
        // console.log(id);
        
        if (lastId !== id) {
            lastId = id;
            // Set/remove active class
            menuItems
                .parent().removeClass("active")
                .end().filter("[href=#"+id+"]").parent().addClass("active");
        }                   
    });
    
}

// function scrollOnClick() {
    
//     $(".scroll").click(function(event){
        
//         // console.log('click on scroll');
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
//             var target_top = target_offset.top-30;
//             // console.log(target_offset);
//             //     //goto that anchor by setting the body scroll top to anchor top
//             $('html, body').animate({scrollTop:target_top }, 1000, 'easeOutQuad');
//         }
//     });
// }


initScrollToTop();

$.fn.editable.defaults.mode = 'inline';
