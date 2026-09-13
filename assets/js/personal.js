/* ==========================================================================
   RCF English - personal features on every page

     Recently viewed   the last 12 pages opened on this device
     Save this page    a bookmark button beside the breadcrumbs
     Reading options   text size, high contrast, wider spacing, read aloud
     Offline           registers the service worker (sw.js) so pages already
                       opened can be read again without a connection

   Everything is kept in this browser (localStorage). Nothing is sent
   anywhere and there is no account. "My RCF English" (my/) shows it all.
   ========================================================================== */

(function () {
  "use strict";

  var ROOT = document.body.getAttribute("data-root") || "";
  var KEYS = { recent: "rcf-recent", saved: "rcf-saved", reading: "rcf-reading" };

  function read(key, fallback) {
    try { var v = JSON.parse(window.localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  /* A page's address relative to the site root, so it works on any host. */
  function here() {
    var a = document.createElement("a");
    a.href = ROOT || "./";
    var base = a.pathname;
    var path = window.location.pathname;
    return path.indexOf(base) === 0 ? path.slice(base.length) : path.replace(/^\//, "");
  }

  function pageTitle() {
    var h1 = document.querySelector("main h1");
    var t = (h1 && h1.textContent.trim()) || document.title.split("|")[0].trim();
    return t.slice(0, 120);
  }

  function section() {
    var crumbs = document.querySelectorAll(".breadcrumbs li");
    if (crumbs.length > 2) return crumbs[crumbs.length - 2].textContent.trim();
    var kicker = document.querySelector(".page-hero__kicker");
    return kicker ? kicker.textContent.trim() : "";
  }

  var path = here();
  var isUtility = /^(my\/|search\/|offline\/|404)/.test(path);

  /* ------------------------------------------------------ recently viewed */

  if (!isUtility && path !== "" && path !== "index.html") {
    var recent = read(KEYS.recent, []).filter(function (r) { return r && r.url !== path; });
    recent.unshift({ url: path, title: pageTitle(), section: section(), at: Date.now() });
    write(KEYS.recent, recent.slice(0, 12));
  }

  /* --------------------------------------------------------- save button */

  var crumbs = document.querySelector(".breadcrumbs .container");
  if (crumbs && !isUtility) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "save-page";
    var paint = function () {
      var saved = read(KEYS.saved, []).some(function (s) { return s.url === path; });
      btn.setAttribute("aria-pressed", saved ? "true" : "false");
      btn.innerHTML = '<span aria-hidden="true">' + (saved ? "★" : "☆") + "</span> " + (saved ? "Saved" : "Save this page");
    };
    btn.addEventListener("click", function () {
      var list = read(KEYS.saved, []);
      var i = -1;
      list.forEach(function (s, n) { if (s.url === path) i = n; });
      if (i >= 0) list.splice(i, 1);
      else list.unshift({ url: path, title: pageTitle(), section: section(), at: Date.now() });
      if (!write(KEYS.saved, list.slice(0, 100))) {
        btn.textContent = "This browser is not allowing saving";
        return;
      }
      paint();
    });
    paint();
    crumbs.appendChild(btn);
  }

  /* ----------------------------------------------------- reading options */

  var SIZES = [1, 1.15, 1.3];
  var prefs = read(KEYS.reading, {});

  function apply() {
    var html = document.documentElement;
    html.style.setProperty("--reading-scale", String(SIZES[prefs.size || 0] || 1));
    html.classList.toggle("reading-large", (prefs.size || 0) > 0);
    html.classList.toggle("reading-contrast", !!prefs.contrast);
    html.classList.toggle("reading-spacing", !!prefs.spacing);
  }
  apply();

  var panel = document.createElement("div");
  panel.className = "reading-tools";
  panel.innerHTML =
    '<button type="button" class="reading-tools__toggle" aria-expanded="false" aria-controls="reading-tools-panel">' +
    '<span aria-hidden="true">Aa</span><span class="visually-hidden">Reading options</span></button>' +
    '<div class="reading-tools__panel" id="reading-tools-panel" role="group" aria-label="Reading options" hidden>' +
    '<p class="reading-tools__title">Reading options</p>' +
    '<div class="reading-tools__row" role="group" aria-label="Text size">' +
    '<button type="button" data-size="0">A</button><button type="button" data-size="1">A+</button><button type="button" data-size="2">A++</button></div>' +
    '<label class="reading-tools__check"><input type="checkbox" data-pref="contrast"> High contrast</label>' +
    '<label class="reading-tools__check"><input type="checkbox" data-pref="spacing"> Wider letter and line spacing</label>' +
    '<button type="button" class="reading-tools__read" data-read>Read this page aloud</button>' +
    '<p class="reading-tools__note">Your choices are kept on this device.</p></div>';
  document.body.appendChild(panel);

  var toggle = panel.querySelector(".reading-tools__toggle");
  var box = panel.querySelector(".reading-tools__panel");
  var readBtn = panel.querySelector("[data-read]");

  function paintPanel() {
    Array.prototype.forEach.call(panel.querySelectorAll("[data-size]"), function (b) {
      b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-size")) === (prefs.size || 0)));
    });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-pref]"), function (c) {
      c.checked = !!prefs[c.getAttribute("data-pref")];
    });
  }
  paintPanel();

  toggle.addEventListener("click", function () {
    var open = box.hidden;
    box.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) { var first = box.querySelector("button"); if (first) first.focus(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) { box.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
  });
  panel.addEventListener("click", function (e) {
    var s = e.target.closest("[data-size]");
    if (s) { prefs.size = Number(s.getAttribute("data-size")); write(KEYS.reading, prefs); apply(); paintPanel(); }
  });
  panel.addEventListener("change", function (e) {
    var c = e.target.closest("[data-pref]");
    if (c) { prefs[c.getAttribute("data-pref")] = c.checked; write(KEYS.reading, prefs); apply(); }
  });

  /* Read aloud: the main content, a paragraph at a time, with the one being
     read highlighted. Pages with their own players are left to those. */
  var speaking = false;
  if (!("speechSynthesis" in window)) {
    readBtn.hidden = true;
  } else {
    readBtn.addEventListener("click", function () {
      if (speaking) { speaking = false; window.speechSynthesis.cancel(); readBtn.textContent = "Read this page aloud"; return; }
      var main = document.getElementById("main");
      var parts = Array.prototype.filter.call(
        main.querySelectorAll("h1, h2, h3, p, li, td, th, dt, dd"),
        function (el) {
          if (el.closest("[hidden], .reading-tools, nav, script, style, .visually-hidden")) return false;
          if (el.querySelector("p, li, h2, h3")) return false;
          return el.textContent.trim().length > 1;
        }
      );
      if (!parts.length) return;
      var voices = window.speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); });
      var voice = voices.filter(function (v) { return /GB|IN/i.test(v.lang); })[0] || voices[0];
      speaking = true;
      readBtn.textContent = "Stop reading";
      var i = 0;
      var done = function () {
        speaking = false;
        readBtn.textContent = "Read this page aloud";
        Array.prototype.forEach.call(document.querySelectorAll(".is-being-read"), function (el) { el.classList.remove("is-being-read"); });
      };
      var next = function () {
        Array.prototype.forEach.call(document.querySelectorAll(".is-being-read"), function (el) { el.classList.remove("is-being-read"); });
        if (!speaking || i >= parts.length) { done(); return; }
        var el = parts[i++];
        el.classList.add("is-being-read");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        var u = new SpeechSynthesisUtterance(el.textContent.replace(/\s+/g, " ").trim());
        if (voice) u.voice = voice;
        u.rate = 0.95;
        u.onend = next;
        u.onerror = function () { done(); };
        window.speechSynthesis.speak(u);
      };
      window.speechSynthesis.cancel();
      next();
    });
    window.addEventListener("pagehide", function () { window.speechSynthesis.cancel(); });
  }

  /* ------------------------------------------------------------- offline */

  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(ROOT + "sw.js").then(function (reg) {
        reg.addEventListener("updatefound", function () {
          var worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              var note = document.createElement("div");
              note.className = "update-note";
              note.setAttribute("role", "status");
              note.innerHTML = 'RCF English has been updated. <button type="button">Show the new version</button>';
              note.querySelector("button").addEventListener("click", function () {
                navigator.serviceWorker.addEventListener("controllerchange", function () { window.location.reload(); });
                worker.postMessage("skipWaiting");
                window.setTimeout(function () { window.location.reload(); }, 1500);
              });
              document.body.appendChild(note);
            }
          });
        });
      }).catch(function () { /* offline reading simply is not available */ });
    });
  }
})();
