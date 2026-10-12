
document.addEventListener('DOMContentLoaded', function () {
  if (document.documentElement.getAttribute('data-accent') !== 'inherit') {
    return;
  }

  document.querySelectorAll('.js-home').forEach(function (a) {
    a.removeAttribute('data-home-original');
    a.addEventListener('click', function (e) {
      // Existing click behavior remains unchanged.
    });
  });
});
