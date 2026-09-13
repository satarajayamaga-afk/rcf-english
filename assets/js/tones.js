/* ---------------------------------------------------------------------------
   Light tones for the primary pages.

   Every sound here is made in the browser with the Web Audio API: a soft sine
   with a faint octave above it and a quick bell-like fade, which sounds like a
   music box rather than a keyboard. There are no audio files, so nothing to
   download, nothing to licence and nothing to go missing.

   It is deliberately quiet. A classroom or a sitting room may have a child's
   page open beside other things, and the sound should sit under a teacher's
   voice, not over it. Nothing plays until the visitor has pressed a button,
   and the mute choice is remembered.
--------------------------------------------------------------------------- */

const KEY = "rcf-play-muted";
const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

let ctx = null;
let master = null;
let muted = false;

try { muted = window.localStorage.getItem(KEY) === "1"; } catch (e) { /* storage blocked */ }

/* "C4", "F#4", "Bb3" -> frequency in hertz. */
function frequency(note) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(String(note || "").trim());
  if (!m) return 0;
  let semis = NAMES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const Tones = {
  get muted() { return muted; },

  setMuted(value) {
    muted = !!value;
    try { window.localStorage.setItem(KEY, muted ? "1" : "0"); } catch (e) { /* storage blocked */ }
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
  },

  /* The audio context is created on first use, which is always inside a click
     handler - browsers refuse to start one before the page has been touched. */
  ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  },

  now() {
    const c = this.ensure();
    return c ? c.currentTime : 0;
  },

  /**
   * One note. Returns the oscillators so a caller can stop a whole song early.
   * `when` is in audio-context seconds; `length` is how long the note rings.
   */
  note(name, when, length, level = 0.2) {
    const c = this.ensure();
    const f = frequency(name);
    if (!c || !f || muted) return [];

    const t = Math.max(when == null ? c.currentTime : when, c.currentTime);
    const ring = Math.max(0.14, length);

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + ring);

    const body = c.createOscillator();
    body.type = "sine";
    body.frequency.value = f;

    const shimmer = c.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = f * 2;
    const shimmerLevel = c.createGain();
    shimmerLevel.gain.value = 0.12;

    body.connect(env);
    shimmer.connect(shimmerLevel);
    shimmerLevel.connect(env);
    env.connect(master);

    body.start(t);
    shimmer.start(t);
    body.stop(t + ring + 0.05);
    shimmer.stop(t + ring + 0.05);
    return [body, shimmer];
  },

  /* Two soft rising notes: "well done". */
  chime() {
    const c = this.ensure();
    if (!c || muted) return;
    const t = c.currentTime + 0.02;
    this.note("E5", t, 0.35, 0.12);
    this.note("G5", t + 0.13, 0.55, 0.12);
  }
};
