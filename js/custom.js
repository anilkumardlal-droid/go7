document.addEventListener("DOMContentLoaded", function () {

    const content = document.getElementById("go7Content");

    if (!content) return;

    setTimeout(function () {

        content.classList.remove("go7-content-loading");

    }, 4500);

});
