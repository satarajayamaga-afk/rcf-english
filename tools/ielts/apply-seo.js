// Gives the hand-written IELTS answer pages - model essays 1 to 10 and the six
// Task 1 tutorials - the same tags, structured data and share row that
// gen-essays.js gives essays 11 to 20. Safe to run again: it replaces what it
// added last time rather than adding it twice.
// Usage: node tools/ielts/apply-seo.js
const fs = require("fs");
const path = require("path");
const seo = require("./seo.js");

const ROOT = path.resolve(__dirname, "../..");
const ESSAYS = "practical-english/ielts/model-essays";
const GRAPHS = "practical-english/ielts/graphs";

function edit(file, fn) {
  const full = path.join(ROOT, "_src/pages", file);
  const raw = fs.readFileSync(full, "utf8");
  const bom = raw.charCodeAt(0) === 0xFEFF ? "﻿" : "";
  const data = JSON.parse(bom ? raw.slice(1) : raw);
  const changed = fn(data);
  fs.writeFileSync(full, bom + JSON.stringify(data, null, 2) + "\n");
  return changed;
}

// Essays 1 to 10. Their kickers still said "of 10" after essays 11 to 20
// were added; the set is twenty now.
let essays = 0;
for (const file of ["practical-english-ielts-essays.json", "practical-english-ielts-essays-2.json"]) {
  essays += edit(file, (d) => {
    let n = 0;
    for (const p of d.pages) {
      if (!p.slug.startsWith(ESSAYS + "/")) continue;
      const slug = p.slug.slice(ESSAYS.length + 1);
      const m = /^Model essay (\d+) of \d+: (.+)$/.exec(p.kicker || "");
      if (!m) throw new Error(`${slug}: unexpected kicker "${p.kicker}"`);
      const type = m[2];
      p.kicker = `Model essay ${m[1]} of 20: ${type}`;
      p.tags = seo.essayTags(slug, type);
      Object.assign(p, seo.ESSAY_SCHEMA);
      const name = p.title.replace(/^Model Essay \d+:\s*/, "");
      p.blocks = seo.withShare(p.blocks, seo.shareBlock(
        `IELTS Writing Task 2 sample answer: ${name}, with the plan, useful language and how it meets the four criteria.`,
        seo.HASHTAGS_TASK2));
      n++;
    }
    return n;
  });
}

// The Task 1 tutorials. The chart type is the thing a candidate searches for.
const CHART = {
  "line-graph": "Line graph",
  "bar-chart": "Bar chart",
  "pie-charts": "Pie charts",
  "table": "Table",
  "process-diagram": "Process diagram",
  "maps": "Maps"
};
const graphs = edit("practical-english-ielts-graphs.json", (d) => {
  let n = 0;
  for (const p of d.pages) {
    if (p.slug === GRAPHS) {
      p.tags = ["IELTS Writing Task 1", "IELTS Academic", "Graphs and charts", "Process diagrams and maps", "Model answers"];
      Object.assign(p, seo.TASK1_SCHEMA);
      p.blocks = seo.withShare(p.blocks, seo.shareBlock(
        "IELTS Academic Writing Task 1: six step-by-step tutorials, from line graphs to maps, each with a model answer.",
        seo.HASHTAGS_TASK1));
      n++;
      continue;
    }
    const slug = p.slug.slice(GRAPHS.length + 1);
    const chart = CHART[slug];
    if (!chart) throw new Error(`No chart type for ${p.slug}`);
    const hasModel = (p.blocks || []).some((b) => b.type === "model");
    p.tags = ["IELTS Writing Task 1", "IELTS Academic", chart, ...(hasModel ? ["Model answer"] : [])];
    Object.assign(p, seo.TASK1_SCHEMA);
    p.blocks = seo.withShare(p.blocks, seo.shareBlock(
      `IELTS Academic Writing Task 1, ${chart.toLowerCase()}: a step-by-step tutorial${hasModel ? " with a model answer" : ""}.`,
      seo.HASHTAGS_TASK1));
    n++;
  }
  return n;
});

console.log(`essays 1-10 updated: ${essays}; Task 1 pages updated: ${graphs}`);
