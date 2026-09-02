/* ==========================================================================
   RCF English - Primary Game Zone: the engine

   One engine, many games. This file knows about scoring, progress, sound,
   stars and the screen furniture. It knows nothing about what any particular
   game looks like: that lives in games/types/*.js, and the questions live in
   data/games/grade-*.json.

   To add a game you write JSON. To add a new KIND of game you write one small
   type module. Neither touches this file.

   Nothing is sent anywhere. Progress is kept in this browser only.
   ========================================================================== */

import { ROOT, esc } from "../lib.js";

/* ------------------------------------------------------------- pictures */

/**
 * Turn a picture value from a data file into markup.
 *
 * "cat.svg" or "assets/img/games/cat.svg"  -> an image, drawn from the file
 * "🐱"                                      -> the character itself
 *
 * This is the whole of the illustration system. Any single picture can be
 * upgraded later by dropping a better file in place, or by pointing the data
 * at a different one. No game code changes.
 */
export function pictureHTML(value, alt = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const looksLikeFile = raw.includes("/") || /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(raw);
  if (looksLikeFile) {
    const path = raw.includes("/") ? raw : `assets/img/games/${raw}`;
    return `<img class="gz-pic" src="${esc(ROOT + path)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  }

  // A symbol - one or two characters, so an emoji or a letter - is drawn big,
  // like a picture. Anything longer is words, and words are set as words: a
  // memory card reading "gives freely" must not be blown up to picture size.
  const characters = [...raw];
  if (characters.length <= 2) {
    return `<span class="gz-pic gz-pic--char" aria-hidden="true">${esc(raw)}</span>`;
  }
  return `<span class="gz-words">${esc(raw)}</span>`;
}

/* ------------------------------------------------------------ small icons

   Drawn here rather than taken from a font or an emoji, so the controls look
   the same on every phone and match the rest of the artwork. They inherit
   the button's colour.                                                      */

const ICON_SOUND_ON = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
  <path d="M4 9v6h4l5 4V5L8 9H4z"/>
  <path d="M16 8.8a4.5 4.5 0 0 1 0 6.4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M18.5 6.2a8 8 0 0 1 0 11.6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const ICON_SOUND_OFF = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
  <path d="M4 9v6h4l5 4V5L8 9H4z"/>
  <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const ICON_BACK = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 5l-7 7 7 7"/>
</svg>`;

/* ---------------------------------------------------------------- sound */

/**
 * Sound is made on the spot with the browser's own tone generator, so there
 * are no audio files to download and nothing to wait for on a slow
 * connection. If a child's device blocks audio, or sound is switched off,
 * every game still plays exactly the same.
 */
const SOUND_KEY = "rcf-gz-sound";
let audioContext = null;

export const sound = {
  get on() {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
  },
  set on(value) {
    try { localStorage.setItem(SOUND_KEY, value ? "on" : "off"); } catch { /* private mode */ }
  },
  play(name) {
    if (!this.on) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContext = audioContext || new Ctx();
      if (audioContext.state === "suspended") audioContext.resume();
      const notes = {
        correct: [[660, 0], [880, 0.09]],
        wrong: [[200, 0], [150, 0.12]],
        win: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]],
        flip: [[420, 0]]
      }[name] || [];
      notes.forEach(([freq, delay]) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = name === "wrong" ? "sawtooth" : "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + 0.22);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(audioContext.currentTime + delay);
        osc.stop(audioContext.currentTime + delay + 0.24);
      });
    } catch { /* sound is a bonus, never a requirement */ }
  }
};

/* ------------------------------------------------------------- progress */

const PROGRESS_KEY = "rcf-gz-progress-v1";

export const progress = {
  all() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
  },
  get(id) {
    return this.all()[id] || null;
  },
  save(id, stars, percent) {
    try {
      const all = this.all();
      const before = all[id] || { stars: 0, best: 0, plays: 0 };
      all[id] = {
        stars: Math.max(before.stars || 0, stars),
        best: Math.max(before.best || 0, percent),
        plays: (before.plays || 0) + 1
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
    } catch { /* private mode: play still works, it just is not remembered */ }
  },
  starsForGrade(activityIds) {
    const all = this.all();
    return activityIds.reduce((sum, id) => sum + ((all[id] && all[id].stars) || 0), 0);
  }
};

/* ------------------------------------------------------------- utilities */

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function starsFor(percent) {
  if (percent >= 90) return 3;
  if (percent >= 70) return 2;
  if (percent >= 40) return 1;
  return 0;
}

const PRAISE = {
  3: ["Brilliant!", "Perfect work!", "Superb!"],
  2: ["Well done!", "Good work!", "Nicely done!"],
  1: ["Good try!", "Keep going!", "Nearly there!"],
  0: ["Try again!", "Have another go!"]
};

/* ---------------------------------------------------------------- engine */

/**
 * Play one activity inside `mount`.
 *
 * `types` is the map of loaded type modules. `onExit` is called when the
 * child leaves the game, `onNext` when they ask for the next activity.
 */
export function play(activity, mount, { types, onExit, onNext, nextTitle }) {
  const type = types[activity.type];
  if (!type) {
    mount.innerHTML = `<p class="gz-error">This game type (${esc(activity.type)}) is not available.</p>`;
    return;
  }

  let right = 0;
  let wrong = 0;
  let finished = false;

  mount.innerHTML = `
    <div class="gz-game" data-game="${esc(activity.type)}">
      <header class="gz-game__bar">
        <button type="button" class="gz-icon-btn" data-gz="back" aria-label="Leave this game">${ICON_BACK}</button>
        <div class="gz-game__titles">
          <h2 class="gz-game__title">${esc(activity.title)}</h2>
          <p class="gz-game__how">${esc(activity.instructions || "")}</p>
        </div>
        <button type="button" class="gz-icon-btn" data-gz="sound" aria-pressed="${sound.on}"
                aria-label="Sound effects">${sound.on ? ICON_SOUND_ON : ICON_SOUND_OFF}</button>
      </header>

      <div class="gz-meter" role="group" aria-label="Progress">
        <div class="gz-meter__track"><div class="gz-meter__fill" data-gz="fill" style="width:0%"></div></div>
        <p class="gz-meter__score"><span data-gz="score">0</span> <span class="gz-meter__word">points</span></p>
      </div>

      <div class="gz-stage" data-gz="stage"></div>
      <p class="gz-live visually-hidden" role="status" data-gz="live"></p>
      <div class="gz-flash" data-gz="flash" aria-hidden="true"></div>
    </div>`;

  const stage = mount.querySelector('[data-gz="stage"]');
  const fill = mount.querySelector('[data-gz="fill"]');
  const scoreOut = mount.querySelector('[data-gz="score"]');
  const live = mount.querySelector('[data-gz="live"]');
  const flash = mount.querySelector('[data-gz="flash"]');
  const soundBtn = mount.querySelector('[data-gz="sound"]');

  soundBtn.addEventListener("click", () => {
    sound.on = !sound.on;
    soundBtn.setAttribute("aria-pressed", String(sound.on));
    soundBtn.innerHTML = sound.on ? ICON_SOUND_ON : ICON_SOUND_OFF;
    if (sound.on) sound.play("correct");
  });
  mount.querySelector('[data-gz="back"]').addEventListener("click", () => {
    if (instance && instance.destroy) instance.destroy();
    onExit();
  });

  function showFlash(kind, text) {
    flash.className = `gz-flash gz-flash--${kind} is-on`;
    flash.textContent = text;
    setTimeout(() => { flash.className = "gz-flash"; }, 700);
  }

  /* What every game type is given. This is the whole contract. */
  const api = {
    picture: pictureHTML,
    shuffle,
    /** Report a correct answer. */
    correct(message = "Yes!") {
      right += 1;
      scoreOut.textContent = String(right);
      sound.play("correct");
      showFlash("good", message);
      live.textContent = message;
    },
    /** Report a wrong answer. Nothing is ever lost, the child simply retries. */
    wrong(message = "Not that one - try again") {
      wrong += 1;
      sound.play("wrong");
      showFlash("bad", message);
      live.textContent = message;
    },
    /** Move the progress bar. */
    progress(done, total) {
      fill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
    },
    flip() { sound.play("flip"); },
    say(message) { live.textContent = message; },
    /** The game is over. */
    finish() {
      if (finished) return;
      finished = true;
      const attempts = right + wrong;
      const percent = attempts ? Math.round((right / attempts) * 100) : 0;
      const stars = starsFor(percent);
      progress.save(activity.id, stars, percent);
      sound.play("win");
      showResults({ right, wrong, percent, stars });
    }
  };

  function showResults({ right: r, wrong: w, percent, stars }) {
    const praise = PRAISE[stars][Math.floor(Math.random() * PRAISE[stars].length)];
    stage.innerHTML = `
      <div class="gz-done">
        <p class="gz-done__stars" aria-label="${stars} out of 3 stars">
          ${[1, 2, 3].map((n) => `<span class="gz-star ${n <= stars ? "is-on" : ""}">★</span>`).join("")}
        </p>
        <h3 class="gz-done__praise">${esc(praise)}</h3>
        <p class="gz-done__count">${r} right${w ? ` &middot; ${w} to practise` : ""}</p>
        <div class="gz-done__buttons">
          <button type="button" class="gz-btn gz-btn--again" data-gz="again">Play again</button>
          ${nextTitle ? `<button type="button" class="gz-btn gz-btn--next" data-gz="next">Next: ${esc(nextTitle)}</button>` : ""}
          <button type="button" class="gz-btn gz-btn--ghost" data-gz="menu">More games</button>
        </div>
      </div>`;
    stage.querySelector('[data-gz="again"]').addEventListener("click", () => {
      play(activity, mount, { types, onExit, onNext, nextTitle });
    });
    const nextBtn = stage.querySelector('[data-gz="next"]');
    if (nextBtn) nextBtn.addEventListener("click", onNext);
    stage.querySelector('[data-gz="menu"]').addEventListener("click", onExit);
    api.progress(1, 1);
  }

  const instance = type.build(activity, api);
  stage.appendChild(instance.el);
  return instance;
}
