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

    const homepage = document.getElementById("go7Homepage");
    const salePage = document.getElementById("sourceSalePage");

    // No ?source= → GO7.IN homepage
    if (!source || source.trim().toLowerCase() === "go7.in") {

        if (homepage) {
            homepage.style.display = "";
        }

        if (salePage) {
            salePage.style.display = "none";
        }

        return;
    }

    const cleaned = source
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];

    // Only .IN domains are allowed
    if (!/^[a-z0-9-]+\.in$/i.test(cleaned)) {

        if (homepage) {
            homepage.style.display = "";
        }

        if (salePage) {
            salePage.style.display = "none";
        }

        return;
    }

    const domain = cleaned.toUpperCase();

    // Show sale page
    if (homepage) {
        homepage.style.display = "none";
    }

    if (salePage) {
        salePage.style.display = "";
    }

    const domainName =
        document.getElementById("domain-name");

    const interestTitle =
        document.getElementById("interest-title");

    const inquiryDescription =
        document.getElementById("inquiry-description");


    if (domainName) {
        domainName.textContent = domain;
    }

    if (interestTitle) {
        interestTitle.textContent =
            "Interested in " + domain + "?";
    }

    if (inquiryDescription) {
        inquiryDescription.textContent =
            "Interested in " + domain +
            "? Submit your inquiry or offer.";
    }

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
