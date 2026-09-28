// Builds the English Classroom Games pages: a hub and one page for each
// grade, from the grade files in this folder.
// Usage: node tools/classroom-games/gen.js
//
// Two things this generator exists to prevent.
//
// First, duplication. The site already carries 26 classroom games across the
// international ESL page and the flashcards page. Publishing the same games
// again under a new heading is exactly what Google's spam policy calls
// scaled content, and it would cost the whole section its ranking rather
// than gain any. TAKEN below lists every game already published, and the
// build refuses if a new page reuses one of those names or repeats a name
// from another grade.
//
// Second, vagueness. A game page that could apply to any class anywhere is
// worth nothing to a teacher and ranks for nothing. Every game here must
// name the language it practises and say what to do when the class has
// forty-five pupils in it, because that is the class most of these teachers
// have. The build refuses a game missing either.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const BASE = "teacher-resources/classroom-games";
const TR = { label: "English Teachers Resources", url: "teacher-resources/" };

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;
const PER_GRADE = 8;

// Already published elsewhere on the site. Never reuse one of these names.
const TAKEN = [
  // global-english/esl/games/esl-classroom-games
  "The word wall race", "Definition bingo", "Odd one out", "The memory tray",
  "Word tennis", "Sentence auction", "Beat the teacher", "Running dictation",
  "Question basketball", "Grammar stations", "The yes-no game", "Liar's interview",
  "The silent film", "The one-minute story", "Right or wrong, on your feet",
  "The alphabet chain", "Change places if", "Board race",
  // teacher-resources/flashcards-and-games
  "Flash and say", "Meaning race", "Pairs", "Missing card", "Stand up if",
  "Sentence builder", "Hot seat", "Line up"
].map((n) => n.toLowerCase());

const grades = fs.readdirSync(__dirname)
  .filter((f) => /^grade-\d+\.js$/.test(f))
  .map((f) => require(path.join(__dirname, f)).grade)
  .sort((a, b) => a.number - b.number);

if (!grades.length) throw new Error("no grade files found in tools/classroom-games");

// ------------------------------------------------------------- the checks
const problems = [];
const nameSeen = new Map();
for (const g of grades) {
  if (!g.games || g.games.length !== PER_GRADE) {
    problems.push(`Grade ${g.number}: ${g.games ? g.games.length : 0} games, and there should be ${PER_GRADE}`);
  }
  if (!g.intro || !g.intro.length) problems.push(`Grade ${g.number}: no intro`);
  if (!g.focus) problems.push(`Grade ${g.number}: no 'focus' line saying what this grade needs`);
  (g.games || []).forEach((a) => {
    const where = `Grade ${g.number}: "${a.name || "?"}"`;
    for (const field of ["name", "time", "grouping", "prep", "language", "steps", "bigClass"]) {
      if (!a[field] || (Array.isArray(a[field]) && !a[field].length)) {
        problems.push(`${where} has no ${field}`);
      }
    }
    if (a.steps && a.steps.length < 3) problems.push(`${where} has only ${a.steps.length} steps; a game needs at least 3`);
    const key = (a.name || "").toLowerCase();
    if (TAKEN.includes(key)) problems.push(`${where} is already published elsewhere on the site`);
    if (nameSeen.has(key)) problems.push(`${where} is also used in Grade ${nameSeen.get(key)}`);
    nameSeen.set(key, g.number);
  });
}
if (problems.length) {
  console.log("Nothing was written. Fix these first:\n");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}

// -------------------------------------------------------------- the pages
const gradeLabel = (n) => `Grade ${n}`;

const pages = grades.map((g) => {
  const blocks = [
    { type: "prose", heading: `What a Grade ${g.number} class needs from a game`, level: "h2", text: g.intro },
    {
      type: "callout", style: "note", title: "Eight games, no equipment",
      text: [`None of these needs a photocopier, a projector or a set of cards. Every one says what to do when the class has forty-five pupils in it, because that is the class most teachers reading this have.`]
    }
  ];

  g.games.forEach((a, i) => {
    blocks.push(Object.assign({ type: "activity", level: "h3", n: String(i + 1) }, a));
    if (i === 3 || i === 6) blocks.push({ type: "adslot", placement: "between" });
  });

  if (g.faq && g.faq.length) {
    blocks.push({ type: "accordion", heading: "Questions teachers ask", level: "h2", items: g.faq });
  }
  blocks.push({ type: "print", label: "Print these games", note: "Prints without the site's menus or advertisements." });
  blocks.push({
    type: "related", heading: "More for your classroom", level: "h2",
    items: [
      { title: "All classroom games by grade", url: `${BASE}/`, text: ["The hub, with a page for every grade and the four rules that decide whether a game teaches anything."] },
      { title: "Printable Flashcards and Classroom Games", url: "teacher-resources/flashcards-and-games/", text: ["Make a set of cards from your own word list, with eight games that use them."] },
      { title: "Classroom Activities", url: "teacher-resources/classroom-activities/", text: ["Short activities for an ordinary lesson, not only for a game."] },
      { title: "Classroom Management", url: "teacher-resources/classroom-management/", text: ["Getting a large class into teams and back out again without losing the period."] }
    ]
  });

  return {
    slug: `${BASE}/grade-${g.number}`,
    title: `Grade ${g.number} English Classroom Games`,
    metaTitle: `English Classroom Games for Grade ${g.number}`,
    description: `Eight English classroom games for Grade ${g.number}, each with the language it practises, the time it takes and what to do in a class of forty-five. No equipment needed.`,
    keywords: `grade ${g.number} english games, english classroom games grade ${g.number}, esl games grade ${g.number}, english language games for large classes, no preparation english games`,
    kicker: "English Teachers Resources",
    kind: "teacher-resource",
    schema: "LearningResource",
    educationalLevel: gradeLabel(g.number),
    resourceType: "Classroom games",
    audienceRole: "teacher",
    tags: [gradeLabel(g.number), "Classroom games", "No equipment", "Large classes", "Free"],
    breadcrumbs: [TR, { label: "English Classroom Games", url: `${BASE}/` }],
    backTo: { label: "English Classroom Games", url: `${BASE}/` },
    hero: { text: `Eight games for a Grade ${g.number} class, each tied to what this grade is actually learning: ${g.focus}.` },
    blocks
  };
});

// ------------------------------------------------------------------- hub
const hub = {
  slug: BASE,
  title: "English Classroom Games by Grade",
  metaTitle: "English Classroom Games for Every Grade",
  description: "English classroom games for each grade, tied to what that grade is learning, with no equipment needed and instructions for a class of forty-five pupils.",
  keywords: "english classroom games, esl classroom games by grade, english games for large classes, no preparation english games, english language games for school",
  kicker: "English Teachers Resources",
  kind: "teacher-resource",
  tags: ["Classroom games", "By grade", "No equipment", "Large classes", "Free"],
  breadcrumbs: [TR],
  backTo: TR,
  hero: { text: "Games chosen for what each grade is actually learning, not a list that could belong to any class. Every one works with no equipment and forty-five pupils." },
  blocks: [
    {
      type: "prose", heading: "Why these are arranged by grade", level: "h2",
      text: [
        "Most collections of classroom games are arranged by skill or by level, which leaves the teacher to work out whether a game fits the class in front of them. That is the hardest part, and it is the part usually left out.",
        "These are arranged by grade instead, and each game is tied to language that grade is genuinely working on - so a Grade 7 game practises the past simple because Grade 7 is learning the past simple, and a Grade 10 game practises the kind of writing the Ordinary Level paper will ask for."
      ]
    },
    {
      type: "cards", heading: "Choose a grade", level: "h2", columns: "4",
      items: grades.map((g) => ({
        title: gradeLabel(g.number),
        url: `${BASE}/grade-${g.number}/`,
        more: `${PER_GRADE} games`,
        text: [g.focus.charAt(0).toUpperCase() + g.focus.slice(1) + "."]
      }))
    },
    { type: "adslot", placement: "between" },
    {
      type: "prose", heading: "The four things that decide whether a game teaches anything", level: "h2",
      text: ["A game that goes well is not the same as a game that taught something. These four decide which you get, and none of them is about the game itself."],
      bullets: [
        "**Every pupil must produce language, not watch somebody produce it.** A quiz where one pupil answers and forty-four listen is a quiz with an audience. Teams that all write, all say the sentence, or all stand up are the difference.",
        "**The rule must force the target language out.** If a pupil can win by pointing or by saying one word, they will. The language you want has to be the only way to score.",
        "**Stop it early.** A game stopped while the class still wants it can be used again next week. A game played until it dies cannot be used again at all.",
        "**Decide about mistakes before you start.** Correct everything and the game stops being a game; correct nothing and it stops being a lesson. Most teachers note two or three errors and deal with them at the end, on the board, with no names."
      ]
    },
    {
      type: "prose", heading: "Running a game in a class of forty-five", level: "h2",
      text: ["The commonest reason a teacher gives up on games is not the game. It is the four minutes of noise getting into teams and the four minutes getting back out, in a period of forty."],
      bullets: [
        "**Use the rows you already have.** Teams by row need no movement at all, and a class of forty-five is usually five or six teams without a single chair being shifted.",
        "**One sheet per row, passed along.** It stops the confident pupil writing everything, and it needs no group work training.",
        "**Give the instructions before the teams,** never after. Once a class is in teams it cannot hear you.",
        "**Have a stopping signal the class already knows** and practise it once when nothing is at stake. A hand up, a clap pattern, anything - but the same one every time.",
        "**Write the score where everybody can see it.** Half the discipline problems in a class game are disputes about the score."
      ]
    },
    {
      type: "related", heading: "Related", level: "h2",
      items: [
        { title: "18 ESL Classroom Games That Teach Something", url: "global-english/esl/games/esl-classroom-games/", text: ["The international collection, arranged by skill rather than grade. No game is repeated between the two."] },
        { title: "Printable Flashcards and Classroom Games", url: "teacher-resources/flashcards-and-games/", text: ["Make cards from your own word list, with eight games that use them."] },
        { title: "Classroom Activities", url: "teacher-resources/classroom-activities/", text: ["Short activities for an ordinary lesson."] },
        { title: "Primary Game Zone", url: "primary-english/game-zone/", text: ["Games the pupils play themselves on a screen, Grades 1 to 6."] }
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
    "ENGLISH CLASSROOM GAMES, BY GRADE",
    "Generated by tools/classroom-games/gen.js from the grade files in that",
    "folder. Do not edit this file by hand: change the grade file and run the",
    "generator again. It refuses to build a game that repeats one already",
    "published elsewhere on the site, or one that does not say what language it",
    "practises and what to do in a class of forty-five."
  ],
  pages: all
};
fs.writeFileSync(path.join(ROOT, "_src/pages/classroom-games.json"), JSON.stringify(out, null, 2) + "\n");

const total = grades.reduce((a, g) => a + g.games.length, 0);
console.log(`${all.length} pages written: ${grades.length} grade${grades.length === 1 ? "" : "s"}, ${total} games.`);
console.log(`No game repeats one of the ${TAKEN.length} already published elsewhere.`);
