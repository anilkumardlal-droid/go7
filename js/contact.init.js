let turnstileVerifiedToken = null;
let turnstileWidgetId = null;

window.onTurnstileSuccess = function(token) {

    turnstileVerifiedToken = token;

    submitInquiry();
};


document.getElementById("contact-form").addEventListener("submit", async function(e) {

    e.preventDefault();

    const feedback = document.querySelector(".contact-feedback");

feedback.innerHTML = "";
feedback.style.color = "";
feedback.style.fontWeight = "";
feedback.style.background = "";
feedback.style.border = "";
feedback.style.borderRadius = "";
feedback.style.padding = "";
feedback.style.boxSizing = "";
feedback.style.lineHeight = "";

    const message = document.getElementById("contact-message").value.trim();

    if (message.length < 20) {

        feedback.style.color = "#B45309";
        feedback.style.fontWeight = "600";

        feedback.innerHTML =
        '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please describe your offer in at least 20 characters.';

        return;
    }

    const privacyConsent = document.getElementById("privacy-consent");

if (!privacyConsent || !privacyConsent.checked) {

    feedback.style.color = "#B45309";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
        '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please read and accept the Privacy Policy before submitting your inquiry.';

    return;
}
    /*
     * First click:
     * Show and render Turnstile.
     */
    if (!turnstileVerifiedToken) {

        const turnstileBox =
            document.getElementById("turnstile-widget");

        if (
            turnstileBox &&
            turnstileWidgetId === null &&
            typeof turnstile !== "undefined"
        ) {

            turnstileBox.style.display = "block";

            turnstileWidgetId = turnstile.render(
                "#turnstile-widget",
                {
                    sitekey: "0x4AAAAAADnxzvJGSfHstKEu",
                    theme: "light",
                    appearance: "always",
                    callback: window.onTurnstileSuccess
                }
            );
        }

        return;
    }

    await submitInquiry();

});


async function submitInquiry() {

    const feedback = document.querySelector(".contact-feedback");

    const token = turnstileVerifiedToken;

    if (!token) {

        feedback.style.color = "#B45309";
        feedback.style.fontWeight = "600";

        feedback.innerHTML =
        '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please complete the security check.';

        return;
    }

        const privacyConsent = document.getElementById("privacy-consent");

    if (!privacyConsent || !privacyConsent.checked) {

        feedback.style.color = "#B45309";
        feedback.style.fontWeight = "600";

        feedback.innerHTML =
            '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please read and accept the Privacy Policy before submitting your inquiry.';

        return;
    }

    const btn = document.getElementById("contact-submit");

    btn.disabled = true;

    btn.innerHTML = `
<span class="spinner-border spinner-border-sm me-2"></span>
Sending...
`;

    btn.style.cursor = "not-allowed";

    const sourceDomain =
        new URLSearchParams(window.location.search).get("source") || "go7.in";

    try {

        const res = await fetch("https://api.go7.in/api/inquiries", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: document.getElementById("contact-name").value,
                email: document.getElementById("contact-email").value,
                subject: document.getElementById("contact-subject").value,
                message: document.getElementById("contact-message").value,
                source_domain: sourceDomain,
                token: token
            })
        });


        const data = await res.json();


        if (!res.ok && res.status !== 429) {

    if (res.status === 403 && data.blocked_ip) {

        feedback.style.display = "block";
feedback.style.visibility = "visible";
feedback.style.opacity = "1";
feedback.style.color = "#B45309";
feedback.style.fontWeight = "400";
feedback.style.lineHeight = "1.3";
feedback.style.background = "#FFF8ED";
feedback.style.border = "1px solid #FED7AA";
feedback.style.borderRadius = "6px";
feedback.style.padding = "8px 10px";
feedback.style.boxSizing = "border-box";

        feedback.innerHTML = `
            <div style="line-height:1.2;">

                <strong style="display:block;color:#B45309;font-size:14px;font-weight:600;">
                    Your IP address has been blocked.
                </strong>
              <p style="margin:2px 0 0;color:#64748B;font-size:13px;line-height:1.2;">You cannot submit an inquiry from this IP address. If you believe this is a mistake, please contact us at <a href="mailto:info@go7.in" style="color:#3850D5;">info@go7.in</a>.</p>
            </div>
        `;

        btn.disabled = true;
        btn.style.cursor = "not-allowed";

        return;
    }

    if (data.error === "Your inquiry contains prohibited content.") {
    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#B45309";
    feedback.style.fontWeight = "500";
    feedback.style.lineHeight = "1.3";
    feedback.style.background = "#FFF8ED";
    feedback.style.border = "1px solid #FED7AA";
    feedback.style.borderRadius = "6px";
    feedback.style.padding = "8px 10px";
    feedback.style.boxSizing = "border-box";

    feedback.innerHTML =
        '<i class="mdi mdi-alert-outline" style="margin-right:8px;font-size:13px;"></i><span style="font-size:13px;">Your inquiry contains prohibited content.</span>';

    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
    btn.style.cursor = "pointer";
    return;
}

throw new Error(data.error || "Request failed");
}


        if (data.success) {

            feedback.style.display = "block";
            feedback.style.visibility = "visible";
            feedback.style.opacity = "1";
            feedback.style.color = "#00d084";

            document.getElementById("contact-form").reset();


            turnstileVerifiedToken = null;
            turnstileWidgetId = null;


            if (typeof turnstile !== "undefined") {
                turnstile.reset();
            }


            document.getElementById("contact-name")
                .closest(".row").style.display = "none";

            document.getElementById("contact-subject")
                .closest(".row").style.display = "none";

            document.getElementById("contact-message")
                .closest(".row").style.display = "none";

            document.getElementById("contact-fields")
                .style.display = "none";


            let seconds = 10;


            const updateMessage = () => {

                feedback.innerHTML = `
<div style="line-height:1.7;">

<strong style="display:block;color:#22c55e;font-size:17px;font-weight:700;">
✓ Inquiry Sent Successfully
</strong>

<p style="margin:14px 0 0;color:#64748B;">
Thank you for your interest in <strong>${sourceDomain.toUpperCase()}</strong>.<br>
Your inquiry will be reviewed, and a response will be provided within 24 hours.
</p>

<p style="margin:14px 0 0;color:#64748B;">
Redirecting in
<strong style="color:#3850D5;font-size:24px;font-weight:700;">
${seconds}
</strong>
second${seconds !== 1 ? "s" : ""}...
</p>

</div>
`;

            };


            updateMessage();


            const countdown = setInterval(() => {

                seconds--;

                updateMessage();


                if (seconds <= 0) {

                    clearInterval(countdown);

                    setTimeout(() => {
                        window.location.href = "/";
                    }, 300);
                }

            }, 1000);


        } else {

            feedback.style.display = "block";
            feedback.style.visibility = "visible";
            feedback.style.opacity = "1";
            feedback.style.color = "#B45309";
            feedback.style.fontWeight = "600";


            if (data.retryAfter) {

                const turnstileBox =
                    document.getElementById("turnstile-widget");


                if (turnstileBox) {
                    turnstileBox.style.display = "none";
                }


                btn.style.display = "none";


                let remaining =
                    Math.max(0, Number(data.retryAfter) || 0);


                const updateCountdown = () => {

                    const h =
                        String(Math.floor(remaining / 3600))
                        .padStart(2, "0");

                    const m =
                        String(Math.floor((remaining % 3600) / 60))
                        .padStart(2, "0");

                    const s =
                        String(remaining % 60)
                        .padStart(2, "0");


                    feedback.innerHTML = `
<div style="line-height:1.7">

<strong style="display:block;color:#B45309;font-size:15px;font-weight:600;">
Access has been temporarily restricted after 3 requests.
</strong>

<p style="margin:14px 0 0;color:#64748B;">
Please try again in
</p>

<div style="
display:flex;
justify-content:flex-start;
align-items:flex-start;
gap:10px;
margin-top:16px;
">

<div style="
width:65px;
padding:12px 8px;
border:1px solid #E2E8F0;
border-radius:10px;
background:#F8FAFC;
text-align:center;
">
<div style="font-size:24px;font-weight:700;color:#3850D5;">${h}</div>
<div style="font-size:11px;color:#64748B;">HRS</div>
</div>

<div style="
width:65px;
padding:12px 8px;
border:1px solid #E2E8F0;
border-radius:10px;
background:#F8FAFC;
text-align:center;
">
<div style="font-size:24px;font-weight:700;color:#3850D5;">${m}</div>
<div style="font-size:11px;color:#64748B;">MIN</div>
</div>

<div style="
width:65px;
padding:12px 8px;
border:1px solid #E2E8F0;
border-radius:10px;
background:#F8FAFC;
text-align:center;
">
<div style="font-size:24px;font-weight:700;color:#3850D5;">${s}</div>
<div style="font-size:11px;color:#64748B;">SEC</div>
</div>

</div>

</div>
`;

                };


                updateCountdown();


                const timer = setInterval(() => {

                    remaining--;


                    if (remaining < 0) {

                        clearInterval(timer);


                        feedback.innerHTML = `
<strong style="color:#10A6BA;font-size:16px;">
✓ You can now submit your inquiry again.
</strong>
`;


                        if (turnstileBox) {
                            turnstileBox.style.display = "";
                        }


                        btn.style.display = "";

                        btn.disabled = false;
                        btn.innerHTML = "Send Inquiry";
                        btn.style.cursor = "pointer";


                        turnstileVerifiedToken = null;
                        turnstileWidgetId = null;


                        if (typeof turnstile !== "undefined") {
                            turnstile.reset();
                        }


                        return;
                    }


                    updateCountdown();

                }, 1000);


            } else {

              feedback.style.background = "#FFF8ED";
              feedback.style.border = "1px solid #FED7AA";
              feedback.style.borderRadius = "8px";
              feedback.style.padding = "12px 14px";
              feedback.style.boxSizing = "border-box";
              feedback.style.lineHeight = "1.4";  
                
                feedback.innerHTML =
                    '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>' +
                    (data.error || data.message || "Unknown Error");


                turnstileVerifiedToken = null;
                turnstileWidgetId = null;


                if (typeof turnstile !== "undefined") {
                    turnstile.reset();
                }


                btn.disabled = false;
                btn.innerHTML = "Send Inquiry";
                btn.style.cursor = "pointer";
            }
        }


    } catch (err) {

        console.error(err);


        turnstileVerifiedToken = null;
        turnstileWidgetId = null;


        if (typeof turnstile !== "undefined") {
            turnstile.reset();
        }


        feedback.style.display = "block";
        feedback.style.visibility = "visible";
        feedback.style.opacity = "1";
        feedback.style.color = "#B45309";
        feedback.style.fontWeight = "500";
        feedback.style.lineHeight = "1.3";
        feedback.style.background = "#FFF8ED";
        feedback.style.border = "1px solid #FED7AA";
        feedback.style.borderRadius = "6px";
        feedback.style.padding = "8px 10px";
        feedback.style.boxSizing = "border-box";


        feedback.innerHTML =
    '<i class="mdi mdi-alert-outline" style="margin-right:8px;font-size:13px;"></i><span style="font-size:13px;">Unable to send your inquiry. Please check your connection and try again.</span>';


        const turnstileBox =
            document.getElementById("turnstile-widget");


        if (turnstileBox) {
            turnstileBox.style.display = "";
        }


        btn.style.display = "";

        btn.disabled = false;
        btn.innerHTML = "Send Inquiry";
        btn.style.cursor = "pointer";
    }

}
