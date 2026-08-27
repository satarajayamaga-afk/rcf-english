/* ==========================================================================
   RCF English - navigation
   Desktop mega menus + mobile accordion drawer.

   Everything degrades gracefully: with JavaScript switched off, each top-level
   menu item is still an ordinary link to its section landing page, and the
   drawer markup is a plain list of links.
   ========================================================================== */

(function () {
  "use strict";

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ---------------------------------------------------------------- utils */

  function on(el, type, fn) {
    if (el) el.addEventListener(type, fn);
  }

  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  /* -------------------------------------------------- desktop mega menus */

  var megaButtons = Array.prototype.slice.call(
    document.querySelectorAll(".main-nav__button[aria-controls]")
  );

  function panelOf(button) {
    return document.getElementById(button.getAttribute("aria-controls"));
  }

  function closeMega(button, returnFocus) {
    var panel = panelOf(button);
    if (!panel || button.getAttribute("aria-expanded") !== "true") return;
    button.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    if (returnFocus) button.focus();
  }

  function closeAllMega(except, returnFocus) {
    megaButtons.forEach(function (b) {
      if (b !== except) closeMega(b, returnFocus === true && b === except);
    });
  }

  function openMega(button) {
    var panel = panelOf(button);
    if (!panel) return;
    closeAllMega(button);
    button.setAttribute("aria-expanded", "true");
    panel.hidden = false;
  }

  function toggleMega(button) {
    if (button.getAttribute("aria-expanded") === "true") closeMega(button, true);
    else openMega(button);
  }

  megaButtons.forEach(function (button) {
    var panel = panelOf(button);
    if (!panel) return;
    var item = button.closest(".main-nav__item");

    on(button, "click", function (event) {
      event.preventDefault();
      toggleMega(button);
    });

    /* Hover is a convenience only - never the sole way in. */
    var hoverTimer = null;
    on(item, "mouseenter", function () {
      if (!window.matchMedia("(hover: hover) and (min-width: 1240px)").matches) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(function () {
        openMega(button);
      }, 90);
    });
    on(item, "mouseleave", function () {
      if (!window.matchMedia("(hover: hover) and (min-width: 1240px)").matches) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(function () {
        closeMega(button, false);
      }, 180);
    });

    /* Arrow Down from the button moves into the panel. */
    on(button, "keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Down") {
        event.preventDefault();
        openMega(button);
        var first = focusables(panel)[0];
        if (first) first.focus();
      }
    });

    /* Tabbing past the last link closes the panel tidily. */
    on(panel, "keydown", function (event) {
      if (event.key !== "Tab") return;
      var items = focusables(panel);
      if (!items.length) return;
      if (!event.shiftKey && event.target === items[items.length - 1]) {
        closeMega(button, false);
      } else if (event.shiftKey && event.target === items[0]) {
        closeMega(button, false);
        button.focus();
        event.preventDefault();
      }
    });

    /* Left / right arrows move between top-level menu buttons. */
    on(button, "keydown", function (event) {
      var idx = megaButtons.indexOf(button);
      if (event.key === "ArrowRight" && idx < megaButtons.length - 1) {
        event.preventDefault();
        megaButtons[idx + 1].focus();
      } else if (event.key === "ArrowLeft" && idx > 0) {
        event.preventDefault();
        megaButtons[idx - 1].focus();
      }
    });
  });

  /* Escape closes the open panel; click outside closes it too. */
  on(document, "keydown", function (event) {
    if (event.key !== "Escape" && event.key !== "Esc") return;
    megaButtons.forEach(function (b) {
      if (b.getAttribute("aria-expanded") === "true") {
        var inside = panelOf(b).contains(document.activeElement) || document.activeElement === b;
        closeMega(b, inside);
      }
    });
  });

  on(document, "click", function (event) {
    megaButtons.forEach(function (b) {
      if (b.getAttribute("aria-expanded") !== "true") return;
      var panel = panelOf(b);
      if (!b.contains(event.target) && !panel.contains(event.target)) closeMega(b, false);
    });
  });

  on(window, "resize", function () {
    if (window.innerWidth < 1240) closeAllMega(null, false);
  });

  /* --------------------------------------------------- mobile nav drawer */

  var drawer = document.getElementById("nav-drawer");
  var toggle = document.querySelector(".nav-toggle");
  var lastFocused = null;

  function openDrawer() {
    if (!drawer || !toggle) return;
    lastFocused = document.activeElement;
    drawer.setAttribute("data-open", "true");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    var target =
      drawer.querySelector('.drawer-nav__link[aria-current]') ||
      drawer.querySelector(".nav-drawer__close");
    if (target) target.focus();
  }

  function closeDrawer() {
    if (!drawer || !toggle) return;
    drawer.setAttribute("data-open", "false");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    /* Return focus to whatever opened the drawer. If that is no longer a
       focusable element - or the drawer was opened without a real click -
       fall back to the menu button, so focus is never lost on the page. */
    if (lastFocused && lastFocused !== document.body && document.contains(lastFocused)) {
      lastFocused.focus();
    } else {
      toggle.focus();
    }
  }

  on(toggle, "click", function () {
    if (toggle.getAttribute("aria-expanded") === "true") closeDrawer();
    else openDrawer();
  });

  if (drawer) {
    Array.prototype.forEach.call(
      drawer.querySelectorAll("[data-close-drawer]"),
      function (el) {
        on(el, "click", closeDrawer);
      }
    );

    on(drawer, "keydown", function (event) {
      if (event.key === "Escape" || event.key === "Esc") {
        event.stopPropagation();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      var panel = drawer.querySelector(".nav-drawer__panel");
      var items = focusables(panel);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* Accordion sections inside the drawer. */
    Array.prototype.forEach.call(
      drawer.querySelectorAll(".drawer-nav__toggle"),
      function (button) {
        on(button, "click", function () {
          var panel = document.getElementById(button.getAttribute("aria-controls"));
          if (!panel) return;
          var open = button.getAttribute("aria-expanded") === "true";
          button.setAttribute("aria-expanded", open ? "false" : "true");
          panel.hidden = open;
        });
      }
    );
  }

  on(window, "resize", function () {
    if (window.innerWidth >= 1240 && drawer && drawer.getAttribute("data-open") === "true") {
      closeDrawer();
    }
  });

  /* --------------------------------------- small-screen search disclosure */

  var searchToggle = document.querySelector(".search-toggle");
  on(searchToggle, "click", function () {
    var form = document.getElementById(searchToggle.getAttribute("aria-controls"));
    if (!form) return;
    var open = searchToggle.getAttribute("aria-expanded") === "true";
    searchToggle.setAttribute("aria-expanded", open ? "false" : "true");
    form.hidden = open;
    if (!open) {
      var input = form.querySelector("input");
      if (input) input.focus();
    }
  });
})();
