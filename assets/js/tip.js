/* ==========================================================================
   RCF English - the daily tip

   The build writes one tip into the page as ordinary HTML, so the block is
   never empty and a reader with JavaScript switched off still gets something
   real. This script's only job is to swap in the tip for today, so it changes
   daily without the site being rebuilt.

   Everyone sees the same tip on the same day: the choice is made from the
   date, not at random. A reader who comes back tomorrow finds a different
   one, which is the whole point; a reader who opens three pages today finds
   the same one, which is less annoying than three different ones.

   If the file cannot be fetched, nothing happens and the built-in tip stays.
   ========================================================================== */

(function () {
  "use strict";

  var blocks = document.querySelectorAll("[data-tip]");
  if (!blocks.length) return;

  var ROOT = document.body.getAttribute("data-root") || "";

  var LABELS = {
    quote: "Worth remembering",
    grammar: "Grammar point",
    teaching: "For the classroom",
    exam: "Examination technique"
  };

  /* Days since an arbitrary fixed date, in the reader's own timezone. Using
     the date rather than Math.random keeps every visitor on the same tip and
     makes the rotation predictable to test. */
  function dayNumber() {
    var now = new Date();
    var utcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor(utcMidnight / 86400000);
  }

  function setLine(el, value) {
    if (!el) return;
    if (value) {
      el.textContent = value;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  fetch(ROOT + "data/tips.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.tips) || !data.tips.length) return;

      Array.prototype.forEach.call(blocks, function (block) {
        var wanted = block.getAttribute("data-tip-kind");
        var pool = wanted
          ? data.tips.filter(function (t) { return t.kind === wanted; })
          : data.tips;
        if (!pool.length) return;

        var pick = pool[dayNumber() % pool.length];

        /* The text may carry the site's **bold** markup. Rather than ship a
           parser, take only the plain words: a tip is one sentence and loses
           nothing without emphasis. */
        var text = String(pick.text || "").replace(/\*\*/g, "");

        setLine(block.querySelector("[data-tip-text]"), text);
        setLine(block.querySelector("[data-tip-source]"), pick.source || "");
        setLine(block.querySelector("[data-tip-note]"), String(pick.note || "").replace(/\*\*/g, ""));

        var label = block.querySelector("[data-tip-label]");
        if (label) label.textContent = LABELS[pick.kind] || "Worth knowing";
      });
    })
    .catch(function () {
      /* Offline, or the file has moved. The tip the build wrote is still
         there and still correct, so there is nothing to report. */
    });
})();
