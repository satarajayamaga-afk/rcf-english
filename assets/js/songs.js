/* ---------------------------------------------------------------------------
   Sing and Learn: songs for Grade 2.

   Every song arrives in the page as its words, set out line by line, so it can
   be read, printed and sung with JavaScript off. Each syllable carries the note
   it is sung on and how long it lasts. This script uses those to do two things.

   "Play the tune" plays the melody as soft tones and lights up each syllable as
   it is sung, so a child can follow the words with their eyes while they sing.
   Nothing sings the words - the child does - which is the point of an action
   song, and it keeps the audio light.

   "Say the words" reads each line aloud slowly, for a child or a parent who
   wants to hear how the words are said before singing them.

   Only one song plays at a time, and Stop always stops everything.
--------------------------------------------------------------------------- */

import { REDUCED, Speech, speak } from "./speech.js";
import { Tones } from "./tones.js";

let active = null;

function stopActive() {
  if (active) {
    const a = active;
    active = null;
    a.stop();
  }
}

function read(article) {
  return Array.from(article.querySelectorAll(".song__verse")).map((v) => ({
    el: v,
    emoji: v.dataset.emoji || "",
    lines: Array.from(v.querySelectorAll(".song__line")).map((line) => ({
      el: line,
      text: line.textContent.replace(/\s+/g, " ").trim(),
      syls: Array.from(line.querySelectorAll(".syl")).map((s) => ({
        el: s,
        note: s.dataset.n,
        beats: Number(s.dataset.b) || 1
      }))
    }))
  }));
}

function setUp(article) {
  const verses = read(article);
  if (!verses.length) return;

  const tempo = Number(article.dataset.tempo) || 100;
  const stage = article.querySelector(".song__stage");
  const emoji = article.querySelector(".song__emoji");
  const baseEmoji = emoji ? emoji.textContent : "";

  const bar = document.createElement("div");
  bar.className = "song__controls";
  bar.innerHTML = `
    <button type="button" class="song__btn song__btn--play" data-act="play"><span aria-hidden="true">&#9654;</span> Play the tune</button>
    <button type="button" class="song__btn" data-act="say"><span aria-hidden="true">&#128483;&#65039;</span> Say the words</button>
    <button type="button" class="song__btn song__btn--stop" data-act="stop" hidden><span aria-hidden="true">&#9632;</span> Stop</button>
    <label class="song__slow"><input type="checkbox" data-slow> Slower</label>
  `;
  article.querySelector(".song__head").after(bar);

  const stopBtn = bar.querySelector('[data-act="stop"]');
  const slowBox = bar.querySelector("[data-slow]");

  function clearMarks() {
    article.querySelectorAll(".syl.is-on").forEach((s) => s.classList.remove("is-on"));
    article.querySelectorAll(".song__line.is-current").forEach((l) => l.classList.remove("is-current"));
    article.classList.remove("song--playing");
    if (emoji) emoji.textContent = baseEmoji;
    stopBtn.hidden = true;
  }

  function markLine(line) {
    article.querySelectorAll(".song__line.is-current").forEach((l) => {
      if (l !== line.el) l.classList.remove("is-current");
    });
    line.el.classList.add("is-current");
  }

  function bob() {
    if (REDUCED || !stage) return;
    stage.classList.remove("is-bob");
    void stage.offsetWidth; /* restart the animation */
    stage.classList.add("is-bob");
  }

  function setVerse(v) {
    if (emoji && v.emoji) emoji.textContent = v.emoji;
  }

  /* ------------------------------------------------------------ tune */

  function playTune() {
    stopActive();
    const quarter = 60 / (tempo * (slowBox.checked ? 0.72 : 1));
    const timers = [];
    const oscillators = [];
    const c = Tones.ensure();
    const origin = c ? c.currentTime + 0.12 : 0;
    let t = 0;
    let previous = null;

    article.classList.add("song--playing");
    stopBtn.hidden = false;

    verses.forEach((v) => {
      timers.push(setTimeout(() => setVerse(v), t * 1000));
      v.lines.forEach((line) => {
        line.syls.forEach((s) => {
          const at = t;
          const length = s.beats * quarter;
          timers.push(setTimeout(() => {
            if (previous) previous.classList.remove("is-on");
            s.el.classList.add("is-on");
            previous = s.el;
            markLine(line);
            bob();
          }, (at + 0.12) * 1000));
          if (c) oscillators.push(...Tones.note(s.note, origin + at, length * 0.92, 0.2));
          t += length;
        });
      });
      t += quarter; /* a breath between verses */
    });

    timers.push(setTimeout(() => {
      if (active && active.article === article) active = null;
      clearMarks();
    }, (t + 0.4) * 1000));

    active = {
      article,
      stop() {
        timers.forEach(clearTimeout);
        oscillators.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } });
        clearMarks();
      }
    };
  }

  /* ------------------------------------------------------------ words */

  async function sayWords() {
    stopActive();
    const token = { cancelled: false };
    active = {
      article,
      stop() {
        token.cancelled = true;
        Speech.cancel();
        clearMarks();
      }
    };
    stopBtn.hidden = false;
    const voice = Speech.preferred();
    const rate = slowBox.checked ? 0.7 : 0.85;

    for (const v of verses) {
      setVerse(v);
      for (const line of v.lines) {
        if (token.cancelled) return;
        markLine(line);
        bob();
        await speak(line.text, voice, rate);
        if (token.cancelled) return;
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    if (!token.cancelled) {
      if (active && active.article === article) active = null;
      clearMarks();
    }
  }

  bar.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.act === "play") playTune();
    if (b.dataset.act === "say") sayWords();
    if (b.dataset.act === "stop") stopActive();
  });
}

document.querySelectorAll("[data-song]").forEach(setUp);

/* One sound switch for the whole page. */
const soundSwitch = document.querySelector("[data-songs-sound]");
if (soundSwitch) {
  const paint = () => {
    soundSwitch.setAttribute("aria-pressed", Tones.muted ? "false" : "true");
    soundSwitch.innerHTML = Tones.muted
      ? '<span aria-hidden="true">&#128263;</span> Sound off'
      : '<span aria-hidden="true">&#128266;</span> Sound on';
  };
  soundSwitch.hidden = false;
  paint();
  soundSwitch.addEventListener("click", () => {
    Tones.setMuted(!Tones.muted);
    if (Tones.muted) { stopActive(); Speech.cancel(); }
    paint();
  });
}

/* Leaving the page or hiding the tab stops a song mid-verse rather than
   letting it carry on playing somewhere the child cannot see it. */
document.addEventListener("visibilitychange", () => { if (document.hidden) stopActive(); });
