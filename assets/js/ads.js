// Fills the advertisement spaces on this page.
//
// Google's own snippet is an inline script next to each ad unit. This site's
// Content-Security-Policy does not allow inline scripts, and adding a hash
// for Google's snippet would be one more thing to keep in step, so the push
// happens here instead: once for each space the page actually drew.
//
// The build only draws a space when an ad unit is named for it in
// config.json, so if this script runs there is something to fill.
(function () {
  "use strict";
  var units = document.querySelectorAll("ins.adsbygoogle");
  if (!units.length) return;

  for (var i = 0; i < units.length; i++) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // An ad that cannot load must never stop the rest of the page. This
      // happens normally when a blocker is in use, and is not an error worth
      // reporting to the visitor.
      break;
    }
  }
})();
