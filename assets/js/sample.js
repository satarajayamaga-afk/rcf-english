/* ==========================================================================
   RCF English - the sample page viewer

   Each sample page on a book card is an ordinary link to the full-size
   picture. That works on its own: with JavaScript off, or if this file fails
   to load, tapping a page still opens it. Nothing here is required to see a
   sample.

   What this adds is the part that was tedious without it. Five pages meant
   five separate tabs, opened and closed one at a time, with no way to go from
   one page to the next. Now the first tap opens a viewer over the page and
   the arrows move through that book's pages in order.

   The viewer traps nothing it should not: Escape closes it, the arrow keys
   move, the background is clickable to dismiss, and focus returns to the
   thumbnail the reader came from.
   ========================================================================== */

(function () {
  "use strict";

  var groups = document.querySelectorAll(".psample__pages");
  if (!groups.length) return;

  var viewer = null;
  var pages = [];      // { href, label } for the book being viewed
  var at = 0;
  var opener = null;   // the thumbnail to put focus back on

  function build() {
    var el = document.createElement("div");
    el.className = "sviewer";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Sample pages");
    el.innerHTML =
      '<div class="sviewer__inner">' +
        '<img class="sviewer__img" alt="">' +
        '<p class="sviewer__count" data-count></p>' +
      '</div>' +
      '<button type="button" class="sviewer__close" aria-label="Close">&times;</button>' +
      '<button type="button" class="sviewer__nav sviewer__nav--prev" aria-label="Previous page">&#8249;</button>' +
      '<button type="button" class="sviewer__nav sviewer__nav--next" aria-label="Next page">&#8250;</button>';

    el.querySelector(".sviewer__close").addEventListener("click", close);
    el.querySelector(".sviewer__nav--prev").addEventListener("click", function () { move(-1); });
    el.querySelector(".sviewer__nav--next").addEventListener("click", function () { move(1); });
    // Clicking the backdrop closes; clicking the picture itself does not.
    el.addEventListener("click", function (e) { if (e.target === el) close(); });

    document.body.appendChild(el);
    return el;
  }

  function show() {
    var p = pages[at];
    var img = viewer.querySelector(".sviewer__img");
    img.setAttribute("src", p.href);
    img.setAttribute("alt", p.label);
    viewer.querySelector("[data-count]").textContent = "Page " + (at + 1) + " of " + pages.length;
    // With one page there is nowhere to go, so hide the arrows entirely.
    var many = pages.length > 1;
    viewer.querySelector(".sviewer__nav--prev").hidden = !many;
    viewer.querySelector(".sviewer__nav--next").hidden = !many;
  }

  function move(step) {
    if (!pages.length) return;
    at = (at + step + pages.length) % pages.length;   // wraps, so it never dead-ends
    show();
  }

  function open(list, index, from) {
    pages = list;
    at = index;
    opener = from;
    if (!viewer) viewer = build();
    show();
    viewer.classList.add("sviewer--on");
    document.body.classList.add("sviewer-open");
    document.addEventListener("keydown", onKey);
    viewer.querySelector(".sviewer__close").focus();
  }

  function close() {
    if (!viewer) return;
    viewer.classList.remove("sviewer--on");
    document.body.classList.remove("sviewer-open");
    document.removeEventListener("keydown", onKey);
    // Let the picture go, so a long shelf of samples does not sit in memory.
    viewer.querySelector(".sviewer__img").removeAttribute("src");
    if (opener && opener.focus) opener.focus();
    opener = null;
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowLeft") { move(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { move(1); e.preventDefault(); }
  }

  Array.prototype.forEach.call(groups, function (group) {
    var links = group.querySelectorAll(".psample__link");
    var list = Array.prototype.map.call(links, function (a) {
      var img = a.querySelector("img");
      return { href: a.getAttribute("href"), label: img ? img.getAttribute("alt") : "Sample page" };
    });

    Array.prototype.forEach.call(links, function (a, i) {
      a.addEventListener("click", function (e) {
        // Leave the ordinary behaviour alone when the reader asks for a new
        // tab or window: ctrl/cmd-click, middle click, shift-click.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        open(list, i, a);
      });
    });
  });
})();
