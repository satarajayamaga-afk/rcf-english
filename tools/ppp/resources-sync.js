// Lists the lesson-plan downloads in data/resources.json, so they appear in
// the "Downloadable planning documents" filter on the Lesson Plans page and in
// All Learning Resources, found by grade like everything else.
//
// That filter used to hold one lesson plan, the O/L Literature SBA plans, so
// choosing any grade returned nothing. The entries are made from the same
// download list as the plans themselves (gen.js), and replaced on every run,
// so they cannot drift from the files.
// Usage: node tools/ppp/resources-sync.js   (after gen.js and downloads.js)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const D = __dirname;
const L = Object.assign({}, require(D + "/g3-g6.js"), require(D + "/g4.js"), require(D + "/g7-g8.js"), require(D + "/g9-g11.js"), require(D + "/al.js"));
const ORDER = ["g3", "g4", "g6", "g7", "g8", "g9", "g10", "g11", "al"];
const HUB = "teacher-resources/ppp-lesson-plans";
const DL = "assets/downloads/teacher/";

const kb = (file) => {
  const p = path.join(ROOT, DL, file);
  if (!fs.existsSync(p)) throw new Error("Missing download " + file + ": run downloads.js first");
  const n = fs.statSync(p).size;
  return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB";
};

const entries = [];
for (const k of ORDER) {
  const g = L[k];
  const file = `rcf-english-${g.slug}-ppp-lesson-plans`;
  entries.push({
    id: `rcf-ppp-lesson-plans-${g.slug}`,
    title: `${g.label} PPP Lesson Plans (${g.plans.length} plans)`,
    description: `${g.plans.length} sample 40-minute PPP English lesson plans for ${g.label}, each built on a unit and activity in the ${g.book}, with the learning outcome, materials, timed stages and homework. One PDF ready to print; an editable Word copy is on the plans page.`,
    category: "teacher-resources",
    subcategory: "planning",
    subject: "English",
    level: k === "al" ? "Advanced Level" : g.label,
    ...(k === "al" ? { examination: "al" } : {}),
    type: "lesson-plan",
    duration: "40 minutes",
    author: "RCF English",
    added: "2026-09-21",
    keywords: `${g.label} English lesson plans, PPP lesson plans, ${g.label} lesson plan PDF, Sri Lanka English lesson plans`,
    url: `${HUB}/${g.slug}/`,
    download: `${DL}${file}.pdf`,
    fileSize: kb(`${file}.pdf`),
    copyright: "RCF English material, free to use",
    anonymousAccess: "verified",
    published: true
  });
}
for (const [id, file, title, page, description] of [
  ["rcf-annual-term-plan-templates", "rcf-english-annual-term-plan-templates", "Annual and Term Plan Templates, Grades 2 to 13",
    "teacher-resources/annual-term-plan-templates/",
    "An annual plan (scheme of work) and a term plan template, with the units of each grade's Pupil's Book listed, ready to fill in with your own dates."],
  ["rcf-daily-weekly-notes-templates", "rcf-english-daily-weekly-notes-templates", "Daily and Weekly Notes (Record of Work) Templates",
    "teacher-resources/daily-weekly-notes-templates/",
    "Record-of-work forms for daily and weekly notes, with a completed sample entry for each grade."]
]) {
  entries.push({
    id, title, description,
    category: "teacher-resources", subcategory: "planning", subject: "English",
    level: "All grades", type: "lesson-plan",
    author: "RCF English", added: "2026-09-21",
    keywords: "English teacher planning templates, scheme of work template, record of work Sri Lanka",
    url: page, download: `${DL}${file}.pdf`, fileSize: kb(`${file}.pdf`),
    copyright: "RCF English material, free to use", anonymousAccess: "verified", published: true
  });
}

const f = path.join(ROOT, "data/resources.json");
const raw = fs.readFileSync(f, "utf8");
const bom = raw.charCodeAt(0) === 0xFEFF ? "﻿" : "";
const data = JSON.parse(bom ? raw.slice(1) : raw);
const ours = new Set(entries.map((e) => e.id));
let replaced = 0;
data.items = data.items.filter((i) => { if (ours.has(i.id)) { replaced++; return false; } return true; });
data.items.push(...entries);
fs.writeFileSync(f, bom + JSON.stringify(data, null, 2) + "\n");
console.log(`${entries.length} planning entries written (${replaced} replaced); resources now ${data.items.length}`);
