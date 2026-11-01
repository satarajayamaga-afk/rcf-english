// The CEFR grammar lesson plans, read from the Markdown in ./plans.
//
// These plans arrive as documents in one rigid CELTA-style format - front
// matter, lesson overview, language analysis, anticipated problems, board
// plan, staged procedure, differentiation, handouts, answer key - so they are
// parsed rather than retyped as JavaScript. Ten exist now and ninety more are
// planned, which is why the parser is the piece of work and not the pages.
//
// What the documents do not carry, STANDARD.md still requires: the learner
// group, the skills, the preparation time and the four adaptations. Those live
// in ./extras.js, one entry per plan.
//
// Each plan becomes a { lesson } module of the shape tools/esl/gen.js expects.
const fs = require("fs");
const path = require("path");
const EXTRAS = require("./extras");

const SRC = path.join(__dirname, "plans");

/* ------------------------------------------------------------------ naming */

const slugify = (s) => String(s)
  .toLowerCase()
  .replace(/[’']/g, "")
  .replace(/\([^)]*\)/g, " ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60);

// The plans' own topic names run to 95 characters, which is fine inside the
// page but not in an <h1> or a <title>. This finds the name a teacher would
// search for. Truncating instead cuts mid-word ("Guided Disco").
function shortName(point) {
  const paren = (point.match(/\(([^)]+)\)\s*$/) || [])[1] || "";
  const base = point.replace(/\s*\([^)]*\)\s*$/, "").trim();
  // A short gloss in brackets is usually the common name: "(Historic Present)".
  let s = (paren && paren.length <= 20 && base.length > 40) ? paren.trim() : base;
  if (s.length > 45 && s.includes(";")) s = s.split(";")[0].trim();
  if (s.length > 45 && /:\s/.test(s)) s = s.split(/:\s/).pop().trim();
  return s;
}

// A clause lifted out of a longer sentence, given its capital and stop back.
const sentence = (s) => {
  const t = String(s).trim();
  if (!t) return "";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : capped + ".";
};

// First candidate that fits, rather than a hard slice through a word.
const fit = (cands, max) => cands.find((c) => c.length <= max) || cands[cands.length - 1];

// A description has a floor as well as a ceiling (STANDARD.md: 140 to 160),
// so a candidate can fail for being too short. Candidates run longest first;
// the first one inside the window wins.
const fitRange = (cands, min, max) => cands.find((c) => c.length >= min && c.length <= max)
  || cands.find((c) => c.length <= max)
  || cands[cands.length - 1];

/* ----------------------------------------------------------------- parsing */

function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return fm;
}

// A Markdown table becomes { header, body }. A first row of empty cells means
// the table has no header, which the plans use for two-column fact lists.
function parseTable(lines) {
  const rows = lines
    .filter((l) => /^\s*\|/.test(l))
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  if (rows.length < 2) return null;
  const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));
  const header = rows[0];
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

/* ----------------------------------------------- the language analysis blocks */

// The five frameworks analyse the language under quite different headings, so
// the subsections are passed through in the plan's own order instead of being
// forced into one fixed set. Concept-checking questions are the exception:
// they are grouped one bullet per target sentence so a teacher can read the
// sentence and its checks together.
function ccqBullets(lines) {
  const out = [];
  let cur = null;
  for (const raw of orderedProse(lines)) {
    const isTarget = /^For\b/.test(raw) || (/^\*.*\*$/.test(raw) && !/\?/.test(raw));
    if (isTarget) {
      cur = { target: raw.replace(/^For\s+/, "").trim(), qs: [] };
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

/* ------------------------------------------------------------ the handouts */

// Everything after a ===PAGE=== marker is a photocopiable page: a reading
// text, a practice exercise, cards to cut up, or the answer key. They are
// rendered on the plan page so a teacher can print the lesson and its
// materials in one go.
function handoutBlocks(parts) {
  const blocks = [];
  for (const part of parts) {
    const h1 = (part.match(/^#\s+(.+)$/m) || [])[1];
    if (!h1) continue;
    const rest = part.replace(/^#\s+.+$/m, "");
    const lines = rest.split(/\r?\n/);
    const quoted = lines.filter((l) => /^>/.test(l)).map((l) => l.replace(/^>\s?/, "").trim()).filter(Boolean);
    const p = proseParts(lines.filter((l) => !/^>/.test(l)));
    const head = { type: "prose", heading: h1, level: "h2" };
    if (p.text.length) head.text = p.text;
    if (p.bullets.length) head.bullets = p.bullets;
    blocks.push(head);
    if (quoted.length) blocks.push({ type: "callout", style: "note", title: "The text", text: quoted });
    for (const t of p.tables) blocks.push(tableBlock(null, t, "h3"));
  }
  return blocks;
}

/* --------------------------------------------------------------- one plan */

function buildLesson(file) {
  const key = file.replace(/\.md$/, "");
  const extra = EXTRAS[key];
  if (!extra) throw new Error(`tools/esl/grammar: ${file} has no entry in extras.js (the learner group, skills, preparation time and adaptations the standard requires)`);

  const raw = fs.readFileSync(path.join(SRC, file), "utf8");
  const fm = frontMatter(raw);
  const afterFm = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const [bodyPart, ...handoutParts] = afterFm.split(/^===PAGE===$/m);

  const secs = sections(bodyPart);
  const get = (re) => secs.find((s) => s.heading && re.test(s.heading));

  const cefr = (fm.level || "").replace(/\s*\(.*\)/, "").trim();
  const cefrNote = fm.level || cefr;
  const framework = fm.framework || "";
  const fwShort = framework.split(/[:(]/)[0].trim();
  const minutes = parseInt(fm.time, 10) || 60;
  const unit = fm.unit || "";
  const point = fm.topic || fm.title || "";
  const topic = extra.topic || shortName(point);

  /* the overview table */
  let profile = "", mainAim = "", subAims = "", outcome = "", materials = "";
  const overview = get(/^Lesson overview$/i);
  if (overview) {
    const t = parseTable(overview.lines);
    if (t) for (const r of t.body) {
      const k = (r[0] || "").replace(/\*/g, "").toLowerCase();
      const v = r[1] || "";
      if (k.includes("class profile")) profile = v;
      else if (k.includes("main aim")) mainAim = v;
      else if (k.includes("subsidiary")) subAims = v;
      else if (k.includes("learning outcome")) outcome = v;
      else if (k.includes("materials")) materials = v;
    }
  }

  /* the procedure */
  const proc = get(/^Procedure$/i);
  const subs = proc ? subsections(proc.lines).filter((s) => s.heading) : [];
  const stages = subs.map((s, i) => {
    const m = s.heading.match(/^Stage\s*\d+\s*:\s*(.+?)\s*\((\d+)\s*minutes?\)\s*$/i)
           || s.heading.match(/^(.+?)\s*\((\d+)\s*minutes?\)\s*$/i);
    const name = m ? m[1].trim() : s.heading.replace(/^Stage\s*\d+\s*:\s*/i, "").trim();
    let aim = "", pattern = "";
    const kept = [];
    for (const l of s.lines) {
      const a = l.match(/^\*\*Stage aim:\*\*\s*(.+)$/);
      const it = l.match(/^\*\*Interaction:\*\*\s*(.+)$/);
      if (a) { aim = a[1].trim(); continue; }
      if (it) { pattern = it[1].trim(); continue; }
      kept.push(l);
    }
    return {
      style: stageStyle(name, i, subs.length),
      name,
      time: `${m ? m[2] : 0} min`,
      pattern,
      aim,
      steps: orderedProse(kept)
    };
  });

  /* differentiation */
  let support = "", stretch = "";
  const diff = get(/^Differentiation$/i);
  if (diff) {
    let label = null, buf = [];
    const flush = () => {
      if (!label) return;
      const joined = buf.join(" ");
      if (/support/i.test(label)) support = joined;
      else if (/stretch/i.test(label)) stretch = joined;
      buf = [];
    };
    for (const l of diff.lines) {
      const h = l.match(/^\*\*(.+?)\*\*\s*$/);
      if (h) { flush(); label = h[1].trim(); continue; }
      const b = l.match(/^\s*[-*]\s+(.*)$/);
      if (b) buf.push(b[1].trim());
    }
    flush();
  }

  const joinSection = (re) => {
    const s = get(re);
    if (!s) return "";
    const p = proseParts(s.lines);
    return [...p.text, ...p.bullets].join(" ");
  };

  const la = get(/^Language analysis$/i);
  const aBlocks = la ? analysisBlocks(la.lines) : [];
  for (const [re, head] of [[/^Anticipated problems/i, "Anticipated problems and solutions"], [/^Board plan$/i, "Board plan"]]) {
    const s = get(re);
    if (!s) continue;
    const p = proseParts(s.lines);
    for (const t of p.tables) aBlocks.push(tableBlock(head, t));
  }

  const unitSlug = slugify(unit);
  const slug = `${unitSlug}/${cefr.toLowerCase()}-${slugify(topic)}`;
  const low = topic.toLowerCase();

  return {
    slug,
    unit,
    unitSlug,
    topic,
    fullTopic: point,
    cefr,
    cefrNote,
    learners: extra.learners,
    minutes,
    skills: extra.skills,
    focus: extra.focus,
    shortRoute: extra.shortRoute,
    materials: materials || "The handouts below, and a board.",
    prep: extra.prep,
    framework,
    fwShort,
    // The boomerang and a task cycle put a free attempt before any study, by
    // design. The ordering check in gen.js is written for PPP.
    freerFirst: /boomerang|task-based|TBL/i.test(framework) || undefined,
    metaTitle: fit([
      `Free ${topic} ESL Lesson Plan (${cefr}, ${minutes} Min)`,
      `${topic} Lesson Plan ${cefr} (${fwShort}) - Free ESL`,
      `${topic} ESL Lesson Plan (${cefr}, ${minutes} Minutes)`,
      `${topic} ESL Lesson Plan (${cefr})`,
      `${topic} Lesson Plan ${cefr}`,
      `${topic} Lesson Plan`
    ], 60),
    // 140 to 160 characters, and never a sentence cut in the middle. The
    // topics run from 11 to 48 characters, so the tail shortens to match.
    description: fitRange([
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}: aims, language analysis, timed stages with interaction patterns, printable handouts and an answer key.`,
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}: aims, language analysis, timed stages with interaction patterns, handouts and an answer key.`,
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}: aims, language analysis, timed stages, printable handouts and a full answer key.`,
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}: aims, language analysis, timed stages, printable handouts and an answer key.`,
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}: aims, language analysis, timed stages and printable handouts.`,
      `Free ${minutes}-minute ${cefr} ESL lesson plan on the ${low}, with printable handouts and a full answer key.`
    ], 140, 160),
    keywords: `${low} lesson plan, ${low} ESL lesson, teaching the ${low}, ${cefr} ESL lesson plan, ${fwShort} lesson plan, free ESL lesson plans`,
    teaches: `${point} (English grammar)`,
    intro: [
      `A complete ${minutes}-minute lesson on the ${low} for ${cefr} classes, built on the ${fwShort} framework, with photocopiable handouts and an answer key.`,
      profile,
      `Everything the lesson needs is on this page: the language analysis to read before you teach, a stage-by-stage procedure with timings and interaction patterns, and the handouts and answer key at the end, ready to print.`
    ].filter(Boolean),
    aims: {
      main: mainAim,
      // The plans write the subsidiary aims as one semicolon-separated
      // sentence, so each half needs its capital and full stop back.
      subsidiary: subAims.split(/;\s*/).map(sentence).filter(Boolean),
      outcome: outcome || undefined
    },
    analysisBlocks: aBlocks,
    stages,
    support,
    stretch,
    adaptations: extra.adaptations,
    check: joinSection(/^Assessment/i),
    homework: joinSection(/^Homework$/i),
    handoutBlocks: handoutBlocks(handoutParts),
    reflection: joinSection(/^Teacher.s reflection/i)
  };
}

// Which coloured panel a stage gets. Order matters more than the patterns do:
// "Freer practice" and "Study, controlled practice" both contain "practice"
// but belong in different panels, and "Discovery task" must not be read as the
// task cycle's "Task" stage, so the narrower tests run first.
function stageStyle(name, i, total) {
  const n = name.toLowerCase();
  if (/feedback|wrap|review|close/.test(n)) return "close";
  if (/lead-in|warmer|engage|pre-task/.test(n)) return "warmer";
  if (/test 1/.test(n)) return "practice";
  if (/test 2/.test(n)) return "production";
  if (/diagnos/.test(n)) return "presentation";
  if (/discovery|clarif|analysis/.test(n)) return "presentation";
  if (/freer|production|activate|report|planning|task$/.test(n)) return "production";
  if (/controlled|practice/.test(n)) return "practice";
  if (/present|study|language focus|teach|context/.test(n)) return "presentation";
  if (i === 0) return "warmer";
  if (i === total - 1) return "close";
  return "presentation";
}

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith(".md")).sort() : [];
module.exports = files.map((f) => ({ lesson: buildLesson(f) }));
