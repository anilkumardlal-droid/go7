document.getElementById("contact-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    document.querySelector(".contact-feedback").innerHTML = "";
   const message = document.getElementById("contact-message").value.trim();

if (message.length < 20) {

    const feedback = document.querySelector(".contact-feedback");

    feedback.style.color = "#D97706";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
        "⚠ Please describe your offer in at least 20 characters.";

    return;
}
    const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!token) {

    const feedback = document.querySelector(".contact-feedback");

    feedback.style.color = "#D97706";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
        "⚠ Please complete the security check.";

    return;
}

    const btn = document.getElementById("contact-submit");
    btn.disabled = true;
    btn.innerHTML = "Sending...";
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

        if (data.success) {
        const feedback = document.querySelector(".contact-feedback");

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
    console.log(data);

    const feedback = document.querySelector(".contact-feedback");

    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#D97706";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
        "⚠ " + (data.error || data.message || "Unknown Error");

    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
    btn.style.cursor = "pointer";
}

   } catch (err) {
    console.error(err);

    const feedback = document.querySelector(".contact-feedback");

    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#D97706";
    feedback.style.fontWeight = "600";

    feedback.innerHTML =
"⚠ Unable to send your inquiry. Please check your internet connection and try again.";

    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
    btn.style.cursor = "pointer";
}
});
