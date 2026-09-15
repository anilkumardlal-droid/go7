var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

(function () {

    /* ================================
       TAWK
    ================================= */

    Tawk_API.onLoad = function () {
        Tawk_API.hideWidget();
        showGO7Chat();
    };

    Tawk_API.onChatMaximized = function () {
        hideGO7Chat();
    };

    Tawk_API.onChatMinimized = function () {
        Tawk_API.hideWidget();
        showGO7Chat();
    };

    Tawk_API.onChatHidden = function () {
        Tawk_API.hideWidget();
        showGO7Chat();
    };


    /* ================================
       LOAD TAWK
    ================================= */

    var s1 = document.createElement("script");
    var s0 = document.getElementsByTagName("script")[0];

    s1.async = true;
    s1.src =
        "https://embed.tawk.to/6aa8e6319117af34473db58d/1k2hs6cod";

    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    s0.parentNode.insertBefore(s1, s0);


    /* ================================
       GO7 LIVE CHAT ICON
    ================================= */

    function createGO7Chat() {

        if (document.getElementById("go7-live-chat")) {
            return;
        }

        var style = document.createElement("style");

        style.textContent = `

            #go7-live-chat {

                position: fixed;

                right: 20px;
                bottom: 20px;

                width: 62px;
                height: 62px;

                padding: 0;
                margin: 0;

                border: none;
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


            /* CHAT ICON */

            #go7-live-chat svg {

                width: 27px;
                height: 27px;

                fill: none;

                stroke: #ffffff;

                stroke-width: 2;

                stroke-linecap: round;
                stroke-linejoin: round;
            }


            /* LIVE PULSE */

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


            /* ONLINE DOT */

            #go7-live-chat .go7-online {

                position: absolute;

                width: 12px;
                height: 12px;

                right: 2px;
                top: 2px;

                background: #22c55e;

                border: 3px solid #ffffff;

                border-radius: 50%;

                z-index: 2;

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


            /* MOBILE */

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


        /* ================================
           CLICK → OPEN TAWK CHAT
        ================================= */

        button.addEventListener("click", function () {

            if (
                typeof Tawk_API !== "undefined" &&
                typeof Tawk_API.maximize === "function"
            ) {

                Tawk_API.maximize();

            }

        });

    }


    function showGO7Chat() {

        var button =
            document.getElementById("go7-live-chat");

        if (button) {

            button.style.display = "flex";

        }

    }


    function hideGO7Chat() {

        var button =
            document.getElementById("go7-live-chat");

        if (button) {

            button.style.display = "none";

        }

    }


    /* ================================
       START
    ================================= */

    function start() {

        createGO7Chat();

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
