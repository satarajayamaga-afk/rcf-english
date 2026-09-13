/* ==========================================================================
   RCF English - examination centre tools

     [data-xcount]   countdown to the official date, or to the student's own
     [data-xtimer]   a timer for sitting a paper under time
     [data-xplan]    a printable weekly study timetable
     [data-qweek]    shows this week's Question of the Week

   Everything a student enters stays in this browser (localStorage). Nothing
   is sent anywhere, and nothing here invents a date or a paper length.
   ========================================================================== */

import { esc } from "./lib.js";

const store = {
  get(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* not kept */ } },
  del(key) { try { window.localStorage.removeItem(key); } catch (e) { /* nothing */ } }
};

/* Dates are compared as calendar days in Sri Lanka's time zone, so the count
   does not change at midnight UTC. */
function todayInColombo() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parts; /* YYYY-MM-DD */
}

function daysBetween(fromIso, toIso) {
  const a = Date.UTC(...fromIso.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  const b = Date.UTC(...toIso.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  return Math.round((b - a) / 86400000);
}

function niceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/* ------------------------------------------------------------ countdown */

function countdown(root) {
  const out = root.querySelector("[data-xcount-out]");
  const official = root.dataset.date;
  const key = `rcf-exam-date-${root.dataset.exam}`;

  function show(iso, own) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) { out.textContent = ""; return; }
    const days = daysBetween(todayInColombo(), iso);
    const weeks = Math.floor(days / 7);
    const whose = own ? "your date" : "the examination";
    if (days > 1) {
      out.innerHTML = `<span class="xcount__num">${days}</span> days to ${esc(whose)}<span class="xcount__sub">${weeks >= 1 ? `about ${weeks} ${weeks === 1 ? "week" : "weeks"} · ` : ""}${esc(niceDate(iso))}</span>`;
    } else if (days === 1) {
      out.innerHTML = `<span class="xcount__num">1</span> day to ${esc(whose)}<span class="xcount__sub">Tomorrow. Sleep well tonight.</span>`;
    } else if (days === 0) {
      out.innerHTML = `<span class="xcount__sub">It starts today. Read the whole paper before you write. Good luck.</span>`;
    } else {
      out.innerHTML = `<span class="xcount__sub">${esc(niceDate(iso))} has passed.${own ? " Enter your next date above." : ""}</span>`;
    }
  }

  if (official) {
    const d = root.querySelector("[data-xcount-date]");
    if (d) d.textContent = niceDate(official);
    show(official, false);
    return;
  }
  const wrap = root.querySelector("[data-xcount-own]");
  const input = root.querySelector("[data-xcount-input]");
  wrap.hidden = false;
  input.value = store.get(key) || "";
  show(input.value, true);
  input.addEventListener("change", () => {
    if (input.value) store.set(key, input.value); else store.del(key);
    show(input.value, true);
  });
}

/* ---------------------------------------------------------------- timer */

function timer(root) {
  root.innerHTML = `
    <div class="xtimer__set">
      <div class="field"><label for="xt-h">Hours</label><input id="xt-h" type="number" min="0" max="5" value="3" inputmode="numeric" data-h></div>
      <div class="field"><label for="xt-m">Minutes</label><input id="xt-m" type="number" min="0" max="59" value="0" inputmode="numeric" data-m></div>
      <label class="xtimer__read"><input type="checkbox" data-read checked> Add 10 minutes reading time first</label>
    </div>
    <p class="text-small text-muted">Set the time printed on the paper you are practising. Papers differ, so check it rather than assuming.</p>
    <div class="xtimer__face" data-face aria-live="off">
      <p class="xtimer__phase" data-phase>Ready</p>
      <p class="xtimer__clock" data-clock>3:00:00</p>
      <div class="xtimer__bar"><span data-bar></span></div>
    </div>
    <p class="visually-hidden" role="status" aria-live="polite" data-say></p>
    <div class="xtimer__buttons">
      <button type="button" class="btn btn--accent" data-start>Start</button>
      <button type="button" class="btn btn--outline" data-pause disabled>Pause</button>
      <button type="button" class="btn btn--outline" data-reset>Reset</button>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const h = $("[data-h]"), m = $("[data-m]"), read = $("[data-read]");
  const clock = $("[data-clock]"), phase = $("[data-phase]"), bar = $("[data-bar]"), say = $("[data-say]");
  const startBtn = $("[data-start]"), pauseBtn = $("[data-pause]");

  let plan = [];      /* [{label, ms}] */
  let stage = 0;
  let left = 0;       /* ms left in this stage */
  let endsAt = 0;
  let tick = null;
  let warned = {};

  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  function build() {
    const writing = (Math.min(5, Math.max(0, Number(h.value) || 0)) * 60 + Math.min(59, Math.max(0, Number(m.value) || 0))) * 60000;
    plan = [];
    if (read.checked) plan.push({ label: "Reading time: read the whole paper, do not write answers", ms: 10 * 60000 });
    if (writing > 0) plan.push({ label: "Writing time", ms: writing });
    stage = 0;
    left = plan.length ? plan[0].ms : 0;
    warned = {};
    render();
  }

  function announce(text) { say.textContent = text; }

  function render() {
    const cur = plan[stage];
    phase.textContent = cur ? cur.label : "Set a time above";
    clock.textContent = fmt(left);
    bar.style.width = cur ? `${Math.max(0, Math.min(100, 100 - (left / cur.ms) * 100))}%` : "0%";
    root.classList.toggle("is-low", Boolean(cur && cur.label === "Writing time" && left <= 10 * 60000));
  }

  function loop() {
    left = endsAt - Date.now();
    const cur = plan[stage];
    if (cur && cur.label === "Writing time") {
      if (left <= cur.ms / 2 && !warned.half) { warned.half = true; announce("Halfway through the writing time."); }
      if (left <= 10 * 60000 && !warned.ten) { warned.ten = true; announce("Ten minutes left. Leave time to check your answers."); }
    }
    if (left <= 0) {
      stage += 1;
      if (stage < plan.length) {
        left = plan[stage].ms;
        endsAt = Date.now() + left;
        announce("Reading time is over. You may start writing.");
      } else {
        stop();
        left = 0;
        phase.textContent = "Time is up. Put your pen down.";
        clock.textContent = "0:00:00";
        bar.style.width = "100%";
        announce("Time is up.");
        startBtn.textContent = "Start";
        return;
      }
    }
    render();
  }

  function stop() { clearInterval(tick); tick = null; pauseBtn.disabled = true; }

  startBtn.addEventListener("click", () => {
    if (tick) return;
    if (!plan.length || (stage >= plan.length)) build();
    if (!plan.length) return;
    endsAt = Date.now() + left;
    tick = setInterval(loop, 250);
    pauseBtn.disabled = false;
    startBtn.textContent = "Running";
    [h, m, read].forEach((el) => { el.disabled = true; });
    announce(`${plan[stage].label} started.`);
  });
  pauseBtn.addEventListener("click", () => {
    if (tick) { stop(); left = endsAt - Date.now(); startBtn.textContent = "Resume"; announce("Paused."); render(); }
  });
  $("[data-reset]").addEventListener("click", () => {
    stop();
    startBtn.textContent = "Start";
    [h, m, read].forEach((el) => { el.disabled = false; });
    build();
  });
  [h, m, read].forEach((el) => el.addEventListener("change", () => { if (!tick) build(); }));
  build();
}

/* ------------------------------------------------------------ timetable */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAN_KEY = "rcf-study-plan";

function timetable(root) {
  const defaults = (root.dataset.subjects || "").split("|").filter(Boolean);
  let saved = {};
  try { saved = JSON.parse(store.get(PLAN_KEY) || "{}"); } catch (e) { saved = {}; }

  root.innerHTML = `
    <div class="xplan__form">
      <div class="field xplan__subjects">
        <label for="xp-subjects">My subjects, one on each line</label>
        <textarea id="xp-subjects" rows="7" data-subjects></textarea>
      </div>
      <div class="field">
        <label for="xp-weak">Subjects that need extra time (one on each line)</label>
        <textarea id="xp-weak" rows="3" data-weak></textarea>
      </div>
      <div class="xplan__nums">
        <div class="field"><label for="xp-wd">Study sessions on a school day</label>
          <select id="xp-wd" data-wd><option>1</option><option selected>2</option><option>3</option></select></div>
        <div class="field"><label for="xp-we">Study sessions on Saturday and Sunday</label>
          <select id="xp-we" data-we><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div>
        <div class="field"><label for="xp-len">Length of one session</label>
          <select id="xp-len" data-len><option value="30">30 minutes</option><option value="40" selected>40 minutes</option><option value="50">50 minutes</option><option value="60">1 hour</option></select></div>
      </div>
      <label class="xplan__check"><input type="checkbox" data-rest checked> Keep Sunday evening free for rest</label>
    </div>
    <div class="xplan__bar">
      <p class="xplan__summary" data-summary role="status" aria-live="polite"></p>
      <div class="xplan__actions">
        <button type="button" class="btn btn--outline" data-shuffle>Mix the order</button>
        <button type="button" class="btn btn--accent" data-print>Print my timetable</button>
      </div>
    </div>
    <div class="xplan__out" data-out></div>`;

  const $ = (s) => root.querySelector(s);
  const subjectsEl = $("[data-subjects]"), weakEl = $("[data-weak]");
  const wd = $("[data-wd]"), we = $("[data-we]"), len = $("[data-len]"), rest = $("[data-rest]");
  const out = $("[data-out]"), summary = $("[data-summary]");
  let seed = Number(saved.seed) || 1;

  subjectsEl.value = saved.subjects != null ? saved.subjects : defaults.join("\n");
  weakEl.value = saved.weak || "";
  if (saved.wd) wd.value = saved.wd;
  if (saved.we) we.value = saved.we;
  if (saved.len) len.value = saved.len;
  if (saved.rest === false) rest.checked = false;

  const lines = (t) => [...new Set(String(t).split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];

  /* Small repeatable shuffle, so "Mix the order" changes the plan but the
     same choices always give the same plan. */
  function rng(n) { let x = n || 1; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; }

  function make() {
    const subjects = lines(subjectsEl.value).slice(0, 15);
    const weakSet = new Set(lines(weakEl.value).map((s) => s.toLowerCase()));
    const perDay = DAYS.map((d, i) => (i < 5 ? Number(wd.value) : Number(we.value)) - (i === 6 && rest.checked ? 1 : 0));
    const total = perDay.reduce((a, b) => a + b, 0);
    store.set(PLAN_KEY, JSON.stringify({ subjects: subjectsEl.value, weak: weakEl.value, wd: wd.value, we: we.value, len: len.value, rest: rest.checked, seed }));

    if (!subjects.length) { out.innerHTML = ""; summary.textContent = "Add at least one subject."; return; }

    /* Share of sessions: every subject once or more, weak subjects twice the weight. */
    const weights = subjects.map((s) => (weakSet.has(s.toLowerCase()) ? 2 : 1));
    const wsum = weights.reduce((a, b) => a + b, 0);
    let counts = weights.map((w) => Math.max(1, Math.floor((total * w) / wsum)));
    let extra = total - counts.reduce((a, b) => a + b, 0);
    const order = subjects.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);
    for (let k = 0; extra > 0; k = (k + 1) % order.length, extra--) counts[order[k]]++;
    while (counts.reduce((a, b) => a + b, 0) > total) { const i = counts.indexOf(Math.max(...counts)); counts[i]--; }

    /* Deal subjects out so the same one is not placed twice in a day where
       that can be avoided. */
    /* Subjects with the most sessions are placed first, each session on the
       day with the most free slots that does not already have that subject.
       Ties between days are broken by the shuffle seed, so "Mix the order"
       gives a different but equally balanced week. */
    const r = rng(seed);
    const dayRank = DAYS.map(() => r());
    const grid = perDay.map(() => []);
    const free = perDay.slice();
    const bySize = counts.map((c, i) => i).sort((a, b) => counts[b] - counts[a] || a - b);
    bySize.forEach((i) => {
      for (let n = 0; n < counts[i]; n++) {
        const days = free
          .map((f, d) => ({ d, f }))
          .filter((x) => x.f > 0)
          .sort((a, b) => (grid[a.d].includes(i) - grid[b.d].includes(i)) || (b.f - a.f) || (dayRank[a.d] - dayRank[b.d]));
        if (!days.length) return;
        grid[days[0].d].push(i);
        free[days[0].d] -= 1;
      }
    });
    /* Shuffle the order within each day so the same subject does not always
       come first. */
    grid.forEach((cells) => { for (let k = cells.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [cells[k], cells[j]] = [cells[j], cells[k]]; } });

    const maxRows = Math.max(...perDay, 1);
    let html = `<div class="table-wrap"><table class="xplan__table"><caption>My weekly study timetable (sessions of ${esc(len.options[len.selectedIndex].text)})</caption><thead><tr><th scope="col">Session</th>${DAYS.map((d) => `<th scope="col">${d}</th>`).join("")}</tr></thead><tbody>`;
    for (let row = 0; row < maxRows; row++) {
      html += `<tr><th scope="row">${row + 1}</th>`;
      grid.forEach((cells, d) => {
        const i = cells[row];
        if (i === undefined) {
          html += `<td class="xplan__free">${d === 6 && rest.checked && row === perDay[6] ? "Rest" : ""}</td>`;
        } else {
          html += `<td class="${weights[i] > 1 ? "xplan__weak" : ""}">${esc(subjects[i])}</td>`;
        }
      });
      html += "</tr>";
    }
    html += "</tbody></table></div>";
    html += `<p class="text-small text-muted">Shaded subjects are the ones you marked as needing extra time. After each session, write one line in your exercise book: what you did and what to do next time.</p>`;
    out.innerHTML = html;
    const hours = Math.round((total * Number(len.value)) / 6) / 10;
    summary.textContent = `${total} sessions a week · about ${hours} hours · ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}`;
  }

  root.addEventListener("input", (e) => { if (e.target.matches("textarea")) { clearTimeout(root._t); root._t = setTimeout(make, 250); } });
  root.addEventListener("change", (e) => { if (e.target.matches("select, input[type=checkbox]")) make(); });
  $("[data-shuffle]").addEventListener("click", () => { seed = (seed * 48271) % 2147483647 || 7; make(); });
  $("[data-print]").addEventListener("click", () => {
    document.documentElement.classList.add("is-printing-plan");
    const done = () => { document.documentElement.classList.remove("is-printing-plan"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
  });
  make();
}

/* -------------------------------------------------- question of the week */

function questionWeek(root) {
  const items = Array.from(root.querySelectorAll("[data-week]"));
  if (!items.length) return;
  const today = todayInColombo();
  const started = items.filter((a) => a.dataset.week <= today); /* newest first */
  const current = started[0] || items[items.length - 1];
  items.forEach((a) => { a.hidden = a !== current; });

  const archive = root.querySelector("[data-qweek-archive]");
  const list = root.querySelector("[data-qweek-list]");
  const earlier = started.filter((a) => a !== current);
  if (!archive || !earlier.length) return;
  archive.hidden = false;
  list.innerHTML = earlier
    .map((a, i) => `<li><button type="button" class="qweek__old" data-open="${items.indexOf(a)}">${esc(a.querySelector(".qweek__title").textContent)} <span class="text-muted">(${esc(a.querySelector(".tag--year").textContent)})</span></button></li>`)
    .join("");
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (!b) return;
    const a = items[Number(b.dataset.open)];
    a.hidden = !a.hidden;
    b.setAttribute("aria-expanded", a.hidden ? "false" : "true");
    if (!a.hidden) { archive.before(a); a.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
}

document.querySelectorAll("[data-xcount]").forEach(countdown);
document.querySelectorAll("[data-xtimer]").forEach(timer);
document.querySelectorAll("[data-xplan]").forEach(timetable);
document.querySelectorAll("[data-qweek]").forEach(questionWeek);
