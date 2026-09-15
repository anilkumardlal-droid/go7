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


/* =========================================
   GO7.IN REAL LIVE CHAT BUTTON
========================================= */

(function () {

    function createChatButton() {

        if (document.getElementById("go7-live-chat")) return;

        var style = document.createElement("style");

        style.textContent = `
            #go7-live-chat {
                position: fixed;
                right: 22px;
                bottom: 22px;
                z-index: 2147483647;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 7px 16px 7px 8px;
                border: 1px solid rgba(45, 72, 214, .15);
                border-radius: 50px;
                background: rgba(255,255,255,.97);
                box-shadow:
                    0 8px 30px rgba(0,0,0,.12),
                    0 2px 8px rgba(45,72,214,.12);
                cursor: pointer;
                font-family: Arial, sans-serif;
                transition: all .25s ease;
            }

            #go7-live-chat:hover {
                transform: translateY(-3px);
                box-shadow:
                    0 12px 35px rgba(0,0,0,.16),
                    0 4px 12px rgba(45,72,214,.18);
            }

            .go7-chat-icon {
                position: relative;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: #3850D5;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 23px;
                box-shadow: 0 4px 12px rgba(56,80,213,.30);
            }

            .go7-chat-icon::before {
                content: "";
                width: 11px;
                height: 11px;
                border-radius: 50%;
                background: #22c55e;
                position: absolute;
                right: 1px;
                top: 1px;
                border: 3px solid #fff;
                box-sizing: content-box;
            }

            .go7-chat-icon::after {
                content: "";
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22c55e;
                right: 3px;
                top: 3px;
                animation: go7Pulse 1.8s infinite;
                opacity: .7;
            }

            .go7-chat-content {
                display: flex;
                flex-direction: column;
                line-height: 1.15;
                text-align: left;
            }

            .go7-chat-title {
                font-size: 15px;
                font-weight: 700;
                color: #18233a;
            }

            .go7-chat-status {
                margin-top: 4px;
                font-size: 12px;
                color: #64748b;
            }

            .go7-chat-status span {
                color: #16a34a;
                font-weight: 600;
            }

            @keyframes go7Pulse {
                0% {
                    transform: scale(.8);
                    opacity: .7;
                }

                70% {
                    transform: scale(2);
                    opacity: 0;
                }

                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }

            @media (max-width: 600px) {

                #go7-live-chat {
                    right: 15px;
                    bottom: 15px;
                    padding: 6px;
                    width: 54px;
                    height: 54px;
                    justify-content: center;
                    box-sizing: border-box;
                }

                .go7-chat-icon {
                    width: 42px;
                    height: 42px;
                    font-size: 20px;
                }

                .go7-chat-content {
                    display: none;
                }
            }
        `;

        document.head.appendChild(style);


        var button = document.createElement("button");

        button.id = "go7-live-chat";
        button.type = "button";
        button.setAttribute("aria-label", "Open GO7.IN Assistant");


        button.innerHTML = `
            <div class="go7-chat-icon">
                💬
            </div>

            <div class="go7-chat-content">
                <div class="go7-chat-title">
                    GO7.IN Assistant
                </div>

                <div class="go7-chat-status">
                    <span>● Online</span> · Chat with us
                </div>
            </div>
        `;


        document.body.appendChild(button);


        button.addEventListener("click", function () {

            if (
                typeof Tawk_API !== "undefined" &&
                typeof Tawk_API.maximize === "function"
            ) {
                Tawk_API.maximize();
            }

        });

    }


    function hideTawkLauncher() {

        var frames = document.querySelectorAll(
            'iframe[title="chat widget"]'
        );

        frames.forEach(function (frame) {

            frame.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            frame.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

        });

    }


    function start() {

        createChatButton();

        hideTawkLauncher();


        var observer = new MutationObserver(function () {
            hideTawkLauncher();
        });


        observer.observe(document.body, {
            childList: true,
            subtree: true
        });


        setInterval(hideTawkLauncher, 1000);

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
