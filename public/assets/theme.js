/* Theme toggle.
 *
 * Default is the operating system's preference, handled purely in CSS via
 * @media (prefers-color-scheme: dark). This script only deals with an explicit
 * override: it writes data-theme="light" | "dark" on <html> and remembers the
 * choice in localStorage.
 *
 * The initial attribute is set by a small inline script in each page's <head>
 * so the correct theme paints on the first frame (no flash of the wrong one).
 * This file runs deferred and only wires up the button.
 */
(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  /* localStorage throws in some privacy modes, so every access is guarded. */
  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* Preference just won't persist across pages; the toggle still works. */
    }
  }

  /* What the visitor is actually looking at right now. */
  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') {
      return explicit;
    }
    return media.matches ? 'dark' : 'light';
  }

  function describe(button) {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    var text = 'Switch to ' + next + ' theme';
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
  }

  function init() {
    var button = document.querySelector('.theme-toggle');
    if (!button) {
      return;
    }

    /* Only reveal the control once we know JS can drive it. */
    button.hidden = false;
    describe(button);

    button.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      writeStored(next);
      describe(button);
    });

    /* While still following the OS, keep the button's label truthful if the
       system flips (e.g. a scheduled night mode) — CSS reacts on its own. */
    var onSystemChange = function () {
      if (!readStored()) {
        describe(button);
      }
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onSystemChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onSystemChange); /* Safari < 14 */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
