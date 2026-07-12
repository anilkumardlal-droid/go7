document.getElementById("contact-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const token = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!token) {
        document.querySelector(".contact-feedback").innerHTML =
        "Please complete the security check.";
        return;
    }

    const btn = document.getElementById("contact-submit");
    btn.disabled = true;
    btn.innerHTML = "Sending...";

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

    const feedback = document.querySelector(".contact-feedback");

    feedback.style.display = "block";
    feedback.style.visibility = "visible";
    feedback.style.opacity = "1";
    feedback.style.color = "#00d084";
    document.getElementById("contact-form").reset();

if (typeof turnstile !== "undefined") {
    turnstile.reset();
}

btn.style.display = "none";

let seconds = 10;

const updateMessage = () => {

    feedback.innerHTML = `
    <div style="line-height:1.8;">
        <strong style="color:#22C55E;font-size:17px;font-weight:600;">
    ✓ Inquiry Sent Successfully
</strong><br><br>

<span style="color:#BDBDBD;">
    Thank you for your interest in our premium domains.<br>
    Your inquiry has been received successfully. Our team will review it and get back to you as soon as possible.
</span><br><br>

<span style="color:#BDBDBD;">
    Redirecting to the Home page in
    <strong style="color:#FACC15;">${seconds}</strong>
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
            document.querySelector(".contact-feedback").innerHTML =
                "✗ " + (data.error || data.message || "Unknown Error");
          btn.disabled = false;
btn.innerHTML = "Send Inquiry";
        }

   } catch (err) {
    console.error(err);

    document.querySelector(".contact-feedback").innerHTML =
        "✗ " + err.message;

    btn.disabled = false;
    btn.innerHTML = "Send Inquiry";
}
});
