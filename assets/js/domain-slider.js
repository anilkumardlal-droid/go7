(() => {
  "use strict";

  const slider = document.getElementById("domainSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".domain-slide"));
  const buttons = Array.from(slider.querySelectorAll(".domain-slider__dotbtn"));
  const counter = document.getElementById("domainSlideCurrent");
  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const intervalMs = 4500;
  let current = 0;
  let timer = null;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.tabIndex = active ? 0 : -1;
    });

    buttons.forEach((button, i) => {
      const active = i === current;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (counter) counter.textContent = String(current + 1).padStart(2, "0");
  }

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (reduceMotion.matches || document.hidden) return;
    timer = window.setInterval(() => showSlide(current + 1), intervalMs);
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showSlide(index);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", (event) => {
    if (!slider.contains(event.relatedTarget)) start();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", start);
  }

  showSlide(0);
  start();
})();
