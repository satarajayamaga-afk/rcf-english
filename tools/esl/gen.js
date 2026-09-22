// Builds the international ESL section under global-english/esl/ from the
// lesson files in tools/esl/lessons/. Every page follows STANDARD.md.
// Usage: node tools/esl/gen.js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const BASE = "global-english/esl";
const LESSONS = fs.readdirSync(path.join(__dirname, "lessons"))
  .filter((f) => f.endsWith(".js"))
  .map((f) => require(path.join(__dirname, "lessons", f)));
const REVIEWED = "22 September 2026";

const GE = { label: "Global English", url: "global-english/" };
const ESL = { label: "ESL Teaching Resources", url: BASE + "/" };
const LP = { label: "Lesson plans", url: BASE + "/lesson-plans/" };
const WS = { label: "Worksheets", url: BASE + "/worksheets/" };
const AD = { type: "adslot", placement: "between" };
const iso = (min) => `PT${min}M`;

// The last line of every page: who wrote it and when it was last checked.
const byline = (what) => ({
  type: "callout", style: "note", title: "About this " + what,
  text: [`Written by RCF English to the [RCF English international standard](${BASE}/our-standards/): levelled by the CEFR, original throughout, and suitable for classrooms in any country. Last reviewed ${REVIEWED}.`]
});

// Checked before anything is written - a page is only built if it has every
// part the standard requires.
function checkLesson(L) {
  const need = ["slug", "topic", "cefr", "learners", "minutes", "skills", "focus", "materials", "prep", "framework", "intro", "aims", "analysis", "stages", "support", "stretch", "adaptations", "check", "homework"];
  need.forEach((k) => { if (!L[k]) throw new Error(`${L.slug}: lesson is missing "${k}" (STANDARD.md, section 2)`); });
  const minutes = L.stages.reduce((a, s) => a + parseInt(s.time, 10), 0);
  if (minutes !== L.minutes) throw new Error(`${L.slug}: the stages add up to ${minutes} minutes, not ${L.minutes}`);
  L.stages.forEach((s) => { if (!s.aim || !s.pattern) throw new Error(`${L.slug}: stage "${s.name}" needs an aim and an interaction pattern`); });
  const firstFree = L.stages.findIndex((s) => s.style === "production");
  const lastControlled = L.stages.map((s) => s.style).lastIndexOf("practice");
  if (firstFree !== -1 && lastControlled > firstFree) throw new Error(`${L.slug}: controlled practice must come before freer practice`);
}
function checkWorksheet(W) {
  ["slug", "topic", "cefr", "minutes", "intro", "tasks", "answers", "notes"].forEach((k) => { if (!W[k]) throw new Error(`${W.slug}: worksheet is missing "${k}" (STANDARD.md, section 3)`); });
  if (W.tasks.length < 3 || W.tasks.length > 5) throw new Error(`${W.slug}: a worksheet has three to five tasks`);
}

// ------------------------------------------------------------ lesson plan
function lessonPage(mod) {
  const L = mod.lesson;
  checkLesson(L);
  const A = L.analysis;
  const title = `${L.topic} ESL Lesson Plan (${L.cefr}, ${L.minutes} Minutes)`;
  return {
    slug: `${BASE}/lesson-plans/${L.slug}`,
    title,
    metaTitle: `${L.topic} ESL Lesson Plan: ${L.cefr}, ${L.minutes} Minutes, Free with Worksheet | RCF English`,
    description: `A free ${L.minutes}-minute ${L.topic.toLowerCase()} lesson plan for ${L.cefr} ESL learners: aims, language analysis, a staged procedure with timings, adaptations for large and online classes, and a printable worksheet with answers.`,
    keywords: `${L.topic.toLowerCase()} lesson plan, ${L.topic.toLowerCase()} ESL lesson, teaching the ${L.topic.toLowerCase()}, ${L.cefr} ESL lesson plan, free ESL lesson plans, EFL lesson plan`,
    kicker: `ESL Lesson Plan · CEFR ${L.cefr}`,
    kind: "teacher-resource",
    schema: "LearningResource",
    educationalLevel: `CEFR ${L.cefr}`,
    cefr: L.cefr,
    timeRequired: iso(L.minutes),
    teaches: `The ${L.topic.toLowerCase()} (English grammar)`,
    audienceRole: "teacher",
    resourceType: "Lesson plan",
    tags: [`CEFR ${L.cefr}`, `${L.minutes} minutes`, L.learners, "Grammar", L.topic],
    breadcrumbs: [GE, ESL, LP],
    backTo: LP,
    hero: { text: L.intro[0] },
    blocks: [
      { type: "prose", heading: "About this lesson", level: "h2", text: L.intro.slice(1) },
      {
        type: "terms", heading: "At a glance", level: "h2",
        items: [
          ["Level", L.cefrNote || `CEFR ${L.cefr}`], ["Learners", L.learners],
          ["Length", `${L.minutes} minutes. ${L.shortRoute || ""}`.trim()], ["Skills", L.skills],
          ["Language focus", L.focus], ["Framework", L.framework],
          ["Materials", L.materials], ["Preparation", L.prep]
        ].map(([term, definition]) => ({ term, definition }))
      },
      {
        type: "prose", heading: "Aims", level: "h2",
        text: [`**Main aim.** ${L.aims.main}`],
        bullets: L.aims.subsidiary.map((s) => `**Subsidiary aim.** ${s}`)
      },
      AD,
      {
        type: "callout", style: "tip", title: `The text: "${L.text.title}"`,
        text: [L.text.body, `**Gist question:** ${L.text.gist}`, `**Detail questions:** ${L.text.detail.map((q, i) => `(${i + 1}) ${q}`).join(" ")}`]
      },
      { type: "prose", heading: "Language analysis", level: "h2", text: ["What to know before the lesson: the meaning, form and pronunciation of the target language, and the problems learners usually have with it."] },
      { type: "prose", heading: "Meaning", level: "h3", text: A.meaning },
      { type: "table", heading: "Concept-checking questions", level: "h3", columns: ["Ask", "Answer"], rows: A.ccqs },
      { type: "table", heading: "Form", level: "h3", columns: ["Sentence type", "Pattern", "Example"], rows: A.form },
      { type: "prose", heading: "Spelling", level: "h3", text: [A.spelling] },
      { type: "prose", heading: "Pronunciation", level: "h3", bullets: A.pronunciation },
      { type: "table", heading: "Anticipated problems and solutions", level: "h3", columns: ["Problem", "Solution"], rows: A.problems },
      {
        type: "plan", level: "h2",
        eyebrow: `CEFR ${L.cefr} · ${L.minutes} minutes · ${L.learners}`,
        heading: `Procedure: ${L.topic}, step by step`,
        stages: L.stages.map((s) => ({
          style: s.style, name: s.name, time: `${s.time} · ${s.pattern}`,
          text: [`**Aim:** ${s.aim}`, ...s.steps]
        })),
        homework: L.homework,
        caption: `${L.framework}. Stage times add up to ${L.minutes} minutes.`
      },
      { type: "terms", heading: "Differentiation", level: "h2", items: [{ term: "Support", definition: L.support }, { term: "Stretch", definition: L.stretch }] },
      { type: "table", heading: "Adapting the lesson", level: "h2", columns: ["For", "What to change"], rows: L.adaptations },
      { type: "prose", heading: "Checking learning", level: "h2", text: [L.check] },
      {
        type: "related", heading: "The worksheet for this lesson", level: "h2",
        items: [{ title: `${L.topic} Worksheet (${L.cefr})`, url: `${BASE}/worksheets/${L.worksheetSlug}/`, text: ["Five graded tasks with an answer key and teacher's notes. Printable."] }]
      },
      AD,
      byline("lesson plan"),
      { type: "share", heading: "Share this lesson plan", level: "h2", text: `Free ${L.topic.toLowerCase()} ESL lesson plan (${L.cefr}, ${L.minutes} minutes) with a worksheet.`, hashtags: ["ESL", "EFL", "TEFL", "ESLTeachers", "EnglishTeachers"] },
      { type: "related", heading: "More", level: "h2", items: [{ title: "All ESL lesson plans", url: LP.url, text: ["Every plan, by level."] }, { title: "ESL worksheets", url: WS.url, text: ["Printable worksheets with answer keys."] }] }
    ]
  };
}

// --------------------------------------------------------------- worksheet
function worksheetPage(mod) {
  const W = mod.worksheet;
  checkWorksheet(W);
  const L = mod.lesson;
  const taskBlocks = W.tasks.map((t) => {
    const [first, ...rest] = t.items;
    const hasExample = /^\*\*0\*\*/.test(first);
    const items = hasExample ? rest : t.items;
    return {
      type: "prose", heading: t.title, level: "h2",
      text: [t.instruction, ...(hasExample ? [`Example: ${first.replace(/^\*\*0\*\*\s*/, "")}`] : [])],
      ...(t.answerLines === false ? { bullets: items } : { numbered: items })
    };
  });
  return {
    slug: `${BASE}/worksheets/${W.slug}`,
    title: `${W.topic} Worksheet (${W.cefr})`,
    metaTitle: `${W.topic} Worksheet for ESL Learners (${W.cefr}), Free and Printable, with Answers | RCF English`,
    description: `A free printable ${W.topic.toLowerCase()} worksheet for ${W.cefr} ESL learners: five graded tasks from verb forms to writing about their own day, with a full answer key and teacher's notes.`,
    keywords: `${W.topic.toLowerCase()} worksheet, ${W.topic.toLowerCase()} exercises, ${W.topic.toLowerCase()} worksheet with answers, printable ESL worksheet ${W.cefr}, ESL grammar worksheet`,
    kicker: `ESL Worksheet · CEFR ${W.cefr}`,
    kind: "teacher-resource",
    schema: "LearningResource",
    educationalLevel: `CEFR ${W.cefr}`,
    cefr: W.cefr,
    timeRequired: iso(W.minutes),
    teaches: `The ${W.topic.toLowerCase()} (English grammar)`,
    audienceRole: "teacher",
    resourceType: "Worksheet",
    tags: [`CEFR ${W.cefr}`, `About ${W.minutes} minutes`, "Printable", "Answer key", W.topic],
    breadcrumbs: [GE, ESL, WS],
    backTo: WS,
    hero: { text: W.intro[0] },
    blocks: [
      { type: "prose", heading: "About this worksheet", level: "h2", text: W.intro.slice(1) },
      { type: "print", label: "Print this worksheet", note: "Prints without the site's menus or advertisements." },
      { type: "callout", style: "note", title: `${W.topic} · Level ${W.cefr} · About ${W.minutes} minutes`, text: ["Name: ______________________________    Date: ______________"] },
      ...taskBlocks,
      AD,
      { type: "table", heading: "For the teacher: answer key", level: "h2", columns: ["Task", "Answers"], rows: W.answers },
      { type: "prose", heading: "Teacher's notes", level: "h2", bullets: W.notes },
      ...(L ? [{ type: "related", heading: "The lesson plan for this worksheet", level: "h2", items: [{ title: `${L.topic} ESL Lesson Plan (${L.cefr}, ${L.minutes} Minutes)`, url: `${BASE}/lesson-plans/${L.slug}/`, text: ["The full lesson this worksheet belongs to."] }] }] : []),
      byline("worksheet"),
      { type: "share", heading: "Share this worksheet", level: "h2", text: `Free printable ${W.topic.toLowerCase()} worksheet (${W.cefr}) with answers.`, hashtags: ["ESL", "EFL", "ESLWorksheets", "EnglishTeachers"] }
    ]
  };
}

// -------------------------------------------------------------------- hubs
const plans = LESSONS.filter((m) => m.lesson);
const sheets = LESSONS.filter((m) => m.worksheet);

const hub = {
  slug: BASE,
  title: "ESL Teaching Resources",
  metaTitle: "Free ESL Lesson Plans and Worksheets, Levelled by the CEFR | RCF English",
  description: "Free ESL lesson plans and printable worksheets for teachers of English in any country: levelled A1 to C2 by the CEFR, written to one published standard, with answer keys and adaptations for large and online classes.",
  keywords: "free ESL lesson plans, ESL worksheets, EFL teaching resources, English teaching resources, CEFR lesson plans, printable ESL worksheets",
  kicker: "Global English",
  kind: "teacher-resource",
  tags: ["ESL", "EFL", "CEFR A1 to C2", "Lesson plans", "Worksheets"],
  breadcrumbs: [GE],
  backTo: GE,
  hero: { text: "Free lesson plans and worksheets for teachers of English everywhere, levelled by the CEFR and written to one published standard." },
  blocks: [
    {
      type: "prose", heading: "What you will find here", level: "h2",
      text: [
        "Complete lessons you can teach tomorrow: aims, a language analysis, a staged procedure with timings and interaction patterns, and notes for large classes, classes with no photocopier and online lessons. Every lesson has a printable worksheet with an answer key.",
        "Every plan and worksheet is written by RCF English, levelled by the Common European Framework of Reference (CEFR), and checked against [our published standard](" + BASE + "/our-standards/) before it goes up. New material is added in small, finished batches."
      ]
    },
    {
      type: "cards", heading: "Start here", level: "h2", columns: "3",
      items: [
        { title: "ESL lesson plans", url: LP.url, more: `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`, text: ["Complete, timed lessons, by CEFR level."] },
        { title: "ESL worksheets", url: WS.url, more: `${sheets.length} ${sheets.length === 1 ? "worksheet" : "worksheets"}`, text: ["Printable, graded tasks with answer keys."] },
        { title: "Our standard", url: BASE + "/our-standards/", more: "Read it", text: ["What every plan and worksheet on this site must have."] }
      ]
    },
    AD,
    { type: "share", heading: "Share", level: "h2", text: "Free ESL lesson plans and worksheets, levelled by the CEFR.", hashtags: ["ESL", "EFL", "TEFL", "EnglishTeachers"] }
  ]
};

const planHub = {
  slug: `${BASE}/lesson-plans`,
  title: "Free ESL Lesson Plans",
  metaTitle: "Free ESL Lesson Plans by CEFR Level, with Worksheets | RCF English",
  description: "Free, complete ESL lesson plans by CEFR level: aims, language analysis, timed stages with interaction patterns, adaptations and a printable worksheet for each.",
  keywords: "free ESL lesson plans, ESL grammar lesson plans, EFL lesson plans, CEFR A2 lesson plans, English lesson plans for teachers",
  kicker: "ESL Teaching Resources",
  kind: "teacher-resource",
  tags: ["ESL lesson plans", "CEFR", "With worksheets"],
  breadcrumbs: [GE, ESL],
  backTo: ESL,
  hero: { text: "Complete lessons, each with aims, a language analysis, a timed procedure and a printable worksheet." },
  blocks: [
    {
      type: "cards", heading: "Lesson plans", level: "h2", columns: "3",
      items: plans.map((m) => ({ title: `${m.lesson.topic} (${m.lesson.cefr})`, url: `${BASE}/lesson-plans/${m.lesson.slug}/`, more: `${m.lesson.minutes} minutes`, text: [m.lesson.focus.split(":")[0] + ". " + m.lesson.learners + "."] }))
    },
    AD
  ]
};

const sheetHub = {
  slug: `${BASE}/worksheets`,
  title: "Free Printable ESL Worksheets",
  metaTitle: "Free Printable ESL Worksheets with Answer Keys, by CEFR Level | RCF English",
  description: "Free printable ESL worksheets by CEFR level, each with graded tasks, a full answer key and teacher's notes, and a matching lesson plan.",
  keywords: "free ESL worksheets, printable ESL worksheets, ESL grammar worksheets with answers, EFL worksheets, CEFR A2 worksheets",
  kicker: "ESL Teaching Resources",
  kind: "teacher-resource",
  tags: ["ESL worksheets", "Printable", "Answer keys"],
  breadcrumbs: [GE, ESL],
  backTo: ESL,
  hero: { text: "Graded, printable worksheets with answer keys and teacher's notes, each matched to a lesson plan." },
  blocks: [
    {
      type: "cards", heading: "Worksheets", level: "h2", columns: "3",
      items: sheets.map((m) => ({ title: `${m.worksheet.topic} (${m.worksheet.cefr})`, url: `${BASE}/worksheets/${m.worksheet.slug}/`, more: `About ${m.worksheet.minutes} minutes`, text: [`${m.worksheet.tasks.length} tasks, answer key and teacher's notes.`] }))
    },
    AD
  ]
};

const standards = {
  slug: `${BASE}/our-standards`,
  title: "Our Standard for Lesson Plans and Worksheets",
  metaTitle: "Our Standard for ESL Lesson Plans and Worksheets | RCF English",
  description: "What every RCF English ESL lesson plan and worksheet must have before it is published: CEFR levels, learner-outcome aims, language analysis, staged procedures, graded worksheets with answer keys, and material suitable for any classroom.",
  keywords: "ESL lesson plan standard, CEFR lesson plan, what makes a good ESL worksheet, lesson plan components",
  kicker: "ESL Teaching Resources",
  kind: "page",
  breadcrumbs: [GE, ESL],
  backTo: ESL,
  hero: { text: "Every plan and worksheet in this section meets these requirements before it is published. They draw on the CEFR, established lesson-planning practice and published readability guidance." },
  blocks: [
    { type: "prose", heading: "Levels", level: "h2", text: ["Everything is set at a level of the Common European Framework of Reference for Languages (CEFR): A1, A2, B1, B2, C1 or C2. The level is stated on the page, and the language of every instruction is at or below it, because instructions a learner cannot read defeat the worksheet."] },
    { type: "prose", heading: "Every lesson plan has", level: "h2", bullets: [
      "**At a glance:** level, learners, length, skills, language focus, materials and preparation time.",
      "**Aims written as learner outcomes:** what learners will be able to do by the end, not what the teacher will cover.",
      "**A language analysis:** meaning with concept-checking questions, form, pronunciation, and the problems learners usually have, each with a solution.",
      "**A staged procedure:** every stage with an aim, a time and an interaction pattern; controlled practice before freer practice; key instructions and instruction-checking questions written out.",
      "**Support and stretch,** and **adaptations** for a large class, a class with no photocopier, an online class and a different age group.",
      "**A way to check learning,** homework, and a matching worksheet."
    ] },
    { type: "prose", heading: "Every worksheet has", level: "h2", bullets: [
      "Its full content on its own web page, not only a download.",
      "Three to five tasks, graded from recognition to controlled use to freer use, each with a short instruction and an example item.",
      "An answer key and teacher's notes: timing, common mistakes, how to use it and an extension.",
      "A readable layout: a clear sans-serif font, generous line spacing, short lines, left-aligned text, and nothing that depends on colour, so it prints in black and white."
    ] },
    { type: "prose", heading: "Material for every classroom", level: "h2", bullets: [
      "**Original:** written by RCF English. Nothing is copied from a coursebook, another website or a published test.",
      "**International:** names, places and situations from many countries, and ordinary everyday topics that suit a classroom anywhere, avoiding subjects that are sensitive in many countries.",
      "**British spelling,** with American forms noted where learners often meet them."
    ] },
    { type: "prose", heading: "Quality before quantity", level: "h2", text: ["Each page is written for one real teaching purpose and read through in full before it is published. New material goes up in small, finished batches, and each page shows the date it was last reviewed."] },
    { type: "prose", heading: "Free and premium", level: "h2", text: ["Every free lesson and worksheet is complete enough to teach from. Premium packs, when they are available, add convenience - editable files, slides and whole-unit bundles - never the part of a lesson that makes it work."] },
    { type: "prose", heading: "Advertising", level: "h2", text: ["Where advertising appears, it is labelled, it sits only between sections, and it never appears inside a lesson, inside a worksheet or beside a button. It does not print."] }
  ]
};

const pages = [hub, planHub, sheetHub, standards, ...plans.map(lessonPage), ...sheets.map(worksheetPage)];
fs.writeFileSync(path.join(ROOT, "_src/pages/global-english-esl.json"), JSON.stringify({
  _readme: [
    "INTERNATIONAL ESL SECTION",
    "Generated by tools/esl/gen.js from tools/esl/lessons/. Do not edit by hand.",
    "Every page follows tools/esl/STANDARD.md; the generator refuses a lesson",
    "or worksheet that is missing a part the standard requires."
  ],
  pages
}, null, 2) + "\n");

// A card for the section on the Global English hub, once. The cards there
// were headed "The four areas" but already listed five.
const geFile = path.join(ROOT, "_src/pages/global-english.json");
const raw = fs.readFileSync(geFile, "utf8");
const bom = raw.charCodeAt(0) === 0xFEFF ? "﻿" : "";
const ge = JSON.parse(bom ? raw.slice(1) : raw);
const gePage = ge.pages.find((p) => p.slug === "global-english");
// Found by what it contains, not by its heading: the heading is renamed
// below, so matching on it worked once and then never again.
const areas = gePage.blocks.find((b) => b.type === "cards" && (b.items || []).some((c) => /^global-english\/(gcse|igcse)\//.test(String(c.url || ""))));
if (!areas) throw new Error("Global English area cards not found");
areas.heading = "Choose an area";
const card = { title: "ESL Teaching Resources", url: BASE + "/", text: ["Free ESL lesson plans and printable worksheets for teachers of English in any country, levelled by the CEFR."] };
const at = areas.items.findIndex((c) => c.url === card.url);
if (at === -1) areas.items.push(card); else areas.items[at] = card;
fs.writeFileSync(geFile, bom + JSON.stringify(ge, null, 2) + "\n");

console.log(`${pages.length} ESL pages written (${plans.length} lesson plans, ${sheets.length} worksheets); Global English card ${at === -1 ? "added" : "updated"}`);
