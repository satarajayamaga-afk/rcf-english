/* Pick of the Day.

   One resource from data/pick-of-the-day.json, shown on the home page once a
   day. The pick is worked out from the date, so every visitor sees the same
   one on the same day and it changes by itself at midnight. There is no
   server and nothing is recorded: the only thing stored is the date the
   visitor last saw it, in their own browser.

   It never interrupts. It waits until the page has settled, it can be closed
   with the button, the Escape key or a click outside it, and "Don't show this
   again" stops it for good. A visitor who has closed it today will not see it
   again today, even if they open ten pages. */

const SEEN = "rcf-pick-seen";   // the date last shown, or "off"
const DELAY = 1400;             // let the page settle first

function today() {
  // Local date, so the pick turns over at midnight where the visitor is,
  // not at 5.30 a.m. Sri Lankan time as a UTC day would.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function store(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function remember(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* private window: just show it again tomorrow */ }
}

// Same pick for everyone on a given day: the day number decides it.
//
// Stepping one place down the list each day would show three primary pages in
// a row, because the list is grouped by subject. Stepping by a number that
// shares no factor with the list length still reaches every item before
// repeating, but lands somewhere different each day.
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function strideFor(n) {
  let s = Math.max(1, Math.round(n * 0.382));
  while (s < n && gcd(s, n) !== 1) s++;
  return gcd(s, n) === 1 ? s : 1;
}
function pickFor(list, date) {
  const days = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  const n = list.length;
  return list[(((days * strideFor(n)) % n) + n) % n];
}

function show(pick) {
  const root = document.createElement("div");
  root.className = "pick";
  root.innerHTML = `
    <div class="pick__box" role="dialog" aria-modal="true" aria-labelledby="pick-title">
      <p class="pick__eyebrow">Pick of the day<span class="pick__tag">${pick.tag}</span></p>
      <h2 class="pick__title" id="pick-title"></h2>
      <p class="pick__text"></p>
      <p class="pick__actions">
        <a class="btn btn--accent pick__open" href="">Open this</a>
        <button type="button" class="btn btn--ghost pick__later">Not now</button>
      </p>
      <button type="button" class="pick__off">Don't show this again</button>
      <button type="button" class="pick__x" aria-label="Close">&times;</button>
    </div>`;
  // Titles and text come from our own data file, but set them as text rather
  // than HTML so a stray character can never become markup.
  root.querySelector(".pick__title").textContent = pick.title;
  root.querySelector(".pick__text").textContent = pick.text;
  const open = root.querySelector(".pick__open");
  open.setAttribute("href", new URL(pick.url, document.baseURI).href);

  const lastFocus = document.activeElement;
  const close = (forGood) => {
    remember(SEEN, forGood ? "off" : today());
    root.remove();
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close(false);
    if (e.key !== "Tab") return;
    // Keep the keyboard inside the box while it is open.
    const items = root.querySelectorAll("a[href], button");
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  root.querySelector(".pick__x").addEventListener("click", () => close(false));
  root.querySelector(".pick__later").addEventListener("click", () => close(false));
  root.querySelector(".pick__off").addEventListener("click", () => close(true));
  root.addEventListener("click", (e) => { if (e.target === root) close(false); });
  open.addEventListener("click", () => close(false));
  document.addEventListener("keydown", onKey);

  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add("pick--in"));
  open.focus();
}

async function start() {
  const seen = store(SEEN);
  if (seen === "off" || seen === today()) return;
  let list;
  try {
    const res = await fetch(new URL("data/pick-of-the-day.json", document.baseURI));
    if (!res.ok) return;
    list = await res.json();
  } catch (e) {
    return; // offline or the file moved: simply no pick today
  }
  if (!Array.isArray(list) || !list.length) return;
  const pick = pickFor(list, today());
  // Do not advertise the page the visitor is already reading.
  if (new URL(pick.url, document.baseURI).pathname === location.pathname) return;
  show(pick);
}

if (document.readyState === "complete") setTimeout(start, DELAY);
else window.addEventListener("load", () => setTimeout(start, DELAY));
