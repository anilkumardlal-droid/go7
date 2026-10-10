/*
 * AVAVA Car — theme bootstrap.
 * Runs in <head> before the page paints so neither the theme nor the accent flashes.
 *
 * Theme:  localStorage "avava-theme"  = "light" | "dark" | "system" (follows the OS, set on account › Preferences).
 * Motion: localStorage "avava-motion" = "reduce" turns animations off site-wide (<html data-motion="reduce">).
 * Accent: every Home version has its own accent (<html data-accent="v1|v2">) and
 *         remembers it in localStorage "avava-accent". Inner pages carry
 *         data-accent="inherit" and take the accent of the Home seen last.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var SKIN = { v1: '', v2: 'green', v3: 'blue' };
  var theme = 'light';
  var accent = root.getAttribute('data-accent');

  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  var stored = read('avava-theme');
  var osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (stored === 'system' && osDark)) {
    theme = 'dark';
  } else if (!stored && root.hasAttribute('data-theme-auto') && window.matchMedia &&
             window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Listing Map v3 follows the system theme on the first visit
    theme = 'dark';
  }
  root.setAttribute('data-theme', theme);
  if (read('avava-motion') === 'reduce') {
    root.setAttribute('data-motion', 'reduce');
  }

  if (accent === 'inherit') {
    var saved = read('avava-accent');
    if (SKIN[saved]) {
      root.setAttribute('data-skin', SKIN[saved]);
    }
  } else if (SKIN.hasOwnProperty(accent)) {
    try {
      window.localStorage.setItem('avava-accent', accent);
    } catch (e) {
      // storage blocked — inner pages fall back to the default accent
    }
  }
}());
