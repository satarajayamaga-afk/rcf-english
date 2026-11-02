// Convert the lesson-plan documents from .docx to the Markdown that
// ./index.js parses.
//
// The plans are written in Google Docs and arrive as a downloaded folder of
// .docx files. This reads the WordprocessingML and writes one Markdown file
// per plan into ./plans, named from the document's own "NN-LL" prefix.
//
// It handles only what these documents actually use: headings, bold, italic,
// numbered and bulleted lists, and tables. That is deliberate - a general
// .docx converter would be a far bigger thing and would not be more correct
// for this job.
//
//   node docx-to-md.js <xmlDir> <manifest.tsv> [outDir]
//
// where xmlDir holds word/document.xml as NNN.xml and word/numbering.xml as
// NNN.num.xml for each document, and manifest.tsv maps NNN to the original
// file name. tools/esl/grammar/README-batches.md records how to produce them.

const fs = require("fs");
const path = require("path");

const [, , XML_DIR, MANIFEST, OUT_DIR_ARG] = process.argv;
if (!XML_DIR || !MANIFEST) {
  console.error("usage: node docx-to-md.js <xmlDir> <manifest.tsv> [outDir]");
  process.exit(2);
}
const OUT_DIR = OUT_DIR_ARG || path.join(__dirname, "plans");

/* ------------------------------------------------------------------- utils */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const unxml = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ENTITIES[n]);

const all = (s, re) => {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = r.exec(s))) { out.push(m); if (m[0] === "") r.lastIndex++; }
  return out;
};

// An on/off property is on unless it explicitly says otherwise.
const flagOn = (xml, tag) => {
  const m = xml.match(new RegExp(`<w:${tag}(\\s[^>]*)?/?>`));
  if (!m) return false;
  const val = (m[1] || "").match(/w:val="([^"]*)"/);
  return !val || !/^(0|false|off)$/i.test(val[1]);
};

/* -------------------------------------------------------------- list format */

// numId -> format per indent level, read from numbering.xml, so an ordered
// list stays numbered and a bulleted sub-list stays bulleted. The answer keys
// refer to question numbers, so this matters.
function listFormats(numXml) {
  const abstract = {};
  for (const m of all(numXml, /<w:abstractNum[^>]*w:abstractNumId="(\d+)"[\s\S]*?<\/w:abstractNum>/)) {
    const levels = [];
    for (const l of all(m[0], /<w:lvl[^>]*w:ilvl="(\d+)"[\s\S]*?<\/w:lvl>/)) {
      levels[parseInt(l[1], 10)] = (l[0].match(/<w:numFmt w:val="([^"]+)"/) || [])[1] || "bullet";
    }
    abstract[m[1]] = levels;
  }
  const byNum = {};
  for (const m of all(numXml, /<w:num[^>]*w:numId="(\d+)"[\s\S]*?<\/w:num>/)) {
    const aid = (m[0].match(/<w:abstractNumId w:val="(\d+)"/) || [])[1];
    byNum[m[1]] = abstract[aid] || [];
  }
  return byNum;
}

// The format for one item: its own level, falling back to level 0.
const fmtAt = (fmts, numId, ilvl) => {
  const levels = fmts[numId] || [];
  return levels[ilvl] || levels[0] || "bullet";
};

/* ------------------------------------------------------------- inline runs */

// The text of a paragraph, with bold and italic kept. Adjacent runs that share
// formatting are merged first, or a bold phrase split across three runs comes
// out as **a****b****c** and renders as literal asterisks.
function inline(xml) {
  const segs = [];
  const body = xml.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, "").replace(/<w:pPr\/>/, "");
  for (const m of all(body, /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/)) {
    const run = m[1];
    const rPr = (run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || [, ""])[1];
    const bold = flagOn(rPr, "b");
    const italic = flagOn(rPr, "i");
    let text = "";
    for (const t of all(run, /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/)) {
      if (t[0] === "<w:tab/>") text += " ";
      else if (t[0] === "<w:br/>") text += " ";
      else text += unxml(t[1]);
    }
    if (!text) continue;
    const last = segs[segs.length - 1];
    if (last && last.bold === bold && last.italic === italic) last.text += text;
    else segs.push({ text, bold, italic });
  }
  // Markers collide when two runs sit flush against each other. There are
  // exactly two cases, and merging anything else makes a long plain sentence
  // inherit the emphasis of the short phrase next to it.
  //
  //  1. Both sides are emphasised: "arrive" bold-italic then "," italic would
  //     emit ***arrive****,* and render as literal asterisks.
  //  2. One side is emphasised and the join is inside a word: "manag" plus a
  //     bold "ing" would emit manag**ing**, which the renderer will not read
  //     as emphasis mid-word. Only a word fragment is merged this way.
  //
  // A plain "(" before an italic phrase is left alone: "(*aren't*)" is fine.
  const marked = (s) => s.bold || s.italic;
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i], b = segs[i + 1];
      if (/\s$/.test(a.text) || /^\s/.test(b.text)) continue;
      if (a.bold === b.bold && a.italic === b.italic) continue;
      const both = marked(a) && marked(b);
      const midWord = /\w$/.test(a.text) && /^\w/.test(b.text)
        && (marked(a) || marked(b))
        && Math.min(a.text.length, b.text.length) <= 12;
      if (!both && !midWord) continue;
      if (both && Math.min(a.text.length, b.text.length) > 30) continue;
      a.text += b.text;
      a.bold = a.bold || b.bold;
      a.italic = a.italic || b.italic;
      segs.splice(i + 1, 1);
      changed = true;
      i--;
    }
    if (!changed) break;
  }

  return segs.map((s) => {
    if (!s.bold && !s.italic) return s.text;
    const lead = s.text.match(/^\s*/)[0];
    const trail = s.text.match(/\s*$/)[0];
    const core = s.text.slice(lead.length, s.text.length - trail.length);
    if (!core) return s.text;
    const mark = (s.bold ? "**" : "") + (s.italic ? "*" : "");
    return `${lead}${mark}${core}${mark}${trail}`;
  }).join("").replace(/\s+/g, " ").trim();
}

/* ----------------------------------------------------------------- tables */

function renderTable(xml) {
  const rows = [];
  for (const tr of all(xml, /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/)) {
    const cells = [];
    for (const tc of all(tr[1], /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/)) {
      const paras = all(tc[1], /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/)
        .map((p) => inline(p[0]))
        .filter(Boolean);
      const text = paras.join(" ").replace(/\|/g, "\\|").trim();
      cells.push(text);
      // A merged cell spans several columns; the empties keep the row aligned.
      const span = parseInt((tc[1].match(/<w:gridSpan w:val="(\d+)"/) || [])[1] || "1", 10);
      for (let k = 1; k < span; k++) cells.push("");
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => { const c = r.slice(); while (c.length < width) c.push(""); return c; };
  const line = (r) => `| ${pad(r).join(" | ")} |`;
  return [line(rows[0]), `| ${Array(width).fill(":--").join(" | ")} |`, ...rows.slice(1).map(line)].join("\n");
}

/* ------------------------------------------------------- document walking */

// The children of <w:body> in order: paragraphs and tables. Walking with a
// cursor rather than one global regex is what keeps a table's own paragraphs
// out of the top-level stream.
function blocks(xml) {
  const bodyM = xml.match(/<w:body>([\s\S]*)<\/w:body>/);
  const body = bodyM ? bodyM[1] : xml;
  const out = [];
  let i = 0;
  const find = /<w:(p|tbl)(?=[\s>/])/g;
  while (i < body.length) {
    find.lastIndex = i;
    const m = find.exec(body);
    if (!m) break;
    const start = m.index;
    if (m[1] === "tbl") {
      // Tables can nest, so count opens and closes.
      let depth = 0, j = start;
      while (j < body.length) {
        const open = body.indexOf("<w:tbl", j);
        const close = body.indexOf("</w:tbl>", j);
        if (close === -1) { j = body.length; break; }
        if (open !== -1 && open < close && /[\s>/]/.test(body[open + 6] || "")) { depth++; j = open + 6; continue; }
        depth--; j = close + 8;
        if (depth <= 0) break;
      }
      out.push({ kind: "tbl", xml: body.slice(start, j) });
      i = j;
    } else {
      const selfClose = body.slice(start).match(/^<w:p(?:\s[^>]*)?\/>/);
      if (selfClose) { i = start + selfClose[0].length; continue; }
      const end = body.indexOf("</w:p>", start);
      const j = end === -1 ? body.length : end + 6;
      out.push({ kind: "p", xml: body.slice(start, j) });
      i = j;
    }
  }
  return out;
}

const HEADING = { Title: 1, Heading1: 1, Heading2: 2, Heading3: 3, Heading4: 4, Heading5: 5 };

function convert(docXml, numXml) {
  const fmts = listFormats(numXml);
  const out = [];
  let seenTopHeading = false;
  // Numbered items are counted so the source file reads the way the document
  // does. Markdown would renumber a run of "1." correctly, but a teacher
  // opening the Markdown should see the same numbers as the Doc.
  let counter = [];
  let lastList = null;

  const pushRule = () => {
    while (out.length && out[out.length - 1] === "") out.pop();
    if (out.length && out[out.length - 1] !== "---") out.push("---");
  };

  for (const b of blocks(docXml)) {
    if (b.kind === "tbl") {
      const t = renderTable(b.xml);
      if (t) out.push(t);
      lastList = null; counter = [];
      continue;
    }
    const pPr = (b.xml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/) || [, ""])[1];
    const style = (pPr.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || "";
    const level = HEADING[style];
    const numId = (pPr.match(/<w:numId w:val="(\d+)"/) || [])[1];
    const ilvl = parseInt((pPr.match(/<w:ilvl w:val="(\d+)"/) || [])[1] || "0", 10);
    const ruled = /<w:pBdr>/.test(pPr) && /<w:(top|bottom)\b/.test(pPr);
    const text = inline(b.xml);

    // A horizontal rule in the document, and the start of every handout, mark
    // the boundary between the plan and its photocopiable pages.
    if (ruled && !text) { pushRule(); continue; }
    if (!text) continue;

    if (level) {
      if (level === 1) {
        if (seenTopHeading) pushRule();
        seenTopHeading = true;
      }
      out.push(`${"#".repeat(level)} ${text}`);
      lastList = null; counter = [];
      continue;
    }
    if (numId && parseInt(numId, 10) > 0) {
      let marker = "-";
      if (fmtAt(fmts, numId, ilvl) !== "bullet") {
        if (lastList !== numId) counter = [];
        counter.length = Math.max(counter.length, ilvl + 1);
        counter[ilvl] = (counter[ilvl] || 0) + 1;
        counter.length = ilvl + 1;              // a deeper list restarts
        marker = `${counter[ilvl]}.`;
      }
      lastList = numId;
      out.push(`${"   ".repeat(ilvl)}${marker} ${text}`);
      continue;
    }
    lastList = null;
    counter = [];
    out.push(text);
  }

  // One blank line between blocks; list items of the same list stay together.
  const lines = [];
  for (let k = 0; k < out.length; k++) {
    const cur = out[k];
    const prev = out[k - 1];
    const isItem = (s) => /^\s*(?:-|\d+\.)\s/.test(s || "");
    if (k && !(isItem(cur) && isItem(prev))) lines.push("");
    lines.push(cur);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ------------------------------------------------------------------- main */

const manifest = fs.readFileSync(MANIFEST, "utf8").split(/\r?\n/).filter(Boolean)
  .map((l) => l.split("\t"))
  .map(([id, name]) => ({ id, name }));

fs.mkdirSync(OUT_DIR, { recursive: true });
let written = 0;
const skipped = [];
for (const { id, name } of manifest) {
  const prefix = (name.match(/^(\d{2}-[ABC][12])/) || [])[1];
  if (!prefix) { skipped.push(`${id} ${name} (no NN-LL prefix)`); continue; }
  const docPath = path.join(XML_DIR, `${id}.xml`);
  const numPath = path.join(XML_DIR, `${id}.num.xml`);
  if (!fs.existsSync(docPath)) { skipped.push(`${id} ${name} (no document.xml)`); continue; }
  const md = convert(fs.readFileSync(docPath, "utf8"), fs.existsSync(numPath) ? fs.readFileSync(numPath, "utf8") : "");
  fs.writeFileSync(path.join(OUT_DIR, `${prefix}.md`), md, "utf8");
  written++;
}
console.log(`${written} plans written to ${OUT_DIR}`);
if (skipped.length) console.log(`skipped:\n  ${skipped.join("\n  ")}`);
