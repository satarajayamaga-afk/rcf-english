/* Two notices, shown as a strip directly above the main menu.

   WHAT'S NEW is about the site: the newest entry in data/updates.json. It
   appears when there is something the visitor has not been told about yet,
   and stays until they close it or a newer thing replaces it. It is gold.

   PICK OF THE DAY is about the resources: one item from
   data/pick-of-the-day.json, chosen by the date so every visitor sees the
   same one and it changes by itself at midnight. It is teal.

   They are separate notices with separate memories: closing one does not
   close the other, and each has its own "don't show again". Only one is
   shown at a time, so the page never opens with two strips. What's new goes
   first when there is something new; otherwise the pick of the day appears.

   There is no server and nothing is recorded. The only things stored are
   the date the pick was last seen and the id of the last update announced,
   both in the visitor's own browser.

   Nothing is covered and no keyboard is trapped: the strip sits in the page
   rather than over it. Escape closes it. */

const SEEN_PICK = "rcf-pick-seen";  // the date last shown, or "off"
const SEEN_NEW = "rcf-new-seen";    // the id of the last update shown, or "off"

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
  try { localStorage.setItem(key, value); } catch (e) { /* private window: show it again next time */ }
}
const json = async (path) => {
  const res = await fetch(new URL(path, document.baseURI));
  if (!res.ok) throw new Error(res.status);
  return res.json();
};

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function strideFor(n) {
  let s = Math.max(1, Math.round(n * 0.382));
  while (s < n && gcd(s, n) !== 1) s++;
  return gcd(s, n) === 1 ? s : 1;
}

// Same pick for everyone on a given day. Stepping one place down the list
// each day would show three primary pages in a row, because the list is
// grouped by subject. Stepping by a number that shares no factor with the
// list length still reaches every item before repeating, but lands
// somewhere different each day.
function pickFor(list, date) {
  const days = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  const n = list.length;
  return list[(((days * strideFor(n)) % n) + n) % n];
}

/* kind: "new" or "pick". Each carries its own wording and its own memory. */
function show(kind, item, onClose) {
  const nav = document.querySelector("nav.main-nav");
  if (!nav || document.querySelector(".pick")) return;

  const isNew = kind === "new";
  const strip = document.createElement("aside");
  strip.className = "pick" + (isNew ? " pick--new" : "");
  strip.setAttribute("aria-label", isNew ? "What's new" : "Pick of the day");
  strip.innerHTML = `
    <div class="container pick__inner">
      <p class="pick__lead">
        <span class="pick__eyebrow">${isNew ? "What's new" : "Pick of the day"}</span>
        <span class="pick__tag"></span>
      </p>
      <p class="pick__body">
        <a class="pick__title" href=""></a>
        <span class="pick__text"></span>
      </p>
      <p class="pick__actions">
        <a class="btn btn--sm btn--accent pick__open" href="">${isNew ? "See it" : "Open this"}</a>
        <button type="button" class="pick__off">Don't show again</button>
      </p>
      <button type="button" class="pick__x" aria-label="Close this notice">&times;</button>
    </div>`;

  // The wording comes from our own data files, but it is set as text rather
  // than HTML so a stray character can never become markup.
  const href = new URL(item.url, document.baseURI).href;
  strip.querySelector(".pick__tag").textContent = item.tag;
  const title = strip.querySelector(".pick__title");
  title.textContent = item.title;
  title.setAttribute("href", href);
  strip.querySelector(".pick__text").textContent = item.text;
  strip.querySelector(".pick__open").setAttribute("href", href);

  const close = (forGood) => {
    onClose(forGood);
    strip.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape" && strip.isConnected) close(false); };

  strip.querySelector(".pick__x").addEventListener("click", () => close(false));
  strip.querySelector(".pick__off").addEventListener("click", () => close(true));
  strip.querySelector(".pick__open").addEventListener("click", () => close(false));
  title.addEventListener("click", () => close(false));
  document.addEventListener("keydown", onKey);

  nav.parentNode.insertBefore(strip, nav);
  requestAnimationFrame(() => strip.classList.add("pick--in"));
}

const here = (url) => new URL(url, document.baseURI).pathname === location.pathname;

async function whatsNew() {
  const seen = store(SEEN_NEW);
  if (seen === "off") return false;
  let data;
  try { data = await json("data/updates.json"); } catch (e) { return false; }
  const items = (data.items || []).filter((i) => i.published !== false && i.url);
  if (!items.length) return false;
  const newest = items.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (!newest || newest.id === seen || here(newest.url)) return false;
  show("new", {
    title: newest.title,
    text: (newest.description || "").split(". ")[0] + ".",
    tag: "Just added",
    url: newest.url
  }, (forGood) => remember(SEEN_NEW, forGood ? "off" : newest.id));
  return true;
}

async function pickOfTheDay() {
  const seen = store(SEEN_PICK);
  if (seen === "off" || seen === today()) return;
  let list;
  try { list = await json("data/pick-of-the-day.json"); } catch (e) { return; }
  if (!Array.isArray(list) || !list.length) return;
  const pick = pickFor(list, today());
  if (here(pick.url)) return;   // do not advertise the page already open
  show("pick", pick, (forGood) => remember(SEEN_PICK, forGood ? "off" : today()));
}

(async () => {
  const shown = await whatsNew();
  if (!shown) await pickOfTheDay();
})();
