/* ==========================================================================
   RCF English - writing practice

   A student chooses a task, writes in the box, and gets:
     live counts          words, sentences, paragraphs
     practice guidance    simple checks a computer can make reliably:
                          length, paragraphs, capital letters and full stops,
                          very long sentences, "i" on its own, repeated words,
                          linking words, and the format parts of letters,
                          notices, emails and essays
     self-check           relevance, organisation, grammar, vocabulary,
                          introduction-body-conclusion, ticked by the student
     print                the answer with the checklist, for a teacher to mark

   The guidance is not a mark. It cannot judge ideas, accuracy or tone, and
   says so. A teacher's marking is the one that counts.
   Drafts stay in this browser only.
   ========================================================================== */

import { esc } from "./lib.js";

const root = document.querySelector("[data-writing]");
const DRAFT_KEY = "rcf-writing-drafts";

const TASKS = [
  { id: "g7-description", level: "Grades 6-7", kind: "paragraph", title: "My favourite place", words: [60, 90],
    prompt: "Write a paragraph of about 60-90 words describing your favourite place. Say where it is, what you can see and hear there, and why you like it." },
  { id: "g8-notice", level: "Grades 8-9", kind: "notice", title: "A notice for a book donation", words: [40, 60],
    prompt: "Your school English Society is collecting old storybooks for a village school library. As secretary, write a notice of about 50 words. Include what is being collected, why, where and until when to bring the books, and whom to contact." },
  { id: "g9-email", level: "Grades 8-9", kind: "email", title: "An email to a friend about a trip", words: [80, 120],
    prompt: "Write an email of about 100 words to your friend describing a school trip you went on last week. Say where you went, what you did and what you enjoyed most." },
  { id: "ol-letter", level: "O/L", kind: "letter", title: "A letter to the principal", words: [150, 200],
    prompt: "The water taps in your school's toilets have been leaking for weeks. Write a letter of about 150-200 words to your principal describing the problem, how it affects students, and suggesting what could be done." },
  { id: "ol-essay", level: "O/L", kind: "essay", title: "Essay: The value of reading", words: [200, 250],
    prompt: "Write an essay of about 200-250 words on 'The value of reading'. Include an introduction, at least two developed points with examples, and a conclusion." },
  { id: "ol-story", level: "O/L", kind: "story", title: "A story that ends with a surprise", words: [150, 200],
    prompt: "Write a story of about 150-200 words that ends with the words: '...and that was when I realised it had been my brother all along.'" },
  { id: "al-letter-editor", level: "A/L General English", kind: "letter", title: "A letter to the editor on road safety", words: [200, 250],
    prompt: "Write a letter to the editor of a newspaper (about 200-250 words) about the increase in road accidents involving motorcycles in your area. Describe the problem, its causes and two practical solutions." },
  { id: "al-report", level: "A/L General English", kind: "report", title: "A report on a school survey", words: [200, 250],
    prompt: "Your class surveyed 100 students about how they travel to school: 45 by bus, 25 on foot, 20 by bicycle, 10 by private vehicle. Write a report of about 200-250 words presenting the findings and making one recommendation." },
  { id: "free", level: "Any level", kind: "free", title: "My own task", words: [0, 0],
    prompt: "Write on a task your teacher has given you. Type the task in the box first, then write your answer." }
];

const LINKERS = ["first", "firstly", "secondly", "finally", "then", "next", "after that", "also", "moreover", "furthermore", "in addition", "however", "although", "but", "because", "so", "therefore", "as a result", "for example", "for instance", "such as", "in conclusion", "to sum up", "on the other hand", "while", "when", "unless", "since"];
const STOP = new Set("the a an and or but of to in on at for with is are was were be been it its this that these those i you he she we they my your his her our their me him us them as by from not no so do did does have has had will would can could should there here what which who when where why how all some any very more most also just than then into out up about over after before".split(" "));

function stats(text) {
  const clean = text.replace(/\r/g, "").trim();
  const words = clean ? clean.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)) : [];
  const paragraphs = clean ? clean.split(/\n\s*\n/).filter((p) => p.trim()) : [];
  // Sentences are found line by line as well as by punctuation, so the start
  // of a paragraph after "Dear Sir," is checked as the start of a sentence.
  const sentences = clean
    ? clean.split(/\n+/).flatMap((line) => line.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g) || [])
        .map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 3 && /[A-Za-z]/.test(x))
    : [];
  return { clean, words, paragraphs, sentences };
}

function guidance(task, text) {
  const s = stats(text);
  const out = [];
  const add = (ok, msg) => out.push({ ok, msg });
  if (!s.words.length) return out;
  const n = s.words.length;
  const lower = s.clean.toLowerCase();

  if (task.words[1]) {
    const [lo, hi] = task.words;
    if (n < lo * 0.9) add(false, `About ${n} words: the task asks for ${lo}-${hi}. Develop your points further.`);
    else if (n > hi * 1.15) add(false, `About ${n} words: the task asks for ${lo}-${hi}. Cut repetition so every sentence earns its place.`);
    else add(true, `About ${n} words, within the ${lo}-${hi} asked for.`);
  }

  const needParas = { essay: 3, letter: 3, report: 3, story: 3, email: 2 }[task.kind];
  if (needParas) {
    if (s.paragraphs.length < needParas) add(false, `${s.paragraphs.length} ${s.paragraphs.length === 1 ? "paragraph" : "paragraphs"}. A ${task.kind} usually needs at least ${needParas}. Leave an empty line between paragraphs.`);
    else add(true, `${s.paragraphs.length} paragraphs.`);
  }

  const noCapital = s.sentences.filter((x) => /^[a-z]/.test(x.trim())).length;
  if (noCapital) add(false, `${noCapital} ${noCapital === 1 ? "sentence begins" : "sentences begin"} without a capital letter.`);
  else add(true, "Every sentence begins with a capital letter.");

  const lastChar = s.clean.replace(/["'”’)\s]+$/, "").slice(-1);
  // Letters, emails and notices end with a name, not a sentence.
  if (!/[.!?]/.test(lastChar) && !["notice", "letter", "email"].includes(task.kind)) add(false, "The last sentence has no full stop.");

  if (/(^|\s)i(\s|'|’|$)/.test(s.clean)) add(false, "The word \"I\" is written as a small \"i\" somewhere. It is always a capital letter.");

  const long = s.sentences.filter((x) => x.split(/\s+/).length > 35).length;
  if (long) add(false, `${long} very long ${long === 1 ? "sentence" : "sentences"} (over 35 words). Check that each is correct, or split it.`);

  const freq = {};
  s.words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter((w) => w.length > 3 && !STOP.has(w)).forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const repeated = Object.entries(freq).filter(([, c]) => c >= Math.max(4, Math.round(n / 40))).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (repeated.length) add(false, `Repeated words: ${repeated.map(([w, c]) => `"${w}" (${c} times)`).join(", ")}. Could some be replaced with other words?`);

  const used = LINKERS.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(lower));
  if (n >= 60) {
    if (used.length < 2) add(false, "Few linking words. Words such as however, because, for example and finally show how ideas connect.");
    else add(true, `Linking words used: ${used.slice(0, 6).join(", ")}.`);
  }

  if (task.kind === "letter") {
    add(/\bdear\b/i.test(s.clean) || /^sir\b/im.test(s.clean), /\bdear\b/i.test(s.clean) || /^sir\b/im.test(s.clean) ? "The letter has a salutation (Dear... / Sir)." : "No salutation found. A letter begins with Dear... or Sir/Madam.");
    const closing = /\byours (faithfully|sincerely|truly)\b|\bthank you\b/i.test(s.clean);
    add(closing, closing ? "The letter has a closing." : "No closing found, such as Yours faithfully.");
    const dated = /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/i.test(s.clean);
    add(dated, dated ? "A date is included." : "No date found. A formal letter needs the date under the address.");
  }
  if (task.kind === "notice") {
    const head = /\bnotice\b/i.test(s.clean.split("\n")[0] || "");
    add(head, head ? "The notice begins with the word NOTICE." : "Begin with the word NOTICE and the name of the organisation.");
    const dated = /\b\d{1,2}(st|nd|rd|th)?\b.*\b(january|february|march|april|may|june|july|august|september|october|november|december)\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/i.test(s.clean);
    add(dated, dated ? "A date is included." : "No date found. A notice needs the date of the event or of issue.");
    const contact = /\bcontact\b|\bsecretary\b|\bpresident\b/i.test(s.clean);
    add(contact, contact ? "Contact details or the writer's position are given." : "Add whom to contact and the writer's name and position.");
  }
  if (task.kind === "email") {
    const hello = /^(hi|hello|dear)\b/im.test(s.clean);
    add(hello, hello ? "The email has a greeting." : "Begin the email with a greeting such as Hi or Dear.");
  }
  if (task.kind === "essay" || task.kind === "report") {
    const concl = /\b(in conclusion|to conclude|to sum up|overall|in short)\b/i.test(lower);
    add(concl, concl ? "There is a signal of a conclusion." : "No clear conclusion signal found. Make the last paragraph sum up your answer.");
  }
  if (task.kind === "report") {
    const figures = (s.clean.match(/\d+/g) || []).length;
    add(figures >= 3, figures >= 3 ? "The report uses the figures from the survey." : "Use the survey figures to support your findings.");
    const rec = /\brecommend|\bsuggest|\bshould\b/i.test(s.clean);
    add(rec, rec ? "A recommendation is made." : "No recommendation found.");
  }
  return out;
}

const CHECKLIST = [
  ["relevance", "Relevance", "I answered the task I was given, and covered every part of it."],
  ["organisation", "Organisation", "My ideas are in a sensible order, in paragraphs, with linking words."],
  ["grammar", "Grammar", "I checked verb tenses, subject-verb agreement, articles and punctuation."],
  ["vocabulary", "Vocabulary", "I used suitable words and avoided repeating the same ones."],
  ["structure", "Introduction, body and conclusion", "My writing has a clear beginning, a developed middle and a proper ending."]
];

function loadDrafts() { try { return JSON.parse(window.localStorage.getItem(DRAFT_KEY)) || {}; } catch (e) { return {}; } }
function saveDrafts(d) { try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { /* not kept */ } }

function setUp() {
  const levels = [...new Set(TASKS.map((t) => t.level))];
  root.innerHTML = `
    <div class="wp">
      <div class="wp__choose field">
        <label for="wp-task">Choose a task</label>
        <select id="wp-task" data-task>
          ${levels.map((l) => `<optgroup label="${esc(l)}">${TASKS.filter((t) => t.level === l).map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join("")}</optgroup>`).join("")}
        </select>
      </div>
      <div class="wp__task" data-prompt></div>
      <div class="wp__own field" data-own-wrap hidden>
        <label for="wp-own">The task you were given</label>
        <textarea id="wp-own" rows="2" data-own></textarea>
      </div>
      <div class="field wp__write">
        <label for="wp-text">Your answer</label>
        <textarea id="wp-text" rows="14" data-text spellcheck="true" placeholder="Leave an empty line between paragraphs."></textarea>
      </div>
      <p class="wp__counts" data-counts aria-live="polite"></p>
      <div class="wp__actions">
        <button type="button" class="btn btn--accent" data-check>Check my writing</button>
        <button type="button" class="btn btn--outline" data-print>Print for my teacher</button>
        <button type="button" class="btn btn--outline" data-clear>Clear</button>
        <span class="wp__saved text-small text-muted" data-saved></span>
      </div>
      <section class="wp__panel" data-guidance hidden aria-labelledby="wp-guidance-title">
        <h3 id="wp-guidance-title">Practice guidance</h3>
        <p class="text-small text-muted">These are simple checks a computer can make. They do not judge your ideas, accuracy or tone, and they are not a mark. Your teacher's marking is the one that counts.</p>
        <ul class="wp__notes" data-notes></ul>
      </section>
      <section class="wp__panel" aria-labelledby="wp-self-title">
        <h3 id="wp-self-title">Check it yourself</h3>
        <p class="text-small text-muted">Read your answer again, slowly, and tick each point only when it is true.</p>
        <ul class="wp__checklist">
          ${CHECKLIST.map(([k, label, text]) => `<li><label><input type="checkbox" data-self="${k}"> <strong>${esc(label)}:</strong> ${esc(text)}</label></li>`).join("")}
        </ul>
      </section>
    </div>
    <div class="wp-print" data-printout></div>`;

  const $ = (s) => root.querySelector(s);
  const taskSel = $("[data-task]"), text = $("[data-text]"), own = $("[data-own]");
  let drafts = loadDrafts();

  const task = () => TASKS.find((t) => t.id === taskSel.value) || TASKS[0];

  function counts() {
    const s = stats(text.value);
    const t = task();
    $("[data-counts]").textContent = `${s.words.length} words · ${s.sentences.length} sentences · ${s.paragraphs.length} paragraphs${t.words[1] ? ` · target ${t.words[0]}-${t.words[1]} words` : ""}`;
  }

  function showTask() {
    const t = task();
    $("[data-prompt]").innerHTML = `<p class="wp__level">${esc(t.level)}</p><p>${esc(t.prompt)}</p>`;
    $("[data-own-wrap]").hidden = t.id !== "free";
    const d = drafts[t.id] || {};
    text.value = d.text || "";
    own.value = d.own || "";
    root.querySelectorAll("[data-self]").forEach((c) => { c.checked = !!(d.self || {})[c.dataset.self]; });
    $("[data-guidance]").hidden = true;
    $("[data-saved]").textContent = d.at ? `Draft saved on this device` : "";
    counts();
  }

  let timer;
  function store() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const self = {};
      root.querySelectorAll("[data-self]").forEach((c) => { self[c.dataset.self] = c.checked; });
      drafts[task().id] = { text: text.value, own: own.value, self, at: Date.now() };
      saveDrafts(drafts);
      $("[data-saved]").textContent = "Draft saved on this device";
    }, 400);
  }

  text.addEventListener("input", () => { counts(); store(); });
  own.addEventListener("input", store);
  root.addEventListener("change", (e) => { if (e.target.matches("[data-self]")) store(); });
  taskSel.addEventListener("change", showTask);

  $("[data-check]").addEventListener("click", () => {
    const notes = guidance(task(), text.value);
    const list = $("[data-notes]");
    list.innerHTML = notes.length
      ? notes.map((n) => `<li class="wp__note wp__note--${n.ok ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${n.ok ? "✓" : "!"}</span><span class="visually-hidden">${n.ok ? "Good: " : "To check: "}</span>${esc(n.msg)}</li>`).join("")
      : `<li class="wp__note">Write your answer first.</li>`;
    $("[data-guidance]").hidden = false;
    $("[data-guidance]").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("[data-clear]").addEventListener("click", () => {
    if (text.value && !window.confirm("Clear this answer from the box and from this device?")) return;
    delete drafts[task().id];
    saveDrafts(drafts);
    showTask();
    text.focus();
  });

  $("[data-print]").addEventListener("click", () => {
    const t = task();
    const s = stats(text.value);
    const self = {};
    root.querySelectorAll("[data-self]").forEach((c) => { self[c.dataset.self] = c.checked; });
    $("[data-printout]").innerHTML = `
      <p class="wp-print__brand">RCF English · Writing practice</p>
      <h1>${esc(t.title)}</h1>
      <p><strong>Task:</strong> ${esc(t.id === "free" ? own.value || t.prompt : t.prompt)}</p>
      <p>Name ______________________ Class ________ Date ____________ · ${s.words.length} words</p>
      <div class="wp-print__answer">${s.paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("") || "<p>(No answer written.)</p>"}</div>
      <table class="wp-print__table"><thead><tr><th>Area</th><th>Student's self-check</th><th>Teacher's comment</th></tr></thead><tbody>
        ${CHECKLIST.map(([k, label]) => `<tr><td>${esc(label)}</td><td>${self[k] ? "✓" : ""}</td><td></td></tr>`).join("")}
      </tbody></table>
      <p class="wp-print__foot">Teacher's mark: ________ · Practice guidance from the website is not a mark.</p>`;
    document.documentElement.classList.add("is-printing-writing");
    const done = () => { document.documentElement.classList.remove("is-printing-writing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
  });

  showTask();
}

if (root) setUp();
