/* ==========================================================================
   RCF English - speaking feedback

   Checks a computer can make from the words of a spoken answer. Shared by
   Speaking Practice, the mock speaking test and the conversation partner.
   Never a band score.
   ========================================================================== */

/* ------------------------------------------------------------- analysis */

const STOP = new Set("the a an and or but of to in on at for with is are was were be been am it its it's this that these those i you he she we they my your his her our their me him us them as by from not no so do did does have has had will would can could should there here what which who when where why how all some any very more most also just than then into out up about over after before i'm don't i've it's that's there's".split(" "));
const FILLERS = ["um", "umm", "uh", "er", "erm", "ah", "you know", "i mean", "basically", "actually", "kind of", "sort of"];
const LINKS = ["because", "so", "although", "though", "however", "but", "also", "and then", "for example", "for instance", "such as", "on the other hand", "whereas", "while", "as a result", "that's why", "which means", "in my opinion", "i think", "i believe", "personally", "to be honest", "i'd say", "the main reason", "another reason", "first of all", "apart from that", "what's more", "overall"];
const BASIC = { good: "enjoyable, useful, excellent, helpful", nice: "pleasant, attractive, friendly, lovely", bad: "unpleasant, harmful, disappointing, poor", big: "large, huge, enormous, major", very: "really, extremely, incredibly, quite", thing: "a more exact noun: activity, idea, item, problem", things: "a more exact noun: activities, ideas, items, problems", "a lot": "many, plenty of, a great deal of", happy: "delighted, pleased, glad, cheerful", interesting: "fascinating, absorbing, eye-opening" };

export const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
export const tokens = (t) => (norm(t) ? norm(t).split(" ") : []);
const has = (text, phrase) => new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
const countPhrase = (text, phrase) => (` ${text} `.match(new RegExp(` ${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?= )`, "g")) || []).length;

/* Longest common subsequence of words, so a read-aloud sentence can show
   which of its words were heard, in order, even when others were missed. */
export function alignWords(target, spoken) {
  const a = tokens(target), b = tokens(spoken);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const hit = new Array(a.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  // map back onto the original words so punctuation and capitals are kept
  const shown = target.split(/\s+/);
  let k = 0;
  const words = shown.map((w) => { const clean = norm(w); if (!clean) return { w, ok: true }; const ok = hit[k]; k++; return { w, ok, clean }; });
  return { words, score: a.length ? hit.filter(Boolean).length / a.length : 0 };
}

export function analyse(mode, item, text, timing) {
  const out = [];
  const add = (ok, msg) => out.push({ ok, msg });
  const t = norm(text);
  const words = tokens(text);
  const n = words.length;
  const result = { notes: out, words: n, wpm: 0, score: null, align: null };
  if (!n) return result;

  const secs = timing && timing.speaking ? timing.speaking / 1000 : 0;
  if (secs >= 8 && n >= 12) {
    result.wpm = Math.round(n / (secs / 60));
    if (mode.id !== "read") {
      if (result.wpm < 80) add(false, `About ${result.wpm} words a minute: quite slow. Try to speak in groups of words rather than one word at a time.`);
      else if (result.wpm > 185) add(false, `About ${result.wpm} words a minute: fast. Slow down a little so every word is clear.`);
      else add(true, `About ${result.wpm} words a minute: a comfortable speed for a listener.`);
    }
  }
  if (timing && mode.id !== "read") {
    if (timing.pauses >= 3) add(false, `${timing.pauses} long pauses of three seconds or more. Use a phrase such as "Let me think" or "What I mean is" to keep going while you think.`);
    else if (secs >= 15) add(true, timing.pauses ? `Only ${timing.pauses} long ${timing.pauses === 1 ? "pause" : "pauses"}: you kept going well.` : "No long pauses: you kept going.");
  }

  if (mode.id === "read") {
    const al = alignWords(item.prompt, text);
    result.align = al;
    result.score = Math.round(al.score * 100);
    const missed = [...new Set(al.words.filter((w) => !w.ok).map((w) => w.clean))];
    if (result.score >= 95) add(true, `${result.score}% of the words were recognised. Clear reading.`);
    else if (result.score >= 75) add(false, `${result.score}% of the words were recognised. Listen to the missed words and try the sentence again.`);
    else add(false, `${result.score}% of the words were recognised. Listen to the sentence again, then read it more slowly, word group by word group.`);
    if (missed.length) add(false, `Not recognised: ${missed.join(", ")}. These may be sounds to practise, or the computer may simply have misheard.`);
    return result;
  }

  // length
  const range = { part1: [18, 70], part2: [150, 400], part3: [45, 160], talk: [12, 120] }[mode.id];
  if (n < range[0]) {
    const tip = { part1: "Add a reason and a detail: an answer of one sentence sounds unfinished.", part2: "Aim to speak for the full two minutes. Use the four points on the card, and add a story or an example to each.", part3: "Develop the idea: give a reason, an example, and if you can, the other side of the argument.", talk: "Say a little more, so the situation is fully handled." }[mode.id];
    add(false, `${n} words. ${tip}`);
  } else if (n > range[1] && mode.id === "part1") add(false, `${n} words. Part 1 answers can be shorter: two or three sentences is enough before the examiner moves on.`);
  else add(true, `${n} words: a good length for this task.`);

  if (mode.id === "part2" && secs && secs < 90) add(false, `You spoke for about ${Math.round(secs)} seconds. Try to keep going for at least a minute and a half.`);

  // reasons, examples, linking
  const reason = /\b(because|since|so|that's why|the reason|as a result|which means)\b/.test(t);
  const example = /\b(for example|for instance|such as|like when|once|last year|last week|when i was)\b/.test(t);
  if (mode.id === "part1" || mode.id === "part3") add(reason, reason ? "You gave a reason." : "No reason found. Add one with because, so, or the reason is.");
  if (mode.id === "part3") {
    add(example, example ? "You supported your answer with an example." : "No example found. Add one with for example or for instance.");
    const balance = /\b(however|on the other hand|although|though|whereas|while|but some|but others|then again)\b/.test(t);
    add(balance, balance ? "You looked at more than one side." : "Try to show the other side too, with on the other hand or however.");
    if (/\b(future|will|going to)\b/i.test(item.prompt)) {
      const spec = /\b(will|might|may|could|probably|likely|perhaps|i expect|i imagine)\b/.test(t);
      add(spec, spec ? "You used language for the future, such as will or might." : "This question is about the future. Use will, might, probably or it is likely that.");
    }
  }
  const links = LINKS.filter((l) => has(t, l));
  if (n >= 30 && mode.id !== "talk") {
    if (links.length < 3) add(false, "Few linking phrases. Phrases such as because, for example, on the other hand and what's more join ideas together.");
    else add(true, `Linking phrases you used: ${links.slice(0, 6).join(", ")}.`);
  }

  // cue-card points and situation functions
  if (mode.id === "part2") {
    const missing = item.points.filter(([, keys]) => !keys.some((k) => has(t, k) || t.includes(k)));
    if (missing.length) add(false, `You may not have covered: ${missing.map(([p]) => p).join("; ")}. This is a guess from your words, so check the card yourself.`);
    else add(true, "You seem to have covered all four points on the card.");
  }
  if (mode.id === "talk") {
    item.functions.forEach(([label, re]) => add(re.test(t), re.test(t) ? `You included ${label}.` : `Not found: ${label}.`));
  }

  // vocabulary
  const freq = {};
  words.filter((w) => w.length > 3 && !STOP.has(w)).forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  // words from the question itself are expected to come back, singular or plural
  const topic = new Set(tokens(item.prompt).map((w) => w.replace(/s$/, "")));
  const repeated = Object.entries(freq).filter(([w, c]) => c >= Math.max(3, Math.round(n / 35)) && !topic.has(w.replace(/s$/, ""))).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (repeated.length) add(false, `Repeated words: ${repeated.map(([w, c]) => `"${w}" (${c} times)`).join(", ")}. Could you use a different word for some of them?`);
  const basic = Object.keys(BASIC).map((w) => [w, countPhrase(t, w)]).filter(([, c]) => c >= 2);
  basic.slice(0, 3).forEach(([w, c]) => add(false, `"${w}" ${c} times. Instead, try: ${BASIC[w]}.`));
  if (n >= 60) {
    const distinct = Object.keys(freq).length;
    add(distinct >= 25, distinct >= 25 ? `${distinct} different content words: a good range.` : `${distinct} different content words. Try to use more varied, topic-specific vocabulary.`);
  }

  // fillers
  const fillers = FILLERS.map((f) => [f, countPhrase(t, f)]).filter(([, c]) => c);
  const fillerTotal = fillers.reduce((s, [, c]) => s + c, 0);
  if (fillerTotal >= Math.max(3, Math.round(n / 25))) add(false, `Fillers: ${fillers.map(([f, c]) => `"${f}" (${c})`).join(", ")}. A few are natural; this many can make you sound unsure. (Speech recognition often leaves fillers out, so there may be more.)`);

  return result;
}

