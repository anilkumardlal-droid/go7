
(function () {

    const content = document.getElementById("go7Content");

    if (!content) return;

    const startTime = Date.now();
    const minimumTime = 3000;

    function showContent() {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minimumTime - elapsed);

        setTimeout(function () {
            content.classList.remove("go7-content-loading");
        }, remaining);
    }

    if (document.readyState === "complete") {
        showContent();
    } else {
        window.addEventListener("load", showContent, { once: true });
    }

})();


// DOMAIN DISPLAY
(function () {

    const source = new URLSearchParams(window.location.search).get("source");

    let domain = "go7.in";

    if (source) {
        const cleaned = source
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split(/[/?#]/)[0];

        if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(cleaned)) {
            domain = cleaned;
        }
    }

    // GO7 shows without www; other domains show with www
    const displayDomain = "www." + domain;
    
    const domainName = document.getElementById("domain-name");
    const interestTitle = document.getElementById("interest-title");
    const inquiryDescription = document.getElementById("inquiry-description");

    if (domainName) {
        domainName.textContent = displayDomain;
    }

    if (interestTitle) {
        interestTitle.textContent = "Interested in " + domain + "?";
    }

    if (inquiryDescription) {
        inquiryDescription.textContent =
            "Interested in " + domain + "? Submit your inquiry or offer.";
    }

})();


// MOBILE AUTO SCROLL
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
