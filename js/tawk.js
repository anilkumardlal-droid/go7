var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

(function () {
    var s1 = document.createElement("script"),
        s0 = document.getElementsByTagName("script")[0];

    s1.async = true;
    s1.src = "https://embed.tawk.to/6aa8e6319117af34473db58d/1k2hs6cod";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    s0.parentNode.insertBefore(s1, s0);
})();

/* GO7.IN Assistant */
(function () {

    function addStyles() {
        if (document.getElementById("go7-assistant-styles")) return;

        var style = document.createElement("style");
        style.id = "go7-assistant-styles";

        style.textContent = `
            /* Hide original Tawk launcher */
            iframe[title="chat widget"] {
                opacity: 0 !important;
                pointer-events: none !important;
            }

            #go7-assistant-button {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 68px;
                height: 68px;
                padding: 0;
                border: 0;
                background: transparent;
                cursor: pointer;
                z-index: 2147483647;
                border-radius: 50%;
                transition: transform .2s ease;
            }

            #go7-assistant-button img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: contain;
            }

            #go7-assistant-button:hover {
                transform: scale(1.06);
            }

            @media (max-width: 600px) {
                #go7-assistant-button {
                    right: 15px;
                    bottom: 15px;
                    width: 60px;
                    height: 60px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function addButton() {
        if (document.getElementById("go7-assistant-button")) return;

        var button = document.createElement("button");
        button.id = "go7-assistant-button";
        button.type = "button";
        button.setAttribute("aria-label", "Open GO7.IN Assistant");

        var img = document.createElement("img");
        img.src = "images/go7-assistant.png";
        img.alt = "GO7.IN Assistant";

        button.appendChild(img);
        document.body.appendChild(button);

        button.addEventListener("click", function () {
            if (typeof Tawk_API !== "undefined" && Tawk_API.maximize) {
                Tawk_API.maximize();
            }
        });
    }

    function hideTawk() {
        var frames = document.querySelectorAll('iframe[title="chat widget"]');

        frames.forEach(function (frame) {
            frame.style.setProperty("opacity", "0", "important");
            frame.style.setProperty("pointer-events", "none", "important");
        });
    }

    function start() {
        addStyles();
        addButton();
        hideTawk();

        /* Keep hiding Tawk even when it reloads */
        var observer = new MutationObserver(function () {
            hideTawk();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setInterval(hideTawk, 500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

})();
