var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

/* =========================================
   GO7.IN ASSISTANT — TAWK LIVE CHAT
========================================= */

(function () {

    /* ---------- Tawk Load ---------- */

    Tawk_API.onLoad = function () {

        // Hide Tawk's original launcher
        Tawk_API.hideWidget();

        showGO7Button();
    };


    /* ---------- Chat Open ---------- */

    Tawk_API.onChatMaximized = function () {

        // Hide custom button while chat is open
        hideGO7Button();
    };


    /* ---------- Chat Minimized / Closed ---------- */

    Tawk_API.onChatMinimized = function () {

        // Hide original Tawk launcher
        Tawk_API.hideWidget();

        // Show GO7.IN Assistant button again
        showGO7Button();
    };


    Tawk_API.onChatHidden = function () {

        Tawk_API.hideWidget();

        showGO7Button();
    };


    /* ---------- Load Tawk ---------- */

    var s1 = document.createElement("script");
    var s0 = document.getElementsByTagName("script")[0];

    s1.async = true;

    s1.src =
        "https://embed.tawk.to/6aa8e6319117af34473db58d/1k2hs6cod";

    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    s0.parentNode.insertBefore(s1, s0);


    /* =========================================
       GO7.IN CUSTOM CHAT BUTTON
    ========================================= */

    function createGO7Button() {

        if (document.getElementById("go7-live-chat")) {
            return;
        }


        /* ---------- CSS ---------- */

        var style = document.createElement("style");

        style.id = "go7-live-chat-style";

        style.textContent = `

            #go7-live-chat {

                position: fixed;

                right: 22px;
                bottom: 22px;

                z-index: 2147483646;

                display: flex;

                align-items: center;

                gap: 10px;

                padding: 7px 17px 7px 8px;

                border: 1px solid rgba(56,80,213,.14);

                border-radius: 50px;

                background: rgba(255,255,255,.98);

                box-shadow:
                    0 8px 30px rgba(0,0,0,.12),
                    0 2px 8px rgba(56,80,213,.12);

                cursor: pointer;

                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Arial,
                    sans-serif;

                transition:
                    transform .25s ease,
                    box-shadow .25s ease;

                outline: none;
            }


            #go7-live-chat:hover {

                transform: translateY(-3px);

                box-shadow:
                    0 13px 35px rgba(0,0,0,.16),
                    0 4px 14px rgba(56,80,213,.16);
            }


            #go7-live-chat:active {

                transform: scale(.97);
            }


            /* ---------- Chat Icon ---------- */

            .go7-chat-icon {

                position: relative;

                width: 48px;
                height: 48px;

                flex: 0 0 48px;

                border-radius: 50%;

                background: #3850D5;

                display: flex;

                align-items: center;
                justify-content: center;

                box-shadow:
                    0 5px 14px rgba(56,80,213,.30);
            }


            .go7-chat-icon svg {

                width: 25px;
                height: 25px;

                fill: none;

                stroke: #ffffff;

                stroke-width: 2;

                stroke-linecap: round;
                stroke-linejoin: round;
            }


            /* ---------- Online Indicator ---------- */

            .go7-online-dot {

                position: absolute;

                right: -1px;
                top: -1px;

                width: 13px;
                height: 13px;

                border-radius: 50%;

                background: #22c55e;

                border: 3px solid #ffffff;

                box-sizing: content-box;

                animation: go7-online-pulse 2s infinite;
            }


            @keyframes go7-online-pulse {

                0% {
                    box-shadow: 0 0 0 0 rgba(34,197,94,.35);
                }

                70% {
                    box-shadow: 0 0 0 7px rgba(34,197,94,0);
                }

                100% {
                    box-shadow: 0 0 0 0 rgba(34,197,94,0);
                }
            }


            /* ---------- Text ---------- */

            .go7-chat-text {

                display: flex;

                flex-direction: column;

                text-align: left;

                line-height: 1.15;
            }


            .go7-chat-title {

                font-size: 15px;

                font-weight: 700;

                color: #18233a;

                white-space: nowrap;
            }


            .go7-chat-status {

                margin-top: 4px;

                font-size: 12px;

                color: #64748b;

                white-space: nowrap;
            }


            .go7-chat-status span {

                color: #16a34a;

                font-weight: 600;
            }


            /* ---------- Mobile ---------- */

            @media (max-width: 600px) {

                #go7-live-chat {

                    right: 15px;
                    bottom: 15px;

                    width: 56px;
                    height: 56px;

                    padding: 5px;

                    justify-content: center;
                }


                .go7-chat-icon {

                    width: 46px;
                    height: 46px;

                    flex: 0 0 46px;
                }


                .go7-chat-text {

                    display: none;
                }
            }

        `;

        document.head.appendChild(style);


        /* ---------- Button ---------- */

        var button = document.createElement("button");

        button.id = "go7-live-chat";

        button.type = "button";

        button.setAttribute(
            "aria-label",
            "Open GO7.IN Assistant"
        );


        button.innerHTML = `

            <div class="go7-chat-icon">

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


                <span class="go7-online-dot"></span>

            </div>


            <div class="go7-chat-text">

                <div class="go7-chat-title">
                    GO7.IN Assistant
                </div>

                <div class="go7-chat-status">
                    <span>● Online</span> · Chat with us
                </div>

            </div>

        `;


        document.body.appendChild(button);


        /* =========================================
           CLICK → DIRECTLY OPEN TAWK CHAT
        ========================================= */

        button.addEventListener("click", function () {

            if (
                typeof Tawk_API !== "undefined" &&
                typeof Tawk_API.maximize === "function"
            ) {

                Tawk_API.maximize();

            }

        });

    }


    /* ---------- Show Button ---------- */

    function showGO7Button() {

        var button =
            document.getElementById("go7-live-chat");

        if (button) {

            button.style.display = "flex";

        }

    }


    /* ---------- Hide Button ---------- */

    function hideGO7Button() {

        var button =
            document.getElementById("go7-live-chat");

        if (button) {

            button.style.display = "none";

        }

    }


    /* ---------- Start ---------- */

    function startGO7Chat() {

        createGO7Button();

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            startGO7Chat
        );

    } else {

        startGO7Chat();

    }

})();
