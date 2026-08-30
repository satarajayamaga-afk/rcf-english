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

   The transcript is NOT written into the page until the student submits, so
   it cannot be reached from any control on the page before then.

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

  /**
   * Give each speaker a different voice where the device has more than one
   * English voice. Many phones ship with only one, in which case every
   * speaker shares it and the narrator's lines still mark the turns.
   */
  assign(speakers) {
    this.refresh();
    const map = new Map();
    const pool = this.voices.length ? this.voices : [null];
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

function transcriptHtml(test) {
  return `
    <h4>Transcript</h4>
    <p class="text-small text-muted">The transcript appears only after you submit, so that
    the first listening is a fair test of what you heard.</p>
    ${test.script
      .map((line) => `<p><strong>${esc(line.speaker)}:</strong> ${esc(line.text)}</p>`)
      .join("")}`;
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

  root.innerHTML = `
    <section class="listening" aria-labelledby="${esc(test.id)}-title">
      <h3 class="listening__title" id="${esc(test.id)}-title">${esc(test.title)}</h3>
      <p class="listening__meta">${esc(test.description)}</p>
      <div class="listening__instructions">
        <h4>What to do</h4>
        <p>${esc(test.instructions)}</p>
      </div>
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
        </div>
      </form>
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
  const voiceMap = hasAudio ? null : Speech.assign([...new Set(test.script.map((l) => l.speaker))]);

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

    // The transcript is written into the page only now. Before this point it
    // is not in the document at all, so no control on the page reveals it.
    transcript.innerHTML = transcriptHtml(test);
    transcript.hidden = false;
    transcript.setAttribute("tabindex", "-1");
    transcript.focus({ preventScroll: true });
  });

  root.querySelector("[data-reset]").addEventListener("click", () => {
    Speech.cancel();
    render(root, test);
  });
}

/* ----------------------------------------------------------------- mount */

async function mount() {
  const slots = document.querySelectorAll("[data-listening]");
  if (!slots.length) return;

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
}

mount();
