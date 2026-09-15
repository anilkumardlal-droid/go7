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

/* GO7.IN Assistant Custom Chat Button */
(function () {
    function createGO7Button() {
        if (document.getElementById("go7-assistant-button")) return;

        var button = document.createElement("button");
        button.id = "go7-assistant-button";
        button.type = "button";
        button.setAttribute("aria-label", "Open GO7.IN Assistant");

        var img = document.createElement("img");
        img.src = "images/go7-assistant.png";
        img.alt = "GO7.IN Assistant";

        button.appendChild(img);

        var style = document.createElement("style");
        style.textContent = `
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
                z-index: 999999;
                border-radius: 50%;
                transition: transform 0.2s ease;
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

            #go7-assistant-button:active {
                transform: scale(0.96);
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
        document.body.appendChild(button);

        button.addEventListener("click", function () {
            if (typeof Tawk_API !== "undefined" && Tawk_API.maximize) {
                Tawk_API.maximize();
            }
        });
    }

    function hideTawkBubble() {
        var style = document.getElementById("go7-hide-tawk");

        if (!style) {
            style = document.createElement("style");
            style.id = "go7-hide-tawk";
            style.textContent = `
                iframe[title="chat widget"] {
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    window.addEventListener("load", function () {
        createGO7Button();
        hideTawkBubble();
    });
})();
