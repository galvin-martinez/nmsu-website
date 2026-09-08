/* Tab-title easter egg.
 *
 * Deliberately an external file rather than inline: the CSP allows
 * script-src 'self', so this needs no policy change. Adding it to the inline
 * theme script would have invalidated that script's sha256 hash and silently
 * broken the theme toggle. */
(function () {
  var original = document.title;
  var away = 'Come back, Aggie! 🔴';

  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? away : original;
  });
})();
