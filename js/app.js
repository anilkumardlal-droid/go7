 /* Theme Name: Domania
   Author: Themesdesign
   Version: 1.1.0
   File Description: Main JS file of the template
*/
 

// GO7 Page Loader
$(window).on('load', function () {

    $('.go7-loader').fadeOut(250);

    $('.go7-preloader')
        .delay(200)
        .fadeOut(600);

    $('body').css('overflow', 'visible');

});

// backpage
$.fn.backButton = function() {
    if (document.referrer !== "") {
      $(this).show();
      $(this).on('click', function(e) {
        e.preventDefault();
        window.location.href = document.referrer;
      });
    }
  }
  
  $('.back-button').backButton();
