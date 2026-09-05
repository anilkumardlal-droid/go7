(function () {
    const button = document.getElementById("backToTop");

    if (!button) return;

    function toggleBackToTop() {
        if (window.scrollY > 400) {
            button.classList.add("show");
        } else {
            button.classList.remove("show");
        }
    }

    window.addEventListener("scroll", toggleBackToTop, {
        passive: true
    });

    toggleBackToTop();

    button.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
})();
