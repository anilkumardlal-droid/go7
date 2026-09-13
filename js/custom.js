(function () {

    const content = document.getElementById("go7Content");

    if (!content) return;

    const startTime = Date.now();

    // Skeleton कम से कम 3 सेकंड दिखेगा
    const minimumTime = 3000;

    function showContent() {

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minimumTime - elapsed);

        setTimeout(function () {
            content.classList.remove("go7-content-loading");
        }, remaining);
    }

    // Actual page पूरी तरह load होने का इंतजार
    if (document.readyState === "complete") {
        showContent();
    } else {
        window.addEventListener("load", showContent, { once: true });
    }

})();

(function () {

    const source = new URLSearchParams(window.location.search).get("source");

    let domain = "GO7.IN";

    if (source) {
        const cleaned = source
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0];

        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
            domain = cleaned.toUpperCase();
        }
    }

    document.getElementById("domain-name").textContent =
        "www." + domain;

    document.getElementById("interest-title").textContent =
        "Interested in " + domain + "?";

    document.getElementById("inquiry-description").textContent =
        "Interested in " + domain + "? Submit your inquiry or offer.";

})();

(function () { 
 
    if (window.innerWidth <= 767) { 
 
        window.addEventListener("load", function () { 
 
            setTimeout(function () { 
 
                const contactForm = 
                    document.getElementById("contact-form"); 
 
                if (!contactForm) return; 
 
                contactForm.scrollIntoView({ 
                    behavior: "smooth", 
                    block: "start" 
                }); 
 
            }, 9000); 
 
        }, { once: true }); 
 
    } 
 
})();
