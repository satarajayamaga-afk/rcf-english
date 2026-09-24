// Audits every page in _src/pages against the things that actually matter for
// search and for an AdSense review: a unique title and description on each
// page, sensible lengths, and enough original prose on pages whose main
// business is a list of downloads.
//
//   node tools/seo-audit.js            a summary and the worst offenders
//   node tools/seo-audit.js --all      every page that fails something
const fs = require("fs");
const path = require("path");

const DIR = path.resolve(__dirname, "../_src/pages");
const ALL = process.argv.includes("--all");
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;
// Below this, a page is thin for a reviewer who is asking "is there anything
// here besides links?"
const WORDS_MIN = 200;
// Blocks that list things to download or open elsewhere.
const LISTING = ["paperLibrary", "browse", "finder", "planFinder", "table", "premium-products", "publications", "classes"];

// Pulls every piece of human-readable text out of a page's blocks.
function words(page) {
  let text = "";
  const walk = (v, key) => {
    if (v == null) return;
    if (typeof v === "string") {
      // Skip things that are not prose read by a visitor.
      if (["url", "slug", "type", "style", "icon", "id", "code", "kind", "schema", "keywords", "metaTitle"].includes(key)) return;
      text += " " + v;
      return;
    }
    if (Array.isArray(v)) return v.forEach((x) => walk(x, key));
    if (typeof v === "object") return Object.keys(v).forEach((k) => walk(v[k], k));
  };
  walk(page.hero, "hero");
  walk(page.blocks, "blocks");
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // markdown links: keep the words
    .replace(/[*_~`#>|-]+/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w)).length;
}

const pages = [];
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  let raw = fs.readFileSync(path.join(DIR, file), "utf8");
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  let doc;
  try { doc = JSON.parse(raw); } catch (err) { console.log("UNREADABLE " + file + ": " + err.message); continue; }
  (doc.pages || []).forEach((p) => pages.push({ file, page: p }));
}

const titles = new Map();
const descs = new Map();
const problems = { dupTitle: [], dupDesc: [], noDesc: [], longTitle: [], badDesc: [], thin: [], noindex: 0 };

for (const { file, page } of pages) {
  if (page.noindex === true) { problems.noindex++; continue; }
  const slug = page.slug || "(home)";
  const title = page.metaTitle || page.title || "";
  const desc = page.description || "";

  (titles.get(title) || titles.set(title, []).get(title)).push(slug);
  if (desc) (descs.get(desc) || descs.set(desc, []).get(desc)).push(slug);

  if (title.length > TITLE_MAX) problems.longTitle.push([title.length, slug, title]);
  if (!desc) problems.noDesc.push([0, slug, "(no description)"]);
  else if (desc.length < DESC_MIN || desc.length > DESC_MAX) problems.badDesc.push([desc.length, slug, desc.slice(0, 70)]);

  const n = words(page);
  const listing = (page.blocks || []).some((b) => LISTING.includes(b.type));
  if (n < WORDS_MIN) problems.thin.push([n, slug, listing ? "LISTING PAGE" : "", file]);
}

for (const [t, slugs] of titles) if (slugs.length > 1) problems.dupTitle.push([slugs.length, t, slugs]);
for (const [d, slugs] of descs) if (slugs.length > 1) problems.dupDesc.push([slugs.length, d.slice(0, 60), slugs]);

const show = (label, rows, fmt) => {
  console.log(`\n${label}: ${rows.length}`);
  const list = ALL ? rows : rows.slice(0, 8);
  list.forEach((r) => console.log("   " + fmt(r)));
  if (!ALL && rows.length > list.length) console.log(`   ... and ${rows.length - list.length} more (run with --all)`);
};

console.log(`\nAudited ${pages.length} pages (${problems.noindex} noindex pages skipped)`);
problems.longTitle.sort((a, b) => b[0] - a[0]);
problems.badDesc.sort((a, b) => b[0] - a[0]);
problems.thin.sort((a, b) => a[0] - b[0]);
show("Duplicate titles", problems.dupTitle, ([n, t, s]) => `${n}x  "${t}"  -> ${s.slice(0, 3).join(", ")}`);
show("Duplicate descriptions", problems.dupDesc, ([n, d, s]) => `${n}x  "${d}..."  -> ${s.slice(0, 3).join(", ")}`);
show("Missing descriptions", problems.noDesc, ([, s]) => s);
show(`Titles over ${TITLE_MAX} characters`, problems.longTitle, ([n, s]) => `${String(n).padStart(3)}  ${s}`);
show(`Descriptions outside ${DESC_MIN}-${DESC_MAX}`, problems.badDesc, ([n, s]) => `${String(n).padStart(3)}  ${s}`);
show(`Pages under ${WORDS_MIN} words`, problems.thin, ([n, s, tag]) => `${String(n).padStart(4)} words  ${s}  ${tag}`);
console.log("");
