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

(function () {

    const privacyLink = document.getElementById("privacy-policy-link");
    const privacyOverlay = document.getElementById("privacy-overlay");
    const privacyClose = document.getElementById("privacy-overlay-close");
    const privacyBackdrop = document.getElementById("privacy-overlay-backdrop");
    const privacyBody = document.getElementById("privacy-overlay-body");

    if (!privacyLink || !privacyOverlay || !privacyClose || !privacyBackdrop || !privacyBody) {
        return;
    }

    function openPrivacy() {

        privacyOverlay.classList.add("is-open");
        privacyOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("privacy-overlay-open");

        if (privacyBody.dataset.loaded === "true") {
            return;
        }

        fetch("/privacy", {
            credentials: "same-origin"
        })
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Privacy Policy could not be loaded.");
            }

            return response.text();
        })
        .then(function (html) {

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const privacyContent = doc.querySelector(".privacy-card");

            if (!privacyContent) {
                throw new Error("Privacy content not found.");
            }

            privacyBody.innerHTML = "";

            const content = document.createElement("div");
            content.className = "privacy-overlay-content";
            content.innerHTML = privacyContent.innerHTML;

            content.querySelectorAll(
                ".privacy-back, #back-to-top, .footer"
            ).forEach(function (element) {
                element.remove();
            });

            privacyBody.appendChild(content);
            privacyBody.dataset.loaded = "true";
        })
        .catch(function () {

            privacyBody.innerHTML =
                '<div class="privacy-overlay-content">' +
                '<p class="text-muted">' +
                'Unable to load the Privacy Policy. ' +
                '<a href="/privacy">Open Privacy Policy</a>.' +
                '</p>' +
                '</div>';
        });
    }

    function closePrivacy() {

        privacyOverlay.classList.remove("is-open");
        privacyOverlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("privacy-overlay-open");
    }

    privacyLink.addEventListener("click", function (event) {

        event.preventDefault();
        openPrivacy();

    });

    privacyClose.addEventListener("click", closePrivacy);

    privacyBackdrop.addEventListener("click", closePrivacy);

    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            privacyOverlay.classList.contains("is-open")
        ) {
            closePrivacy();
        }

    });

})();
