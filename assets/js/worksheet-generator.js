/* ==========================================================================
   RCF English - worksheet and test generator

   Builds a printable worksheet or short test, with a separate answer key,
   from the questions in data/quizzes.json - the same questions as the
   interactive activities, all written by RCF English.

   The teacher chooses:
     level            a grade, Primary, or O/L revision
     topics           the activities for that level (with competency levels
                      where the activity names them)
     question types   choose / write / correct and reorder / match / reading
     number           how many questions (reading passages keep their questions)
     options          title, name and date lines, marks, answer key, order

   Nothing is invented: if the chosen topics hold fewer questions than asked
   for, the worksheet uses what there is and says so.
   ========================================================================== */

import { esc, loadData } from "./lib.js";

const root = document.querySelector("[data-wsgen]");

const TYPE_INFO = {
  mcq: { label: "Multiple choice", thinking: "Choose", instruction: "Circle the correct answer." },
  gap: { label: "Fill in the blank", thinking: "Write", instruction: "Write the missing word in each space." },
  error: { label: "Correct the mistake", thinking: "Correct", instruction: "Each sentence has one mistake. Rewrite the sentence correctly." },
  order: { label: "Put in order", thinking: "Correct", instruction: "Put the parts in the correct order to make a sentence." },
  match: { label: "Matching", thinking: "Choose", instruction: "Match each word in A with its meaning in B. Write the letter." },
  reading: { label: "Reading comprehension", thinking: "Read", instruction: "Read the passage and answer the questions." }
};

function levelOf(a) {
  const m = String(a.page || "").match(/grades\/grade-(\d+)\//);
  if (m) return { key: `g${m[1]}`, label: `Grade ${m[1]}`, sort: Number(m[1]) };
  if (/grade-5-scholarship/.test(a.page)) return { key: "g5", label: "Grade 5 (Scholarship)", sort: 5 };
  if (/^primary-english\//.test(a.page)) return { key: "primary", label: "Primary (Grades 1-5)", sort: 1 };
  if (/^ol-(english|literature)\//.test(a.page)) return { key: "ol", label: "O/L revision (Grades 10-11)", sort: 10.5 };
  return { key: "general", label: "General English", sort: 12 };
}

function competencyOf(a) {
  const m = String(a.description || "").match(/Competency levels? ([\d.]+(?:(?:,| and) [\d.]+)*)/i);
  return m ? m[1] : "";
}

function topicName(a) {
  const t = String(a.title).replace(/^Grade \d+:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function shuffle(list) {
  const c = list.slice();
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

/* Every activity becomes a list of "items". A reading passage is one item
   that carries several questions; everything else is one question per item. */
function itemsOf(a) {
  if (a.type === "reading") {
    return [{ type: "reading", activity: a, count: a.questions.length }];
  }
  if (a.type === "match") {
    return [{ type: "match", activity: a, pairs: a.pairs, count: a.pairs.length }];
  }
  return a.questions.map((q) => ({ type: a.type, activity: a, q, count: 1 }));
}

const answerText = (ans) => (Array.isArray(ans) ? ans[0] : ans);

function renderSection(type, items, startNo, opts) {
  const info = TYPE_INFO[type];
  let n = startNo;
  let body = "";
  let key = "";
  if (type === "reading") {
    items.forEach((it) => {
      const a = it.activity;
      body += `<div class="ws__passage"><p class="ws__passage-title">${esc(a.passageTitle || "Passage")}</p>${a.passage.map((p) => `<p>${esc(p)}</p>`).join("")}</div><ol class="ws__qs" start="${n}">`;
      a.questions.forEach((q) => {
        const order = opts.shuffleChoices ? shuffle(q.options.map((t, i) => ({ t, i }))) : q.options.map((t, i) => ({ t, i }));
        body += `<li>${esc(q.prompt)}${opts.marks ? ' <span class="ws__mark">(1)</span>' : ""}<ol class="ws__opts" type="a">${order.map((o) => `<li>${esc(o.t)}</li>`).join("")}</ol></li>`;
        key += `<li value="${n}">${String.fromCharCode(97 + order.findIndex((o) => o.i === q.answer))}) ${esc(q.options[q.answer])}</li>`;
        n++;
      });
      body += "</ol>";
    });
  } else if (type === "match") {
    items.forEach((it) => {
      const pairs = it.pairs;
      const meanings = shuffle(pairs.map((p, i) => ({ t: p.meaning, i })));
      body += `<table class="ws__match"><thead><tr><th>A</th><th></th><th>B</th></tr></thead><tbody>${pairs
        .map((p, i) => `<tr><td>${n + i}. ${esc(p.term)}</td><td class="ws__box"></td><td>${String.fromCharCode(65 + i)}. ${esc(meanings[i].t)}</td></tr>`)
        .join("")}</tbody></table>`;
      pairs.forEach((p, i) => {
        key += `<li value="${n + i}">${String.fromCharCode(65 + meanings.findIndex((m) => m.i === i))} (${esc(p.meaning)})</li>`;
      });
      n += pairs.length;
    });
  } else {
    body += `<ol class="ws__qs" start="${n}">`;
    items.forEach((it) => {
      const q = it.q;
      const mark = opts.marks ? ' <span class="ws__mark">(1)</span>' : "";
      if (type === "mcq") {
        const order = opts.shuffleChoices ? shuffle(q.options.map((t, i) => ({ t, i }))) : q.options.map((t, i) => ({ t, i }));
        body += `<li>${esc(q.prompt)}${mark}<ol class="ws__opts" type="a">${order.map((o) => `<li>${esc(o.t)}</li>`).join("")}</ol></li>`;
        key += `<li value="${n}">${String.fromCharCode(97 + order.findIndex((o) => o.i === q.answer))}) ${esc(q.options[q.answer])}</li>`;
      } else if (type === "gap") {
        const sentence = esc(q.sentence).replace("____", '<span class="ws__blank"></span>');
        body += `<li>${sentence}${q.hint && opts.hints ? ` <span class="ws__hint">(${esc(q.hint)})</span>` : ""}${mark}</li>`;
        key += `<li value="${n}">${esc(answerText(q.answer))}</li>`;
      } else if (type === "error") {
        body += `<li>${esc(q.sentence)}${mark}<span class="ws__line"></span></li>`;
        key += `<li value="${n}">${esc(answerText(q.answer))}</li>`;
      } else if (type === "order") {
        body += `<li>${shuffle(q.parts).map((p) => `<span class="ws__part">${esc(p)}</span>`).join(" / ")}${mark}<span class="ws__line"></span></li>`;
        key += `<li value="${n}">${esc(q.parts.join(" "))}</li>`;
      }
      n++;
    });
    body += "</ol>";
  }
  return {
    html: `<section class="ws__section"><h2>${esc(info.label)}</h2><p class="ws__instruction">${esc(info.instruction)}</p>${body}</section>`,
    key: `<section class="ws__key-section"><h3>${esc(info.label)}</h3><ol class="ws__key-list">${key}</ol></section>`,
    next: n
  };
}

function setUp(data) {
  const activities = (data.activities || []).filter((a) => TYPE_INFO[a.type]);
  const levels = new Map();
  activities.forEach((a) => {
    const lv = levelOf(a);
    if (!levels.has(lv.key)) levels.set(lv.key, Object.assign({ list: [] }, lv));
    levels.get(lv.key).list.push(a);
  });
  const levelList = [...levels.values()].sort((x, y) => x.sort - y.sort);

  root.innerHTML = `
    <form class="wsgen__form" data-form>
      <fieldset class="wsgen__step">
        <legend>1. Level</legend>
        <div class="field"><label for="ws-level">Class or level</label>
          <select id="ws-level" data-level>${levelList.map((l) => `<option value="${l.key}">${esc(l.label)}</option>`).join("")}</select></div>
      </fieldset>
      <fieldset class="wsgen__step">
        <legend>2. Topics and competencies</legend>
        <div class="wsgen__topics" data-topics></div>
      </fieldset>
      <fieldset class="wsgen__step">
        <legend>3. Question types</legend>
        <div class="wsgen__types" data-types></div>
      </fieldset>
      <fieldset class="wsgen__step">
        <legend>4. Worksheet or test</legend>
        <div class="wsgen__grid">
          <div class="field"><label for="ws-count">Number of questions</label><input id="ws-count" type="number" min="3" max="40" value="10" data-count></div>
          <div class="field"><label for="ws-title">Title</label><input id="ws-title" type="text" maxlength="80" data-title placeholder="e.g. Grade 8 Term 1 revision"></div>
          <div class="field"><label for="ws-school">School or class (optional)</label><input id="ws-school" type="text" maxlength="80" data-school></div>
        </div>
        <div class="wsgen__checks">
          <label><input type="checkbox" data-opt="names" checked> Name, class and date lines</label>
          <label><input type="checkbox" data-opt="marks"> Show marks (a test)</label>
          <label><input type="checkbox" data-opt="hints"> Include hints for blanks</label>
          <label><input type="checkbox" data-opt="shuffleChoices" checked> Mix the order of answer choices</label>
          <label><input type="checkbox" data-opt="key" checked> Answer key on a separate page</label>
        </div>
      </fieldset>
      <div class="wsgen__actions">
        <button type="submit" class="btn btn--accent">Make the worksheet</button>
        <button type="button" class="btn btn--outline" data-print disabled>Print or save as PDF</button>
        <p class="wsgen__status" role="status" aria-live="polite" data-status></p>
      </div>
    </form>
    <div class="ws" data-sheet hidden></div>`;

  const $ = (s) => root.querySelector(s);
  const levelSel = $("[data-level]");
  const topicsBox = $("[data-topics]");
  const typesBox = $("[data-types]");
  const status = $("[data-status]");
  const sheet = $("[data-sheet]");
  const printBtn = $("[data-print]");

  function chosenActivities() {
    const lv = levels.get(levelSel.value);
    const ids = new Set([...topicsBox.querySelectorAll("input:checked")].map((c) => c.value));
    return lv.list.filter((a) => ids.has(a.id));
  }

  function paintTypes() {
    const acts = chosenActivities();
    const counts = {};
    acts.forEach((a) => itemsOf(a).forEach((it) => { counts[it.type] = (counts[it.type] || 0) + it.count; }));
    const previous = new Set([...typesBox.querySelectorAll("input:checked")].map((c) => c.value));
    typesBox.innerHTML = Object.keys(TYPE_INFO)
      .filter((t) => counts[t])
      .map((t) => `<label><input type="checkbox" value="${t}"${previous.size === 0 || previous.has(t) ? " checked" : ""}> ${esc(TYPE_INFO[t].label)} <span class="text-muted">(${counts[t]} available)</span></label>`)
      .join("") || `<p class="text-muted">Choose at least one topic above.</p>`;
  }

  function paintTopics() {
    const lv = levels.get(levelSel.value);
    topicsBox.innerHTML = lv.list
      .map((a) => {
        const comp = competencyOf(a);
        const n = itemsOf(a).reduce((s, it) => s + it.count, 0);
        return `<label class="wsgen__topic"><input type="checkbox" value="${esc(a.id)}" checked>
          <span><strong>${esc(topicName(a))}</strong>
          <span class="wsgen__topic-meta">${comp ? `Competency level ${esc(comp)} · ` : ""}${esc(TYPE_INFO[a.type].label)} · ${n} ${n === 1 ? "question" : "questions"}</span></span></label>`;
      })
      .join("");
    typesBox.innerHTML = "";
    paintTypes();
  }

  levelSel.addEventListener("change", paintTopics);
  topicsBox.addEventListener("change", paintTypes);
  paintTopics();

  $("[data-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const types = new Set([...typesBox.querySelectorAll("input:checked")].map((c) => c.value));
    const want = Math.max(3, Math.min(40, Number($("[data-count]").value) || 10));
    const opts = {};
    root.querySelectorAll("[data-opt]").forEach((c) => { opts[c.dataset.opt] = c.checked; });

    let pool = [];
    chosenActivities().forEach((a) => itemsOf(a).forEach((it) => { if (types.has(it.type)) pool.push(it); }));
    if (!pool.length) {
      status.textContent = "There are no questions for those choices. Choose another topic or question type.";
      sheet.hidden = true;
      printBtn.disabled = true;
      return;
    }

    // Pick items until the number is reached. A reading passage or matching
    // set is kept whole, so the total may run a little over.
    pool = shuffle(pool);
    const picked = [];
    let total = 0;
    for (const it of pool) {
      if (total >= want) break;
      picked.push(it);
      total += it.count;
    }

    const byType = {};
    picked.forEach((it) => { (byType[it.type] = byType[it.type] || []).push(it); });
    let n = 1;
    let body = "";
    let key = "";
    Object.keys(TYPE_INFO).forEach((t) => {
      if (!byType[t]) return;
      const s = renderSection(t, byType[t], n, opts);
      body += s.html;
      key += s.key;
      n = s.next;
    });
    const count = n - 1;
    const lv = levels.get(levelSel.value);
    const title = $("[data-title]").value.trim() || `${lv.label} English worksheet`;
    const school = $("[data-school]").value.trim();

    sheet.innerHTML = `
      <div class="ws__page">
        <header class="ws__head">
          ${school ? `<p class="ws__school">${esc(school)}</p>` : ""}
          <h1 class="ws__title">${esc(title)}</h1>
          ${opts.names ? `<p class="ws__who"><span>Name <span class="ws__fill"></span></span><span>Class <span class="ws__fill ws__fill--short"></span></span><span>Date <span class="ws__fill ws__fill--short"></span></span></p>` : ""}
          ${opts.marks ? `<p class="ws__total">Total: ______ / ${count}</p>` : ""}
        </header>
        ${body}
        <p class="ws__foot">Questions from RCF English (rcfenglish.com) · free to print and copy for classroom use</p>
      </div>
      ${opts.key ? `<div class="ws__page ws__page--key"><h2 class="ws__key-title">Answer key: ${esc(title)}</h2>${key}</div>` : ""}`;
    sheet.hidden = false;
    printBtn.disabled = false;
    status.textContent = count < want
      ? `The chosen topics hold ${count} questions, so the worksheet has ${count} rather than ${want}.`
      : `Worksheet ready: ${count} questions${opts.key ? ", with an answer key" : ""}. Make it again for a different mix.`;
    sheet.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  printBtn.addEventListener("click", () => {
    document.documentElement.classList.add("is-printing-ws");
    const done = () => { document.documentElement.classList.remove("is-printing-ws"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
  });
}

if (root) {
  loadData("quizzes").then((data) => {
    if (!data || !Array.isArray(data.activities)) {
      root.innerHTML = `<p class="text-muted">The question bank could not be loaded. Please try again.</p>`;
      return;
    }
    setUp(data);
  });
}
