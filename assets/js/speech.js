/* ---------------------------------------------------------------------------
   Speech, shared.

   Speech synthesis is unreliable in ways that matter to a child's page: a
   device may have no English voice, a browser may refuse to speak until the
   page has been touched, and some browsers never fire "end". Everything here
   resolves in roughly the time the words take to say whatever happens, so a
   page built on it never stalls waiting for a voice that is not coming.

   Used by the spoken-English dialogues, the alphabet board and the songs.
--------------------------------------------------------------------------- */

export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Speech = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window,
  voices: [],

  refresh() {
    if (!this.supported) return;
    this.voices = window.speechSynthesis.getVoices().filter((v) => /^en\b/i.test(v.lang));
  },

  /* One voice per speaker where the device has several English voices. */
  assign(speakers) {
    this.refresh();
    const map = new Map();
    const pool = this.voices.length ? this.voices : [null];
    speakers.forEach((name, i) => map.set(name, pool[i % pool.length]));
    return map;
  },

  /* The voice for a single speaker. A British or Indian English voice is
     preferred where the device has one, because it is closer to the English a
     Sri Lankan classroom hears than the American default. */
  preferred() {
    this.refresh();
    const pick = (re) => this.voices.find((v) => re.test(v.lang));
    return pick(/^en-GB/i) || pick(/^en-IN/i) || this.voices[0] || null;
  },

  cancel() {
    if (this.supported) window.speechSynthesis.cancel();
  }
};

if (Speech.supported) {
  Speech.refresh();
  window.speechSynthesis.addEventListener("voiceschanged", () => Speech.refresh());
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Roughly how long a line takes to say, used when speech is unavailable so
   the pacing still feels natural rather than like a slideshow. */
export function readingTime(text, rate) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(900, (words / 2.6) * 1000) / rate;
}

/**
 * Say some words, and resolve when they have been said - or when they would
 * have been, if the device could not say them.
 */
export function speak(text, voice, rate = 1) {
  return new Promise((resolve) => {
    const pace = readingTime(text, rate);

    if (!Speech.supported || !Speech.voices.length) {
      wait(pace).then(resolve);
      return;
    }

    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = rate;

    let done = false;
    let started = false;
    let startGuard;
    let endGuard;
    let poll;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(startGuard);
      clearTimeout(endGuard);
      clearInterval(poll);
      resolve();
    };

    u.addEventListener("start", () => {
      started = true;
      clearTimeout(startGuard);
      /* "end" is unreliable in several browsers - it can arrive late or not
         at all. Watching the queue empty is accurate to about a tenth of a
         second and does not depend on the event firing. */
      poll = setInterval(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) finish();
      }, 120);
      /* Absolute backstop, in case the queue never reports empty. */
      endGuard = setTimeout(finish, pace * 2 + 3000);
    });
    u.addEventListener("end", finish);
    u.addEventListener("error", finish);

    window.speechSynthesis.speak(u);

    /* If speaking has not begun shortly after we asked, assume it will not,
       and fall back to timed pacing. */
    startGuard = setTimeout(() => {
      if (started || done) return;
      window.speechSynthesis.cancel();
      wait(Math.max(0, pace - 500)).then(finish);
    }, 500);
  });
}
