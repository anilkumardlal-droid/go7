e.preventDefault();

const feedback = document.querySelector(".contact-feedback");
const btn = document.getElementById("contact-submit");

feedback.innerHTML = "";
feedback.style.color = "";

const message = document.getElementById("contact-message").value.trim();

if (message.length < 20) {
    feedback.style.color = "#dc3545";
    feedback.innerHTML = "Please describe your offer in at least 20 characters.";
    return;
}

const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

if (!token) {
    feedback.style.color = "#dc3545";
    feedback.innerHTML = "Please complete the security check.";
    return;
}

btn.disabled = true;
btn.value = "Sending...";

    try {
        const res = await fetch("https://info.anilsrivastav561.workers.dev/", {
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
    <div style="line-height:1.6;">
        <strong style="color:#22C55E;font-size:17px;font-weight:600;">
    ✓ Inquiry Sent Successfully
</strong><br><br>

<span style="color:#10a6ba;">
    Thanks for your interest in GO7.IN. I'll get back to you soon.
    Redirecting in <strong style="color:#FE872D;">${seconds}</strong>
    second${seconds !== 1 ? "s" : ""}...
</span>
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
            feedback.style.color = "#dc3545";
feedback.innerHTML =
                "✗ " + (data.error || data.message || "Unknown Error");
          btn.disabled = false;
btn.value = "Send Inquiry";
        }

   } catch (err) {
    console.error(err);

    feedback.style.color = "#dc3545";
feedback.innerHTML =
        "✗ " + err.message;

    btn.disabled = false;
    btn.value = "Send Inquiry";
}
});
