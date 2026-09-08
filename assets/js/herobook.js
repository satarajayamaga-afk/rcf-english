/* ---------------------------------------------------------------------------
   The open book in the home hero.

   The book is already in the page and already looks like a book before this
   script runs: an open spread, floating, with its first two pages showing.
   All this adds is the turning.

   It turns one leaf, then waits a few seconds before turning the next, so a
   page goes over every five to eight seconds, which is the pace of somebody
   reading rather than somebody flicking. When it reaches the last page it
   waits a little longer and comes back the other way, so the loop never has
   to snap back to the start.

   It stops when you point at it, when the hero is scrolled out of sight, when
   the tab is in the background, and altogether if the visitor has asked for
   reduced motion. None of it carries information, so stopping costs nothing.
--------------------------------------------------------------------------- */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

const TURN_MS = 1750;      /* must match the transition in the stylesheet */
const PAUSE_MIN = 4000;
const PAUSE_MAX = 6500;
const PAUSE_END = 8500;    /* the longer look at the first and last spread */

const TILT_Y = 7;          /* degrees the book swings with the pointer */
const TILT_X = 5;
const REST_X = 23;         /* the tilt it sits at, matching the stylesheet */

function pause(atEnd) {
  if (atEnd) return PAUSE_END;
  return PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
}

function setUpBook(root) {
  const scene = root.querySelector(".hbook__scene");
  const book = root.querySelector("[data-hbook-book]");
  const leaves = Array.from(root.querySelectorAll("[data-hbook-leaf]"));
  if (!scene || !book || !leaves.length) return;

  /* Which leaf turns next, and which way we are going through the book. */
  let at = 0;
  let forward = true;

  let timer = null;
  let turning = null;
  let held = false;      /* the pointer is on the book */
  let onScreen = true;
  let running = false;

  function clear() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function stop() {
    running = false;
    clear();
  }

  function start() {
    if (running || REDUCED.matches || held || !onScreen || document.hidden) return;
    running = true;
    schedule(false);
  }

  function schedule(atEnd) {
    clear();
    timer = setTimeout(turn, pause(atEnd));
  }

  function turn() {
    if (!running) return;

    const leaf = leaves[at];
    if (!leaf) { running = false; return; }

    /* Going forward we turn the next leaf over; coming back we turn the last
       turned leaf back again. */
    turning = leaf;
    leaf.classList.add("is-turning");
    leaf.classList.toggle("is-turned", forward);

    window.setTimeout(() => {
      leaf.classList.remove("is-turning");
      if (turning === leaf) turning = null;

      let atEnd = false;
      if (forward) {
        at += 1;
        if (at >= leaves.length) { at = leaves.length - 1; forward = false; atEnd = true; }
      } else {
        at -= 1;
        if (at < 0) { at = 0; forward = true; atEnd = true; }
      }

      if (running) schedule(atEnd);
    }, TURN_MS);
  }

  /* ------------------------------------------------------------- pointer */

  /* A small amount of parallax, so the book feels like an object in the page
     rather than a picture of one. Written on the next frame rather than on
     every pointer event. */
  let queued = false;
  let wantX = REST_X;
  let wantY = 0;

  function apply() {
    queued = false;
    book.style.setProperty("--tilt-x", wantX.toFixed(2) + "deg");
    book.style.setProperty("--tilt-y", wantY.toFixed(2) + "deg");
  }

  function aim(event) {
    if (REDUCED.matches) return;
    const box = scene.getBoundingClientRect();
    if (!box.width || !box.height) return;
    /* -1 to 1 across the book, clamped so a pointer far away does not push
       the tilt any further than a pointer at the edge. */
    const dx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2));
    const dy = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - 0.5) * 2));
    wantY = dx * TILT_Y;
    wantX = REST_X - dy * TILT_X;
    if (!queued) { queued = true; requestAnimationFrame(apply); }
  }

  function rest() {
    wantX = REST_X;
    wantY = 0;
    if (!queued) { queued = true; requestAnimationFrame(apply); }
  }

  /* The pointer is tracked across the whole hero, not just the book itself,
     which is what makes it read as parallax rather than as a hover effect.
     Holding still, though, only happens on the book. */
  const hero = root.closest(".hero") || root;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    hero.addEventListener("pointermove", aim);
    hero.addEventListener("pointerleave", rest);
  }

  scene.addEventListener("pointerenter", () => {
    held = true;
    root.classList.add("is-held");
    stop();
  });
  scene.addEventListener("pointerleave", () => {
    held = false;
    root.classList.remove("is-held");
    start();
  });

  /* ------------------------------------------------------- when to run */

  if ("IntersectionObserver" in window) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start(); else stop();
      });
    }, { threshold: 0.25 });
    watch.observe(root);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  const motionChanged = () => {
    if (REDUCED.matches) {
      stop();
      rest();
    } else {
      start();
    }
  };
  if (typeof REDUCED.addEventListener === "function") {
    REDUCED.addEventListener("change", motionChanged);
  }

  start();
}

document.querySelectorAll("[data-hbook]").forEach(setUpBook);
