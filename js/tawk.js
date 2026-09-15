var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

(function () {

    var closeButton = null;
    var positionTimer = null;

    /* =========================================
       TAWK EVENTS
    ========================================= */

    Tawk_API.onLoad = function () {
        Tawk_API.hideWidget();
        showLiveButton();
    };

    Tawk_API.onChatMaximized = function () {
        hideLiveButton();

        setTimeout(function () {
            createCloseButton();
            positionCloseButton();
        }, 100);
    };

    Tawk_API.onChatMinimized = function () {
        removeCloseButton();
        Tawk_API.hideWidget();
        showLiveButton();
    };

    Tawk_API.onChatHidden = function () {
        removeCloseButton();
        Tawk_API.hideWidget();
        showLiveButton();
    };


    /* =========================================
       LOAD TAWK
    ========================================= */

    var s1 = document.createElement("script");
    var s0 = document.getElementsByTagName("script")[0];

    s1.async = true;
    s1.src =
        "https://embed.tawk.to/6aa8e6319117af34473db58d/1k2hs6cod";

    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    s0.parentNode.insertBefore(s1, s0);


    /* =========================================
       LIVE CHAT BUTTON
    ========================================= */

    function createLiveButton() {

        if (document.getElementById("go7-live-chat")) {
            return;
        }

        var style = document.createElement("style");

        style.id = "go7-live-chat-style";

        style.textContent = `
            #go7-live-chat {
                position: fixed;
                right: 20px;
                bottom: 20px;

                width: 62px;
                height: 62px;

                padding: 0;
                border: 0;
                border-radius: 50%;

                background: #3850D5;

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;

                z-index: 2147483646;

                box-shadow:
                    0 6px 22px rgba(56,80,213,.30);

                transition:
                    transform .2s ease,
                    box-shadow .2s ease;
            }

            #go7-live-chat:hover {
                transform: translateY(-2px);

                box-shadow:
                    0 9px 28px rgba(56,80,213,.38);
            }

            #go7-live-chat:active {
                transform: scale(.94);
            }

            #go7-live-chat svg {
                width: 27px;
                height: 27px;

                fill: none;
                stroke: #fff;
                stroke-width: 2;

                stroke-linecap: round;
                stroke-linejoin: round;
            }

            #go7-live-chat::before {
                content: "";

                position: absolute;
                inset: 0;

                border-radius: 50%;

                border: 2px solid #3850D5;

                animation: go7LivePulse 2s infinite;

                pointer-events: none;
            }

            @keyframes go7LivePulse {
                0% {
                    transform: scale(1);
                    opacity: .65;
                }

                70% {
                    transform: scale(1.35);
                    opacity: 0;
                }

                100% {
                    transform: scale(1.35);
                    opacity: 0;
                }
            }

            .go7-online {
                position: absolute;

                width: 12px;
                height: 12px;

                right: 2px;
                top: 2px;

                background: #22c55e;

                border: 3px solid #fff;

                border-radius: 50%;

                animation: go7Online 1.8s infinite;
            }

            @keyframes go7Online {
                0% {
                    box-shadow: 0 0 0 0 rgba(34,197,94,.45);
                }

                70% {
                    box-shadow: 0 0 0 6px rgba(34,197,94,0);
                }

                100% {
                    box-shadow: 0 0 0 0 rgba(34,197,94,0);
                }
            }

            /* CUSTOM CLOSE BUTTON */

            #go7-chat-close {
                position: fixed;

                width: 34px;
                height: 34px;

                padding: 0;

                border: 0;
                border-radius: 50%;

                background: #ffffff;

                color: #26324a;

                font-family: Arial, sans-serif;

                font-size: 24px;
                font-weight: 400;

                line-height: 34px;

                text-align: center;

                cursor: pointer;

                z-index: 2147483647;

                box-shadow:
                    0 3px 12px rgba(0,0,0,.18);

                transition:
                    transform .15s ease,
                    background .15s ease;
            }

            #go7-chat-close:hover {
                background: #f1f5f9;
                transform: scale(1.08);
            }

            #go7-chat-close:active {
                transform: scale(.94);
            }

            @media (max-width: 600px) {

                #go7-live-chat {
                    right: 15px;
                    bottom: 15px;

                    width: 56px;
                    height: 56px;
                }

                #go7-live-chat svg {
                    width: 24px;
                    height: 24px;
                }

                #go7-chat-close {
                    width: 32px;
                    height: 32px;

                    font-size: 22px;
                    line-height: 32px;
                }
            }
        `;

        document.head.appendChild(style);


        var button = document.createElement("button");

        button.id = "go7-live-chat";
        button.type = "button";
        button.setAttribute(
            "aria-label",
            "Open live chat"
        );

        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="
                    M20 11.5
                    a8 8 0 0 1-8 8
                    8.8 8.8 0 0 1-3.7-.8
                    L4 20
                    l1.3-3.7
                    A8 8 0 1 1 20 11.5Z
                "></path>

                <path d="M8 12h.01"></path>
                <path d="M12 12h.01"></path>
                <path d="M16 12h.01"></path>
            </svg>

            <span class="go7-online"></span>
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


    /* =========================================
       CUSTOM CLOSE BUTTON
    ========================================= */

    function createCloseButton() {

        if (closeButton) {
            return;
        }

        closeButton = document.createElement("button");

        closeButton.id = "go7-chat-close";
        closeButton.type = "button";
        closeButton.setAttribute(
            "aria-label",
            "Close chat"
        );

        closeButton.innerHTML = "&times;";

        document.body.appendChild(closeButton);


        closeButton.addEventListener("click", function () {

            if (
                typeof Tawk_API !== "undefined" &&
                typeof Tawk_API.minimize === "function"
            ) {

                Tawk_API.minimize();

            }

        });


        startPositionTracking();
    }


    function removeCloseButton() {

        if (closeButton) {

            closeButton.remove();

            closeButton = null;
        }

        if (positionTimer) {

            clearInterval(positionTimer);

            positionTimer = null;
        }
    }


    /* =========================================
       POSITION CLOSE BUTTON
    ========================================= */

    function positionCloseButton() {

        if (!closeButton) {
            return;
        }

        var iframe =
            document.querySelector(
                'iframe[title="chat widget"]'
            );

        if (!iframe) {
            return;
        }

        var rect =
            iframe.getBoundingClientRect();

        if (
            rect.width <= 100 ||
            rect.height <= 100
        ) {
            return;
        }


        /*
         * Tawk window ke top-right
         */

        closeButton.style.left =
            (rect.right - 46) + "px";

        closeButton.style.top =
            (rect.top + 12) + "px";
    }


    function startPositionTracking() {

        if (positionTimer) {
            clearInterval(positionTimer);
        }

        positionTimer =
            setInterval(
                positionCloseButton,
                200
            );

        positionCloseButton();
    }


    /* =========================================
       SHOW / HIDE LIVE BUTTON
    ========================================= */

    function showLiveButton() {

        var button =
            document.getElementById(
                "go7-live-chat"
            );

        if (button) {
            button.style.display = "flex";
        }
    }


    function hideLiveButton() {

        var button =
            document.getElementById(
                "go7-live-chat"
            );

        if (button) {
            button.style.display = "none";
        }
    }


    /* =========================================
       START
    ========================================= */

    function start() {
        createLiveButton();
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
