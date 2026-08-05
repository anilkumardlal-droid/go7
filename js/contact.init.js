document.getElementById("contact-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const feedback = document.querySelector(".contact-feedback");

feedback.innerHTML = "";
feedback.style.color = "";
feedback.style.fontWeight = "";
   const message = document.getElementById("contact-message").value.trim();

if (message.length < 20) {

    feedback.style.color = "#B45309";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
    '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please describe your offer in at least 20 characters.';

    return;
}
    const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!token) {

    feedback.style.color = "#B45309";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
    '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Please complete the security check.';

    return;
}

    const btn = document.getElementById("contact-submit");
    btn.disabled = true;
    btn.innerHTML = `
<span class="spinner-border spinner-border-sm me-2"></span>
Sending...
`;
    btn.style.cursor = "not-allowed";

    try {
        const res = await fetch("https://api.go7.in/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: document.getElementById("contact-name").value,
                email: document.getElementById("contact-email").value,
                subject: document.getElementById("contact-subject").value,
                message: document.getElementById("contact-message").value,
                token: token
            })
        });

        const data = await res.json();

if (!res.ok && res.status !== 429) {
    throw new Error(data.error || "Request failed");
}

if (data.success) {

    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#00d084";
    document.getElementById("contact-form").reset();

if (typeof turnstile !== "undefined") {
    turnstile.reset();
}

document.getElementById("contact-name").closest(".row").style.display = "none";
document.getElementById("contact-subject").closest(".row").style.display = "none";
document.getElementById("contact-message").closest(".row").style.display = "none";

document.getElementById("contact-fields").style.display = "none";

let seconds = 10;

const updateMessage = () => {

    feedback.innerHTML = `
<div style="line-height:1.7;">

<strong style="display:block;color:#10A6BA;font-size:17px;font-weight:700;">
✓ Inquiry Sent Successfully
</strong>

<p style="margin:14px 0 0;color:#64748B;">
Thank you for your inquiry.<br>
GO7.IN will review your inquiry and respond within 24 hours.
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

const turnstileBox = document.querySelector(".cf-turnstile");
if (turnstileBox) {
    turnstileBox.style.display = "none";
}
btn.style.display = "none";

    let remaining = Math.max(0, Number(data.retryAfter) || 0);

   const updateCountdown = () => {

    const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
const s = String(remaining % 60).padStart(2, "0");

feedback.innerHTML = `
<div style="line-height:1.7">

<strong style="display:block;color:#B45309;font-size:17px;font-weight:700;">
⚠ Too many inquiry attempts.
</strong>

<p style="margin:14px 0 0;color:#64748B;">
Please try again in
</p>

<div style="
display:flex;
justify-content:center;
gap:10px;
margin-top:16px;
">

<div style="
width:80px;
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
width:80px;
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
width:80px;
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

if (typeof turnstile !== "undefined") {
    turnstile.reset();
}

            return;
        }

        updateCountdown();

    }, 1000);

} else {

    feedback.innerHTML =
        '<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>' +
        (data.error || data.message || "Unknown Error");

    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
    btn.style.cursor = "pointer";
}
}

   } catch (err) {
    console.error(err);

if (typeof turnstile !== "undefined") {
    turnstile.reset();
}

    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#B45309";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
'<i class="mdi mdi-alert-outline" style="margin-right:8px;"></i>Unable to send your inquiry. Please check your internet connection and try again.';
    const turnstileBox = document.querySelector(".cf-turnstile");

if (turnstileBox) {
    turnstileBox.style.display = "";
}

btn.style.display = "";
    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
    btn.style.cursor = "pointer";
}
});
