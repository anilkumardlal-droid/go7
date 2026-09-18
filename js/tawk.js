var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

(function () {

    var closeButton = null;
    var positionTimer = null;
    var audioContext = null;
    var audioUnlocked = false;


    /* =========================================
       IMMEDIATELY HIDE TAWK NATIVE UI
    ========================================= */

    var earlyStyle = document.createElement("style");

    earlyStyle.id = "go7-tawk-hide-native";

    earlyStyle.textContent = `
        /*
         * Tawk native launcher hidden from the beginning.
         * It will never appear before our custom button.
         */

        iframe[title="chat widget"] {
            visibility: hidden !important;
        }

        #go7-chat-close {
            visibility: hidden !important;
        }

        #go7-live-chat {
            visibility: hidden !important;
        }
    `;

    document.head.appendChild(earlyStyle);


    /* =========================================
       TAWK EVENTS
    ========================================= */

    Tawk_API.onLoad = function () {

        /*
         * Keep native Tawk launcher hidden.
         */
        Tawk_API.hideWidget();

        /*
         * Custom button appears after 5 seconds.
         */
        setTimeout(function () {

            showLiveButton();

        }, 5000);

    };


    Tawk_API.onChatMaximized = function () {

        hideLiveButton();

        /*
         * Allow Tawk chat window to become visible.
         */
        showTawkWindow();

        setTimeout(function () {

            createCloseButton();

            positionCloseButton();

        }, 100);

    };


    Tawk_API.onChatMinimized = function () {

        removeCloseButton();

        Tawk_API.hideWidget();

        hideTawkWindow();

        showLiveButton();

    };


    Tawk_API.onChatHidden = function () {

        removeCloseButton();

        Tawk_API.hideWidget();

        hideTawkWindow();

        showLiveButton();

    };


    Tawk_API.onChatStarted = function () {

        unlockAudio();

    };


    /*
     * New message notification sound.
     */
    Tawk_API.onChatMessageVisitor = function () {

        playNotificationSound();

    };


    /* =========================================
       LOAD TAWK
    ========================================= */

    var s1 = document.createElement("script");
    var s0 = document.getElementsByTagName("script")[0];

    s1.async = true;

    s1.src =
        "https://embed.tawk.to/6aaad7cb3768263445ac008b/1k2llltho";

    s1.charset = "UTF-8";

    s1.setAttribute("crossorigin", "*");

    s0.parentNode.insertBefore(s1, s0);


    /* =========================================
       LIVE CHAT SKELETON
       Visible for the first 5 seconds
    ========================================= */

    function createChatSkeleton() {

        if (document.getElementById("go7-chat-skeleton")) {
            return;
        }

        var skeleton = document.createElement("div");

        skeleton.id = "go7-chat-skeleton";

        skeleton.setAttribute("aria-hidden", "true");

        document.body.appendChild(skeleton);

    }


    function removeChatSkeleton() {

        var skeleton =
            document.getElementById("go7-chat-skeleton");

        if (skeleton) {

            skeleton.remove();

        }

    }


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

            /* =================================
               LIVE CHAT SKELETON
            ================================= */

            #go7-chat-skeleton {

                position: fixed;

                right: 20px;
                bottom: 20px;

                width: 62px;
                height: 62px;

                border-radius: 50%;

                background: #E8ECF1;

                z-index: 2147483645;

                overflow: hidden;

                box-shadow:
                    0 6px 22px rgba(15,23,42,.10);

                pointer-events: none;

            }


            #go7-chat-skeleton::after {

                content: "";

                position: absolute;

                inset: 0;

                transform:
                    translateX(-100%);

                background:
                    linear-gradient(
                        90deg,
                        transparent,
                        rgba(255,255,255,.80),
                        transparent
                    );

                animation:
                    go7ChatSkeleton 1.4s linear infinite;

            }


            @keyframes go7ChatSkeleton {

                100% {

                    transform:
                        translateX(100%);

                }

            }


            /* =================================
               LIVE CHAT BUTTON
            ================================= */

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

                visibility: visible !important;

            }


            #go7-live-chat:hover {

                transform:
                    translateY(-2px);

                box-shadow:
                    0 9px 28px rgba(56,80,213,.38);

            }


            #go7-live-chat:active {

                transform:
                    scale(.94);

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


            /* =================================
               LIVE PULSE
            ================================= */

            #go7-live-chat::before {

                content: "";

                position: absolute;

                inset: 0;

                border-radius: 50%;

                border: 2px solid #3850D5;

                animation:
                    go7LivePulse 2s infinite;

                pointer-events: none;

            }


            @keyframes go7LivePulse {

                0% {

                    transform:
                        scale(1);

                    opacity: .65;

                }

                70% {

                    transform:
                        scale(1.35);

                    opacity: 0;

                }

                100% {

                    transform:
                        scale(1.35);

                    opacity: 0;

                }

            }


            /* =================================
               ONLINE DOT
            ================================= */

            .go7-online {

                position: absolute;

                width: 12px;
                height: 12px;

                right: 2px;
                top: 2px;

                background: #22c55e;

                border: 3px solid #fff;

                border-radius: 50%;

                animation:
                    go7Online 1.8s infinite;

            }


            @keyframes go7Online {

                0% {

                    box-shadow:
                        0 0 0 0
                        rgba(34,197,94,.45);

                }

                70% {

                    box-shadow:
                        0 0 0 6px
                        rgba(34,197,94,0);

                }

                100% {

                    box-shadow:
                        0 0 0 0
                        rgba(34,197,94,0);

                }

            }


            /* =================================
               CUSTOM CLOSE BUTTON
            ================================= */

            #go7-chat-close {

                position: fixed;

                width: 34px;
                height: 34px;

                padding: 0;

                border: 0;

                border-radius: 50%;

                background: #ffffff;

                color: #26324a;

                font-family:
                    Arial, sans-serif;

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

                transform:
                    scale(1.08);

            }


            #go7-chat-close:active {

                transform:
                    scale(.94);

            }


            @media (max-width: 600px) {

                #go7-chat-skeleton {

                    right: 15px;
                    bottom: 15px;

                    width: 56px;
                    height: 56px;

                }


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


        /* =================================
           BUTTON
        ================================= */

        var button =
            document.createElement("button");


        button.id =
            "go7-live-chat";


        button.type =
            "button";


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


        /* =================================
           OPEN CHAT
        ================================= */

        button.addEventListener(
            "click",
            function () {

                unlockAudio();

                if (
                    typeof Tawk_API !== "undefined" &&
                    typeof Tawk_API.maximize === "function"
                ) {

                    Tawk_API.maximize();

                }

            }
        );

    }


    /* =========================================
       TAWK WINDOW VISIBILITY
    ========================================= */

    function showTawkWindow() {

        var iframe =
            document.querySelector(
                'iframe[title="chat widget"]'
            );


        if (iframe) {

            iframe.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

        }

    }


    function hideTawkWindow() {

        var iframe =
            document.querySelector(
                'iframe[title="chat widget"]'
            );


        if (iframe) {

            iframe.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

        }

    }


    /* =========================================
       AUDIO
    ========================================= */

    function unlockAudio() {

        if (audioUnlocked) {
            return;
        }


        try {

            var AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContext) {
                return;
            }


            audioContext =
                audioContext ||
                new AudioContext();


            if (
                audioContext.state ===
                "suspended"
            ) {

                audioContext.resume();

            }


            audioUnlocked = true;

        } catch (e) {

            // Browser audio restriction

        }

    }


    function playNotificationSound() {

        try {

            if (!audioContext) {

                var AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;


                if (!AudioContext) {
                    return;
                }


                audioContext =
                    new AudioContext();

            }


            if (
                audioContext.state ===
                "suspended"
            ) {

                audioContext.resume();

            }


            var oscillator =
                audioContext.createOscillator();


            var gain =
                audioContext.createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.setValueAtTime(
                880,
                audioContext.currentTime
            );


            oscillator.frequency.exponentialRampToValueAtTime(
                660,
                audioContext.currentTime + 0.12
            );


            gain.gain.setValueAtTime(
                0.0001,
                audioContext.currentTime
            );


            gain.gain.exponentialRampToValueAtTime(
                0.08,
                audioContext.currentTime + 0.015
            );


            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                audioContext.currentTime + 0.18
            );


            oscillator.connect(gain);

            gain.connect(
                audioContext.destination
            );


            oscillator.start();


            oscillator.stop(
                audioContext.currentTime + 0.2
            );


        } catch (e) {

            // Ignore browser audio restrictions

        }

    }


    /* =========================================
       CUSTOM CLOSE BUTTON
    ========================================= */

    function createCloseButton() {

        /*
         * Remove any old button first.
         */

        var oldButton =
            document.getElementById(
                "go7-chat-close"
            );


        if (oldButton) {
            oldButton.remove();
        }


        closeButton =
            document.createElement("button");


        closeButton.id =
            "go7-chat-close";


        closeButton.type =
            "button";


        closeButton.setAttribute(
            "aria-label",
            "Close chat"
        );


        closeButton.innerHTML =
            "&times;";


        document.body.appendChild(
            closeButton
        );


        closeButton.addEventListener(
            "click",
            function () {

                if (
                    typeof Tawk_API !== "undefined" &&
                    typeof Tawk_API.minimize === "function"
                ) {

                    Tawk_API.minimize();

                }

            }
        );


        startPositionTracking();

    }


    function removeCloseButton() {

        var oldButton =
            document.getElementById(
                "go7-chat-close"
            );


        if (oldButton) {
            oldButton.remove();
        }


        closeButton = null;


        if (positionTimer) {

            clearInterval(
                positionTimer
            );


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


        closeButton.style.left =
            (rect.right - 46) + "px";


        closeButton.style.top =
            (rect.top + 12) + "px";

    }


    function startPositionTracking() {

        if (positionTimer) {

            clearInterval(
                positionTimer
            );

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

            button.style.display =
                "flex";

            button.style.visibility =
                "visible";

        }

    }


    function hideLiveButton() {

        var button =
            document.getElementById(
                "go7-live-chat"
            );


        if (button) {

            button.style.display =
                "none";

        }

    }


    /* =========================================
       START
    ========================================= */

    function start() {

        /*
         * Show Live Chat skeleton immediately.
         * Keep it visible for exactly 5 seconds.
         */

        createChatSkeleton();


        setTimeout(function () {

            removeChatSkeleton();

            createLiveButton();

            showLiveButton();

        }, 5000);

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
