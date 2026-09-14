/* ==========================================================================
   RCF English - speaking practice

   A learner chooses a task, hears the question, speaks, and gets:
     transcript        what the browser's speech recognition heard, which the
                       learner can correct before checking again
     timing            speaking time, words per minute, long pauses
     guidance          checks a computer can make from the words: length,
                       reasons and examples, linking phrases, repeated and
                       over-used words, fillers, cue-card points, and for
                       read-aloud tasks which words were recognised
     history           the last attempts, kept in this browser only

   Speech recognition is the browser's own (Chrome and Edge send the audio to
   Google; Safari to Apple). RCF English receives nothing. The guidance is
   not an IELTS band and never claims to be one.
   ========================================================================== */

import { esc } from "./lib.js";
import { Speech } from "./speech.js";
import { PART1, PART2, PART3, READ, SITUATIONS } from "./speaking-data.js";
import { analyse } from "./speaking-analysis.js";

const root = document.querySelector("[data-speaking]");
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CONSENT_KEY = "rcf-speaking-consent";
const HISTORY_KEY = "rcf-speaking-history";
const LANG_KEY = "rcf-speaking-lang";

const MODES = [
  { id: "part1", label: "IELTS Part 1", intro: "Short answers about familiar topics. Aim for two or three sentences: an answer, a reason and a detail. About 20 to 30 seconds each.",
    items: PART1.flatMap(([topic, qs]) => qs.map((q, i) => ({ id: `p1-${topic}-${i}`, group: topic, title: q, prompt: q }))) },
  { id: "part2", label: "IELTS Part 2", intro: "The cue card. One minute to prepare, then up to two minutes of speaking. Try to keep going until the timer stops you.",
    items: PART2.map((t, i) => ({ id: `p2-${i}`, group: "Cue cards", ...t })) },
  { id: "part3", label: "IELTS Part 3", intro: "Discussion questions. Give an opinion, a reason, an example, and where you can, the other side. About 40 to 60 seconds each.",
    items: PART3.flatMap(([topic, qs]) => qs.map((q, i) => ({ id: `p3-${topic}-${i}`, group: topic, title: q, prompt: q }))) },
  { id: "read", label: "Read aloud", intro: "Practical Spoken English. Listen to the sentence, then read it aloud clearly. You will see which words were recognised.",
    items: READ.flatMap(([sound, tip, lines]) => lines.map((l, i) => ({ id: `rd-${sound}-${i}`, group: sound, title: l, prompt: l, tip }))) },
  { id: "talk", label: "Everyday situations", intro: "Practical Spoken English. Read the situation, then say what you would say. The check looks for the language the situation needs.",
    items: SITUATIONS.map((s, i) => ({ id: `sit-${i}`, group: "Situations", ...s })) }
];

/* ---------------------------------------------------------------- storage */

const store = {
  get(key, fallback) { try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* not kept */ } }
};

/* --------------------------------------------------------------------- UI */

function fmt(secs) { const s = Math.max(0, Math.round(secs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

function say(text, rate = 0.95) {
  return new Promise((resolve) => {
    if (!Speech.supported) return resolve();
    Speech.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = Speech.preferred();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
    u.rate = rate;
    const done = () => { clearTimeout(guard); resolve(); };
    const guard = setTimeout(done, Math.max(2500, text.split(/\s+/).length * 600));
    u.onend = done; u.onerror = done;
    window.speechSynthesis.speak(u);
  });
}

function setUp() {
  root.innerHTML = `
    <div class="sp">
      <div class="sp__modes" role="tablist" aria-label="Type of practice">
        ${MODES.map((m, i) => `<button type="button" role="tab" class="sp__mode" data-mode="${m.id}" aria-selected="${i === 0}">${esc(m.label)}</button>`).join("")}
      </div>
      <p class="sp__intro" data-intro></p>
      <div class="sp__row">
        <div class="field sp__choose">
          <label for="sp-item">Choose a question</label>
          <select id="sp-item" data-item></select>
        </div>
        <div class="field sp__lang">
          <label for="sp-lang">Recognise my speech as</label>
          <select id="sp-lang" data-lang>
            <option value="en-GB">English (UK)</option>
            <option value="en-IN">English (India): often better for Sri Lankan accents</option>
            <option value="en-US">English (US)</option>
            <option value="en-AU">English (Australia)</option>
          </select>
        </div>
      </div>
      <div class="sp__card" data-card></div>
      <div class="sp__controls">
        <button type="button" class="btn btn--outline" data-hear>▶ Hear it</button>
        <button type="button" class="btn btn--accent" data-start>● Start speaking</button>
        <button type="button" class="btn btn--outline" data-stop hidden>■ Stop</button>
        <button type="button" class="btn btn--outline" data-next>Next question</button>
        <span class="sp__clock" data-clock aria-live="off"></span>
      </div>
      <p class="sp__status" data-status role="status" aria-live="polite"></p>
      <div class="sp__consent wp__panel" data-consent hidden>
        <h3>Before you start</h3>
        <p>Your browser turns your voice into text. <strong>Chrome and Edge send the sound of your voice to Google, and Safari sends it to Apple</strong>, to do this. RCF English does not receive your voice or your words, and nothing is saved except a short summary of your practice, on this device only.</p>
        <p>Your browser will ask for permission to use the microphone. You can stop at any time.</p>
        <div class="sp__controls"><button type="button" class="btn btn--accent" data-agree>I understand. Start</button><button type="button" class="btn btn--outline" data-decline>Not now</button></div>
      </div>
      <div class="sp__live" data-live hidden aria-live="polite"></div>
      <section class="wp__panel sp__result" data-result hidden aria-labelledby="sp-result-title">
        <h3 id="sp-result-title">What the computer heard</h3>
        <div data-align></div>
        <div class="field">
          <label for="sp-text">Transcript. If a word was misheard, correct it and press Check again.</label>
          <textarea id="sp-text" rows="5" data-text></textarea>
        </div>
        <div class="sp__controls"><button type="button" class="btn btn--outline" data-recheck>Check again</button><button type="button" class="btn btn--outline" data-retry>Try again</button></div>
        <p class="sp__stats" data-stats></p>
        <h3>Practice guidance</h3>
        <p class="text-small text-muted">These are checks a computer can make from your words. They cannot judge grammar, pronunciation or ideas the way an examiner does, and they are not an IELTS band score.</p>
        <ul class="wp__notes" data-notes></ul>
      </section>
      <section class="wp__panel" data-history-wrap hidden aria-labelledby="sp-history-title">
        <h3 id="sp-history-title">Your recent practice</h3>
        <p class="text-small text-muted">Kept in this browser only.</p>
        <div class="table-wrap"><table class="data"><thead><tr><th scope="col">When</th><th scope="col">Practice</th><th scope="col">Words</th><th scope="col">Words a minute</th><th scope="col">Recognised</th></tr></thead><tbody data-history></tbody></table></div>
        <p><button type="button" class="btn btn--outline btn--small" data-clear-history>Clear my history</button></p>
      </section>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const itemSel = $("[data-item]"), langSel = $("[data-lang]"), status = $("[data-status]"), clock = $("[data-clock]");
  let mode = MODES[0];
  let rec = null, recording = false, prepTimer = null, tick = null;
  let finalText = "", firstAt = 0, lastAt = 0, startedAt = 0, pauses = 0, inPause = false, timing = null;

  langSel.value = store.get(LANG_KEY, "en-GB");
  langSel.addEventListener("change", () => store.set(LANG_KEY, langSel.value));

  if (!SR) {
    status.innerHTML = "Speech recognition is not available in this browser. Please open this page in <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Safari</strong>. You can still hear the questions, use the timer, and type what you would say into the box to have it checked.";
    $("[data-start]").textContent = "Start the timer";
  }

  const item = () => mode.items.find((x) => x.id === itemSel.value) || mode.items[0];

  function fillItems() {
    const groups = [...new Set(mode.items.map((x) => x.group))];
    itemSel.innerHTML = groups.map((g) => `<optgroup label="${esc(g)}">${mode.items.filter((x) => x.group === g).map((x) => `<option value="${esc(x.id)}">${esc(x.title)}</option>`).join("")}</optgroup>`).join("");
    $("[data-intro]").textContent = mode.intro;
    showItem();
  }

  function showItem() {
    const it = item();
    let html = "";
    if (mode.id === "part2") {
      html = `<p class="wp__level">Cue card</p><p class="sp__prompt">${esc(it.prompt)}</p><p class="mb-0">You should say:</p><ul>${it.points.map(([p]) => `<li>${esc(p)}</li>`).join("")}</ul><p class="text-small text-muted mb-0">${esc(it.notes)}</p>`;
    } else if (mode.id === "read") {
      html = `<p class="wp__level">Read aloud · ${esc(it.group)}</p><p class="sp__prompt sp__prompt--read">${esc(it.prompt)}</p><p class="text-small mb-0"><strong>Tip:</strong> ${esc(it.tip)}</p>`;
    } else if (mode.id === "talk") {
      html = `<p class="wp__level">Situation · ${esc(it.title)}</p><p class="sp__prompt">${esc(it.prompt)}</p><p class="text-small text-muted mb-0">Try to include: ${it.functions.map(([l]) => esc(l)).join("; ")}.</p>`;
    } else {
      html = `<p class="wp__level">${esc(mode.label)} · ${esc(it.group)}</p><p class="sp__prompt">${esc(it.prompt)}</p>`;
    }
    $("[data-card]").innerHTML = html;
    $("[data-result]").hidden = true;
    $("[data-live]").hidden = true;
    clock.textContent = "";
    if (SR) status.textContent = "";
  }

  root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    if (recording) stop();
    mode = MODES.find((m) => m.id === b.dataset.mode);
    root.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    fillItems();
  }));
  itemSel.addEventListener("change", () => { if (recording) stop(); showItem(); });
  $("[data-next]").addEventListener("click", () => {
    if (recording) stop();
    const i = mode.items.findIndex((x) => x.id === item().id);
    itemSel.value = mode.items[(i + 1) % mode.items.length].id;
    showItem();
  });
  $("[data-hear]").addEventListener("click", () => {
    const it = item();
    say(mode.id === "part2" ? `${it.prompt} You should say: ${it.points.map(([p]) => p).join(", ")}.` : it.prompt, mode.id === "read" ? 0.85 : 0.95);
  });

  /* --- recording --- */
  function begin() {
    if (store.get(CONSENT_KEY, false) !== true && SR) { $("[data-consent]").hidden = false; $("[data-agree]").focus(); return; }
    Speech.cancel();
    if (mode.id === "part2") prepare(); else listen();
  }
  $("[data-start]").addEventListener("click", begin);
  $("[data-agree]").addEventListener("click", () => { store.set(CONSENT_KEY, true); $("[data-consent]").hidden = true; begin(); });
  $("[data-decline]").addEventListener("click", () => { $("[data-consent]").hidden = true; });

  function prepare() {
    let left = 60;
    status.textContent = "One minute to prepare. Make notes on the four points. Press Start speaking when you are ready, or wait for the timer.";
    $("[data-start]").textContent = "● Start speaking now";
    clock.textContent = `Preparation ${fmt(left)}`;
    clearInterval(prepTimer);
    const startBtn = $("[data-start]");
    const go = () => { clearInterval(prepTimer); startBtn.removeEventListener("click", early, true); startBtn.textContent = SR ? "● Start speaking" : "Start the timer"; listen(); };
    const early = (e) => { e.stopImmediatePropagation(); go(); };
    startBtn.addEventListener("click", early, true);
    prepTimer = setInterval(() => { left--; clock.textContent = `Preparation ${fmt(left)}`; if (left <= 0) go(); }, 1000);
  }

  function listen() {
    finalText = ""; firstAt = 0; lastAt = 0; pauses = 0; inPause = false;
    startedAt = Date.now();
    $("[data-result]").hidden = true;
    $("[data-start]").hidden = true;
    $("[data-stop]").hidden = false;
    recording = true;
    const limit = { part1: 60, part2: 120, part3: 120, read: 30, talk: 90 }[mode.id];
    tick = setInterval(() => {
      const now = Date.now();
      const el = (now - startedAt) / 1000;
      clock.textContent = `${fmt(el)} / ${fmt(limit)}`;
      if (SR && firstAt && now - lastAt >= 3000 && !inPause) { pauses++; inPause = true; }
      if (el >= limit) { status.textContent = mode.id === "part2" ? "Thank you. That is the end of the two minutes." : "Time is up."; stop(); }
    }, 250);

    if (!SR) {
      status.textContent = "The timer is running. Speak your answer aloud, then type what you said into the box.";
      return;
    }
    const live = $("[data-live]");
    live.hidden = false;
    live.textContent = "Listening…";
    status.textContent = "Listening. Speak now.";
    rec = new SR();
    rec.lang = langSel.value;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const now = Date.now();
      if (!firstAt) firstAt = now;
      lastAt = now; inPause = false;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += (finalText ? " " : "") + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      live.textContent = `${finalText} ${interim}`.trim() || "Listening…";
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      const msg = { "not-allowed": "The microphone is blocked. Allow this site to use the microphone in your browser settings, then try again.", "service-not-allowed": "Speech recognition is switched off in this browser.", network: "Speech recognition needs an internet connection. Check your connection and try again.", "audio-capture": "No microphone was found." }[e.error] || `Speech recognition stopped (${e.error}).`;
      status.textContent = msg;
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) stop(true);
    };
    // Browsers end recognition after a silence or a time limit. While the
    // learner is still speaking, it is started again straight away.
    rec.onend = () => { if (recording) { try { rec.start(); } catch (err) { /* already starting */ } } };
    try { rec.start(); } catch (err) { status.textContent = "Speech recognition could not start. Please try again."; stop(true); }
  }

  function stop(silent) {
    clearInterval(tick); clearInterval(prepTimer);
    const was = recording;
    recording = false;
    if (rec) { rec.onend = null; try { rec.stop(); } catch (e) { /* stopped */ } }
    $("[data-start]").hidden = false;
    $("[data-stop]").hidden = true;
    $("[data-start]").textContent = SR ? "● Start speaking" : "Start the timer";
    if (!was || silent === true) return;
    const end = SR ? (lastAt || Date.now()) : Date.now();
    const from = SR ? (firstAt || startedAt) : startedAt;
    timing = { speaking: SR ? (firstAt ? end - from + 800 : 0) : end - from, pauses };
    // give the recogniser a moment to deliver its last words
    setTimeout(() => {
      $("[data-live]").hidden = true;
      $("[data-text]").value = finalText;
      if (!SR) status.textContent = "Type what you said, then press Check again.";
      else if (!finalText) status.textContent = "No speech was recognised. Check the microphone, speak a little louder, and try again.";
      else status.textContent = "";
      $("[data-result]").hidden = false;
      check(true);
      $("[data-result]").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, SR ? 700 : 0);
  }
  $("[data-stop]").addEventListener("click", () => stop());

  function check(record) {
    const it = item();
    const text = $("[data-text]").value;
    const r = analyse(mode, it, text, timing);
    const bits = [`${r.words} words`];
    if (timing && timing.speaking) bits.push(`about ${fmt(timing.speaking / 1000)} speaking`);
    if (r.wpm) bits.push(`${r.wpm} words a minute`);
    if (r.score !== null) bits.push(`${r.score}% recognised`);
    $("[data-stats]").textContent = r.words ? bits.join(" · ") : "";
    $("[data-align]").innerHTML = r.align
      ? `<p class="sp__align">${r.align.words.map((w) => w.ok ? `<span class="sp__w sp__w--ok">${esc(w.w)}</span>` : `<button type="button" class="sp__w sp__w--miss" data-say="${esc(w.clean)}" title="Hear this word">${esc(w.w)}</button>`).join(" ")}</p><p class="text-small text-muted">Green words were recognised. Press an orange word to hear it.</p>`
      : "";
    $("[data-notes]").innerHTML = r.notes.length
      ? r.notes.map((x) => `<li class="wp__note wp__note--${x.ok ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${x.ok ? "✓" : "!"}</span><span class="visually-hidden">${x.ok ? "Good: " : "To work on: "}</span>${esc(x.msg)}</li>`).join("")
      : `<li class="wp__note">Nothing to check yet.</li>`;
    if (record && r.words) {
      const h = store.get(HISTORY_KEY, []);
      h.unshift({ at: Date.now(), mode: mode.label, title: it.title, words: r.words, wpm: r.wpm, score: r.score });
      store.set(HISTORY_KEY, h.slice(0, 30));
      history();
    }
  }
  $("[data-recheck]").addEventListener("click", () => check(false));
  $("[data-retry]").addEventListener("click", () => { showItem(); begin(); });
  $("[data-align]").addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say, 0.8); });

  function history() {
    const h = store.get(HISTORY_KEY, []);
    $("[data-history-wrap]").hidden = !h.length;
    $("[data-history]").innerHTML = h.slice(0, 10).map((x) => `<tr><td>${esc(new Date(x.at).toLocaleDateString(undefined, { day: "numeric", month: "short" }))}</td><td>${esc(x.mode)}: ${esc(x.title)}</td><td>${x.words}</td><td>${x.wpm || "-"}</td><td>${x.score === null ? "-" : x.score + "%"}</td></tr>`).join("");
  }
  $("[data-clear-history]").addEventListener("click", () => { store.set(HISTORY_KEY, []); history(); });

  // a link such as speaking-practice/?mode=read opens that kind of practice
  const wanted = new URLSearchParams(window.location.search).get("mode");
  const tab = wanted && root.querySelector(`[data-mode="${CSS.escape(wanted)}"]`);
  if (tab) tab.click(); else fillItems();
  history();
}

if (root) setUp();
