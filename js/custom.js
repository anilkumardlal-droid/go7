document.addEventListener("DOMContentLoaded", function () {

    const preloader = document.getElementById("go7Preloader");

    if (!preloader) return;

    window.addEventListener("load", function () {

        preloader.classList.add("loaded");

        setTimeout(function () {
            preloader.remove();
        }, 400);

    });

});
