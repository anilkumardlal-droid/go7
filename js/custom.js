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

(function () {

    const source = new URLSearchParams(window.location.search).get("source");

    let domain = "GO7.IN";

    if (source) {
        const cleaned = source
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0];

        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
            domain = cleaned.toUpperCase();
        }
    }

    document.getElementById("domain-name").textContent =
        "www." + domain;

    document.getElementById("interest-title").textContent =
        "Interested in " + domain + "?";

    document.getElementById("inquiry-description").textContent =
        "Interested in " + domain + "? Submit your inquiry or offer.";

})();

(function () { 
 
    if (window.innerWidth <= 767) { 
 
        window.addEventListener("load", function () { 
 
            setTimeout(function () { 
 
                const contactForm = 
                    document.getElementById("contact-form"); 
 
                if (!contactForm) return; 
 
                contactForm.scrollIntoView({ 
                    behavior: "smooth", 
                    block: "start" 
                }); 
 
            }, 9000); 
 
        }, { once: true }); 
 
    } 
 
})();

<script>
$(function () {

  var privacyLink = document.getElementById('privacy-policy-link');
  var privacyOverlay = document.getElementById('privacy-overlay');
  var privacyBody = document.getElementById('privacy-overlay-body');
  var privacyClose = document.getElementById('privacy-overlay-close');
  var privacyBackdrop = document.getElementById('privacy-overlay-backdrop');

  function openPrivacy() {

    privacyOverlay.classList.add('is-open');
    privacyOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('privacy-overlay-open');

    fetch('/privacy', {
      credentials: 'same-origin'
    })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Privacy Policy could not be loaded.');
      }

      return response.text();
    })
    .then(function (text) {

      var parser = new DOMParser();
      var doc = parser.parseFromString(text, 'text/html');
      var source = doc.querySelector('.privacy-card');

      if (!source) {
        throw new Error('Privacy content not found.');
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'privacy-overlay-content';
      wrapper.innerHTML = source.innerHTML;

      wrapper.querySelectorAll(
        '.privacy-back, #back-to-top, .footer'
      ).forEach(function (el) {
        el.remove();
      });

      privacyBody.innerHTML = '';
      privacyBody.appendChild(wrapper);
    })
    .catch(function () {

      privacyBody.innerHTML =
        '<div class="privacy-overlay-content">' +
        '<p class="text-muted">' +
        'The Privacy Policy could not be loaded here. ' +
        '<a href="/privacy">Open Privacy Policy</a>.' +
        '</p>' +
        '</div>';
    });
  }

  function closePrivacy() {

    privacyOverlay.classList.remove('is-open');
    privacyOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('privacy-overlay-open');
  }

  privacyLink.addEventListener('click', function (event) {
    event.preventDefault();
    openPrivacy();
  });

  privacyClose.addEventListener('click', closePrivacy);

  privacyBackdrop.addEventListener('click', closePrivacy);

  document.addEventListener('keydown', function (event) {

    if (
      event.key === 'Escape' &&
      privacyOverlay.classList.contains('is-open')
    ) {
      closePrivacy();
    }

  });

});
</script>
