// The CEFR grammar lesson plans, read from the Markdown in ./plans.
//
// These arrive as Google Docs in one consistent format: a header line, the
// grammar point as the title, a lesson-overview table, language analysis,
// anticipated problems, a board plan, a staged procedure, differentiation,
// assessment, reflection, then the handouts and an answer key separated by
// rules. They are parsed rather than retyped as JavaScript, because fifty-five
// exist now and more are coming.
//
// The documents carry almost everything STANDARD.md asks for. Two things they
// do not carry are the four adaptations and the 45-minute short route, so
// those are composed here from the plan's own handouts and stages - never
// invented - and a plan may override any of it in ./extras.js.
//
// Each plan becomes a { lesson } module of the shape tools/esl/gen.js expects.
const fs = require("fs");
const path = require("path");
const EXTRAS = require("./extras");
const DRIVE = require("./drive");
const { padTo, PLAN_TAILS } = require("../text");

const SRC = path.join(__dirname, "plans");

/* ------------------------------------------------------------------ naming */

const slugify = (s) => String(s)
  .toLowerCase()
  .replace(/[’']/g, "")
  .replace(/\([^)]*\)/g, " ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60);

// The documents name the grammar point in full - "Prepositions of Place (in,
// on, under, next to, behind, in front of, between)" - which is right at the
// top of a CELTA plan and wrong in an <h1> and a search result. This is the
// name a teacher would actually search for.
function shortName(point) {
  const paren = (point.match(/\(([^)]+)\)\s*$/) || [])[1] || "";
  const base = point.replace(/\s*\([^)]*\)\s*$/, "").trim();
  // A trailing parenthesis that names the thing ("(Historic Present)") beats a
  // long description of it. A trailing parenthesis that only lists examples
  // ("(in, on, under ...)") does not, and those are the long ones.
  let s = (paren && paren.length <= 30 && base.length > 45 && !/,/.test(paren)) ? paren.trim() : base;
  if (s.length > 45 && /;/.test(s)) s = s.split(";")[0].trim();
  if (s.length > 45 && /:\s/.test(s)) s = s.split(/:\s/).pop().trim();
  if (s.length > 45 && /\sand\sthe\s/.test(s)) s = s.split(/\sand\sthe\s/)[0].trim();
  // A list of forms, however it is punctuated, is cut from the end until the
  // name fits: "Prepositions in Relative Clauses, Sentence Relatives and
  // Reduced Relative Clauses" becomes the first of the three.
  for (const sep of [", ", " / "]) {
    if (s.length > 45 && s.includes(sep)) {
      const parts = s.split(sep);
      while (parts.length > 1 && parts.join(sep).length > 45) parts.pop();
      s = parts.join(sep);
    }
  }
  return s;
}

const sentence = (s) => {
  const t = String(s).trim();
  if (!t) return "";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : capped + ".";
};

const lower = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);

// Pick the first candidate that fits; fall back to the shortest written.
const fit = (cands, max) => cands.find((c) => c.length <= max) || cands[cands.length - 1];

const fitRange = (cands, min, max) => cands.find((c) => c.length >= min && c.length <= max)
  || cands.find((c) => c.length <= max)
  || cands[cands.length - 1];

/* ----------------------------------------------------------------- parsing */

// A Markdown table becomes { header, body }. A first row of empty cells means
// the table has no header, which some plans use for two-column fact lists.
function parseTable(lines) {
  const rows = lines
    .filter((l) => /^\s*\|/.test(l))
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim().replace(/\\([*_.!])/g, "$1")));
  if (rows.length < 2) return null;
  const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));
  const header = rows[0].map((c) => c.replace(/\*\*/g, ""));
  const headless = header.every((c) => c === "");
  return { headless, header, body: headless ? body : body.slice(1) };
}

function sections(body) {
  const out = [];
  let cur = null;
  for (const line of body.split(/\r?\n/)) {
    const h2 = line.match(/^##\s+(?!#)(.+)$/);
    if (h2) { cur = { heading: h2[1].trim(), lines: [] }; out.push(cur); continue; }
    if (cur) cur.lines.push(line); else { cur = { heading: null, lines: [line] }; out.push(cur); }
  }
  return out;
}

function subsections(lines) {
  const out = [];
  let cur = { heading: null, lines: [] };
  out.push(cur);
  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) { cur = { heading: h3[1].trim(), lines: [] }; out.push(cur); continue; }
    cur.lines.push(line);
  }
  return out.filter((s) => s.heading || s.lines.join("").trim());
}

// Paragraphs and list items in the order they appear. A stage reads as a
// sequence - do this, then this, then say this - so splitting paragraphs from
// steps and concatenating would put the closing transition before step 1.
function orderedProse(lines) {
  const out = [];
  let buf = [];
  const flush = () => { const t = buf.join(" ").trim(); if (t) out.push(t); buf = []; };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^\s*\|/.test(line)) continue;                   // tables handled separately
    if (!line.trim()) { flush(); continue; }
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) { flush(); out.push(item[1].trim()); continue; }
    buf.push(line.trim());
  }
  flush();
  return out;
}

function proseParts(lines) {
  const text = [], bullets = [], tables = [];
  let buf = [], tbuf = [];
  const flushText = () => { const t = buf.join(" ").trim(); if (t) text.push(t); buf = []; };
  const flushTable = () => { if (tbuf.length) { const t = parseTable(tbuf); if (t) tables.push(t); tbuf = []; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^\s*\|/.test(line)) { flushText(); tbuf.push(line); continue; }
    flushTable();
    if (!line.trim()) { flushText(); continue; }
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) { flushText(); bullets.push(item[1].trim()); continue; }
    buf.push(line.trim());
  }
  flushText(); flushTable();
  return { text, bullets, tables };
}

// A heading of null leaves the table unheaded, which is what a table directly
// under its own handout title needs: repeating the title as an h3 under the h2
// reads as a mistake.
const tableBlock = (heading, t, level) => {
  const b = { type: "table", level: level || "h3", columns: t.headless ? t.header.map(() => "") : t.header, rows: t.body };
  if (heading) b.heading = heading;
  return b;
};

/* ------------------------------------------------------- the overview table */

// The lesson-overview table is the plan's own metadata: grammar topic, point,
// level, duration, class profile, aims, learning outcome and materials.
function overview(lines) {
  const t = parseTable(lines);
  const o = {};
  if (!t) return o;
  const rows = t.headless ? t.body : [t.header, ...t.body];
  for (const row of rows) {
    if (row.length < 2) continue;
    const key = row[0].replace(/\*\*/g, "").trim().toLowerCase();
    if (key && row[1]) o[key] = row[1].trim();
  }
  return o;
}

/* --------------------------------------------- the language analysis blocks */

// Concept-checking questions are grouped one bullet per target sentence, so a
// teacher reads the sentence and its checks together.
function ccqBullets(lines) {
  const out = [];
  let cur = null;
  for (const raw of orderedProse(lines)) {
    const intro = /^(Use these|Ask these|For the sentence)/i.test(raw);
    const isTarget = intro || (/^\*[^*]/.test(raw) && !/\?/.test(raw));
    if (isTarget) {
      cur = { target: raw.replace(/^(Use these for|Ask these for|For)\s*/i, "").replace(/^the sentences?\s*/i, "").replace(/[:.]$/, "").trim(), qs: [] };
      out.push(cur);
      continue;
    }
    if (!cur) { cur = { target: "", qs: [] }; out.push(cur); }
    cur.qs.push(raw);
  }
  return out
    .filter((g) => g.qs.length)
    .map((g) => (g.target ? `**${g.target}** ` : "") + g.qs.join(" · "));
}

function analysisBlocks(lines) {
  const blocks = [];
  for (const sub of subsections(lines)) {
    if (!sub.heading) continue;
    if (/concept.check/i.test(sub.heading)) {
      const bullets = ccqBullets(sub.lines);
      if (bullets.length) blocks.push({ type: "prose", heading: "Concept-checking questions", level: "h3", bullets });
      continue;
    }
    const p = proseParts(sub.lines);
    for (const t of p.tables) blocks.push(tableBlock(sub.heading, t));
    if (p.text.length || p.bullets.length) {
      const heading = p.tables.length ? `${sub.heading}: notes` : sub.heading;
      const b = { type: "prose", heading, level: "h3" };
      if (p.text.length) b.text = p.text;
      if (p.bullets.length) b.bullets = p.bullets;
      blocks.push(b);
    }
  }
  return blocks;
}

/* ------------------------------------------------------------ the procedure */

// Stage styles are the five the site colours: warmer, presentation, practice,
// production, close. The narrowest test has to come first - "Test 1" is
// practice, not a warmer, and "Freer practice" is production, not practice.
function stageStyle(name, i, total) {
  const n = name.toLowerCase();
  if (/feedback|wrap|review|close|conclusion/.test(n)) return "close";
  if (/warm.?up|lead.?in|engage|pre.?task/.test(n)) return "warmer";
  if (/test 1/.test(n)) return "practice";
  if (/test 2/.test(n)) return "production";
  if (/diagnos/.test(n)) return "presentation";
  if (/freer|production|activate|report|personalis/.test(n)) return "production";
  if (/controlled|restricted|practice/.test(n)) return "practice";
  if (/present|clarif|discovery|analysis|study|language focus|teach|context/.test(n)) return "presentation";
  if (i === 0) return "warmer";
  if (i === total - 1) return "close";
  return "presentation";
}

// One "### Stage N: Name (M minutes)" block. The aim and the interaction
// pattern sit on one bold line; a long stage may split into Part A and Part B,
// each with its own aim, and those headings stay in the steps so the shape of
// the stage survives.
function parseStage(heading, lines) {
  const m = heading.match(/^Stage\s*\d+\s*:\s*(.+?)\s*(?:\((\d+)\s*minutes?\))?\s*$/i);
  const name = m ? m[1].trim() : heading.trim();
  const time = m && m[2] ? m[2] : null;
  const aims = [], patterns = [], rest = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const a = line.match(/\*\*Stage aim:\*\*\s*(.+?)(?:\s*\*\*Interaction:\*\*\s*(.+))?$/);
    if (a) {
      aims.push(a[1].trim());
      if (a[2]) patterns.push(a[2].trim());
      continue;
    }
    const p = line.match(/^\*\*Interaction:\*\*\s*(.+)$/);
    if (p) { patterns.push(p[1].trim()); continue; }
    rest.push(line);
  }
  return {
    name,
    time,
    aim: aims.map((a) => sentence(a)).join(" ").trim(),
    pattern: (patterns[0] || "Whole class").replace(/\.$/, ""),
    steps: orderedProse(rest)
  };
}

/* ------------------------------------------------------------ the handouts */

// Everything after a horizontal rule is a photocopiable page: a reading text,
// a practice exercise, cards to cut up, or the answer key. They are rendered
// on the plan page so a teacher prints the lesson and its materials in one go.
function handoutBlocks(parts) {
  const blocks = [];
  for (const part of parts) {
    const h1 = (part.match(/^#\s+(.+)$/m) || [])[1];
    if (!h1) continue;
    const rest = part.replace(/^#\s+.+$/m, "");
    const lines = rest.split(/\r?\n/);
    const quoted = lines.filter((l) => /^>/.test(l)).map((l) => l.replace(/^>\s?/, "").trim()).filter(Boolean);
    const p = proseParts(lines.filter((l) => !/^>/.test(l)));
    const head = { type: "prose", heading: h1.trim(), level: "h2" };
    if (p.text.length) head.text = p.text;
    if (p.bullets.length) head.bullets = p.bullets;
    blocks.push(head);
    if (quoted.length) blocks.push({ type: "callout", style: "note", title: "The text", text: quoted });
    for (const t of p.tables) blocks.push(tableBlock(null, t, "h3"));
  }
  return blocks;
}

/* ------------------------------------- what the documents do not yet carry */

// STANDARD.md asks for four adaptations and a 45-minute route. The plans do
// not carry them, so they are composed from the plan's own materials and
// stages: every sentence restates something the plan actually contains. Where
// that is too blunt for a particular lesson, ./extras.js overrides it.
// The names a stage gives its own tasks. A step that opens in bold -
// "**Information gap (10 minutes).**" - is naming an activity, and that name
// is what makes an adaptation specific to this lesson rather than generic.
function taskLabels(stage) {
  return (stage ? stage.steps : [])
    .map((s) => (s.match(/^\*\*([^*]+?)\*\*/) || [])[1] || "")
    .map((s) => s.replace(/\s*\(\s*\d+\s*minutes?\s*\)\s*/i, " ").replace(/\s*[:.]\s*$/, "").trim())
    .filter((s) => s && s.length <= 40 && /[a-z]/.test(s));
}

function adaptationsFor(cefr, handoutNames, stages) {
  const sheetCount = handoutNames.filter((n) => /^handout/i.test(n)).length;
  const sheets = sheetCount > 1 ? `Handouts 1 to ${sheetCount}` : "the handout";
  const freer = stages.find((s) => s.style === "production") || stages[stages.length - 1];
  const controlled = stages.find((s) => s.style === "practice");
  // The pairwork that matters is the production stage's, not the first stage
  // that happens to mention a partner.
  const pairish = (s) => /pair|partner|mingle|group/i.test(s.pattern + " " + s.steps.join(" "));
  const pairStage = (freer && pairish(freer)) ? freer : [...stages].reverse().find(pairish);
  const pairPhrase = pairStage ? `the pairwork in "${pairStage.name}"` : "the pairwork";
  const tasks = taskLabels(freer);
  const named = (n) => n.replace(/^Handout\s*/i, "Handout ").replace(/:\s*/, ": ");
  const practiceSheet = handoutNames.find((n) => /practice/i.test(n));
  const cutUp = handoutNames.find((n) => /card|cut|gap|dictation|grid|domino|game|role/i.test(n));

  return [
    ["A large class (40 or more)",
      `Keep ${pairPhrase} in fixed pairs rather than a mingle, and take feedback from four or five pairs instead of the whole room.`
      + (tasks.length ? ` Run "${tasks[0]}" once, with two pairs reporting, rather than hearing every pair.` : "")
      + ` Monitor one half of the room during ${controlled ? `"${controlled.name}"` : "the practice stage"} and the other half during "${freer.name}".`],

    ["A class with no photocopier",
      `Put ${practiceSheet ? `the exercises from ${named(practiceSheet)}` : "the practice exercise"} on the board for learners to copy into their notebooks, and read any text aloud twice instead of printing it.`
      + (cutUp ? ` ${named(cutUp)} works read out from the front: learners note what they need rather than holding a card.` : "")
      + ` The board plan above is this lesson's minimum - with that on the board, it runs on no paper at all.`],

    ["An online class",
      `Send ${sheets} in the chat before the lesson and put the board plan on a shared slide.`
      + (tasks.length ? ` Use breakout rooms for "${tasks[0]}" and visit each room once.` : ` Use breakout rooms for ${pairPhrase} and visit each room once.`)
      + ` Have learners type the controlled answers in the chat, so you see every answer at once instead of nominating.`],

    ["A different age group",
      cefr === "A1" || cefr === "A2"
        ? `With young learners, cut the writing at the end and give that time to the speaking task; keep the drilling short, and let them draw or mime where the plan allows it. With adults, keep the writing and ask for a short spoken summary in place of anything drawn or mimed.`
        : cefr === "C1"
          ? `With teenagers at this level, cut the academic framing and keep the examples in their own world; the forms do not change. With adults in a work context, swap the lesson's texts for ones from their own field and keep the analysis as it stands.`
          : `With teenagers, shorten the analysis and get to the task sooner. With adults in a work context, keep the forms exactly as they are and swap the lesson's theme for one from their own field.`]
  ];
}

function shortRouteFor(stages) {
  const freer = stages.find((s) => s.style === "production");
  const close = stages.find((s) => s.style === "close");
  if (!freer) return "For 45 minutes, set the last stage as homework.";
  const tasks = taskLabels(freer);
  const cut = tasks.length > 1
    ? `run only "${tasks[0]}" of the two tasks in "${freer.name}"`
    : `run "${freer.name}" once through without the second round`;
  return `For 45 minutes, ${cut} and cut ${close ? `"${close.name}"` : "the feedback"} to board-based error correction.`;
}

// The meta description, built to land inside Google's 140-160 characters.
//
// The grammar point is used by its own name, with no article in front of it.
// "The present simple" reads better than "Present Simple" on its own, but no
// single rule covers sixty topics: an article is wrong in front of a plural
// ("the comparative adjectives"), wrong in front of a quoted form ("the can
// and can't for ability"), and wrong twice over for a topic that already
// carries one ("the the zero article"). The name alone is right every time.
function describe(cefr, topic, minutes) {
  const heads = [
    `Free ${minutes}-minute ${cefr} ESL lesson plan on ${topic}.`,
    `Free ${cefr} ESL lesson plan on ${topic}.`,
    `${cefr} ESL lesson plan: ${topic}.`
  ];
  let best = heads[heads.length - 1];
  for (const head of heads) {
    if (head.length > 160) continue;
    best = padTo(head, PLAN_TAILS, 140, 160);
    if (best.length >= 140) return best;
  }
  return best;
}

// The skills a plan practises, read from its own subsidiary aims.
function skillsFrom(text) {
  const t = String(text).toLowerCase();
  const found = ["speaking", "listening", "reading", "writing"].filter((s) => t.includes(s));
  if (!found.length) return "Speaking and writing";
  const caps = found.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return caps.length === 1 ? caps[0] : `${caps.slice(0, -1).join(", ")} and ${lower(caps[caps.length - 1])}`;
}

// The framework is not named in the documents, so it is read from the stages.
function frameworkFrom(stages) {
  const names = stages.map((s) => s.name.toLowerCase()).join(" | ");
  if (/test 1/.test(names) && /test 2/.test(names)) return { full: "Test-teach-test", short: "Test-teach-test" };
  if (/task/.test(names) && /report/.test(names)) return { full: "A task cycle (Willis)", short: "Task cycle" };
  if (/discovery/.test(names)) return { full: "Guided discovery", short: "Guided discovery" };
  return { full: "PPP (presentation, practice, production)", short: "PPP" };
}

/* --------------------------------------------------------------- one plan */

function buildLesson(file) {
  const raw = fs.readFileSync(path.join(SRC, file), "utf8").replace(/^﻿/, "");
  const key = file.replace(/\.md$/, "");
  const X = EXTRAS[key] || {};

  // The handouts come after the horizontal rules that follow the plan.
  const parts = raw.split(/\r?\n-{3,}[ \t]*(?:\r?\n|$)/);
  const body = parts[0];
  const handouts = parts.slice(1).filter((p) => /^#\s+/m.test(p));

  const header = (body.match(/^GRAMMAR TOPIC:\s*(.+)$/mi) || [])[1] || "";
  const point = (body.match(/^#\s+(.+)$/m) || [])[1] || "";
  const theme = (body.match(/^\*Lesson theme:\s*(.+?)\*\s*$/mi) || [])[1] || "";

  const secs = sections(body);
  const find = (re) => secs.find((s) => s.heading && re.test(s.heading));
  const O = overview((find(/lesson overview/i) || { lines: [] }).lines);

  // The overview table names the topic in sentence case ("Comparatives and
  // Superlatives"); the header line shouts it. Title-casing is only for the
  // fallback, because it would capitalise the "and".
  const unitName = O["grammar topic"]
    ? O["grammar topic"].trim()
    : header.split("·")[0].trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const topic = X.topic || shortName(O["grammar point"] || point);
  const levelRaw = O.level || (header.match(/\b[ABC][12]\b.*$/) || [])[0] || "A1";
  const cefr = (levelRaw.match(/\b([ABC][12])\b/) || [])[1] || "A1";
  const minutes = parseInt((String(O.duration || "60").match(/\d+/) || [60])[0], 10);

  // The procedure. "Stage 6: Homework" carries no time and no stage aim: it is
  // the homework, which the plan block renders under the stages, not a stage.
  const procSub = subsections((find(/^procedure/i) || { lines: [] }).lines);
  const allStages = procSub
    .filter((s) => s.heading && /^stage/i.test(s.heading))
    .map((s) => parseStage(s.heading, s.lines));
  const homeworkStage = allStages.find((s) => /homework/i.test(s.name) || !s.time);
  const stages = allStages
    .filter((s) => s !== homeworkStage)
    .map((s, i, a) => ({ ...s, time: `${s.time} minutes`, style: stageStyle(s.name, i, a.length) }));

  const homework = homeworkStage
    ? homeworkStage.steps.filter((t) => !/^\*\*Set at the end/i.test(t)).join(" ")
    : "";

  // The language analysis, the anticipated problems and the board plan read as
  // one run of "what to know before you teach this".
  const ab = analysisBlocks((find(/language analysis/i) || { lines: [] }).lines);
  const problems = find(/anticipated problems/i);
  if (problems) { const t = parseTable(problems.lines); if (t) ab.push(tableBlock("Anticipated problems and solutions", t)); }
  const board = find(/board plan/i);
  if (board) { const t = parseTable(board.lines); if (t) ab.push(tableBlock("Board plan", t)); }

  // Differentiation: the documents label support and stretch in bold.
  const diffParts = { support: [], stretch: [] };
  let bucket = null;
  for (const line of (find(/differentiation/i) || { lines: [] }).lines) {
    if (/^\*\*Support/i.test(line.trim())) { bucket = "support"; continue; }
    if (/^\*\*Stretch/i.test(line.trim())) { bucket = "stretch"; continue; }
    if (bucket) diffParts[bucket].push(line);
  }
  const joinBullets = (lines) => orderedProse(lines).join(" ");

  const check = orderedProse((find(/assessment/i) || { lines: [] }).lines).join(" ");
  const reflection = orderedProse((find(/reflection/i) || { lines: [] }).lines).join(" ");

  const handoutNames = handouts.map((p) => (p.match(/^#\s+(.+)$/m) || [])[1].trim());
  // The answer key is one of the printable pages, but it is not handed out, so
  // it is not counted when the preparation note says how many to print.
  const sheetCount = handoutNames.filter((n) => /^handout/i.test(n)).length;
  const fw = frameworkFrom(stages);
  const low = topic.toLowerCase();

  // The link to the editable original, but only once the documents are shared
  // for viewing. See the note at the top of ./drive.js.
  const docId = DRIVE.docs[key];
  const driveUrl = DRIVE.shared && docId ? `https://docs.google.com/document/d/${docId}/edit?usp=sharing` : null;

  return {
    slug: `${slugify(unitName)}/${cefr.toLowerCase()}-${slugify(topic)}`,
    driveUrl,
    unit: unitName,
    unitSlug: slugify(unitName),
    topic,
    cefr,
    cefrNote: `CEFR ${levelRaw}`,
    minutes,
    learners: X.learners || "Teenagers and adults",
    skills: X.skills || skillsFrom(O["subsidiary aims"] || ""),
    focus: X.focus || `Grammar: ${O["grammar point"] || point}`,
    materials: O.materials || handoutNames.join(", "),
    prep: X.prep || (sheetCount
      ? `About 10 minutes: print ${sheetCount > 1 ? `Handouts 1 to ${sheetCount}` : "the handout"}, one per learner, and read the language analysis. The answer key is for you, not the class.`
      : "About 10 minutes: read the language analysis and copy out the board plan."),
    framework: fw.full,
    fwShort: fw.short,
    teaches: `${topic} (English grammar)`,
    teachPhrase: `teaching ${topic}`,
    shortRoute: X.shortRoute || shortRouteFor(stages),
    intro: [
      `A complete ${minutes}-minute ${cefr} lesson on ${topic}${theme ? `, built round the theme "${theme}"` : ""}.`,
      O["class profile"] ? `**Who it is for.** ${O["class profile"]}` : "",
      "Everything the lesson needs is on this page: the language analysis, the timed stages with the teacher's own words and instruction-checking questions, the differentiation, the printable handouts and the answer key."
    ].filter(Boolean),
    aims: {
      main: sentence(O["main aim"] || ""),
      subsidiary: String(O["subsidiary aims"] || "").split(";").map((s) => sentence(s)).filter(Boolean),
      outcome: sentence(O["learning outcome"] || "")
    },
    analysisBlocks: ab,
    stages,
    homework,
    support: joinBullets(diffParts.support),
    stretch: joinBullets(diffParts.stretch),
    adaptations: X.adaptations || adaptationsFor(cefr, handoutNames, stages),
    check,
    reflection,
    handoutBlocks: handoutBlocks(handouts),
    metaTitle: X.metaTitle || fit([
      `${topic} Lesson Plan ${cefr} (${fw.short}) - Free ESL`,
      `Free ${topic} ESL Lesson Plan (${cefr}, ${minutes} Min)`,
      `${topic} ESL Lesson Plan (${cefr}, ${minutes} Minutes)`,
      `${topic} ESL Lesson Plan (${cefr})`,
      `${topic} Lesson Plan ${cefr}`,
      `${topic} Lesson Plan`
    ], 60),
    description: X.description || describe(cefr, topic, minutes)
  };
}

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith(".md")).sort() : [];
module.exports = files.map((f) => ({ lesson: buildLesson(f) }));
