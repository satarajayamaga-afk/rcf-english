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

const root = document.querySelector("[data-speaking]");
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CONSENT_KEY = "rcf-speaking-consent";
const HISTORY_KEY = "rcf-speaking-history";
const LANG_KEY = "rcf-speaking-lang";

/* ------------------------------------------------------------------ tasks */

const PART1 = [
  ["Hometown", ["Where is your hometown?", "What do you like most about your hometown?", "Has your hometown changed much since you were a child?", "Would you like to live there in the future? Why or why not?"]],
  ["Work or studies", ["Do you work, or are you a student?", "Why did you choose that subject or that job?", "What is the most difficult part of your studies or your work?", "What would you like to do in the future?"]],
  ["Free time", ["What do you usually do in your free time?", "Do you prefer spending your free time alone or with other people?", "Is there a hobby you would like to try?", "How has the way you spend your free time changed over the years?"]],
  ["Food", ["What kind of food do you enjoy eating?", "Do you often cook at home?", "Is there any food you disliked as a child but enjoy now?", "Do people in your country eat out more often than they used to?"]],
  ["Weather", ["What is the weather usually like where you live?", "What kind of weather do you like best?", "Does the weather affect your mood?", "Do you prefer the rainy season or the dry season?"]],
  ["Technology", ["How often do you use your mobile phone?", "What do you mainly use the internet for?", "Is there any piece of technology you could not live without?", "Do you think people spend too much time on their phones?"]],
  ["Transport", ["How do you usually travel to school or work?", "What is public transport like in your area?", "Do you prefer travelling by bus or by train?", "How could transport in your town be improved?"]],
  ["Reading", ["Do you enjoy reading?", "What kind of books did you read as a child?", "Do you prefer printed books or reading on a screen?", "Is reading popular among young people where you live?"]]
];

const PART2 = [
  { title: "A teacher who influenced you", prompt: "Describe a teacher who has influenced you.",
    points: [["who this teacher was", ["teacher", "sir", "madam", "miss", "mr", "mrs", "name"]], ["what subject they taught", ["subject", "taught", "teach", "lesson", "class"]], ["what was special about them", ["special", "different", "always", "never", "kind", "strict", "patient"]], ["how they influenced you", ["influence", "changed", "helped", "because of", "now i", "taught me", "learned", "learnt"]]] },
  { title: "A place you would recommend to visitors", prompt: "Describe a place in your country that you would recommend to visitors.",
    points: [["where it is", ["located", "near", "in the", "province", "district", "south", "north", "east", "west", "coast", "hill"]], ["how to get there", ["bus", "train", "car", "drive", "hours", "road", "get there", "travel"]], ["what visitors can do there", ["can", "visit", "see", "walk", "swim", "climb", "enjoy", "try"]], ["why you would recommend it", ["recommend", "because", "worth", "reason", "best"]]] },
  { title: "A useful skill you learned", prompt: "Describe a skill you learned that has been useful to you.",
    points: [["what the skill is", ["skill", "learn", "learned", "learnt", "how to"]], ["when and how you learned it", ["when i was", "years ago", "taught", "course", "class", "practised", "practiced", "myself", "youtube"]], ["how difficult it was", ["difficult", "hard", "easy", "challenge", "struggled", "mistakes"]], ["why it has been useful", ["useful", "helps", "helped", "because", "save", "now i can"]]] },
  { title: "A memorable celebration", prompt: "Describe a memorable celebration you attended.",
    points: [["what was celebrated", ["wedding", "birthday", "festival", "new year", "avurudu", "vesak", "christmas", "deepavali", "ramadan", "eid", "anniversary", "celebrat"]], ["where and when it was", ["last year", "ago", "held", "at the", "in the", "when"]], ["who was there", ["family", "friends", "relatives", "people", "guests", "everyone"]], ["why it was memorable", ["memorable", "remember", "never forget", "because", "special"]]] },
  { title: "A useful piece of technology", prompt: "Describe a piece of technology you find useful.",
    points: [["what it is", ["phone", "laptop", "computer", "app", "device", "machine", "tablet", "internet"]], ["how often you use it", ["every day", "daily", "often", "always", "hours", "times a"]], ["what you use it for", ["use it", "for", "to"]], ["why it is useful to you", ["useful", "because", "helps", "without it", "save"]]] },
  { title: "A time you helped someone", prompt: "Describe a time when you helped someone.",
    points: [["who you helped", ["friend", "neighbour", "neighbor", "stranger", "classmate", "old", "brother", "sister", "mother", "father"]], ["what their problem was", ["problem", "needed", "lost", "couldn't", "could not", "trouble", "difficult"]], ["how you helped", ["helped", "i gave", "i took", "i showed", "i called", "i explained"]], ["how you felt about it", ["felt", "happy", "proud", "glad", "good", "satisfied"]]] }
].map((t) => ({ ...t, notes: "You will have one minute to prepare. You can make notes. Then speak for one to two minutes." }));

const PART3 = [
  ["Education and teachers", ["What makes a good teacher?", "Should students be allowed to choose what they study at school?", "How has technology changed the way students learn?", "Do you think computers will replace teachers in the future?"]],
  ["Tourism", ["Why do people like travelling to other countries?", "What are the advantages and disadvantages of tourism for a local community?", "How can tourists be encouraged to respect local culture?", "Will people travel more or less in the future?"]],
  ["Skills and learning", ["Which skills are most important for young people today?", "Is it better to learn a skill from a teacher or from the internet?", "Why do some adults stop learning new things?", "Should schools teach practical skills such as cooking?"]],
  ["Traditions and celebrations", ["Why are traditional celebrations important?", "How have celebrations changed compared with the past?", "Do you think traditional festivals will disappear in the future?", "Should governments spend money on public celebrations?"]],
  ["Technology and society", ["How has technology changed the way families communicate?", "Are there any dangers in children using technology?", "Should older people be taught to use new technology?", "Which technology do you think will change our lives most in the future?"]],
  ["Helping others", ["Why do some people volunteer to help others?", "Should helping in the community be part of school life?", "Is it the government's responsibility to help people in need?", "Are people less willing to help strangers than in the past?"]]
];

const READ = [
  ["V and W", "Keep your top teeth on your lower lip for V. Round your lips for W, with no teeth.", ["We visited the village every Wednesday.", "Vimal waited very patiently for the van.", "Would you like a vegetable wrap with your tea?"]],
  ["TH", "Put the tip of your tongue lightly between your teeth. Do not say T or D.", ["I think these three things are worth thinking about.", "The weather this Thursday will be better than yesterday.", "Thank you both for the birthday gift."]],
  ["F and P", "F is a long sound through your teeth and lip. P is a short puff of air from closed lips.", ["Please fill in the form before five o'clock.", "My father prefers fresh pineapple for breakfast.", "The price of paper has fallen a little."]],
  ["S, SH and Z", "SH is softer and wider than S. Z has a buzz you can feel in your throat.", ["She sells fresh fish at the shop on Sunday.", "The zoo is closed on Tuesdays and Thursdays.", "Sheela usually uses sugar in her coffee."]],
  ["Word endings", "Say the last sound of every word clearly: asked, fixed, desks, helped.", ["I asked him to fix the desk last week.", "She walked past the shops and helped her friends.", "They finished the tests and packed their bags."]],
  ["Useful phrases", "Say each phrase as one smooth group of words, not word by word.", ["Could you tell me how to get to the railway station, please?", "I'm sorry, could you say that again a little more slowly?", "I'd like to make an appointment for Monday morning."]]
];

const SITUATIONS = [
  { title: "At the pharmacy", prompt: "You are at a pharmacy. Ask for something for a headache, and ask how often you should take it.",
    functions: [["a polite request", /\b(could i|can i|could you|i would like|i'd like|may i|do you have)\b/], ["a question about how often", /\b(how often|how many times|how many)\b/], ["thanks", /\bthank/]] },
  { title: "Late for a meeting", prompt: "You arrive late for a meeting. Apologise and explain why you are late.",
    functions: [["an apology", /\b(sorry|apologi[sz]e)\b/], ["a reason", /\b(because|the bus|traffic|since|as the|my train)\b/], ["a promise for next time", /\b(won't happen|will not happen|next time|make sure|it won't)\b/]] },
  { title: "Booking a hotel room", prompt: "Telephone a hotel to book a room for two nights next weekend, and ask about the price.",
    functions: [["a booking request", /\b(i'd like to (book|reserve)|i would like to (book|reserve)|could i (book|reserve)|can i (book|reserve)|book a room|reserve a room)\b/], ["the dates", /\b(nights?|weekend|friday|saturday|sunday)\b/], ["a question about the price", /\b(how much|price|cost|rate)\b/]] },
  { title: "Declining an invitation", prompt: "A friend invites you to a party, but you cannot go. Say no politely and suggest another time.",
    functions: [["thanks for the invitation", /\b(thank|that's kind|that is kind|sounds (great|lovely|fun)|i'd love to|i would love to)\b/], ["a polite refusal", /\b(afraid|can't|cannot|unfortunately|won't be able|will not be able)\b/], ["a reason", /\b(because|i have to|i've got to|i have got to)\b/], ["another suggestion", /\b(maybe|another time|next time|how about|what about|shall we)\b/]] },
  { title: "Asking for directions", prompt: "Stop a stranger in the street and ask for directions to the nearest bank.",
    functions: [["a polite opening", /\bexcuse me\b/], ["a question about the way", /\b(could you|can you|do you know|where is|where's|how do i get|how can i get)\b/], ["thanks", /\bthank/]] },
  { title: "Introducing yourself at an interview", prompt: "You are at a job interview. Introduce yourself in about thirty seconds.",
    functions: [["your name", /\b(my name is|i'm|i am)\b/], ["your studies or experience", /\b(studied|study|studying|worked|work|working|experience|graduated|qualification)\b/], ["why you want the job", /\b(interested|because|would like|i'd like|hope|keen|excited)\b/]] },
  { title: "A polite complaint", prompt: "In a restaurant, your food has arrived cold. Complain politely to the waiter.",
    functions: [["a polite opening", /\b(excuse me|sorry to)\b/], ["the problem", /\b(cold|not hot|isn't hot|is not hot|wrong)\b/], ["a request", /\b(could you|would you|can you|please)\b/]] },
  { title: "A message for your teacher", prompt: "Leave a voice message for your teacher saying you are unwell and will miss class tomorrow.",
    functions: [["a greeting and your name", /\b(hello|hi|good (morning|afternoon|evening)|this is)\b/], ["that you are unwell", /\b(ill|sick|fever|unwell|not well|not feeling well)\b/], ["that you will miss class", /\b(miss|can't come|cannot come|won't be|will not be|absent)\b/], ["a request about the work", /\b(homework|notes|work|let me know|could you|catch up)\b/]] }
];

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

/* ------------------------------------------------------------- analysis */

const STOP = new Set("the a an and or but of to in on at for with is are was were be been am it its it's this that these those i you he she we they my your his her our their me him us them as by from not no so do did does have has had will would can could should there here what which who when where why how all some any very more most also just than then into out up about over after before i'm don't i've it's that's there's".split(" "));
const FILLERS = ["um", "umm", "uh", "er", "erm", "ah", "you know", "i mean", "basically", "actually", "kind of", "sort of"];
const LINKS = ["because", "so", "although", "though", "however", "but", "also", "and then", "for example", "for instance", "such as", "on the other hand", "whereas", "while", "as a result", "that's why", "which means", "in my opinion", "i think", "i believe", "personally", "to be honest", "i'd say", "the main reason", "another reason", "first of all", "apart from that", "what's more", "overall"];
const BASIC = { good: "enjoyable, useful, excellent, helpful", nice: "pleasant, attractive, friendly, lovely", bad: "unpleasant, harmful, disappointing, poor", big: "large, huge, enormous, major", very: "really, extremely, incredibly, quite", thing: "a more exact noun: activity, idea, item, problem", things: "a more exact noun: activities, ideas, items, problems", "a lot": "many, plenty of, a great deal of", happy: "delighted, pleased, glad, cheerful", interesting: "fascinating, absorbing, eye-opening" };

const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const tokens = (t) => (norm(t) ? norm(t).split(" ") : []);
const has = (text, phrase) => new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
const countPhrase = (text, phrase) => (` ${text} `.match(new RegExp(` ${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?= )`, "g")) || []).length;

/* Longest common subsequence of words, so a read-aloud sentence can show
   which of its words were heard, in order, even when others were missed. */
function alignWords(target, spoken) {
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

function analyse(mode, item, text, timing) {
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
