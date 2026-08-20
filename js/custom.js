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

// ============================================
// GO7.IN — FORM SUCCESS FIREWORKS
// ============================================

(function () {

    const canvas = document.getElementById("fireworksCanvas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width;
    let height;
    let animationFrame;
    let particles = [];
    let running = false;
    let interval = null;

    const colors = [
        "#00c09d",
        "#ffffff",
        "#ffd700",
        "#4dd0e1",
        "#ff5c8a",
        "#9b6cff"
    ];


    // Resize canvas
    function resizeCanvas() {

        width = window.innerWidth;
        height = window.innerHeight;

        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();


    // Create one fireworks burst
    function createBurst(x, y) {

        const color =
            colors[
                Math.floor(
                    Math.random() * colors.length
                )
            ];


        const count =
            50 + Math.floor(Math.random() * 25);


        for (let i = 0; i < count; i++) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const speed =
                2.2 +
                Math.random() * 5;


            particles.push({

                x: x,

                y: y,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                life:
                    55 +
                    Math.random() * 45,

                maxLife:
                    100,

                size:
                    1 +
                    Math.random() * 2,

                color:
                    color

            });
        }
    }


    // Animation
    function animate() {

        if (!running) return;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        for (
            let i = particles.length - 1;
            i >= 0;
            i--
        ) {

            const p = particles[i];


            p.x += p.vx;
            p.y += p.vy;


            p.vx *= 0.985;
            p.vy *= 0.985;


            // Gravity
            p.vy += 0.045;


            p.life--;


            const alpha =
                Math.max(
                    0,
                    p.life / p.maxLife
                );


            ctx.globalAlpha =
                alpha;


            ctx.beginPath();


            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                p.color;


            ctx.shadowBlur = 10;

            ctx.shadowColor =
                p.color;


            ctx.fill();


            if (p.life <= 0) {

                particles.splice(
                    i,
                    1
                );
            }
        }


        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;


        animationFrame =
            requestAnimationFrame(
                animate
            );
    }


    // =========================================
    // SHOW FIREWORKS
    // =========================================

    window.showFireworks = function () {

        if (running) return;


        running = true;

        particles = [];


        resizeCanvas();


        canvas.classList.add(
            "active"
        );


        // Start animation
        animate();


        // First fireworks
        createBurst(
            width * 0.50,
            height * 0.35
        );


        createBurst(
            width * 0.25,
            height * 0.40
        );


        createBurst(
            width * 0.75,
            height * 0.32
        );


        // Repeat fireworks
        interval = setInterval(
            function () {

                createBurst(

                    width *
                    (
                        0.15 +
                        Math.random() *
                        0.70
                    ),

                    height *
                    (
                        0.15 +
                        Math.random() *
                        0.50
                    )

                );

            },
            500
        );


        // Stop after 5 seconds
        setTimeout(
            function () {

                clearInterval(
                    interval
                );

                interval = null;

                running = false;


                canvas.classList.remove(
                    "active"
                );


                setTimeout(
                    function () {

                        cancelAnimationFrame(
                            animationFrame
                        );

                        particles = [];

                        ctx.clearRect(
                            0,
                            0,
                            width,
                            height
                        );

                    },
                    1200
                );

            },
            5000
        );

    };

})();
