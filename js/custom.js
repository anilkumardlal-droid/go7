/*!
 * Item: Kitzu
 * Description: Personal Portfolio Template
 * Author/Developer: Exill
 * Author/Developer URL: https://themeforest.net/user/exill
 * Version: v2.0.0
 * License: Themeforest Standard Licenses: https://themeforest.net/licenses
 */
!function(n){"use strict";n((function(){})),n(window).on("load",(function(){}))}(jQuery);

$(function () {

    $(".goto-about").on("click", function (e) {

        e.preventDefault();

        // Close current modal
        $('#transactions [data-modal-close]').click();

        // Open About
        setTimeout(function () {
            window.location.hash = "about";
            $('.navbar .nav-link[href="#about"]').click();
        }, 700);

    });

});
