// Builds the creative writing model pages, one for each grade from 6 to 13,
// from the grade files in this folder.
// Usage: node tools/creative-writing/gen.js
//
// The word count is the point of these. A model written at 250 words for a
// grade that must write 130 teaches a pupil to fail, so the generator counts
// every piece and refuses to build one that misses its target. Better a
// refusal here than a teacher discovering it in front of a class.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const BASE = "teacher-resources/english-day/creative-writing";
const ED = { label: "English Day Resources", url: "teacher-resources/english-day/" };
const TR = { label: "English Teachers Resources", url: "teacher-resources/" };

// About a hundred words at Grade 6 and ten more for each year after it; a
// larger step at Grade 11, where the O/L work begins; and 250 across both
// A/L years, which is the length an A/L General English essay runs to.
const TARGET = { 6: 100, 7: 110, 8: 120, 9: 130, 10: 140, 11: 165, 12: 250, 13: 250 };
// A composition is not a word-counting exercise; a tenth either way is fine.
const TOLERANCE = 0.12;

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

const countWords = (lines) =>
  lines.join(" ").replace(/[*_~`#>|-]+/g, " ").split(/\s+/).filter((w) => /[a-zA-Z]/.test(w)).length;

const grades = fs.readdirSync(__dirname)
  .filter((f) => /^grade-\d+\.js$/.test(f))
  .map((f) => require(path.join(__dirname, f)).grade)
  .sort((a, b) => a.number - b.number);

if (!grades.length) throw new Error("no grade files found in tools/creative-writing");

// ------------------------------------------------------------- the checks
const problems = [];
for (const g of grades) {
  const target = TARGET[g.number];
  if (!target) { problems.push(`Grade ${g.number}: no word target is set for this grade`); continue; }
  if (g.words !== target) problems.push(`Grade ${g.number}: the file says ${g.words} words, the ladder says ${target}`);
  if (!g.essays || g.essays.length !== 10) {
    problems.push(`Grade ${g.number}: ${g.essays ? g.essays.length : 0} compositions, and there should be 10`);
  }
  const seen = new Set();
  (g.essays || []).forEach((e) => {
    if (!e.title || !e.text || !e.teaches) { problems.push(`Grade ${g.number}: "${e.title || "?"}" is missing a title, its text or its teaching note`); return; }
    if (seen.has(e.title)) problems.push(`Grade ${g.number}: "${e.title}" appears twice`);
    seen.add(e.title);
    const n = countWords(e.text);
    const low = Math.round(target * (1 - TOLERANCE));
    const high = Math.round(target * (1 + TOLERANCE));
    if (n < low || n > high) {
      problems.push(`Grade ${g.number}: "${e.title}" is ${n} words; it should be ${low} to ${high}`);
    }
  });
}
if (problems.length) {
  console.log("Nothing was written. Fix these first:\n");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}

// -------------------------------------------------------------- the pages
const pages = grades.map((g) => {
  const target = TARGET[g.number];
  const counts = g.essays.map((e) => countWords(e.text));
  const average = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

  const blocks = [
    { type: "prose", heading: "About these models", level: "h2", text: g.intro },
    {
      type: "callout", style: "note", title: `Ten compositions, about ${target} words each`,
      text: [`Every piece below was written to the length a Grade ${g.number} pupil is expected to manage - the ten average ${average} words. They are RCF English's own work, free to print, read aloud or put on a screen.`]
    }
  ];

  g.essays.forEach((e, i) => {
    blocks.push({
      type: "prose",
      heading: `${i + 1}. ${e.title}`,
      level: "h2",
      text: e.text
    });
    blocks.push({
      type: "callout", style: "tip", title: "What this one shows",
      text: [e.teaches]
    });
    if (i === 4) blocks.push({ type: "adslot", placement: "between" });
  });

  blocks.push({ type: "prose", heading: g.advice.heading, level: "h2", bullets: g.advice.items });
  blocks.push({ type: "print", label: "Print these compositions", note: "Prints without the site's menus or advertisements." });
  blocks.push({
    type: "related", heading: "More for the competition", level: "h2",
    items: [
      { title: "English Day Resources", url: ED.url, text: ["The circulars, the competition rules, and material for the other events."] },
      { title: "Writing Practice", url: "writing-practice/", text: ["Type a composition and check it: word count, paragraphs, linking words and format."] },
      { title: "Essay Writing Exercises", url: "essay-writing-exercises/", text: ["Build an essay step by step, and repair a weak paragraph."] }
    ]
  });

  return {
    slug: `${BASE}/grade-${g.number}`,
    title: `Grade ${g.number} Creative Writing: Ten Model Compositions`,
    metaTitle: `Grade ${g.number} Creative Writing Samples (${target} Words)`,
    description: `Ten model compositions for Grade ${g.number}, about ${target} words each, written for learners of English as a second language, with a note on what each one shows.`,
    keywords: `grade ${g.number} creative writing, grade ${g.number} essay samples, english composition grade ${g.number}, creative writing examples sri lanka, english day creative writing`,
    kicker: "English Day Resources",
    kind: "teacher-resource",
    schema: "LearningResource",
    educationalLevel: `Grade ${g.number}`,
    resourceType: "Model compositions",
    audienceRole: "teacher",
    tags: [`Grade ${g.number}`, "Creative writing", `About ${target} words`, "Free", "Printable"],
    breadcrumbs: [TR, ED],
    backTo: ED,
    hero: { text: `Ten compositions of about ${target} words, written at the level a Grade ${g.number} pupil can actually reach - and each one showing a single thing worth copying.` },
    blocks
  };
});

// The hub that lists the grades.
const hub = {
  slug: BASE,
  title: "Creative Writing: Model Compositions by Grade",
  metaTitle: "Creative Writing Samples for Grades 6 to 13",
  description: "Model compositions for every grade from 6 to 13, written at the length each grade is expected to manage, for learners of English as a second language.",
  keywords: "creative writing samples sri lanka, model compositions english, grade 6 to 13 creative writing, english day creative writing, esl composition examples",
  kicker: "English Day Resources",
  kind: "teacher-resource",
  tags: ["Creative writing", "Grades 6 to 13", "Free", "Printable"],
  breadcrumbs: [TR, ED],
  backTo: ED,
  hero: { text: "Written at the length each grade can manage, in the English a second-language learner already has. The point is not to admire them: it is to take one thing from each and use it." },
  blocks: [
    {
      type: "prose", heading: "Why the length matters", level: "h2",
      text: [
        "A model composition is only useful if the pupil reading it believes they could write something like it. A beautiful piece of 400 words handed to a child who must produce 100 does not raise the standard - it teaches them that good writing is something other people do.",
        "So these grow with the grade: about a hundred words at Grade 6 and ten more for each year after it, a larger step to a hundred and sixty-five at Grade 11 where the O/L work is judged, and two hundred and fifty across both Advanced Level years, which is the length a General English answer runs to. The generator that builds these pages counts every composition and refuses to publish one that misses its grade."
      ]
    },
    {
      type: "cards", heading: "Choose a grade", level: "h2", columns: "4",
      items: grades.map((g) => ({
        title: `Grade ${g.number}`,
        url: `${BASE}/grade-${g.number}/`,
        more: `${TARGET[g.number]} words`,
        text: [`Ten compositions of about ${TARGET[g.number]} words.`]
      }))
    },
    {
      type: "prose", heading: "Using a model without copying it", level: "h2",
      text: ["The commonest mistake with model compositions is to read one and then set the same title. The class writes a slightly worse version of what they have just read, and nobody learns anything."],
      bullets: [
        "**Take one technique, not the whole piece.** The last line, the dialogue, the way the first sentence puts you in a place.",
        "**Change the title before they write.** If the model is about a rainy day, set a hot day, or a day the electricity failed.",
        "**Let them see the word count.** Knowing the target is a hundred words stops a weak writer producing four sentences and a strong one producing two pages.",
        "**Read one aloud a week,** not ten in a lesson. A composition heard is remembered; a booklet handed out is filed."
      ]
    }
  ]
};

// --------------------------------------------------------------- checking
const all = [hub, ...pages];
for (const p of all) {
  const t = p.metaTitle || p.title;
  if (t.length > TITLE_MAX) throw new Error(`${p.slug}: title is ${t.length} characters, over ${TITLE_MAX}\n  "${t}"`);
  const d = p.description || "";
  if (d.length < DESC_MIN || d.length > DESC_MAX) throw new Error(`${p.slug}: description is ${d.length} characters, not ${DESC_MIN}-${DESC_MAX}\n  "${d}"`);
}

const out = {
  _readme: [
    "CREATIVE WRITING MODEL COMPOSITIONS, GRADES 6 TO 13",
    "Generated by tools/creative-writing/gen.js from the grade files in that",
    "folder. Do not edit this file by hand: change the grade file and run the",
    "generator again. It counts every composition and refuses to build one",
    "that misses the word target for its grade."
  ],
  pages: all
};
fs.writeFileSync(path.join(ROOT, "_src/pages/creative-writing.json"), JSON.stringify(out, null, 2) + "\n");

const total = grades.reduce((a, g) => a + g.essays.length, 0);
console.log(`${all.length} pages written: ${grades.length} grade${grades.length === 1 ? "" : "s"}, ${total} compositions.`);
grades.forEach((g) => {
  const counts = g.essays.map((e) => countWords(e.text));
  console.log(`  Grade ${g.number}: target ${TARGET[g.number]}, actual ${Math.min(...counts)} to ${Math.max(...counts)}`);
});
