// Builds _src/pages/teacher-resources-elt-articles.json from the article
// data in this folder, and adds the section to the English Teachers
// Resources hub.
// Usage: node tools/elt-articles/gen.js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const articles = [...require("./articles-a.js").articles, ...require("./articles-b.js").articles];
const BASE = "teacher-resources/elt-articles";
const FILES = "https://americanenglish.state.gov/files/ae/resource_files/";
const JOURNAL = "English Teaching Forum";
const PUBLISHER = "U.S. Department of State";

// The order the sections appear in on the hub, and what each is called.
const THEMES = [
  ["classes", "Large classes and classroom management", "For crowded rooms, mixed-ability groups and very few materials."],
  ["speaking", "Speaking and listening", "Short, repeatable activities that get every pupil talking, not just the confident few."],
  ["reading", "Reading", "Turning the passages you already have into fluency practice."],
  ["writing", "Writing, feedback and assessment", "Less marking for you, more thinking for the pupils."],
  ["exams", "Examinations", "Preparing pupils for a test without teaching them tricks."],
  ["teachers", "Teachers like us", "Classrooms elsewhere in South Asia, with the same pressures as ours."]
];

const readMins = (w) => Math.max(1, Math.round(w / 200));
const issue = (a) => `Volume ${a.volume}, Number ${a.number} (${a.year})`;
const byline = (a) => a.authors.length
  ? a.authors.length === 1 ? a.authors[0] : a.authors.slice(0, -1).join(", ") + " and " + a.authors[a.authors.length - 1]
  : `A profile of ${a.subject}`;

// Checked before anything is written: every article needs these, and a
// theme that is not in THEMES would quietly never appear on the hub.
const themeKeys = new Set(THEMES.map((t) => t[0]));
const slugs = new Set();
for (const a of articles) {
  for (const k of ["slug", "title", "file", "year", "brief", "steps", "lanka", "tomorrow", "tags", "oneLine"]) {
    if (a[k] === undefined || a[k] === "") throw new Error(`${a.slug || a.title}: missing ${k}`);
  }
  if (!themeKeys.has(a.theme)) throw new Error(`${a.slug}: unknown theme ${a.theme}`);
  if (slugs.has(a.slug)) throw new Error(`duplicate slug ${a.slug}`);
  slugs.add(a.slug);
}

// Articles in hub order, so "Next" follows the same path as the hub.
const ordered = THEMES.flatMap(([k]) => articles.filter((a) => a.theme === k));

const crumbs = [
  { label: "English Teachers Resources", url: "teacher-resources/" },
  { label: "ELT Articles", url: BASE + "/" }
];

function articlePage(a, i) {
  const next = ordered[i + 1];
  const pdf = FILES + a.file;
  const theme = THEMES.find((t) => t[0] === a.theme)[1];
  const facts = [
    [a.authors.length > 1 ? "Authors" : a.authors.length ? "Author" : "About", byline(a)],
    ["Published in", `${JOURNAL}, ${issue(a)}, ${PUBLISHER}`],
    ["Section of the journal", a.kind],
    ...(a.where ? [["Where the work was done", a.where]] : []),
    ["Level", a.level],
    ["Length", `About ${readMins(a.words)} minutes to read`]
  ];
  return {
    slug: `${BASE}/${a.slug}`,
    title: a.title,
    metaTitle: `${a.title} (${JOURNAL}, ${a.year}): summary and full article | RCF English`,
    description: `A summary for English teachers of "${a.title}" from ${JOURNAL} (${a.year}), with notes for large classes in Sri Lanka and elsewhere, and the full article to read free.`,
    keywords: [...a.tags, JOURNAL, "ELT article", "teaching English", "EFL teachers"].join(", "),
    kicker: `ELT Articles · ${theme}`,
    kind: "teacher-resource",
    schema: "LearningResource",
    educationalLevel: "Teachers of English",
    resourceType: "Article summary",
    tags: a.tags,
    basedOn: { title: a.title, url: pdf, authors: a.authors, journal: JOURNAL, publisher: PUBLISHER, year: String(a.year) },
    breadcrumbs: crumbs,
    backTo: { label: "ELT Articles", url: BASE + "/" },
    hero: { text: a.oneLine },
    blocks: [
      ...(a.sriLankan ? [{
        type: "callout", style: "tip", title: "Written in Sri Lanka",
        text: ["This article is by a Sri Lankan teacher educator, about Sri Lankan classrooms, published in an international journal distributed to English teachers in more than a hundred countries."]
      }] : []),
      { type: "prose", heading: "In brief", level: "h2", text: a.brief },
      { type: "terms", heading: "About the article", level: "h2", items: facts.map(([term, definition]) => ({ term, definition })) },
      { type: "prose", heading: "How it works", level: "h2", numbered: a.steps },
      { type: "prose", heading: "In a Sri Lankan classroom", level: "h2", text: a.lanka },
      { type: "checklist", heading: "Try this tomorrow", level: "h2", items: a.tomorrow },
      {
        type: "pdfReader", heading: "Read the full article", level: "h2",
        src: pdf, title: a.title,
        credit: `**${byline(a)}**, ${JOURNAL}, ${issue(a)}. Shown from the U.S. Department of State's website.`
      },
      {
        type: "callout", style: "legal", title: "Where this comes from",
        text: [
          `The summary, the steps and the classroom notes on this page are RCF English's own, written after reading the whole article. The article itself is published by the ${PUBLISHER} in ${JOURNAL} and is shown here from the journal's own website, americanenglish.state.gov. RCF English does not host a copy of it and is not connected with the journal.`
        ]
      },
      {
        type: "share", heading: "Share this article", level: "h2",
        text: `${a.title}: a summary for English teachers, with the full article free.`,
        hashtags: a.hashtags
      },
      {
        type: "related", heading: "Next", level: "h2",
        items: [
          ...(next ? [{ title: next.title, url: `${BASE}/${next.slug}/`, text: [next.oneLine] }] : []),
          { title: "All ELT articles", url: BASE + "/", text: ["The full list, grouped by what they help with."] }
        ]
      }
    ]
  };
}

const sriLankan = articles.find((a) => a.sriLankan);
const hub = {
  slug: BASE,
  title: "ELT Articles for Teachers",
  metaTitle: "ELT Articles for English Teachers: summaries and free full articles | RCF English",
  description: `Practical articles on teaching English from ${JOURNAL}, chosen for large classes and few resources - speaking, reading, writing, feedback and exams - each with a summary and the full article to read free.`,
  keywords: "ELT articles, English Teaching Forum, teaching English articles, EFL teaching ideas, large classes, teaching speaking, Sri Lanka English teachers",
  kicker: "English Teachers Resources",
  kind: "teacher-resource",
  schema: "LearningResource",
  educationalLevel: "Teachers of English",
  resourceType: "Article collection",
  tags: ["English Teaching Forum", "ELT articles", "Teaching English in Sri Lanka", "Large classes", "Teaching speaking", "EFL"],
  breadcrumbs: [crumbs[0]],
  backTo: crumbs[0],
  hero: { text: `${articles.length} practical articles from ${JOURNAL}, chosen for classrooms like ours: large, mixed-ability and short of materials. Each has a summary, notes for a Sri Lankan classroom, and the full article to read.` },
  blocks: [
    {
      type: "prose", heading: "About these articles", level: "h2",
      text: [
        `${JOURNAL} is a free quarterly journal for English teachers, published by the ${PUBLISHER} and distributed in more than a hundred countries. Most of its authors are classroom teachers, and its articles are practical: an activity, a routine, a way of managing a class.`,
        "We have chosen the ones that work where classes are large, books are shared and a lesson lasts forty minutes. For each there is a short summary, the steps, a note on using it in a Sri Lankan classroom, and the whole article, which you can read on the page or open on your phone."
      ]
    },
    ...(sriLankan ? [{
      type: "callout", style: "tip", title: "Written in Sri Lanka",
      text: [`[${sriLankan.title}](${BASE}/${sriLankan.slug}/) is by ${sriLankan.authors[0]}, a senior lecturer at Mahaweli National College of Education in Kandy. ${sriLankan.oneLine.replace(/^By a lecturer at [^:]+: /, "It describes ")}`]
    }] : []),
    ...THEMES.filter(([k]) => ordered.some((a) => a.theme === k)).map(([k, label, blurb]) => ({
      type: "cards", heading: label, level: "h2", columns: "3",
      intro: [blurb],
      items: ordered.filter((a) => a.theme === k).map((a) => ({
        title: a.title,
        url: `${BASE}/${a.slug}/`,
        more: `${readMins(a.words)} min read · ${a.year}`,
        text: [a.oneLine]
      }))
    })),
    {
      type: "callout", style: "legal", title: "Where the articles come from",
      text: [
        `Every article is published by the ${PUBLISHER} in ${JOURNAL} and is shown from the journal's own website; RCF English does not host copies. The summaries and classroom notes are RCF English's own. RCF English is not connected with the journal or the ${PUBLISHER}.`
      ]
    },
    {
      type: "share", heading: "Share this page", level: "h2",
      text: "Practical ELT articles for English teachers, with summaries and the full articles free.",
      hashtags: ["ELT", "TESOL", "EFL", "EnglishTeachers", "TeachingEnglish"]
    }
  ]
};

const out = {
  _readme: [
    "ELT ARTICLES",
    "Generated by tools/elt-articles/gen.js from articles-a.js and articles-b.js.",
    "Do not edit this file by hand: edit the data files and run the script.",
    "",
    "The articles are published by the U.S. Department of State in English",
    "Teaching Forum and are shown from americanenglish.state.gov, never copied.",
    "Every summary on these pages is RCF English's own writing."
  ],
  pages: [hub, ...ordered.map(articlePage)]
};
fs.writeFileSync(path.join(ROOT, "_src/pages/teacher-resources-elt-articles.json"), JSON.stringify(out, null, 2) + "\n");

// Put the section on the English Teachers Resources hub, once.
const hubFile = path.join(ROOT, "_src/pages/teacher-resources.json");
const raw = fs.readFileSync(hubFile, "utf8");
const bom = raw.charCodeAt(0) === 0xFEFF ? "﻿" : "";
const tr = JSON.parse(bom ? raw.slice(1) : raw);
const trPage = tr.pages.find((p) => p.slug === "teacher-resources");
const planning = trPage.blocks.find((b) => b.type === "cards" && b.heading === "Planning and teaching");
if (!planning) throw new Error("Planning and teaching cards not found on the teacher resources hub");
const card = {
  title: "ELT Articles",
  url: BASE + "/",
  more: `${articles.length} articles`,
  text: [`Practical articles from ${JOURNAL} for large classes: speaking, reading, writing, feedback and exams, each with a summary and the full article.`]
};
const at = planning.items.findIndex((c) => c.url === card.url);
if (at === -1) planning.items.push(card); else planning.items[at] = card;
fs.writeFileSync(hubFile, bom + JSON.stringify(tr, null, 2) + "\n");

console.log(`${articles.length} articles in ${THEMES.length} themes; hub card ${at === -1 ? "added" : "updated"}`);
