/* ---------------------------------------------------------------------------
   Watch and Write: the alphabet, for Grade 1.

   The page arrives with the whole alphabet as an ordinary list - each letter
   and a word for it - so it is useful with JavaScript off. This script turns
   that list into a writing board.

   A letter is drawn one stroke at a time on the four lines a child's copy book
   uses, with a pencil point moving along each stroke and a number at the place
   each stroke begins. The order and direction of the strokes are the point:
   a child who starts every letter in the right place and moves the right way
   joins up easily later, and one who does not has a habit to unlearn.

   Then the child has a turn, tracing over a dotted letter with a finger or a
   mouse. Nothing is scored. It is practice, not a test.

   Sound is light and optional: the letter name and a word for it, and a soft
   chime when a letter is finished.
--------------------------------------------------------------------------- */

import { REDUCED, Speech, speak } from "./speech.js";
import { Tones } from "./tones.js";

const SVGNS = "http://www.w3.org/2000/svg";
const W = 120;
const H = 130;
const LINE = { top: 15, mid: 50, base: 85, desc: 115 };

/* Stroke paths, in stroke order, each drawn in the direction the pencil moves.
   Capitals sit between the top line and the baseline. Small letters sit on the
   baseline with the body up to the middle line; tall letters reach the top line
   and tails drop to the lowest line. The formations are the plain print style
   taught in the early grades, not a joined script. */
const CAPITALS = {
  A: ["M30 15 L8 85", "M30 15 L52 85", "M17 58 L43 58"],
  B: ["M10 15 L10 85", "M10 15 L30 15 C46 15 46 50 30 50 L10 50", "M10 50 L33 50 C52 50 52 85 33 85 L10 85"],
  C: ["M52 27 C44 12 26 13 18 20 C6 31 6 69 18 80 C26 88 44 88 52 73"],
  D: ["M10 15 L10 85", "M10 15 L24 15 C58 15 58 85 24 85 L10 85"],
  E: ["M10 15 L10 85", "M10 15 L48 15", "M10 50 L42 50", "M10 85 L48 85"],
  F: ["M10 15 L10 85", "M10 15 L48 15", "M10 50 L42 50"],
  G: ["M52 27 C44 12 26 13 18 20 C6 31 6 69 18 80 C28 89 48 88 52 70 L52 56 L34 56"],
  H: ["M10 15 L10 85", "M50 15 L50 85", "M10 50 L50 50"],
  I: ["M20 15 L20 85"],
  J: ["M44 15 L44 64 C44 90 14 90 10 70"],
  K: ["M10 15 L10 85", "M48 15 L10 57", "M25 42 L50 85"],
  L: ["M10 15 L10 85 L46 85"],
  M: ["M8 15 L8 85", "M8 15 L32 60 L56 15 L56 85"],
  N: ["M10 15 L10 85", "M10 15 L50 85 L50 15"],
  O: ["M30 15 C8 15 6 40 6 50 C6 72 18 85 30 85 C44 85 54 72 54 50 C54 28 44 15 30 15"],
  P: ["M10 15 L10 85", "M10 15 L30 15 C50 15 50 52 30 52 L10 52"],
  Q: ["M30 15 C8 15 6 40 6 50 C6 72 18 85 30 85 C44 85 54 72 54 50 C54 28 44 15 30 15", "M34 66 L56 90"],
  R: ["M10 15 L10 85", "M10 15 L30 15 C50 15 50 52 30 52 L10 52", "M28 52 L50 85"],
  S: ["M50 27 C44 13 14 11 12 32 C10 50 50 46 50 67 C50 90 14 90 10 73"],
  T: ["M8 15 L52 15", "M30 15 L30 85"],
  U: ["M10 15 L10 62 C10 92 50 92 50 62 L50 15"],
  V: ["M8 15 L30 85 L52 15"],
  W: ["M4 15 L18 85 L32 38 L46 85 L60 15"],
  X: ["M10 15 L50 85", "M50 15 L10 85"],
  Y: ["M8 15 L30 50", "M52 15 L30 50 L30 85"],
  Z: ["M8 15 L50 15 L8 85 L50 85"]
};

const SMALL = {
  a: ["M44 57 C38 46 12 46 11 67 C10 90 42 91 44 70", "M44 50 L44 85"],
  b: ["M12 15 L12 85", "M12 66 C14 44 46 44 46 67 C46 90 14 90 12 70"],
  c: ["M44 56 C38 45 12 45 11 67 C10 90 38 91 44 79"],
  d: ["M44 57 C38 46 12 46 11 67 C10 90 42 91 44 70", "M44 15 L44 85"],
  e: ["M11 67 L45 67 C46 45 12 43 11 67 C10 90 38 91 44 80"],
  f: ["M42 20 C36 11 20 12 20 30 L20 85", "M8 50 L36 50"],
  g: ["M44 57 C38 46 12 46 11 67 C10 90 42 91 44 70", "M44 50 L44 100 C44 120 14 120 10 105"],
  h: ["M12 15 L12 85", "M12 64 C14 44 44 44 44 64 L44 85"],
  i: ["M22 50 L22 85", "M22 33 L22 34"],
  j: ["M30 50 L30 100 C30 118 10 118 6 106", "M30 33 L30 34"],
  k: ["M12 15 L12 85", "M40 48 L12 70", "M22 63 L42 85"],
  l: ["M22 15 L22 85"],
  m: ["M8 50 L8 85", "M8 62 C10 46 28 46 30 62 L30 85", "M30 62 C32 46 52 46 54 62 L54 85"],
  n: ["M12 50 L12 85", "M12 64 C14 44 44 44 44 64 L44 85"],
  o: ["M28 50 C8 50 8 85 28 85 C48 85 48 50 28 50"],
  p: ["M12 50 L12 115", "M12 66 C14 44 46 44 46 67 C46 90 14 90 12 70"],
  q: ["M44 57 C38 46 12 46 11 67 C10 90 42 91 44 70", "M44 50 L44 115"],
  r: ["M12 50 L12 85", "M12 64 C16 48 32 45 42 52"],
  s: ["M42 55 C36 45 12 45 12 58 C12 71 42 64 42 77 C42 90 14 91 10 80"],
  t: ["M24 22 L24 75 C24 88 36 88 42 82", "M10 50 L38 50"],
  u: ["M12 50 L12 70 C12 92 44 92 44 70", "M44 50 L44 85"],
  v: ["M8 50 L26 85 L44 50"],
  w: ["M4 50 L16 85 L28 58 L40 85 L52 50"],
  x: ["M10 50 L42 85", "M42 50 L10 85"],
  y: ["M8 50 L26 85", "M44 50 L18 115"],
  z: ["M10 50 L42 50 L10 85 L42 85"]
};

/* The next animation frame, with a timer behind it. Browsers stop sending
   frames to a page they think is not being looked at - a background tab, a
   phone saving power, an embedded preview - and a stroke animation that waits
   on frames would leave the child looking at a blank board with the pencil
   stuck. The timer keeps the letter being drawn, just less smoothly. */
function nextFrame(fn) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn(performance.now());
  };
  requestAnimationFrame(run);
  setTimeout(run, 50);
}

function svg(name, attrs = {}) {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let boardCount = 0;

function setUp(root) {
  const items = Array.from(root.querySelectorAll("[data-letter]")).map((li) => ({
    letter: li.dataset.letter,
    name: li.dataset.name,
    word: li.dataset.word,
    emoji: li.dataset.emoji
  }));
  if (!items.length) return;

  const uid = "abc" + ++boardCount;
  let index = 0;
  let upper = true;
  let tracing = false;
  let run = { cancelled: true };

  /* ------------------------------------------------------------ markup */

  root.classList.add("abc--ready");
  const app = document.createElement("div");
  app.className = "abc__app";
  app.innerHTML = `
    <div class="abc__toolbar">
      <div class="abc__case" role="group" aria-label="Letter size">
        <button type="button" class="abc__chip" data-case="upper" aria-pressed="true">Capital letters</button>
        <button type="button" class="abc__chip" data-case="lower" aria-pressed="false">Small letters</button>
      </div>
      <button type="button" class="abc__chip abc__sound" aria-pressed="${Tones.muted ? "false" : "true"}"></button>
    </div>
    <div class="abc__stage">
      <button type="button" class="abc__nav" data-step="-1" aria-label="Previous letter"><span aria-hidden="true">&#8249;</span></button>
      <div class="abc__board">
        <canvas class="abc__trace" hidden></canvas>
      </div>
      <button type="button" class="abc__nav" data-step="1" aria-label="Next letter"><span aria-hidden="true">&#8250;</span></button>
    </div>
    <p class="abc__caption" aria-live="polite"></p>
    <div class="abc__actions">
      <button type="button" class="abc__btn abc__btn--main" data-act="watch"><span aria-hidden="true">&#9654;</span> Watch</button>
      <button type="button" class="abc__btn" data-act="trace" aria-pressed="false"><span aria-hidden="true">&#9999;&#65039;</span> Your turn</button>
      <button type="button" class="abc__btn" data-act="clear" hidden><span aria-hidden="true">&#129533;</span> Clear</button>
      <button type="button" class="abc__btn" data-act="say"><span aria-hidden="true">&#128266;</span> Say it</button>
    </div>
    <div class="abc__picker" role="group" aria-label="Choose a letter"></div>
  `;
  root.appendChild(app);

  const board = app.querySelector(".abc__board");
  const canvas = app.querySelector(".abc__trace");
  const caption = app.querySelector(".abc__caption");
  const picker = app.querySelector(".abc__picker");
  const soundBtn = app.querySelector(".abc__sound");
  const traceBtn = app.querySelector('[data-act="trace"]');
  const clearBtn = app.querySelector('[data-act="clear"]');

  const drawing = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "abc__svg", role: "img", "aria-labelledby": `${uid}-t` });
  const title = svg("title", { id: `${uid}-t` });
  drawing.appendChild(title);
  /* The four copy-book lines. */
  drawing.appendChild(svg("line", { x1: 4, x2: W - 4, y1: LINE.top, y2: LINE.top, class: "abc__rule" }));
  drawing.appendChild(svg("line", { x1: 4, x2: W - 4, y1: LINE.mid, y2: LINE.mid, class: "abc__rule abc__rule--mid" }));
  drawing.appendChild(svg("line", { x1: 4, x2: W - 4, y1: LINE.base, y2: LINE.base, class: "abc__rule abc__rule--base" }));
  drawing.appendChild(svg("line", { x1: 4, x2: W - 4, y1: LINE.desc, y2: LINE.desc, class: "abc__rule abc__rule--desc" }));
  const glyph = svg("g", { class: "abc__glyph" });
  drawing.appendChild(glyph);
  board.insertBefore(drawing, canvas);

  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "abc__pick";
    b.dataset.i = i;
    b.textContent = it.letter;
    picker.appendChild(b);
  });

  /* ---------------------------------------------------------- helpers */

  const current = () => items[index];
  const char = () => (upper ? current().letter.toUpperCase() : current().letter.toLowerCase());

  function paintSound() {
    soundBtn.setAttribute("aria-pressed", Tones.muted ? "false" : "true");
    soundBtn.innerHTML = Tones.muted
      ? '<span aria-hidden="true">&#128263;</span> Sound off'
      : '<span aria-hidden="true">&#128266;</span> Sound on';
  }

  function paintPicker() {
    picker.querySelectorAll(".abc__pick").forEach((b, i) => {
      const it = items[i];
      b.textContent = upper ? it.letter.toUpperCase() : it.letter.toLowerCase();
      const on = i === index;
      b.classList.toggle("is-on", on);
      if (on) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
      b.setAttribute("aria-label", `${upper ? "Capital" : "Small"} ${it.letter.toUpperCase()}`);
    });
    app.querySelectorAll("[data-case]").forEach((b) =>
      b.setAttribute("aria-pressed", String((b.dataset.case === "upper") === upper))
    );
  }

  function paintCaption() {
    const it = current();
    caption.innerHTML =
      `<span class="abc__cap-emoji" aria-hidden="true">${esc(it.emoji)}</span>` +
      `<span class="abc__cap-letter">${esc(char())}</span>` +
      `<span class="abc__cap-word"><strong>${esc(char())}</strong> is for <strong>${esc(it.word)}</strong></span>`;
  }

  /* Build the strokes for the current letter, centred on the board. */
  function buildGlyph() {
    glyph.textContent = "";
    glyph.removeAttribute("transform");
    const strokes = (upper ? CAPITALS : SMALL)[char()] || [];
    const paths = strokes.map((d) => {
      const p = svg("path", { d, class: "abc__stroke" });
      glyph.appendChild(p);
      return p;
    });

    /* Centre horizontally; the vertical position is fixed by the lines. */
    let box = null;
    try { box = glyph.getBBox(); } catch (e) { /* not rendered yet */ }
    /* A straight letter such as l has a box of width 0, which is still a box. */
    if (box) glyph.setAttribute("transform", `translate(${(W - box.width) / 2 - box.x} 0)`);

    /* A numbered dot where each stroke begins. Where two strokes start in the
       same place the second number is nudged aside so both can be read. */
    const starts = svg("g", { class: "abc__starts" });
    const placed = [];
    paths.forEach((p, i) => {
      const s = p.getPointAtLength(0);
      let x = s.x;
      let y = s.y;
      while (placed.some((q) => Math.hypot(q.x - x, q.y - y) < 7)) { x -= 7; y -= 5; }
      placed.push({ x, y });
      const g = svg("g", { class: "abc__start", "data-i": i });
      g.appendChild(svg("circle", { cx: x, cy: y, r: 4.6 }));
      const t = svg("text", { x, y: y + 1.9 });
      t.textContent = String(i + 1);
      g.appendChild(t);
      starts.appendChild(g);
    });
    glyph.appendChild(starts);

    const pen = svg("circle", { class: "abc__pen", r: 3.4, cx: -20, cy: -20 });
    glyph.appendChild(pen);

    const it = current();
    title.textContent = `How to write ${upper ? "capital" : "small"} ${it.letter.toUpperCase()}: ${paths.length} stroke${paths.length === 1 ? "" : "s"}`;
    return { paths, pen, starts };
  }

  function showComplete(parts) {
    parts.paths.forEach((p) => {
      p.style.strokeDasharray = "";
      p.style.strokeDashoffset = "";
    });
    parts.pen.classList.remove("is-on");
  }

  function drawStroke(path, pen, token) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len}`;
    path.style.strokeDashoffset = String(len);
    const dur = Math.max(450, len * 17);
    const begin = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (token.cancelled) { resolve(false); return; }
        const t = Math.min(1, (now - begin) / dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        path.style.strokeDashoffset = String(len * (1 - e));
        const pt = path.getPointAtLength(len * e);
        pen.setAttribute("cx", pt.x);
        pen.setAttribute("cy", pt.y);
        if (t < 1) nextFrame(step);
        else resolve(true);
      };
      nextFrame(step);
    });
  }

  const pause = (ms, token) => new Promise((r) => setTimeout(() => r(!token.cancelled), ms));

  /* ---------------------------------------------------------- actions */

  function say() {
    if (Tones.muted) return Promise.resolve();
    const it = current();
    Speech.cancel();
    return speak(`${upper ? "Capital" : "Small"} ${it.name}. ${it.name} for ${it.word}.`, Speech.preferred(), 0.85);
  }

  async function watch() {
    run.cancelled = true;
    const token = { cancelled: false };
    run = token;
    setTracing(false);
    paintCaption();
    const parts = buildGlyph();

    if (REDUCED) {
      showComplete(parts);
      return;
    }

    parts.paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
    });
    parts.pen.classList.add("is-on");

    for (let i = 0; i < parts.paths.length; i++) {
      parts.starts.querySelectorAll(".abc__start").forEach((s) =>
        s.classList.toggle("is-now", Number(s.dataset.i) === i)
      );
      if (!(await drawStroke(parts.paths[i], parts.pen, token))) return;
      if (!(await pause(260, token))) return;
    }
    parts.starts.querySelectorAll(".abc__start").forEach((s) => s.classList.remove("is-now"));
    parts.pen.classList.remove("is-on");
    if (token.cancelled) return;
    Tones.chime();
    await say();
  }

  function go(i) {
    index = (i + items.length) % items.length;
    paintPicker();
    watch();
  }

  /* ---------------------------------------------------------- tracing */

  let ctx2d = null;
  let drawingNow = false;

  function sizeCanvas() {
    const r = board.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx2d = canvas.getContext("2d");
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.lineCap = "round";
    ctx2d.lineJoin = "round";
    ctx2d.lineWidth = Math.max(6, r.width * 0.05);
    ctx2d.strokeStyle = "#0e7c66";
  }

  function setTracing(on) {
    tracing = on;
    board.classList.toggle("is-tracing", on);
    canvas.hidden = !on;
    clearBtn.hidden = !on;
    traceBtn.setAttribute("aria-pressed", String(on));
    if (on) {
      run.cancelled = true;
      const parts = buildGlyph();
      showComplete(parts);
      sizeCanvas();
    }
  }

  function point(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (!ctx2d) return;
    drawingNow = true;
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* pointer already released */ }
    const p = point(ev);
    ctx2d.beginPath();
    ctx2d.moveTo(p.x, p.y);
    ctx2d.lineTo(p.x + 0.01, p.y + 0.01);
    ctx2d.stroke();
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!drawingNow || !ctx2d) return;
    const p = point(ev);
    ctx2d.lineTo(p.x, p.y);
    ctx2d.stroke();
  });
  const endLine = () => { drawingNow = false; };
  canvas.addEventListener("pointerup", endLine);
  canvas.addEventListener("pointercancel", endLine);
  canvas.addEventListener("pointerleave", endLine);

  window.addEventListener("resize", () => { if (tracing) sizeCanvas(); });

  /* ----------------------------------------------------------- wiring */

  app.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b || !app.contains(b)) return;

    if (b.dataset.step) { go(index + Number(b.dataset.step)); return; }
    if (b.classList.contains("abc__pick")) { go(Number(b.dataset.i)); return; }
    if (b.dataset.case) {
      upper = b.dataset.case === "upper";
      paintPicker();
      watch();
      return;
    }
    if (b === soundBtn) {
      Tones.setMuted(!Tones.muted);
      if (Tones.muted) Speech.cancel();
      paintSound();
      return;
    }
    switch (b.dataset.act) {
      case "watch": watch(); break;
      case "trace": setTracing(!tracing); break;
      case "clear": if (ctx2d) sizeCanvas(); break;
      case "say": say(); break;
    }
  });

  app.addEventListener("keydown", (ev) => {
    if (ev.target.closest("canvas")) return;
    if (ev.key === "ArrowRight") { ev.preventDefault(); go(index + 1); }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); go(index - 1); }
  });

  paintSound();
  paintPicker();
  paintCaption();
  /* Draw the first letter finished rather than animating on arrival: motion
     and sound wait until the visitor chooses to start. */
  showComplete(buildGlyph());
}

document.querySelectorAll("[data-abc]").forEach(setUp);
