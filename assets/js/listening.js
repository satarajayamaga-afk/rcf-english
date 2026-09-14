/* ==========================================================================
   RCF English - listening tests

   A complete listening test, driven by data/listening.json.

   PLAYBACK
   Two sources are supported, and a test does not change in any other way when
   you move from one to the other:

     "audio": "downloads/listening/l07-1.mp3"   a recorded file, if one exists
     (no "audio" field)                          the browser reads the script

   So recorded MP3s can replace browser speech later, one test at a time, by
   adding an "audio" field. Nothing else in the test needs rewriting.

   MODES
     practice   replay as often as you like
     test       formal conditions: the recording plays twice only

   The transcript is NOT written into the page until the student submits or,
   in Practice mode only, asks for it with "Show the transcript". Under
   Formal test conditions nothing reveals it before submission.

   ALSO
     Before you listen   the test's vocabulary[], each word speakable
     Accent              the English accents this device's voices offer
     Level               1 Foundation (Grades 6-7), 2 Intermediate (8-9),
                         3 Advanced (10-11)
     Worksheet           a printable sheet, with or without the answer key

   Nothing is sent anywhere: no login, no accounts, no personal information,
   no cookies. Nothing the student types leaves the browser.

   Mount a test with:  <div data-listening="l06-1"></div>
   ========================================================================== */

import { esc, loadData, safeHref } from "./lib.js";

/* Speed choices are multipliers applied to the test's own base rate, so a
   Grade 6 passage stays slower than a Grade 11 one at every setting. */
const SPEEDS = [
  { label: "Slower", factor: 0.8 },
  { label: "Normal", factor: 1 },
  { label: "Faster", factor: 1.2 }
];

const TEST_PLAYS = 2;

/* Accents are named by what the device's voice says it is. Which ones appear
   depends entirely on the phone or computer: a page never promises a voice. */
const ACCENTS = [
  { region: "GB", label: "British English" },
  { region: "IN", label: "Indian English" },
  { region: "US", label: "American English" },
  { region: "AU", label: "Australian English" },
  { region: "IE", label: "Irish English" },
  { region: "ZA", label: "South African English" },
  { region: "NZ", label: "New Zealand English" },
  { region: "CA", label: "Canadian English" }
];
const ACCENT_KEY = "rcf-listening-accent";

/* Difficulty follows the grade the test was written for. */
function levelOf(grade) {
  const g = Number(grade);
  if (g <= 7) return { n: 1, label: "Level 1 · Foundation" };
  if (g <= 9) return { n: 2, label: "Level 2 · Intermediate" };
  return { n: 3, label: "Level 3 · Advanced" };
}

function storedAccent() {
  try { return window.localStorage.getItem(ACCENT_KEY) || ""; } catch (e) { return ""; }
}

function storeAccent(value) {
  try {
    if (value) window.localStorage.setItem(ACCENT_KEY, value);
    else window.localStorage.removeItem(ACCENT_KEY);
  } catch (e) { /* private window: the choice just is not remembered */ }
}

function speakersOf(test) {
  return [...new Set(test.script.map((l) => l.speaker))].filter((s) => s !== "Narrator");
}

/* ------------------------------------------------------------- utilities */

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "")
    .trim();
}

function accepts(answer) {
  return (Array.isArray(answer) ? answer : [answer]).map(normalise);
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function band(percent) {
  if (percent >= 80) return "high";
  if (percent >= 50) return "mid";
  return "low";
}

function scoreNote(percent) {
  if (percent === 100) return "Every answer correct. Well done.";
  if (percent >= 80) return "A strong result. Read the transcript for anything you missed.";
  if (percent >= 50) return "A fair result. Read the transcript, then listen once more.";
  return "Read the transcript carefully, then try the test again another day.";
}

/* --------------------------------------------------------- speech engine */

const Speech = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window,
  voices: [],

  refresh() {
    if (!this.supported) return;
    this.voices = window.speechSynthesis.getVoices().filter((v) => /^en\b/i.test(v.lang));
  },

  /* "en_GB" on some Android phones, "en-GB" elsewhere. */
  region(voice) {
    return String(voice.lang || "").replace("_", "-").toUpperCase().split("-")[1] || "";
  },

  /* Only the accents this device can actually speak are ever offered. */
  accents() {
    this.refresh();
    const found = new Set(this.voices.map((v) => this.region(v)));
    return ACCENTS.filter((a) => found.has(a.region));
  },

  /**
   * Give each speaker a different voice where the device has more than one
   * English voice. Many phones ship with only one, in which case every
   * speaker shares it and the narrator's lines still mark the turns. With an
   * accent chosen, the voices come from that accent only.
   */
  assign(speakers, region) {
    this.refresh();
    const map = new Map();
    const chosen = region ? this.voices.filter((v) => this.region(v) === region) : [];
    const pool = chosen.length ? chosen : this.voices.length ? this.voices : [null];
    speakers.forEach((name, i) => map.set(name, pool[i % pool.length]));
    return map;
  },

  cancel() {
    if (this.supported) window.speechSynthesis.cancel();
  }
};

if (Speech.supported) {
  Speech.refresh();
  window.speechSynthesis.addEventListener("voiceschanged", () => Speech.refresh());
}

/* ------------------------------------------------------------ transcript */

function transcriptHtml(test, early) {
  const note = early
    ? "You opened the transcript before submitting. That is fine for practice: read along, then hide it and listen once more without it."
    : "The transcript appears only after you submit, so that the first listening is a fair test of what you heard.";
  return `
    <h4>Transcript</h4>
    <p class="text-small text-muted">${esc(note)}</p>
    ${test.script
      .map((line) => `<p><strong>${esc(line.speaker)}:</strong> ${esc(line.text)}</p>`)
      .join("")}`;
}

/* --------------------------------------------------- before you listen */

function vocabularyHtml(test) {
  const words = Array.isArray(test.vocabulary) ? test.vocabulary : [];
  if (!words.length) return "";
  const canSay = Speech.supported;
  const rows = words
    .map(
      (w) => `
      <li class="lvocab__item">
        <span class="lvocab__word">${esc(w.word)}</span>
        <span class="lvocab__meaning">${esc(w.meaning)}</span>
        ${canSay ? `<button type="button" class="lvocab__say" data-say="${esc(w.word)}">Hear it<span class="visually-hidden">: ${esc(w.word)}</span></button>` : ""}
      </li>`
    )
    .join("");
  return `
    <details class="lvocab" open>
      <summary>Before you listen: ${words.length} useful words</summary>
      <p class="text-small text-muted">Read these first. Knowing them will help you follow the passage.</p>
      <ul class="lvocab__list">${rows}</ul>
    </details>`;
}

/* The accent choice appears only for browser speech, and only when the
   device has more than one accent to choose from. */
function accentHtml(hasAudio) {
  if (hasAudio || !Speech.supported) return "";
  const list = Speech.accents();
  if (list.length < 2) return "";
  const saved = storedAccent();
  const opts = list
    .map((a) => `<option value="${a.region}"${a.region === saved ? " selected" : ""}>${esc(a.label)}</option>`)
    .join("");
  return `
    <label class="listening__speed">
      <span>Accent</span>
      <select data-accent><option value="">Mixed voices</option>${opts}</select>
    </label>`;
}

/* ------------------------------------------------------------- worksheet */

function worksheetQuestion(q, qi) {
  const n = `<span class="lw__n">${qi + 1}.</span> `;
  const line = `<span class="lw__line"></span>`;
  if (q.kind === "mcq") {
    return `<li>${n}${esc(q.prompt)}<ol class="lw__opts" type="a">${q.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ol></li>`;
  }
  if (q.kind === "gap" || q.kind === "short") return `<li>${n}${esc(q.prompt)}<p>${line}</p></li>`;
  if (q.kind === "note") {
    return `<li>${n}${esc(q.prompt)}${q.lines.map((l) => `<p>${esc(l.label)} ${line}</p>`).join("")}</li>`;
  }
  if (q.kind === "match") {
    const meanings = shuffle(q.pairs.map((p) => p.meaning));
    return `<li>${n}${esc(q.prompt)}<table class="lw__match"><tbody>${q.pairs
      .map((p, i) => `<tr><td>${esc(p.term)}</td><td class="lw__box"></td><td>${String.fromCharCode(65 + i)}. ${esc(meanings[i])}</td></tr>`)
      .join("")}</tbody></table><p class="lw__hint">Write the letter of the matching meaning in each box.</p></li>`;
  }
  if (q.kind === "sequence") {
    return `<li>${n}${esc(q.prompt)}<table class="lw__match"><tbody>${shuffle(q.items)
      .map((t) => `<tr><td class="lw__box"></td><td>${esc(t)}</td></tr>`)
      .join("")}</tbody></table><p class="lw__hint">Number the events 1 to ${q.items.length}.</p></li>`;
  }
  return "";
}

function printWorksheet(test, withKey) {
  const level = levelOf(test.grade);
  const words = Array.isArray(test.vocabulary) ? test.vocabulary : [];
  const sheet = document.createElement("div");
  sheet.className = "lw";
  sheet.innerHTML = `
    <header class="lw__head">
      <p class="lw__brand">RCF English · Listening worksheet</p>
      <h1>${esc(test.title)}</h1>
      <p>Grade ${esc(test.grade)} · ${esc(level.label)}</p>
      <p class="lw__who">Name ${`<span class="lw__line"></span>`} Date <span class="lw__line lw__line--short"></span></p>
    </header>
    <p><strong>What to do:</strong> ${esc(test.instructions)}</p>
    ${words.length ? `<h2>Before you listen</h2><table class="lw__vocab"><tbody>${words
      .map((w) => `<tr><th>${esc(w.word)}</th><td>${esc(w.meaning)}</td></tr>`)
      .join("")}</tbody></table>` : ""}
    <h2>Questions</h2>
    <ol class="lw__qs">${test.questions.map(worksheetQuestion).join("")}</ol>
    ${withKey ? `
      <section class="lw__key">
        <h2>Answer key</h2>
        <ol>${test.questions.map((q) => `<li>${esc(correctAnswerText(q))}</li>`).join("")}</ol>
        <h2>Transcript</h2>
        ${test.script.map((l) => `<p><strong>${esc(l.speaker)}:</strong> ${esc(l.text)}</p>`).join("")}
      </section>` : ""}
    <p class="lw__foot">rcfenglish.com · Free to print and copy for classroom use.</p>`;
  document.body.appendChild(sheet);
  document.documentElement.classList.add("is-printing-worksheet");
  const done = () => {
    document.documentElement.classList.remove("is-printing-worksheet");
    sheet.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  /* Some mobile browsers never fire afterprint. The sheet is invisible on
     screen anyway, so tidy it away at the next touch or click. */
  window.setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
}

/* ----------------------------------------------------------- player view */

function playerHtml(test, hasAudio) {
  const speeds = SPEEDS.map(
    (s) => `<option value="${s.factor}"${s.factor === 1 ? " selected" : ""}>${esc(s.label)}</option>`
  ).join("");

  const audioEl = hasAudio
    ? `<audio data-audio preload="none" src="${esc(safeHref(test.audio))}"></audio>`
    : "";

  return `
    <div class="listening__player">
      ${audioEl}
      <div class="listening__modes" role="group" aria-label="Choose how you want to listen">
        <button type="button" class="btn btn--ghost is-on" data-mode="practice" aria-pressed="true">Practice</button>
        <button type="button" class="btn btn--ghost" data-mode="test" aria-pressed="false">Formal test</button>
      </div>
      <p class="listening__limit" data-limit-note></p>
      <div class="listening__controls">
        <button type="button" class="btn btn--accent" data-play>Play the recording</button>
        <button type="button" class="btn btn--ghost" data-pause disabled>Pause</button>
        <button type="button" class="btn btn--ghost" data-stop disabled>Stop</button>
        <label class="listening__speed">
          <span>Speed</span>
          <select data-speed>${speeds}</select>
        </label>
        ${accentHtml(hasAudio)}
      </div>
      <p class="listening__status" role="status" aria-live="polite" data-player-status></p>
    </div>`;
}

/* -------------------------------------------------------- question views */

function renderQuestion(q, qi) {
  const num = `<span class="q__num" aria-hidden="true">${qi + 1}</span>`;
  const prompt = `<p class="q__prompt">${num}${esc(q.prompt)}</p>`;
  const name = `q${qi}`;

  if (q.kind === "mcq") {
    const opts = q.options
      .map(
        (opt, oi) => `
        <li><label class="option">
          <input type="radio" name="${name}" value="${oi}">
          <span class="option__text">${esc(opt)}</span>
        </label></li>`
      )
      .join("");
    return `<li class="q" data-q="${qi}" data-kind="mcq">${prompt}<ul class="options">${opts}</ul><p class="q__feedback" data-feedback></p></li>`;
  }

  if (q.kind === "gap" || q.kind === "short") {
    const label = q.kind === "gap" ? "Word for the gap" : "Your answer";
    return `<li class="q" data-q="${qi}" data-kind="${q.kind}">${prompt}
      <div class="field">
        <label class="visually-hidden" for="${name}">${esc(label)} for question ${qi + 1}</label>
        <input type="text" id="${name}" autocomplete="off" placeholder="${esc(label)}">
      </div>
      <p class="q__feedback" data-feedback></p></li>`;
  }

  if (q.kind === "note") {
    const rows = q.lines
      .map(
        (line, li) => `
        <li class="note__row">
          <label for="${name}-${li}">${esc(line.label)}</label>
          <input type="text" id="${name}-${li}" data-line="${li}" autocomplete="off">
        </li>`
      )
      .join("");
    return `<li class="q" data-q="${qi}" data-kind="note">${prompt}<ul class="note">${rows}</ul><p class="q__feedback" data-feedback></p></li>`;
  }

  if (q.kind === "match") {
    const meanings = shuffle(q.pairs.map((p) => p.meaning));
    const rows = q.pairs
      .map(
        (pair, pi) => `
        <li class="match__row">
          <span class="match__term">${esc(pair.term)}</span>
          <label class="visually-hidden" for="${name}-${pi}">Match for ${esc(pair.term)}</label>
          <select id="${name}-${pi}" data-pair="${pi}">
            <option value="">Choose…</option>
            ${meanings.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}
          </select>
        </li>`
      )
      .join("");
    return `<li class="q" data-q="${qi}" data-kind="match">${prompt}<ul class="match">${rows}</ul><p class="q__feedback" data-feedback></p></li>`;
  }

  if (q.kind === "sequence") {
    const scrambled = shuffle(q.items.map((text, i) => ({ text, i })));
    const rows = scrambled
      .map(
        (item) => `
        <li class="sequence__row">
          <label class="visually-hidden" for="${name}-${item.i}">Position for: ${esc(item.text)}</label>
          <select id="${name}-${item.i}" data-item="${item.i}">
            <option value="">–</option>
            ${q.items.map((_, n) => `<option value="${n}">${n + 1}</option>`).join("")}
          </select>
          <span class="sequence__text">${esc(item.text)}</span>
        </li>`
      )
      .join("");
    return `<li class="q" data-q="${qi}" data-kind="sequence">${prompt}<ul class="sequence">${rows}</ul><p class="q__feedback" data-feedback></p></li>`;
  }

  return "";
}

/* ------------------------------------------------------------- marking */

function markQuestion(q, li) {
  if (q.kind === "mcq") {
    const chosen = li.querySelector("input:checked");
    return chosen ? Number(chosen.value) === Number(q.answer) : false;
  }
  if (q.kind === "gap" || q.kind === "short") {
    return accepts(q.answer).includes(normalise(li.querySelector("input[type=text]").value));
  }
  if (q.kind === "note") {
    return q.lines.every((line, n) =>
      accepts(line.answer).includes(normalise(li.querySelector(`input[data-line="${n}"]`).value))
    );
  }
  if (q.kind === "match") {
    return q.pairs.every(
      (pair, pi) => normalise(li.querySelector(`select[data-pair="${pi}"]`).value) === normalise(pair.meaning)
    );
  }
  if (q.kind === "sequence") {
    return q.items.every((_, n) => String(li.querySelector(`select[data-item="${n}"]`).value) === String(n));
  }
  return false;
}

function correctAnswerText(q) {
  if (q.kind === "mcq") return q.options[q.answer];
  if (q.kind === "gap" || q.kind === "short") return (Array.isArray(q.answer) ? q.answer : [q.answer])[0];
  if (q.kind === "note") {
    return q.lines.map((l) => `${l.label} ${(Array.isArray(l.answer) ? l.answer : [l.answer])[0]}`).join("; ");
  }
  if (q.kind === "match") return q.pairs.map((p) => `${p.term} — ${p.meaning}`).join("; ");
  if (q.kind === "sequence") return q.items.map((t, i) => `${i + 1}. ${t}`).join("  ");
  return "";
}

/* --------------------------------------------------------------- render */

function render(root, test) {
  const hasAudio = Boolean(test.audio);
  const canPlay = hasAudio || Speech.supported;

  const level = levelOf(test.grade);
  const speakers = speakersOf(test).length;
  root.innerHTML = `
    <section class="listening" aria-labelledby="${esc(test.id)}-title">
      <h3 class="listening__title" id="${esc(test.id)}-title">${esc(test.title)}</h3>
      <div class="tag-row listening__tags">
        <span class="tag tag--level">Grade ${esc(test.grade)}</span>
        <span class="tag listening__level listening__level--${level.n}">${esc(level.label)}</span>
        <span class="tag">${test.questions.length} questions</span>
        ${speakers ? `<span class="tag">${speakers === 1 ? "1 speaker" : `${speakers} speakers`}</span>` : ""}
        ${test.source === "textbook" ? `<span class="tag tag--textbook">Pupil's Book activity</span>` : ""}
        <span class="tag">${hasAudio ? "Recorded audio" : "Read aloud by your device"}</span>
      </div>
      <p class="listening__meta">${esc(test.description)}</p>
      <div class="listening__instructions">
        <h4>What to do</h4>
        <p>${esc(test.instructions)}</p>
      </div>
      ${vocabularyHtml(test)}
      ${canPlay ? playerHtml(test, hasAudio) : `
        <div class="noscript-note">
          <p class="mb-0">This browser cannot play the passage. Ask your teacher for the
          printed transcript so that you can still do the questions.</p>
        </div>`}
      <form data-form novalidate>
        <ol class="qlist">${test.questions.map(renderQuestion).join("")}</ol>
        <div class="listening__actions">
          <button type="submit" class="btn btn--accent">Submit my answers</button>
          <button type="button" class="btn btn--ghost" data-reset>Start again</button>
          <button type="button" class="btn btn--ghost" data-show-transcript aria-expanded="false">Show the transcript</button>
        </div>
      </form>
      <div class="listening__print">
        <span>Worksheet:</span>
        <button type="button" class="btn btn--sm btn--outline" data-print="sheet">Print for students</button>
        <button type="button" class="btn btn--sm btn--outline" data-print="key">Print with answer key</button>
      </div>
      <p class="listening__score" role="status" aria-live="polite" data-score></p>
      <div class="listening__transcript" data-transcript hidden></div>
    </section>`;

  if (canPlay) wirePlayer(root, test, hasAudio);
  wireForm(root, test);
}

/* --------------------------------------------------------------- player */

function wirePlayer(root, test, hasAudio) {
  const playBtn = root.querySelector("[data-play]");
  const pauseBtn = root.querySelector("[data-pause]");
  const stopBtn = root.querySelector("[data-stop]");
  const speedSel = root.querySelector("[data-speed]");
  const status = root.querySelector("[data-player-status]");
  const limitNote = root.querySelector("[data-limit-note]");
  const modeBtns = root.querySelectorAll("[data-mode]");
  const audio = root.querySelector("[data-audio]");

  const baseRate = Number(test.rate) || 1;
  const allSpeakers = [...new Set(test.script.map((l) => l.speaker))];
  const transcriptBtn = root.querySelector("[data-show-transcript]");

  // Chrome often lists its voices a moment after the page loads, so the
  // accent choice may only become possible then.
  if (!hasAudio && Speech.supported && !root.querySelector("[data-accent]")) {
    const addAccent = () => {
      if (root.querySelector("[data-accent]") || !root.isConnected) return;
      const html = accentHtml(false);
      if (html) root.querySelector(".listening__controls").insertAdjacentHTML("beforeend", html);
    };
    window.speechSynthesis.addEventListener("voiceschanged", addAccent);
  }
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-accent]")) storeAccent(event.target.value);
  });

  let mode = "practice";
  let plays = 0;
  let playing = false;

  function limit() {
    return mode === "test" ? TEST_PLAYS : 0;
  }

  function setStatus(text) {
    const cap = limit();
    status.textContent = cap ? `${text} Plays used: ${plays} of ${cap}.` : text;
  }

  function refreshLimitNote() {
    limitNote.innerHTML =
      mode === "test"
        ? `<strong>Formal test.</strong> The recording plays <strong>${TEST_PLAYS} times</strong> only, as in a real examination.`
        : `<strong>Practice.</strong> Replay as often as you like. Switch to “Formal test” when you want examination conditions.`;
  }

  function stopPlayback() {
    if (hasAudio) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      Speech.cancel();
    }
  }

  function finish() {
    playing = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    const cap = limit();
    playBtn.disabled = Boolean(cap && plays >= cap);
    setStatus(playBtn.disabled ? "Finished. You have used all your plays." : "Finished.");
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === mode) return;
      mode = btn.dataset.mode;
      // The transcript is a practice aid. Under test conditions it waits for
      // the answers to be submitted.
      if (transcriptBtn) transcriptBtn.hidden = mode === "test";
      if (mode === "test") {
        const t = root.querySelector("[data-transcript]");
        if (t && t.dataset.early) { t.hidden = true; t.innerHTML = ""; delete t.dataset.early; }
        if (transcriptBtn) { transcriptBtn.textContent = "Show the transcript"; transcriptBtn.setAttribute("aria-expanded", "false"); }
      }
      plays = 0;
      stopPlayback();
      playing = false;
      modeBtns.forEach((b) => {
        const on = b.dataset.mode === mode;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      refreshLimitNote();
      setStatus("Not started.");
    });
  });

  playBtn.addEventListener("click", () => {
    const cap = limit();
    if (playing || (cap && plays >= cap)) return;

    stopPlayback();
    plays += 1;
    playing = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    setStatus("Playing.");

    const factor = Number(speedSel.value) || 1;

    if (hasAudio) {
      audio.playbackRate = baseRate * factor;
      audio.onended = finish;
      audio.play().catch(() => finish());
      return;
    }

    const accentSel = root.querySelector("[data-accent]");
    const voiceMap = Speech.assign(allSpeakers, accentSel ? accentSel.value : "");
    test.script.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line.text);
      const voice = voiceMap.get(line.speaker);
      if (voice) u.voice = voice;
      u.rate = baseRate * factor;
      u.pitch = 1;
      if (i === test.script.length - 1) {
        u.addEventListener("end", finish);
        u.addEventListener("error", finish);
      }
      window.speechSynthesis.speak(u);
    });
  });

  pauseBtn.addEventListener("click", () => {
    if (hasAudio) {
      if (audio.paused) {
        audio.play();
        pauseBtn.textContent = "Pause";
        setStatus("Playing.");
      } else {
        audio.pause();
        pauseBtn.textContent = "Resume";
        setStatus("Paused.");
      }
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      pauseBtn.textContent = "Pause";
      setStatus("Playing.");
    } else {
      window.speechSynthesis.pause();
      pauseBtn.textContent = "Resume";
      setStatus("Paused.");
    }
  });

  stopBtn.addEventListener("click", () => {
    stopPlayback();
    finish();
    setStatus("Stopped.");
  });

  window.addEventListener("pagehide", () => stopPlayback());

  refreshLimitNote();
  setStatus("Not started.");
}

/* ----------------------------------------------------------------- form */

function wireForm(root, test) {
  const form = root.querySelector("[data-form]");
  const scoreEl = root.querySelector("[data-score]");
  const transcript = root.querySelector("[data-transcript]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Speech.cancel();
    const audio = root.querySelector("[data-audio]");
    if (audio) audio.pause();

    let correct = 0;
    test.questions.forEach((q, qi) => {
      const li = form.querySelector(`[data-q="${qi}"]`);
      const feedback = li.querySelector("[data-feedback]");
      const right = markQuestion(q, li);
      if (right) correct += 1;
      li.classList.remove("is-right", "is-wrong");
      li.classList.add(right ? "is-right" : "is-wrong");
      feedback.innerHTML = right
        ? `<strong>Correct.</strong> ${esc(q.explanation || "")}`
        : `<strong>Not quite.</strong> The answer is: ${esc(correctAnswerText(q))}. ${esc(q.explanation || "")}`;
    });

    const total = test.questions.length;
    const percent = Math.round((correct / total) * 100);
    scoreEl.className = `listening__score is-${band(percent)}`;
    scoreEl.innerHTML = `<strong>${correct} / ${total}</strong> &mdash; ${percent}% &mdash; ${esc(scoreNote(percent))}`;

    // The transcript is written into the page only now, or when a student in
    // Practice mode asks for it. Before that it is not in the document at all.
    delete transcript.dataset.early;
    const tb = root.querySelector("[data-show-transcript]");
    if (tb) tb.hidden = true;
    transcript.innerHTML = transcriptHtml(test);
    transcript.hidden = false;
    transcript.setAttribute("tabindex", "-1");
    transcript.focus({ preventScroll: true });
  });

  const showBtn = root.querySelector("[data-show-transcript]");
  showBtn.addEventListener("click", () => {
    const open = transcript.hidden || !transcript.dataset.early;
    if (open && transcript.hidden) {
      transcript.innerHTML = transcriptHtml(test, true);
      transcript.dataset.early = "yes";
      transcript.hidden = false;
      transcript.setAttribute("tabindex", "-1");
      transcript.focus({ preventScroll: false });
      showBtn.textContent = "Hide the transcript";
      showBtn.setAttribute("aria-expanded", "true");
    } else {
      transcript.hidden = true;
      transcript.innerHTML = "";
      delete transcript.dataset.early;
      showBtn.textContent = "Show the transcript";
      showBtn.setAttribute("aria-expanded", "false");
    }
  });

  root.querySelectorAll("[data-print]").forEach((btn) => {
    btn.addEventListener("click", () => printWorksheet(test, btn.dataset.print === "key"));
  });

  root.querySelectorAll("[data-say]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Never cut into the passage while it is being read.
      if (window.speechSynthesis.speaking) return;
      const u = new SpeechSynthesisUtterance(btn.dataset.say);
      const accentSel = root.querySelector("[data-accent]");
      const voice = Speech.assign(["word"], accentSel ? accentSel.value : "").get("word");
      if (voice) u.voice = voice;
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    });
  });

  root.querySelector("[data-reset]").addEventListener("click", () => {
    Speech.cancel();
    render(root, test);
  });
}

/* ----------------------------------------------------------------- mount */

/* The listening laboratory page: every test as a card, filtered by grade,
   and one test opened at a time on the same page. The address bar carries
   the choice (?grade=8, ?test=l08-2), so a teacher can send a class a link
   straight to one test. */
function setUpLab(lab, list) {
  const cards = Array.from(lab.querySelectorAll("[data-lab-card]"));
  const chips = Array.from(lab.querySelectorAll("[data-lab-grade]"));
  const sourceChips = Array.from(lab.querySelectorAll("[data-lab-source]"));
  let source = "";
  const count = lab.querySelector("[data-lab-count]");
  const stage = lab.querySelector("[data-lab-stage]");
  const slot = lab.querySelector("[data-lab-slot]");
  const listNode = lab.querySelector("[data-lab-groups]") || lab.querySelector(".lab__list");
  const groups = Array.from(lab.querySelectorAll("[data-lab-group]"));
  lab.querySelector("[data-lab-filters]").hidden = false;

  let grade = "";

  function writeUrl(test) {
    const url = new URL(window.location.href);
    if (grade) url.searchParams.set("grade", grade); else url.searchParams.delete("grade");
    if (test) url.searchParams.set("test", test); else url.searchParams.delete("test");
    window.history.replaceState(null, "", url.pathname + url.search + (test ? "#lab-test" : ""));
  }

  function filter(value) {
    grade = value;
    let n = 0;
    cards.forEach((c) => {
      const on = (!grade || c.dataset.grade === grade) && (!source || c.dataset.source === source);
      c.hidden = !on;
      if (on) n += 1;
    });
    chips.forEach((b) => {
      const on = b.dataset.labGrade === grade;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    sourceChips.forEach((b) => {
      const on = b.dataset.labSource === source;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    // Each group shows how many of its tests match, and hides itself when none do.
    groups.forEach((grp) => {
      const shown = grp.querySelectorAll("[data-lab-card]:not([hidden])").length;
      grp.hidden = shown === 0;
      const c = grp.querySelector("[data-lab-group-count]");
      if (c) c.textContent = String(shown);
    });
    count.textContent = n === 1 ? "1 listening test" : `${n} listening tests`;
  }

  function open(id, focus = true) {
    const test = list.find((t) => String(t.id) === String(id));
    if (!test) return;
    Speech.cancel();
    slot.setAttribute("data-listening", test.id);
    render(slot, test);
    listNode.hidden = true;
    lab.querySelector("[data-lab-filters]").hidden = true;
    stage.hidden = false;
    writeUrl(test.id);
    if (focus) {
      stage.focus({ preventScroll: true });
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function close() {
    Speech.cancel();
    const id = slot.getAttribute("data-listening");
    slot.innerHTML = "";
    stage.hidden = true;
    listNode.hidden = false;
    lab.querySelector("[data-lab-filters]").hidden = false;
    writeUrl("");
    const back = id && lab.querySelector(`[data-lab-open="${CSS.escape(id)}"]`);
    if (back) back.focus();
  }

  chips.forEach((b) => b.addEventListener("click", () => { filter(b.dataset.labGrade); writeUrl(""); }));
  sourceChips.forEach((b) => b.addEventListener("click", () => { source = b.dataset.labSource; filter(grade); writeUrl(""); }));
  lab.addEventListener("click", (event) => {
    const link = event.target.closest("[data-lab-open]");
    if (link) { event.preventDefault(); open(link.dataset.labOpen); }
    if (event.target.closest("[data-lab-close]")) close();
  });

  const params = new URLSearchParams(window.location.search);
  const g = params.get("grade") || "";
  filter(chips.some((b) => b.dataset.labGrade === g) ? g : "");
  if (params.get("test")) open(params.get("test"), Boolean(window.location.hash));
}

async function mount() {
  const slots = document.querySelectorAll("[data-listening]");
  const lab = document.querySelector("[data-listening-lab]");
  if (!slots.length && !lab) return;

  const data = await loadData("listening");
  const list = Array.isArray(data) ? data : (data && data.tests) || [];
  if (!list.length) {
    slots.forEach((slot) => {
      slot.innerHTML = `<p class="text-muted">The listening tests could not be loaded.</p>`;
    });
    return;
  }

  slots.forEach((slot) => {
    const id = slot.getAttribute("data-listening");
    const test = list.find((t) => String(t.id) === String(id));
    if (!test) {
      slot.innerHTML = `<p class="text-muted">This listening test could not be found.</p>`;
      return;
    }
    render(slot, test);
  });

  if (lab) setUpLab(lab, list);
}

mount();
