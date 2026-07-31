(function () {

    function removeSkeleton() {
        const content = document.getElementById("go7Content");

        if (content) {
            content.classList.remove("go7-content-loading");
        }
    }

    // Skeleton maximum 4.5 seconds
    setTimeout(removeSkeleton, 4500);

})();
