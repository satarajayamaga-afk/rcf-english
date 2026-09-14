/* ==========================================================================
   RCF English - voice conversation engine

   The pieces a spoken conversation with the website needs:
     talk()           the website speaks a line, and resolves when it is done
     listen()         the website listens to one turn, and decides the turn is
                      over after a silence, a time limit or a button press
     ensureConsent()  the notice about where speech recognition sends audio,
                      shown once before a learner first uses the microphone

   The website never listens while it is speaking, so it does not hear itself.
   Speech recognition is the browser's own: Chrome and Edge send the audio to
   Google, and Safari to Apple. RCF English receives nothing.
   ========================================================================== */

import { Speech, speak, wait } from "./speech.js";

export const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const CONSENT_KEY = "rcf-speaking-consent";
export const LANG_KEY = "rcf-speaking-lang";

export const store = {
  get(key, fallback) { try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* not kept */ } }
};

export const LANGS = [
  ["en-GB", "English (UK)"],
  ["en-IN", "English (India): often better for Sri Lankan accents"],
  ["en-US", "English (US)"],
  ["en-AU", "English (Australia)"]
];

export function langSelect(id) {
  const current = store.get(LANG_KEY, "en-GB");
  return `<label for="${id}">Recognise my speech as</label><select id="${id}" data-voice-lang>${LANGS.map(([v, l]) => `<option value="${v}"${v === current ? " selected" : ""}>${l}</option>`).join("")}</select>`;
}

export function wireLangSelect(root) {
  const sel = root.querySelector("[data-voice-lang]");
  if (sel) sel.addEventListener("change", () => store.set(LANG_KEY, sel.value));
}

export const fmt = (secs) => { const s = Math.max(0, Math.round(secs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/* The website's voice. A British or Indian English voice where the device has one. */
export async function talk(text, rate = 0.95, voice) {
  Speech.cancel();
  await speak(text, voice || Speech.preferred(), rate);
  await wait(250); // let the speaker fall silent before the microphone opens
}

/* Listen to one turn.
   Returns { promise, stop }. The promise resolves to
   { text, speakingMs, pauses, error } once the turn is over. */
export function listen({ maxMs = 60000, endSilenceMs = 2500, noSpeechMs = 9000, onInterim } = {}) {
  let resolveTurn;
  const promise = new Promise((r) => { resolveTurn = r; });
  if (!SR) { resolveTurn({ text: "", speakingMs: 0, pauses: 0, error: "unsupported" }); return { promise, stop() {} }; }

  const rec = new SR();
  rec.lang = store.get(LANG_KEY, "en-GB");
  rec.continuous = true;
  rec.interimResults = true;

  const startedAt = Date.now();
  let finalText = "", interim = "", firstAt = 0, lastAt = 0, pauses = 0, inPause = false, over = false, error = "";

  rec.onresult = (e) => {
    const now = Date.now();
    if (!firstAt) firstAt = now;
    lastAt = now; inPause = false;
    interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += (finalText ? " " : "") + r[0].transcript.trim();
      else interim += r[0].transcript;
    }
    if (onInterim) onInterim(`${finalText} ${interim}`.trim());
  };
  rec.onerror = (e) => {
    if (e.error === "no-speech" || e.error === "aborted") return;
    error = e.error;
    finish();
  };
  // Browsers end recognition after a silence or a time limit. While the turn
  // is still open it is started again straight away.
  rec.onend = () => { if (!over) { try { rec.start(); } catch (err) { /* already starting */ } } };

  const tick = setInterval(() => {
    const now = Date.now();
    if (firstAt && now - lastAt >= 3000 && !inPause) { pauses++; inPause = true; }
    if (firstAt && now - lastAt >= endSilenceMs) finish();
    else if (!firstAt && now - startedAt >= noSpeechMs) finish();
    else if (now - startedAt >= maxMs) finish();
  }, 200);

  function finish() {
    if (over) return;
    over = true;
    clearInterval(tick);
    rec.onend = null;
    try { rec.stop(); } catch (e) { /* stopped */ }
    // the recogniser may still deliver its last words
    setTimeout(() => {
      rec.onresult = null;
      const text = (finalText || interim).trim();
      resolveTurn({ text, speakingMs: firstAt ? lastAt - firstAt + 800 : 0, pauses: Math.max(0, pauses - (firstAt && Date.now() - lastAt >= 3000 ? 1 : 0)), error });
    }, 700);
  }

  try { rec.start(); } catch (err) { error = "start"; finish(); }
  return { promise, stop: finish };
}

export const ERRORS = {
  "not-allowed": "The microphone is blocked. Allow this site to use the microphone in your browser settings, then try again.",
  "service-not-allowed": "Speech recognition is switched off in this browser, or it needs a tap to start. Press Answer to try again.",
  network: "Speech recognition needs an internet connection. Check your connection and try again.",
  "audio-capture": "No microphone was found.",
  start: "The microphone could not start. Press Answer to try again.",
  unsupported: "This browser cannot recognise speech. Please use Chrome, Edge or Safari."
};

/* The notice about speech recognition, shown once. Resolves true to go on. */
export function ensureConsent(container) {
  if (store.get(CONSENT_KEY, false) === true) return Promise.resolve(true);
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.className = "wp__panel sp__consent";
    box.innerHTML = `
      <h3>Before you start</h3>
      <p>Your browser turns your voice into text. <strong>Chrome and Edge send the sound of your voice to Google, and Safari sends it to Apple</strong>, to do this. RCF English does not receive your voice or your words. See the <a href="${document.body.dataset.root || ""}privacy/">privacy policy</a>.</p>
      <p>Your browser will ask for permission to use the microphone. Headphones help the website hear you clearly. You can stop at any time.</p>
      <div class="sp__controls"><button type="button" class="btn btn--accent" data-agree>I understand. Start</button><button type="button" class="btn btn--outline" data-decline>Not now</button></div>`;
    container.prepend(box);
    box.querySelector("[data-agree]").focus();
    box.addEventListener("click", (e) => {
      const agree = e.target.closest("[data-agree]");
      const decline = e.target.closest("[data-decline]");
      if (!agree && !decline) return;
      if (agree) store.set(CONSENT_KEY, true);
      box.remove();
      resolve(!!agree);
    });
  });
}
