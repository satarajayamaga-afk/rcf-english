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

  // Owner mode. Visiting any page with ?noads=1 switches advertising off for
  // that browser, for good; ?noads=0 switches it back on. It is meant for the
  // people who run the site: browse your own pages as much as you like
  // without risking a click on your own advertisement, which is the quickest
  // way an AdSense account is closed, and without your own visits counting as
  // impressions.
  //
  // It only ever hides advertising from the person who asked for it. Nothing
  // about an ad's behaviour is changed for anybody else, which would breach
  // Google's terms.
  var KEY = "rcf-no-ads";
  var off = false;
  try {
    var asked = new URLSearchParams(window.location.search).get("noads");
    if (asked === "1") localStorage.setItem(KEY, "1");
    else if (asked === "0") localStorage.removeItem(KEY);
    off = localStorage.getItem(KEY) === "1";
  } catch (err) {
    // A browser with storage blocked simply sees the advertisements.
    off = false;
  }
  if (off) {
    // Take the reserved spaces out of the page as well, so no empty labelled
    // box is left behind.
    var spaces = document.querySelectorAll(".adslot");
    for (var s = 0; s < spaces.length; s++) spaces[s].remove();
    return;
  }

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
