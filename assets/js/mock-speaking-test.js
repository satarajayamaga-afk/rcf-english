/* ==========================================================================
   RCF English - mock IELTS Speaking test

   A hands-free run through the three parts of the Speaking test. The website
   plays the examiner: it asks a question, listens, decides the answer is over
   after a silence, asks a short follow-up when an answer is very brief, times
   the Part 2 preparation and talk, and at the end shows a transcript of the
   whole test with practice guidance for each answer.

   The examiner's words follow the published shape of the test. The questions
   are original RCF English questions, not official IELTS material. There is
   no band score.
   ========================================================================== */

import { esc } from "./lib.js";
import { Speech } from "./speech.js";
import { PART1, PART2, PART3, TESTS as PLAN } from "./speaking-data.js";
import { analyse } from "./speaking-analysis.js";
import { SR, store, talk, listen, ensureConsent, langSelect, wireLangSelect, fmt, ERRORS } from "./voice.js";

const root = document.querySelector("[data-mock-speaking]");
const HISTORY_KEY = "rcf-speaking-history";

const find = (list, name) => {
  const hit = list.find((x) => (Array.isArray(x) ? x[0] : x.title) === name);
  if (!hit) throw new Error(`Mock speaking test: "${name}" is not in the question bank`);
  return hit;
};
const TESTS = PLAN.map((p, i) => ({
  name: `Test ${i + 1}`,
  part1: p.part1.map((n) => find(PART1, n)),
  card: find(PART2, p.card),
  part3: find(PART3, p.part3)
}));

const FOLLOW1_WHY = ["Why?", "Why do you say that?", "Why is that?"];
const FOLLOW1_MORE = ["Can you tell me a little more about that?", "Could you say a bit more about that?", "Tell me more."];
// "Why?" suits an opinion or a yes/no question; after "Where is..." it would sound odd
const follow1 = (q) => (/^(do|does|did|would|is|are|has|have|should|can)\b|\bprefer\b|\bwhy\b/i.test(q) ? FOLLOW1_WHY : FOLLOW1_MORE);
const FOLLOW3 = ["Why do you think that is?", "Can you give me an example?", "Why do you say that?", "And what about the other side of that argument?"];
const pick = (list, n) => list[n % list.length];

function setUp() {
  root.innerHTML = `
    <div class="mst">
      <div class="mst__setup" data-setup>
        <div class="sp__row">
          <div class="field"><label for="mst-test">Choose a test</label>
            <select id="mst-test" data-test>${TESTS.map((t, i) => `<option value="${i}">${esc(t.name)}: ${esc(t.part1[0][0])}, ${esc(t.part1[1][0])}; ${esc(t.card.title.toLowerCase())}</option>`).join("")}</select></div>
          <div class="field">${langSelect("mst-lang")}</div>
        </div>
        <label class="mst__check"><input type="checkbox" data-show checked> Show the examiner's questions on the screen as well</label>
        <p class="text-small text-muted">About 11 to 14 minutes. Sit somewhere quiet, with headphones if you have them. The examiner moves on when you stop speaking for a few seconds, so there is no need to touch the screen.</p>
        <div class="sp__controls"><button type="button" class="btn btn--accent" data-begin>Start the test</button></div>
      </div>

      <div class="mst__room" data-room hidden>
        <div class="mst__bar">
          <span class="mst__part" data-part></span>
          <span class="sp__clock" data-clock></span>
        </div>
        <div class="mst__examiner" data-examiner-wrap>
          <span class="mst__avatar" aria-hidden="true">🎙</span>
          <div><p class="mst__who">Examiner</p><p class="mst__says" data-says aria-live="polite"></p></div>
        </div>
        <div class="sp__card" data-card hidden></div>
        <div class="mst__you" data-you hidden>
          <p class="mst__who">You <span class="mst__mic" data-mic>listening</span></p>
          <p class="mst__heard" data-heard aria-live="polite"></p>
        </div>
        <p class="sp__status" data-status role="status" aria-live="polite"></p>
        <div class="sp__controls">
          <button type="button" class="btn btn--accent" data-done hidden>I've finished my answer</button>
          <button type="button" class="btn btn--accent" data-ready hidden>I'm ready to speak</button>
          <button type="button" class="btn btn--accent" data-answer hidden>Answer</button>
          <button type="button" class="btn btn--outline" data-repeat hidden>Repeat the question</button>
          <button type="button" class="btn btn--outline" data-end>End the test</button>
        </div>
      </div>

      <div class="mst__report" data-report hidden></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  wireLangSelect(root);
  if (!SR) {
    $("[data-setup]").insertAdjacentHTML("afterbegin", `<p class="sp__status">${ERRORS.unsupported} The mock test needs speech recognition. You can still practise with the timer on the <a href="${document.body.dataset.root || ""}speaking-practice/">Speaking Practice</a> page.</p>`);
    $("[data-begin]").disabled = true;
    return;
  }

  let run = 0;           // increases when a test is started or ended, so an old one stops
  let current = null;    // the open listening turn
  let log = [];
  let showText = true;
  let clockTimer = null;

  const alive = (id) => id === run;

  function setPart(label) { $("[data-part]").textContent = label; }
  function clock(text) { $("[data-clock]").textContent = text; }

  async function examiner(id, text) {
    if (!alive(id)) return;
    $("[data-says]").textContent = showText ? text : "…";
    $("[data-examiner-wrap]").classList.add("is-speaking");
    await talk(text, 0.95);
    $("[data-examiner-wrap]").classList.remove("is-speaking");
  }

  /* One listening turn. Resolves to the result, or null if the test ended. */
  async function hear(id, opts) {
    if (!alive(id)) return null;
    const you = $("[data-you]"), heard = $("[data-heard]");
    you.hidden = false; heard.textContent = "";
    $("[data-mic]").textContent = "listening";
    you.classList.add("is-listening");
    $("[data-done]").hidden = false;
    $("[data-status]").textContent = "";
    const started = Date.now();
    if (opts.limit) {
      clearInterval(clockTimer);
      clockTimer = setInterval(() => clock(`${fmt((Date.now() - started) / 1000)} / ${fmt(opts.limit / 1000)}`), 250);
    }
    current = listen({ maxMs: opts.limit || 90000, endSilenceMs: opts.silence, noSpeechMs: opts.noSpeech || 9000, onInterim: (t) => { heard.textContent = t; } });
    const r = await current.promise;
    current = null;
    clearInterval(clockTimer);
    you.classList.remove("is-listening");
    $("[data-mic]").textContent = "";
    $("[data-done]").hidden = true;
    if (!alive(id)) return null;
    if (r.error && r.error !== "no-speech") {
      // a browser may refuse to open the microphone without a tap
      $("[data-status]").textContent = ERRORS[r.error] || `Speech recognition stopped (${r.error}).`;
      if (r.error === "not-allowed" || r.error === "audio-capture") return null;
      $("[data-answer]").hidden = false;
      await new Promise((go) => $("[data-answer]").addEventListener("click", go, { once: true }));
      $("[data-answer]").hidden = true;
      return hear(id, opts);
    }
    return r;
  }

  /* Ask a question, listen, follow up once if the answer is very short. */
  async function ask(id, part, question, opts) {
    const entry = { part, question, answer: "", speakingMs: 0, pauses: 0, followUp: "" };
    log.push(entry);
    $("[data-repeat]").hidden = part === 2;
    let repeated = false;
    const repeatBtn = $("[data-repeat]");
    const onRepeat = () => { repeated = true; if (current) current.stop(); };
    repeatBtn.addEventListener("click", onRepeat);
    try {
      await examiner(id, question);
      let r = await hear(id, opts);
      if (!r) return entry;
      if (repeated && !r.text) { repeated = false; await examiner(id, question); r = await hear(id, opts); if (!r) return entry; }
      if (!r.text) {
        await examiner(id, "Sorry, I didn't hear you. Let me ask again.");
        await examiner(id, question);
        r = await hear(id, opts);
        if (!r) return entry;
      }
      entry.answer = r.text; entry.speakingMs = r.speakingMs; entry.pauses = r.pauses;
      const words = r.text ? r.text.split(/\s+/).length : 0;
      if (opts.follow && r.text && words < opts.follow.minWords) {
        entry.followUp = pick(opts.follow.list, log.length);
        await examiner(id, entry.followUp);
        const more = await hear(id, opts);
        if (more && more.text) {
          entry.answer += " " + more.text;
          entry.speakingMs += more.speakingMs;
          entry.pauses += more.pauses;
        }
      }
      return entry;
    } finally {
      repeatBtn.removeEventListener("click", onRepeat);
    }
  }

  async function runTest() {
    const id = ++run;
    const test = TESTS[Number($("[data-test]").value) || 0];
    showText = $("[data-show]").checked;
    log = [];
    $("[data-setup]").hidden = true;
    $("[data-report]").hidden = true;
    $("[data-room]").hidden = false;
    $("[data-card]").hidden = true;
    $("[data-you]").hidden = true;
    root.scrollIntoView({ behavior: "smooth", block: "start" });

    /* Part 1 */
    setPart("Part 1 · Introduction and interview");
    clock("");
    await examiner(id, "Good morning. This is a practice speaking test. Can you tell me your full name, please?");
    await hear(id, { silence: 2000, noSpeech: 8000 });
    await examiner(id, "Thank you. Now, in this first part, I'd like to ask you some questions about yourself.");
    for (const [topic, questions] of test.part1) {
      if (!alive(id)) return;
      await examiner(id, `Let's talk about ${topic.toLowerCase()}.`);
      for (const q of questions) {
        if (!alive(id)) return;
        await ask(id, 1, q, { silence: 2600, follow: { minWords: 12, list: follow1(q) } });
      }
    }

    /* Part 2 */
    if (!alive(id)) return;
    setPart("Part 2 · Long turn");
    await examiner(id, "Thank you. Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish.");
    const card = test.card;
    $("[data-card]").innerHTML = `<p class="wp__level">Cue card</p><p class="sp__prompt">${esc(card.prompt)}</p><p class="mb-0">You should say:</p><ul>${card.points.map(([p]) => `<li>${esc(p)}</li>`).join("")}</ul>`;
    $("[data-card]").hidden = false;
    await examiner(id, `Here is your topic. ${card.prompt} You should say: ${card.points.map(([p]) => p).join(", ")}.`);
    if (!alive(id)) return;
    let left = 60;
    const ready = $("[data-ready]");
    ready.hidden = false;
    clock(`Preparation ${fmt(left)}`);
    await new Promise((go) => {
      const t = setInterval(() => { left--; clock(`Preparation ${fmt(left)}`); if (left <= 0 || !alive(id)) { clearInterval(t); go(); } }, 1000);
      ready.addEventListener("click", () => { clearInterval(t); go(); }, { once: true });
    });
    ready.hidden = true;
    await examiner(id, "All right? Remember, you have one to two minutes for this, so don't worry if I stop you. I'll tell you when the time is up. Can you start speaking now, please?");
    const talkEntry = { part: 2, question: card.prompt, answer: "", speakingMs: 0, pauses: 0, followUp: "", card };
    log.push(talkEntry);
    const startedTalk = Date.now();
    let r = await hear(id, { limit: 120000, silence: 7000, noSpeech: 12000 });
    if (!r) return;
    talkEntry.answer = r.text; talkEntry.speakingMs = r.speakingMs; talkEntry.pauses = r.pauses;
    const spent = Date.now() - startedTalk;
    if (spent < 60000 && r.text) {
      talkEntry.followUp = "Can you tell me a little more about that?";
      await examiner(id, talkEntry.followUp);
      const more = await hear(id, { limit: 120000 - spent, silence: 7000, noSpeech: 8000 });
      if (!more) return;
      if (more.text) { talkEntry.answer += " " + more.text; talkEntry.speakingMs += more.speakingMs; talkEntry.pauses += more.pauses; }
    }
    clock("");
    await examiner(id, "Thank you.");
    $("[data-card]").hidden = true;

    /* Part 3 */
    if (!alive(id)) return;
    setPart("Part 3 · Discussion");
    const [topic3, questions3] = test.part3;
    await examiner(id, `We've been talking about ${card.title.toLowerCase()}, and I'd like to discuss with you one or two more general questions related to this. Let's consider ${topic3.toLowerCase()}.`);
    for (const q of questions3) {
      if (!alive(id)) return;
      await ask(id, 3, q, { silence: 3200, follow: { minWords: 30, list: FOLLOW3 } });
    }
    if (!alive(id)) return;
    await examiner(id, "Thank you. That is the end of the speaking test.");
    report(test, true);
  }

  function report(test, finished) {
    run++;
    $("[data-room]").hidden = true;
    const answered = log.filter((e) => e.answer);
    const totalWords = answered.reduce((s, e) => s + e.answer.split(/\s+/).length, 0);
    const totalMs = answered.reduce((s, e) => s + e.speakingMs, 0);
    const wpm = totalMs > 20000 ? Math.round(totalWords / (totalMs / 60000)) : 0;
    const followUps = log.filter((e) => e.followUp && e.part !== 2).length;
    const p2 = log.find((e) => e.part === 2);
    const modes = { 1: { id: "part1" }, 2: { id: "part2" }, 3: { id: "part3" } };

    const summary = [
      `${answered.length} of ${log.length} questions answered`,
      `${totalWords} words`,
      totalMs ? `about ${fmt(totalMs / 1000)} of speaking` : "",
      wpm ? `${wpm} words a minute on average` : "",
      p2 && p2.speakingMs ? `Part 2 talk: about ${fmt(p2.speakingMs / 1000)}` : ""
    ].filter(Boolean);

    const tips = [];
    if (followUps >= 3) tips.push(`The examiner needed to ask a follow-up ${followUps} times because answers were very short. In Part 1, add a reason and a detail to every answer; in Part 3, add a reason, an example and the other side.`);
    if (p2 && p2.speakingMs && p2.speakingMs < 90000) tips.push("Your Part 2 talk was under a minute and a half. Use every point on the card, and add a short story or example to each one.");
    if (wpm && wpm < 85) tips.push("Your overall speed was quite slow. Practise saying whole phrases in one breath rather than one word at a time.");
    const missing = log.length - answered.length;
    if (!finished) tips.push("You ended the test early, so this report covers only the questions you reached.");
    if (missing) tips.push(`${missing} ${missing === 1 ? "question has" : "questions have"} no answer recorded. If you did answer, the microphone may not have picked you up: check it, or try headphones with a microphone.`);
    const good = !tips.length && answered.length;
    if (good) tips.push("You kept talking and gave developed answers. Now read each answer below and look for places to use more precise vocabulary and a wider range of grammar.");

    const section = (part, title) => {
      const entries = log.filter((e) => e.part === part);
      if (!entries.length) return "";
      return `<h3>${title}</h3>${entries.map((e) => {
        const item = part === 2 ? e.card : { prompt: e.question };
        const notes = e.answer ? analyse(modes[part], item, e.answer, { speaking: e.speakingMs, pauses: e.pauses }).notes : [];
        return `<details class="accordion mst__answer"><summary>${esc(e.question)}${e.answer ? "" : " (no answer recorded)"}</summary><div class="accordion__body">
          ${e.followUp ? `<p class="text-small text-muted">The examiner followed up: “${esc(e.followUp)}”</p>` : ""}
          <p class="mst__transcript">${e.answer ? esc(e.answer) : "<em>Nothing was recognised for this question.</em>"}</p>
          ${notes.length ? `<ul class="wp__notes">${notes.map((x) => `<li class="wp__note wp__note--${x.ok ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${x.ok ? "✓" : "!"}</span><span class="visually-hidden">${x.ok ? "Good: " : "To work on: "}</span>${esc(x.msg)}</li>`).join("")}</ul>` : ""}
        </div></details>`;
      }).join("")}`;
    };

    const box = $("[data-report]");
    box.innerHTML = `
      <section class="wp__panel">
        <h2 class="mst__title">Your mock test: ${esc(test.name)}</h2>
        <p class="sp__stats">${esc(summary.join(" · "))}</p>
        <ul class="wp__notes">${tips.map((t) => `<li class="wp__note wp__note--${good ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${good ? "✓" : "!"}</span>${esc(t)}</li>`).join("")}</ul>
        <p class="text-small text-muted">This is practice guidance from the words the computer recognised. It is not an IELTS band score: a band depends on fluency, vocabulary, grammar and pronunciation judged by a trained examiner. Recognition makes mistakes, so read your transcript with that in mind.</p>
        ${section(1, "Part 1")}${section(2, "Part 2")}${section(3, "Part 3")}
        <div class="sp__controls mt-4"><button type="button" class="btn btn--accent" data-again>Take another test</button><button type="button" class="btn btn--outline" data-print>Print the transcript</button></div>
      </section>`;
    box.hidden = false;
    box.querySelector("[data-again]").addEventListener("click", () => { box.hidden = true; $("[data-setup]").hidden = false; });
    box.querySelector("[data-print]").addEventListener("click", () => { box.querySelectorAll("details").forEach((d) => { d.open = true; }); window.print(); });
    box.scrollIntoView({ behavior: "smooth", block: "start" });

    const h = store.get(HISTORY_KEY, []);
    h.unshift({ at: Date.now(), mode: "Mock test", title: test.name, words: totalWords, wpm, score: null });
    store.set(HISTORY_KEY, h.slice(0, 30));
  }

  function endTest() {
    const hadAnswers = log.some((e) => e.answer);
    run++;
    if (current) current.stop();
    Speech.cancel();
    clearInterval(clockTimer);
    $("[data-room]").hidden = true;
    ["[data-done]", "[data-ready]", "[data-answer]", "[data-repeat]"].forEach((s) => { $(s).hidden = true; });
    if (hadAnswers) report(TESTS[Number($("[data-test]").value) || 0], false);
    else $("[data-setup]").hidden = false;
  }

  $("[data-begin]").addEventListener("click", async () => {
    if (!(await ensureConsent($("[data-setup]")))) return;
    runTest();
  });
  $("[data-done]").addEventListener("click", () => { if (current) current.stop(); });
  $("[data-end]").addEventListener("click", endTest);
  window.addEventListener("pagehide", () => { run++; if (current) current.stop(); Speech.cancel(); });
}

if (root) setUp();
