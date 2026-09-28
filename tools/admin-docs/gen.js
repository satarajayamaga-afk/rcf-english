// Builds the Teacher Administrative Documents register from
// data/admin-docs.json.
// Usage: node tools/admin-docs/gen.js
//
// ONE PAGE, NOT TEN. Ten category pages with two links each would be ten thin
// pages, which this site has been penalised for before and which Google reads
// as padding. One page also prints, and answers Ctrl-F, which is how a
// teacher hunting a rule actually uses a reference.
//
// THE RULE THIS FILE ENFORCES: link, never host.
// A copy of a circular on rcfenglish.com would outrank the Ministry's own
// page, and when the circular is superseded the copy would quietly go on
// misleading people. So the generator refuses any entry whose link points at
// our own domain, at Google Drive, or at a file we control. That rule lives
// in code because a rule that lives only in a README gets forgotten at the
// exact moment somebody is in a hurry.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8").replace(/^﻿/, ""));

const data = read("data/admin-docs.json");
const categories = data.categories || [];
const documents = data.documents || [];

// Official sources only. A register that accepts any link is a link list, and
// a teacher cannot tell the difference until it matters.
const OFFICIAL = [
  "moe.gov.lk", "pubad.gov.lk", "doenets.lk", "nie.lk", "documents.gov.lk",
  "gov.lk", "parliament.lk", "treasury.gov.lk", "pensions.gov.lk"
];
// Anything here means we are hosting rather than linking.
const OURS = ["rcfenglish.com", "drive.google.com", "docs.google.com", "drive.usercontent.google.com"];
const STATUS = ["index", "listed", "current", "superseded", "historical"];

const TODAY = new Date().toISOString().slice(0, 10);

const problems = [];
const catIds = new Set(categories.map((c) => c.id));
const seen = new Set();

for (const c of categories) {
  if (!c.id || !c.name || !c.blurb) problems.push(`category "${c.id || c.name || "?"}" needs an id, a name and a blurb`);
}

for (const d of documents) {
  const w = `"${d.id || d.title || "?"}"`;
  if (!d.id) problems.push(`${w}: no id`);
  if (seen.has(d.id)) problems.push(`${w}: this id is used twice`);
  seen.add(d.id);
  if (!d.title) problems.push(`${w}: no title`);
  if (!d.issuedBy) problems.push(`${w}: no issuedBy - a teacher must know who issued it`);
  if (!catIds.has(d.category)) problems.push(`${w}: category "${d.category}" does not exist`);
  if (!STATUS.includes(d.status)) problems.push(`${w}: status must be one of ${STATUS.join(", ")}`);

  const u = String(d.officialUrl || "");
  if (!u) problems.push(`${w}: no officialUrl`);
  else if (!/^https:\/\//i.test(u)) problems.push(`${w}: the link must be https`);
  else {
    let host = "";
    try { host = new URL(u).hostname.toLowerCase(); } catch (e) { problems.push(`${w}: "${u}" is not a valid address`); }
    if (host) {
      if (OURS.some((h) => host === h || host.endsWith("." + h))) {
        problems.push(`${w}: this links to ${host}, which means hosting a copy. Link to the official source instead - see the note at the top of data/admin-docs.json.`);
      } else if (!OFFICIAL.some((h) => host === h || host.endsWith("." + h))) {
        problems.push(`${w}: ${host} is not an official source. Add it to OFFICIAL in this file only if it genuinely is one.`);
      }
    }
  }

  if (!d.checked) problems.push(`${w}: no 'checked' date - a register nobody has checked is worse than no register`);
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(d.checked)) problems.push(`${w}: 'checked' must be yyyy-mm-dd`);
  else if (d.checked > TODAY) problems.push(`${w}: 'checked' is in the future`);

  // Hosting by another name.
  for (const k of ["file", "download", "localCopy", "pdf"]) {
    if (d[k]) problems.push(`${w}: remove "${k}". This is a register: it links, it does not hold copies.`);
  }
}

if (problems.length) {
  console.log("Nothing was written. Fix these first:\n");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}

// ------------------------------------------------------------------ page
const STATUS_LABEL = {
  index: "Official index",
  listed: "Listed in the index",
  current: "In force",
  superseded: "Superseded",
  historical: "Historical"
};

const byCategory = (id) => documents.filter((d) => d.category === id);

const blocks = [
  {
    type: "callout", style: "info", title: "This page links to the official documents. It does not hold copies.",
    text: [
      "That is deliberate. If a copy of a circular sat here it would outrank the Ministry's own page in a search, and when the circular was replaced our copy would go on quietly misleading people. A link cannot mislead in that way: the official page either updates or disappears.",
      "So **check the date on whatever you open**, and where a decision matters, confirm the current position with your zonal or provincial office. This register tells you what exists and where it lives. It is not legal advice and it cannot tell you what is in force today."
    ]
  },
  {
    type: "prose", heading: "How to use this", level: "h2",
    text: ["Each section lists the official source, who issued it, and the day somebody here last opened the link. Where a document carries a circular or gazette number, it is printed exactly as it appears on the document."],
    bullets: [
      "**\"Official index\"** means the link is a landing page or a search listing many documents, rather than a single one. Those links keep working as new circulars are issued, which a fixed list does not.",
      "**\"Listed in the index\"** means the document was in the Ministry's own circular index on the date shown, with the number and date printed here copied from it. It does **not** mean somebody has confirmed it is still in force. Open it and check, and where it matters, confirm with your office.",
      "**\"In force\"** is used only where the document is the current published version of something, such as this year's Efficiency Bar modules.",
      "**No circular number appears here unless somebody has read it off the document.** An invented number looks exactly like a real one, and a teacher will quote it to an office.",
      "**Provincial instructions can differ from the national position.** Where they do, your provincial or zonal office is the authority, not this page and not the national circular."
    ]
  }
];

categories.forEach((c, i) => {
  blocks.push({ type: "prose", heading: c.name, level: "h2", text: [c.blurb].concat(c.help || []) });

  const docs = byCategory(c.id);
  if (docs.length) {
    blocks.push({
      type: "table",
      heading: `${c.name}: where the documents are`,
      level: "h3",
      columns: ["Document", "Issued by", "Status", "Link checked"],
      rows: docs.map((d) => {
        const num = d.docNumber ? ` (${d.docNumber})` : "";
        const issued = d.issued ? `, ${d.issued}` : "";
        const note = d.note ? `<br>${d.note}` : "";
        return [
          `**[${d.title}](${d.officialUrl})**${num}${issued}${note}`,
          d.issuedBy,
          STATUS_LABEL[d.status],
          d.checked
        ];
      })
    });
  } else {
    blocks.push({
      type: "callout", style: "note", title: `Nothing listed for ${c.name} yet`,
      text: ["No document has been checked and recorded for this section. Rather than fill it with links nobody has opened, it is left empty until somebody does. Your zonal or provincial office is the source in the meantime."]
    });
  }

  if (i === 2 || i === 6) blocks.push({ type: "adslot", placement: "between" });
});

blocks.push({
  type: "prose", heading: "If a link here is dead or out of date", level: "h2",
  text: ["Government sites reorganise and documents move. A dead link in a register is a real fault, not a cosmetic one, because somebody needed that document."],
  bullets: [
    "**Tell us** through the contact page and it will be corrected.",
    "**In the meantime, search the issuing body's own site** rather than the open web. A document found on a forum or a messaging group may be the wrong version, and there is no way to tell by looking at it.",
    "**A document with no number and no date should not be relied on** whoever sent it to you."
  ]
});

blocks.push({ type: "print", label: "Print this register", note: "Prints without the site's menus or advertisements." });

blocks.push({
  type: "related", heading: "Related", level: "h2",
  items: [
    { title: "Government Circulars", url: "teacher-resources/circulars/", text: ["How Ministry circular numbering works, and how to tell which version applies now."] },
    { title: "Important Links for Teachers", url: "teacher-resources/official-links/", text: ["The wider set of official pages, including all ten Efficiency Bar modules."] },
    { title: "Mutual Transfers", url: "teacher-resources/mutual-transfers/", text: ["Our own matching for teachers who want to swap schools. Separate from the official scheme."] },
    { title: "English Teachers Resources", url: "teacher-resources/", text: ["Everything else for teachers."] }
  ]
});

const page = {
  slug: "teacher-resources/administrative-documents",
  title: "Teacher Administrative Documents",
  metaTitle: "Teacher Administrative Documents: Sri Lanka",
  description: "Where the official documents governing a teacher's service live: transfers, promotions, Efficiency Bar, foreign leave and the Establishments Code.",
  keywords: "sri lanka teacher service documents, teacher transfer circular, teacher promotion documents, efficiency bar examination, foreign leave teachers, establishments code, teacher administrative documents",
  kicker: "English Teachers Resources",
  kind: "teacher-resource",
  schema: "LearningResource",
  resourceType: "Teacher resource",
  audienceRole: "teacher",
  tags: ["Administration", "Circulars", "Transfers", "Promotions", "Foreign leave", "Free"],
  breadcrumbs: [{ label: "English Teachers Resources", url: "teacher-resources/" }],
  backTo: { label: "English Teachers Resources", url: "teacher-resources/" },
  hero: { text: "Where the documents that govern your service actually live - service, transfers, promotions, the Efficiency Bar, foreign leave and pay. Linked to the official source, never copied." },
  blocks
};

const TITLE_MAX = 60, DESC_MIN = 140, DESC_MAX = 160;
const t = page.metaTitle || page.title;
if (t.length > TITLE_MAX) throw new Error(`title is ${t.length} characters, over ${TITLE_MAX}: "${t}"`);
if (page.description.length < DESC_MIN || page.description.length > DESC_MAX) {
  throw new Error(`description is ${page.description.length} characters, not ${DESC_MIN}-${DESC_MAX}`);
}

fs.writeFileSync(
  path.join(ROOT, "_src/pages/admin-docs.json"),
  JSON.stringify({
    _readme: [
      "TEACHER ADMINISTRATIVE DOCUMENTS",
      "Generated by tools/admin-docs/gen.js from data/admin-docs.json.",
      "Do not edit by hand. This register links to official sources and never",
      "hosts copies; the generator refuses an entry that tries to."
    ],
    pages: [page]
  }, null, 2) + "\n"
);

const withDocs = categories.filter((c) => byCategory(c.id).length).length;
console.log(`  Register built: ${documents.length} documents across ${withDocs} of ${categories.length} sections.`);
categories.forEach((c) => {
  const n = byCategory(c.id).length;
  console.log(`    ${n ? String(n).padStart(2) : " -"}  ${c.name}`);
});
console.log("  Every link points at an official source. No copies are hosted.");
