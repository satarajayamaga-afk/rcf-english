// Checks every link in data/assistant.json against the built search index.
// Usage: node tools/check-assistant.js
//
// This exists because the build's own link checker cannot see these links.
// They are written into the page by JavaScript at run time, so a wrong slug
// here produces a 404 that no build would ever report - the worst kind of
// broken link, because nothing tells you about it.
//
// Run it after editing data/assistant.json, and after any change that moves
// or renames a page.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8").replace(/^﻿/, ""));

const data = read("data/assistant.json");
const index = read("data/search-index.json");
const known = new Set(index.map((e) => String(e.url || "")));

const problems = [];
const seenIds = new Set();
let links = 0;

for (const it of data.intents || []) {
  if (!it.id) problems.push("an intent has no id");
  if (seenIds.has(it.id)) problems.push(`two intents share the id "${it.id}"`);
  seenIds.add(it.id);
  if (!it.must || !it.must.length) problems.push(`"${it.id}" has no 'must' words, so it can never match`);
  if (!it.answer) problems.push(`"${it.id}" has no answer`);
  if (it.answer && it.answer.length > 400) problems.push(`"${it.id}" answer is ${it.answer.length} characters; keep it under 400 and let the links do the work`);
  if (!it.links || !it.links.length) problems.push(`"${it.id}" has no links`);
  for (const l of it.links || []) {
    links++;
    if (!l.url) { problems.push(`"${it.id}" has a link with no url`); continue; }
    if (!known.has(l.url)) problems.push(`"${it.id}" links to ${l.url} - there is no such page`);
  }
}

// The fallback links written into ask.js must exist too. They are listed here
// rather than parsed out of the file, so if you change them there, change
// them here as well and this check will hold you to it.
for (const u of ["search/", "about/online-communities/", "contact/"]) {
  links++;
  if (!known.has(u)) problems.push(`the fallback link ${u} in assets/js/ask.js has no such page`);
}

if (!data.suggestions || data.suggestions.length < 3) {
  problems.push("there should be at least three starter suggestions");
}

if (problems.length) {
  console.log("\n  Ask RCF English has problems:\n");
  problems.forEach((p) => console.log("    " + p));
  console.log("");
  process.exit(1);
}

console.log(`  Ask RCF English is fine: ${seenIds.size} answers, ${links} links, all pointing at real pages.`);
