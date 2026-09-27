(() => {
  const field = document.getElementById("particles");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!field || reduceMotion) return;

  const count = window.matchMedia("(max-width: 600px)").matches ? 48 : 88;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("i");
    particle.className = "particle";

    const size = 1 + Math.random() * 2.4;

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty("--duration", `${2.4 + Math.random() * 4.2}s`);
    particle.style.setProperty("--delay", `${-Math.random() * 5}s`);

    fragment.appendChild(particle);
  }

  field.appendChild(fragment);
})();
