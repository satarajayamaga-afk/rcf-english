/* ==========================================================================
   RCF English - essay writing exercises

   Five kinds of practice for O/L, A/L General English and IELTS essays:
     Essay builder         plan and write an essay step by step, with checks
                           at each step, then send the draft to Writing Practice
     Improve a paragraph   rewrite a weak paragraph, check it, compare a model
     Choose the best       theses, topic sentences, examples and conclusions
     Linking and order     put a paragraph in order; choose linking words
     Model essays          see the job every sentence does, or test yourself

   The checks are rules written by RCF English, not artificial intelligence.
   They look for things a computer can find reliably and say so honestly.
   Work is kept in this browser only.
   ========================================================================== */

import { esc } from "./lib.js";
import { LEVELS, BUILDER, IMPROVE, CHOOSE, ORDER, GAPS, ROLES, MODELS } from "./essay-exercises-data.js";

const root = document.querySelector("[data-essays]");
const SAVE_KEY = "rcf-essay-builder";
const WRITING_KEY = "rcf-writing-drafts";

const store = {
  get(k, f) { try { const v = window.localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
  set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* not kept */ } }
};

/* Inline *emphasis* in the content. */
const md = (t) => esc(t).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const lower = (t) => ` ${String(t || "").toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ")} `;
const wordsOf = (t) => (String(t || "").trim() ? String(t).trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)) : []);
const sentencesOf = (t) => (String(t || "").match(/[^.!?]+[.!?]*/g) || []).map((x) => x.trim()).filter(Boolean);
const LINKS = ["because", "for example", "for instance", "as a result", "in addition", "however", "therefore", "moreover", "although", "so ", "also", "this means", "which", "such as", "finally", "firstly", "secondly", "furthermore", "on the other hand", "while", "whereas"];

const note = (ok, msg) => `<li class="wp__note wp__note--${ok ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${ok ? "✓" : "!"}</span><span class="visually-hidden">${ok ? "Good: " : "To improve: "}</span>${md(msg)}</li>`;
const notes = (list) => `<ul class="wp__notes">${list.map(([ok, msg]) => note(ok, msg)).join("")}</ul>`;

/* Apply one data-written check to a piece of writing. */
function runCheck(c, text) {
  const t = lower(text);
  const w = wordsOf(text);
  let ok = true;
  if (c.minWords) ok = w.length >= c.minWords;
  else if (c.maxWords) ok = w.length > 0 && w.length <= c.maxWords;
  else if (c.has) ok = c.has.some((p) => t.includes(p.toLowerCase()));
  else if (c.not) ok = w.length > 0 && !c.not.some((p) => t.includes(p.toLowerCase()));
  else if (c.notRegex) ok = w.length > 0 && !new RegExp(c.notRegex, "i").test(text.replace(/[’]/g, "'"));
  else if (c.maxCount) ok = w.length > 0 && (t.match(new RegExp(`\\b${c.maxCount[0]}\\b`, "g")) || []).length <= c.maxCount[1];
  else if (c.firstHas) { const first = lower(sentencesOf(text)[0] || ""); ok = c.firstHas.some((p) => first.includes(p)); }
  else if (c.maxStarts) ok = w.length > 0 && sentencesOf(text).filter((s) => s.toLowerCase().startsWith(c.maxStarts[0])).length <= c.maxStarts[1];
  else if (c.minLinks) ok = LINKS.filter((l) => t.includes(` ${l.trim()} `) || t.includes(` ${l.trim()},`)).length >= c.minLinks;
  else if (c.minSentences) ok = sentencesOf(text).filter((s) => wordsOf(s).length >= c.minSentences[1]).length >= c.minSentences[0];
  return [ok, ok ? c.ok : c.fix];
}

/* ================================================================= setup */

const TABS = [
  ["builder", "Essay builder"],
  ["improve", "Improve a paragraph"],
  ["choose", "Choose the best sentence"],
  ["order", "Linking and order"],
  ["models", "How a model essay works"]
];

function setUp() {
  root.innerHTML = `
    <div class="ee">
      <div class="sp__modes" role="tablist" aria-label="Kind of exercise">
        ${TABS.map(([id, label], i) => `<button type="button" role="tab" class="sp__mode" data-tab="${id}" aria-selected="${i === 0}">${esc(label)}</button>`).join("")}
      </div>
      <div class="field ee__level">
        <label for="ee-level">Level</label>
        <select id="ee-level" data-level>
          <option value="">All levels</option>
          ${LEVELS.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("")}
        </select>
      </div>
      <div data-panel></div>
    </div>`;

  const panel = root.querySelector("[data-panel]");
  const levelSel = root.querySelector("[data-level]");
  let tab = "builder";
  const level = () => levelSel.value;
  const atLevel = (list) => list.filter((x) => !level() || x.level === level());

  const params = new URLSearchParams(window.location.search);
  if (LEVELS.includes(params.get("level"))) levelSel.value = params.get("level");

  function show(id) {
    tab = id;
    root.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    ({ builder, improve, choose, order, models })[id]();
  }
  root.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  levelSel.addEventListener("change", () => show(tab));

  /* ======================================================= essay builder */

  function builder() {
    const tasks = atLevel(BUILDER);
    const saved = store.get(SAVE_KEY, {});
    let task = tasks.find((t) => t.id === saved.current) || tasks[0];
    let st = (saved.work || {})[task.id] || blank();

    function blank() { return { step: 0, understood: false, thesis: "", bodies: [{ point: "", explain: "", example: "" }, { point: "", explain: "", example: "" }], background: "", conclusion: "", essay: "" }; }
    function save() {
      const all = store.get(SAVE_KEY, {});
      all.current = task.id;
      all.work = all.work || {};
      all.work[task.id] = st;
      store.set(SAVE_KEY, all);
    }

    const STEPS = ["Understand the question", "Write your thesis", `Body paragraph 1`, `Body paragraph 2`, "Introduction and conclusion", "Your essay"];

    function render() {
      panel.innerHTML = `
        <div class="field ee__choose"><label for="ee-task">Choose an essay question</label>
          <select id="ee-task" data-task>${tasks.map((t) => `<option value="${t.id}"${t.id === task.id ? " selected" : ""}>${esc(t.level)}: ${esc(t.prompt.replace(/\s*\((about|at least)[^)]*\)|\s*Write an essay of about[^.]*\./g, "").slice(0, 90))}</option>`).join("")}</select></div>
        <div class="sp__card"><p class="wp__level">${esc(task.level)} · about ${task.words[0]}-${task.words[1]} words</p><p class="sp__prompt">${md(task.prompt)}</p></div>
        <ol class="ee__steps">${STEPS.map((s, i) => `<li class="${i === st.step ? "is-current" : i < st.step ? "is-done" : ""}">${esc(s)}</li>`).join("")}</ol>
        <section class="wp__panel" data-step></section>`;
      panel.querySelector("[data-task]").addEventListener("change", (e) => {
        task = tasks.find((t) => t.id === e.target.value);
        st = (store.get(SAVE_KEY, {}).work || {})[task.id] || blank();
        save(); render();
      });
      step();
    }

    function nav(canNext, nextLabel = "Next step") {
      return `<div class="sp__controls ee__nav">
        ${st.step ? `<button type="button" class="btn btn--outline" data-back>Back</button>` : ""}
        <button type="button" class="btn btn--outline" data-check>Check this step</button>
        <button type="button" class="btn btn--accent" data-next ${canNext ? "" : "disabled"}>${esc(nextLabel)}</button>
      </div><div data-notes aria-live="polite"></div>`;
    }

    function wire(check, collect) {
      const box = panel.querySelector("[data-step]");
      const next = box.querySelector("[data-next]");
      box.querySelector("[data-back]")?.addEventListener("click", () => { collect(); st.step--; save(); render(); });
      box.querySelector("[data-check]").addEventListener("click", () => {
        collect(); save();
        const r = check();
        box.querySelector("[data-notes]").innerHTML = notes(r.notes);
        next.disabled = !r.pass;
      });
      next.addEventListener("click", () => { collect(); const r = check(); if (!r.pass) return; st.step++; save(); render(); });
      box.addEventListener("input", () => { collect(); save(); });
    }

    const keywordHit = (text) => task.keywords.some((k) => lower(text).includes(k));

    function step() {
      const box = panel.querySelector("[data-step]");
      const b = st.bodies;

      if (st.step === 0) {
        box.innerHTML = `<h3>Step 1. What does the question ask you to do?</h3>
          <p class="text-small text-muted">Read the question twice. Look at the instruction words, then choose.</p>
          <fieldset class="ee__options"><legend class="visually-hidden">What the question asks</legend>
          ${task.understand.map((o, i) => `<label class="ee__option"><input type="radio" name="ee-u" value="${i}"${st.choice === i ? " checked" : ""}> ${esc(o)}</label>`).join("")}</fieldset>
          ${nav(st.understood)}`;
        wire(() => {
          const ok = st.choice === 0;
          st.understood = ok;
          return { pass: ok, notes: st.choice === undefined ? [[false, "Choose one of the answers first."]] : [[ok, ok ? `Right. ${task.why}` : `Not quite. ${task.why}`]] };
        }, () => { const c = box.querySelector("input[name=ee-u]:checked"); if (c) st.choice = Number(c.value); });
        return;
      }

      if (st.step === 1) {
        const stance = { opinion: "your opinion", discuss: "your own opinion", advantages: "that there are both advantages and disadvantages", problem: "the main problem and that there are solutions" }[task.kind];
        box.innerHTML = `<h3>Step 2. Write your thesis statement</h3>
          <p>Your thesis is your answer to the question in one sentence. It should show ${esc(stance)}.</p>
          <p class="text-small text-muted">A useful pattern: <em>Although [the other side], I believe [your view] because [your main reason].</em></p>
          <div class="field"><label for="ee-thesis">Your thesis</label><textarea id="ee-thesis" rows="3" data-f="thesis">${esc(st.thesis)}</textarea></div>
          ${nav(false)}`;
        wire(() => {
          const t = st.thesis, n = wordsOf(t).length, lt = lower(t);
          const out = [];
          out.push([n >= 10 && n <= 45, n < 10 ? `Only ${n} words. A thesis needs a position and a reason, usually 15 to 35 words.` : n > 45 ? `${n} words. Keep the thesis to one clear sentence.` : `${n} words: a good length.`]);
          out.push([!/\?\s*$/.test(t.trim()), /\?\s*$/.test(t.trim()) ? "A thesis is not a question. Answer the question instead." : "It is a statement, not a question."]);
          const pos = {
            opinion: /\b(i (strongly )?(believe|think|agree|disagree|feel)|in my (view|opinion)|should|must|outweigh|more .+ than|partly agree|to some extent)\b/,
            discuss: /\b(i (strongly )?(believe|think|agree|feel)|in my (view|opinion)|should|prefer|favour|favor)\b/,
            advantages: /\b(advantages?|disadvantages?|benefits?|drawbacks?|problems?|both)\b/,
            problem: /\b(problems?|challenges?|solutions?|solve|address|tackle|measures?|steps)\b/
          }[task.kind];
          const hasPos = pos.test(lt);
          out.push([hasPos, hasPos ? "Your thesis shows your position." : `Your thesis does not yet show ${stance}.`]);
          out.push([keywordHit(t), keywordHit(t) ? "It is clearly about the topic of the question." : "Use the key words of the topic so the thesis clearly answers this question."]);
          out.push([!/\bin this essay i (will|am going to)\b/.test(lt), /\bin this essay i (will|am going to)\b/.test(lt) ? "Avoid *In this essay I will...*: give your answer instead of announcing it." : "It answers rather than announces."]);
          return { pass: n >= 6 && hasPos, notes: out };
        }, () => { st.thesis = box.querySelector("[data-f=thesis]").value; });
        return;
      }

      if (st.step === 2 || st.step === 3) {
        const i = st.step - 2;
        const [label, help] = task.bodies[i];
        box.innerHTML = `<h3>Step ${st.step + 1}. Body paragraph ${i + 1}: ${esc(label)}</h3>
          <p>${esc(help)} Plan it in three parts. You can write full sentences here: they will become your paragraph.</p>
          <div class="field"><label for="ee-p${i}">1. Point (topic sentence)</label><textarea id="ee-p${i}" rows="2" data-f="point" placeholder="The main point of this paragraph, in one sentence.">${esc(b[i].point)}</textarea></div>
          <div class="field"><label for="ee-e${i}">2. Explanation</label><textarea id="ee-e${i}" rows="3" data-f="explain" placeholder="Why or how is the point true?">${esc(b[i].explain)}</textarea></div>
          <div class="field"><label for="ee-x${i}">3. Example or evidence</label><textarea id="ee-x${i}" rows="3" data-f="example" placeholder="For example, ...">${esc(b[i].example)}</textarea></div>
          ${nav(false)}`;
        wire(() => {
          const p = b[i];
          const out = [];
          const np = wordsOf(p.point).length, ne = wordsOf(p.explain).length, nx = wordsOf(p.example).length;
          out.push([np >= 6 && np <= 35, np < 6 ? "The point is too short to be a clear topic sentence." : np > 35 ? "The topic sentence is long. Keep the point short and put the detail in the explanation." : "The topic sentence is a good length."]);
          out.push([keywordHit(p.point + " " + p.explain), keywordHit(p.point + " " + p.explain) ? "The paragraph stays on the topic of the question." : "Make sure the point is clearly about the question's topic."]);
          const why = /\b(because|this means|so |as a result|which|since|therefore|this is why|that is why|if )/.test(lower(p.explain));
          out.push([ne >= 10 && why, ne < 10 ? "Develop the explanation: at least 10 words." : why ? "The explanation gives a reason or a result." : "Show the reasoning in the explanation with *because*, *this means* or *as a result*."]);
          const ex = /\b(for example|for instance|such as|when|once|a student|a worker|a family|my |in [a-z]+ \d|\d)/.test(lower(p.example));
          out.push([nx >= 10 && ex, nx < 10 ? "Develop the example: at least 10 words." : ex ? "The example is specific." : "Make the example specific: a situation, a person or a detail. Start with *For example*."]);
          if (i === 1 && lower(p.point).trim() && lower(p.point).trim() === lower(b[0].point).trim()) out.push([false, "This point is the same as paragraph 1. Make a different point."]);
          return { pass: np >= 4 && ne >= 6 && nx >= 6, notes: out };
        }, () => { box.querySelectorAll("[data-f]").forEach((f) => { b[i][f.dataset.f] = f.value; }); });
        return;
      }

      if (st.step === 4) {
        box.innerHTML = `<h3>Step 5. Introduction and conclusion</h3>
          <div class="field"><label for="ee-bg">Introduction: one or two sentences of background</label>
            <p class="text-small text-muted">Introduce the topic in your own words. Your thesis will be added after it automatically.</p>
            <textarea id="ee-bg" rows="3" data-f="background">${esc(st.background)}</textarea></div>
          <p class="ee__thesis-preview"><strong>Your thesis:</strong> ${esc(st.thesis)}</p>
          <div class="field"><label for="ee-con">Conclusion: two or three sentences</label>
            <p class="text-small text-muted">Sum up your main points and repeat your answer in new words. Do not add new ideas.</p>
            <textarea id="ee-con" rows="4" data-f="conclusion">${esc(st.conclusion)}</textarea></div>
          ${nav(false, "Build my essay")}`;
        wire(() => {
          const out = [];
          const nb = wordsOf(st.background).length, nc = wordsOf(st.conclusion).length;
          out.push([nb >= 12 && nb <= 60, nb < 12 ? "Add a little more background: at least 12 words." : nb > 60 ? "The background is long. Get to your thesis sooner." : "The background is a good length."]);
          // copying six or more words in a row from the question
          const qw = wordsOf(task.prompt.toLowerCase().replace(/[^a-z' ]/g, " "));
          const bw = st.background.toLowerCase().replace(/[^a-z' ]/g, " ");
          let copied = false;
          for (let k = 0; k + 6 <= qw.length && !copied; k++) if (` ${bw} `.replace(/\s+/g, " ").includes(` ${qw.slice(k, k + 6).join(" ")} `)) copied = true;
          out.push([!copied, copied ? "Part of the background is copied from the question. Put it in your own words." : "The background uses your own words."]);
          const signal = /\b(in conclusion|to conclude|to sum up|overall|on balance|in short|all in all)\b/.test(lower(st.conclusion));
          out.push([signal, signal ? "The conclusion is clearly signalled." : "Begin the conclusion with *In conclusion*, *To sum up* or *On balance*."]);
          out.push([nc >= 20 && nc <= 80, nc < 20 ? "The conclusion is too short: sum up both body paragraphs." : nc > 80 ? "The conclusion is long. Keep it to two or three sentences." : "The conclusion is a good length."]);
          const newIdea = /\b(another (reason|point|problem|advantage)|furthermore|moreover|in addition)\b/.test(lower(st.conclusion));
          out.push([!newIdea, newIdea ? "Words such as *another reason* or *in addition* suggest a new idea. A conclusion should only sum up." : "No new ideas appear in the conclusion."]);
          return { pass: nb >= 8 && nc >= 12 && signal, notes: out };
        }, () => { box.querySelectorAll("[data-f]").forEach((f) => { st[f.dataset.f] = f.value; }); });
        return;
      }

      // step 5: the essay
      const sentence = (x) => { const t = String(x || "").trim(); return t && !/[.!?]["”']?$/.test(t) ? t + "." : t; };
      const para = (list) => list.map(sentence).filter(Boolean).join(" ");
      if (!st.essay) st.essay = [para([st.background, st.thesis]), para([b[0].point, b[0].explain, b[0].example]), para([b[1].point, b[1].explain, b[1].example]), para([st.conclusion])].join("\n\n");
      save();
      const count = () => wordsOf(st.essay).length;
      box.innerHTML = `<h3>Step 6. Your essay</h3>
        <p>Here is your essay, built from your plan. Now read it aloud and improve it: add linking words between paragraphs (<em>Firstly</em>, <em>On the other hand</em>, <em>However</em>), and develop any paragraph that feels thin.</p>
        <div class="field"><label for="ee-essay">Your essay</label><textarea id="ee-essay" rows="16" data-essay>${esc(st.essay)}</textarea></div>
        <p class="sp__stats" data-count></p>
        <div class="sp__controls">
          <button type="button" class="btn btn--accent" data-wp>Check it in Writing Practice</button>
          <button type="button" class="btn btn--outline" data-copy>Copy</button>
          <button type="button" class="btn btn--outline" data-back>Back</button>
          <button type="button" class="btn btn--outline" data-restart>Start this essay again</button>
        </div>
        <p class="text-small text-muted" data-msg aria-live="polite"></p>`;
      const upd = () => {
        const n = count();
        const [lo, hi] = task.words;
        box.querySelector("[data-count]").textContent = `${n} words · target about ${lo}-${hi}${n < lo ? " · develop your paragraphs further" : n > hi + 40 ? " · a little long: remove repetition" : " · a good length"}`;
      };
      upd();
      box.querySelector("[data-essay]").addEventListener("input", (e) => { st.essay = e.target.value; save(); upd(); });
      box.querySelector("[data-back]").addEventListener("click", () => { st.step = 4; st.essay = ""; save(); render(); });
      box.querySelector("[data-restart]").addEventListener("click", () => { if (!window.confirm("Clear this essay and start again?")) return; st = blank(); save(); render(); });
      box.querySelector("[data-copy]").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(st.essay); box.querySelector("[data-msg]").textContent = "Copied."; } catch (e) { box.querySelector("[data-msg]").textContent = "Select the text and copy it yourself."; }
      });
      box.querySelector("[data-wp]").addEventListener("click", () => {
        const drafts = store.get(WRITING_KEY, {});
        drafts.free = { text: st.essay, own: task.prompt, self: {}, at: Date.now() };
        store.set(WRITING_KEY, drafts);
        window.location.href = `${document.body.dataset.root || ""}writing-practice/?task=free`;
      });
    }

    if (!tasks.length) { panel.innerHTML = "<p>No essay questions at this level.</p>"; return; }
    render();
  }

  /* =================================================== improve a paragraph */

  function improve() {
    const items = atLevel(IMPROVE);
    let item = items[0];
    function render() {
      panel.innerHTML = `
        <div class="field ee__choose"><label for="ee-imp">Choose a paragraph</label>
          <select id="ee-imp" data-imp>${items.map((x) => `<option value="${x.id}"${x.id === item.id ? " selected" : ""}>${esc(x.level)}: ${esc(x.title)}</option>`).join("")}</select></div>
        <section class="wp__panel">
          <p class="text-small">${md(item.context)}</p>
          <h3>The weak paragraph</h3>
          <blockquote class="ee__weak">${esc(item.weak)}</blockquote>
          <details class="accordion"><summary>What is wrong with it?</summary><div class="accordion__body"><ul>${item.hints.map((h) => `<li>${md(h)}</li>`).join("")}</ul></div></details>
          <div class="field"><label for="ee-rewrite">Rewrite the paragraph</label><textarea id="ee-rewrite" rows="7" data-rewrite></textarea></div>
          <div class="sp__controls">
            <button type="button" class="btn btn--accent" data-check>Check my paragraph</button>
            <button type="button" class="btn btn--outline" data-model>Show a model paragraph</button>
          </div>
          <p class="sp__stats" data-count></p>
          <div data-out aria-live="polite"></div>
          <div data-model-box hidden class="ee__model"><h3>A model paragraph</h3><p>${esc(item.model)}</p><p><strong>Why it works</strong></p><ul>${item.notes.map((n) => `<li>${md(n)}</li>`).join("")}</ul></div>
        </section>`;
      const ta = panel.querySelector("[data-rewrite]");
      ta.addEventListener("input", () => { panel.querySelector("[data-count]").textContent = `${wordsOf(ta.value).length} words`; });
      panel.querySelector("[data-imp]").addEventListener("change", (e) => { item = items.find((x) => x.id === e.target.value); render(); });
      panel.querySelector("[data-check]").addEventListener("click", () => {
        if (!wordsOf(ta.value).length) { panel.querySelector("[data-out]").innerHTML = notes([[false, "Write your paragraph first."]]); return; }
        const res = item.checks.map((c) => runCheck(c, ta.value));
        const passed = res.filter(([ok]) => ok).length;
        panel.querySelector("[data-out]").innerHTML = `<p class="sp__stats">${passed} of ${res.length} checks passed.</p>${notes(res)}<p class="text-small text-muted">These checks look for particular features. A paragraph can pass them all and still be improved, so compare yours with the model.</p>`;
      });
      panel.querySelector("[data-model]").addEventListener("click", () => { panel.querySelector("[data-model-box]").hidden = false; });
    }
    if (!items.length) { panel.innerHTML = "<p>No paragraphs at this level.</p>"; return; }
    render();
  }

  /* ============================================ choose the best sentence */

  function choose() {
    const qs = atLevel(CHOOSE);
    let right = 0, answered = 0;
    panel.innerHTML = `<p class="sp__stats" data-score>Choose the best answer for each question.</p>
      ${qs.map((q, qi) => {
        // a stable shuffle, so the correct answer is not always in the same place
        const order = q.options.map((o, i) => i).sort((a, b) => ((a * 7 + qi * 3) % 4) - ((b * 7 + qi * 3) % 4));
        return `<section class="wp__panel ee__q" data-q="${qi}">
          <p class="wp__level">${esc(q.level)} · Question ${qi + 1}</p>
          <p>${md(q.question)}</p>
          <div class="ee__options">${order.map((i) => `<button type="button" class="ee__opt" data-opt="${i}">${md(q.options[i][0])}</button>`).join("")}</div>
          <div data-fb aria-live="polite"></div>
        </section>`;
      }).join("")}`;
    panel.querySelectorAll("[data-q]").forEach((sec) => {
      const q = qs[Number(sec.dataset.q)];
      sec.addEventListener("click", (e) => {
        const b = e.target.closest("[data-opt]");
        if (!b || sec.dataset.done) return;
        sec.dataset.done = "1";
        const [, ok, why] = q.options[Number(b.dataset.opt)];
        answered++; if (ok) right++;
        sec.querySelectorAll("[data-opt]").forEach((o) => {
          const [, good] = q.options[Number(o.dataset.opt)];
          o.disabled = true;
          if (good) o.classList.add("is-right");
          else if (o === b) o.classList.add("is-wrong");
        });
        const best = q.options.find((o) => o[1]);
        sec.querySelector("[data-fb]").innerHTML = notes([[ok, ok ? `Correct. ${why}` : `Not the best choice. ${why}`], ...(ok ? [] : [[true, `The best answer: ${best[2]}`]])]);
        panel.querySelector("[data-score]").textContent = `${right} of ${answered} correct so far (${qs.length} questions).`;
      });
    });
  }

  /* ==================================================== linking and order */

  function order() {
    const orders = atLevel(ORDER), gaps = atLevel(GAPS);
    panel.innerHTML = `
      <h3>Put the paragraph in order</h3>
      <p class="text-small text-muted">Use the arrows to move each sentence. Look for clues: linking words, and words such as <em>this</em>, <em>they</em> and <em>such</em> that point back.</p>
      ${orders.map((o, oi) => `<section class="wp__panel" data-order="${oi}"><p class="wp__level">${esc(o.level)} · ${esc(o.title)}</p><ol class="ee__order" data-list></ol>
        <div class="sp__controls"><button type="button" class="btn btn--accent" data-check>Check the order</button></div><div data-fb aria-live="polite"></div></section>`).join("")}
      <h3 class="mt-4">Choose the linking words</h3>
      ${gaps.map((g, gi) => `<section class="wp__panel" data-gap="${gi}"><p class="wp__level">${esc(g.level)} · ${esc(g.title)}</p><p class="ee__gaptext">${gapHtml(g, gi)}</p>
        <div class="sp__controls"><button type="button" class="btn btn--accent" data-check>Check my answers</button></div><div data-fb aria-live="polite"></div></section>`).join("")}`;

    panel.querySelectorAll("[data-order]").forEach((sec) => {
      const o = orders[Number(sec.dataset.order)];
      // a fixed scramble that never starts in the right order
      let current = [2, 4, 0, 3, 1].map((i) => i % o.sentences.length);
      const list = sec.querySelector("[data-list]");
      const draw = () => {
        list.innerHTML = current.map((si, pos) => `<li class="ee__item"><span>${esc(o.sentences[si])}</span>
          <span class="ee__move"><button type="button" class="btn btn--sm btn--outline" data-up="${pos}" aria-label="Move up"${pos === 0 ? " disabled" : ""}>↑</button><button type="button" class="btn btn--sm btn--outline" data-down="${pos}" aria-label="Move down"${pos === current.length - 1 ? " disabled" : ""}>↓</button></span></li>`).join("");
      };
      draw();
      sec.addEventListener("click", (e) => {
        const up = e.target.closest("[data-up]"), down = e.target.closest("[data-down]");
        if (up || down) {
          const p = Number((up || down).dataset[up ? "up" : "down"]), q = up ? p - 1 : p + 1;
          [current[p], current[q]] = [current[q], current[p]];
          draw();
          list.querySelectorAll("button")[q * 2 + (up ? 0 : 1)]?.focus();
          return;
        }
        if (e.target.closest("[data-check]")) {
          const correct = current.filter((si, pos) => si === pos).length;
          const all = correct === current.length;
          list.querySelectorAll(".ee__item").forEach((li, pos) => li.classList.toggle("is-wrong", current[pos] !== pos));
          sec.querySelector("[data-fb]").innerHTML = notes([[all, all ? "All in the right order." : `${correct} of ${current.length} sentences in the right place. Keep moving the others.`], ...(all ? [[true, o.clue]] : [])]);
        }
      });
    });

    panel.querySelectorAll("[data-gap]").forEach((sec) => {
      const g = GAPS.indexOf(gaps[Number(sec.dataset.gap)]) >= 0 ? gaps[Number(sec.dataset.gap)] : null;
      sec.querySelector("[data-check]").addEventListener("click", () => {
        const sels = [...sec.querySelectorAll("select")];
        let right = 0;
        const out = sels.map((s, i) => {
          const ok = s.value === s.dataset.answer;
          if (ok) right++;
          s.classList.toggle("is-right", ok);
          s.classList.toggle("is-wrong", !ok);
          return [ok, `Gap ${i + 1}: ${ok ? "" : `the answer is *${s.dataset.answer}*. `}${g.explain[i] || ""}`];
        });
        sec.querySelector("[data-fb]").innerHTML = `<p class="sp__stats">${right} of ${sels.length} correct.</p>${notes(out)}`;
      });
    });
  }

  function gapHtml(g, gi) {
    let n = 0;
    return esc(g.text).replace(/\[\[([^\]]+)\]\]/g, (_, opts) => {
      const list = opts.split("|");
      const answer = list[0];
      const shown = [...list].sort();
      const id = `ee-g${gi}-${n++}`;
      return `<label class="visually-hidden" for="${id}">Gap ${n}</label><select id="${id}" class="ee__gap" data-answer="${esc(answer)}"><option value="">...</option>${shown.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`;
    });
  }

  /* ============================================= how a model essay works */

  function models() {
    const list = atLevel(MODELS);
    let m = list[0];
    let mode = "explore";
    function render() {
      const roleKeys = [...new Set(m.paragraphs.flat().map(([r]) => r))];
      const words = m.paragraphs.flat().map(([, s]) => s).join(" ").split(/\s+/).length;
      panel.innerHTML = `
        <div class="sp__row">
          <div class="field"><label for="ee-model">Choose a model essay</label><select id="ee-model" data-model>${list.map((x, i) => `<option value="${i}"${x === m ? " selected" : ""}>${esc(x.level)}: ${esc(x.title)}</option>`).join("")}</select></div>
          <div class="field"><label for="ee-mode">What would you like to do?</label><select id="ee-mode" data-mode><option value="explore"${mode === "explore" ? " selected" : ""}>Explore: tap a sentence to see its job</option><option value="test"${mode === "test" ? " selected" : ""}>Test yourself: name the job of each sentence</option></select></div>
        </div>
        <div class="sp__card"><p class="wp__level">${esc(m.level)} · model essay · ${words} words</p><p class="sp__prompt">${md(m.prompt)}</p></div>
        <section class="wp__panel ee__essay">
          ${m.paragraphs.map((p, pi) => `<p>${p.map(([role, s], si) => mode === "explore"
            ? `<button type="button" class="ee__sent ee__sent--${role}" data-role="${role}" aria-expanded="false">${esc(s)}</button>`
            : `<span class="ee__sent">${esc(s)}</span> <select class="ee__roleselect" data-answer="${role}" aria-label="Job of this sentence"><option value="">job?</option>${roleKeys.map((k) => `<option value="${k}">${esc(ROLES[k][0])}</option>`).join("")}</select>`).join(" ")}</p>`).join("")}
        </section>
        <div data-explain aria-live="polite" class="ee__explain">${mode === "explore" ? `<p class="text-small text-muted">Tap any sentence.</p>` : ""}</div>
        ${mode === "test" ? `<div class="sp__controls"><button type="button" class="btn btn--accent" data-check>Check my answers</button></div><div data-fb aria-live="polite"></div>` : ""}
        <details class="accordion"><summary>The jobs sentences do in an essay</summary><div class="accordion__body"><dl class="term-list">${roleKeys.map((k) => `<div><dt>${esc(ROLES[k][0])}</dt><dd>${esc(ROLES[k][1])}</dd></div>`).join("")}</dl></div></details>`;
      panel.querySelector("[data-model]").addEventListener("change", (e) => { m = list[Number(e.target.value)]; render(); });
      panel.querySelector("[data-mode]").addEventListener("change", (e) => { mode = e.target.value; render(); });
      if (mode === "explore") {
        panel.querySelector(".ee__essay").addEventListener("click", (e) => {
          const s = e.target.closest("[data-role]");
          if (!s) return;
          panel.querySelectorAll(".ee__sent.is-on").forEach((x) => { x.classList.remove("is-on"); x.setAttribute("aria-expanded", "false"); });
          s.classList.add("is-on"); s.setAttribute("aria-expanded", "true");
          const [name, what] = ROLES[s.dataset.role];
          panel.querySelector("[data-explain]").innerHTML = `<p><strong>${esc(name)}.</strong> ${esc(what)}</p>`;
        });
      } else {
        panel.querySelector("[data-check]").addEventListener("click", () => {
          const sels = [...panel.querySelectorAll(".ee__roleselect")];
          let right = 0;
          sels.forEach((s) => { const ok = s.value === s.dataset.answer; if (ok) right++; s.classList.toggle("is-right", ok); s.classList.toggle("is-wrong", !ok); });
          const wrong = sels.filter((s) => s.value !== s.dataset.answer).slice(0, 3).map((s) => [false, `“${s.previousElementSibling.textContent.slice(0, 60)}…”: this is the *${ROLES[s.dataset.answer][0].toLowerCase()}*. ${ROLES[s.dataset.answer][1]}`]);
          panel.querySelector("[data-fb]").innerHTML = `<p class="sp__stats">${right} of ${sels.length} correct.</p>${wrong.length ? notes(wrong) : notes([[true, "Every sentence named correctly."]])}`;
        });
      }
    }
    if (!list.length) { panel.innerHTML = "<p>No model essays at this level.</p>"; return; }
    render();
  }

  const want = params.get("tab");
  show(TABS.some(([id]) => id === want) ? want : "builder");
}

if (root) setUp();
