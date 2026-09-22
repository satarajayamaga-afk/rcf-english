// Makes the Word (.docx) and PDF downloads for the pages in
// _src/pages/teacher-resources-ppp.json.
// Usage: node tools/ppp/downloads.js
// Needs only Node and Microsoft Edge (for the PDFs); no packages.
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "_src/pages/teacher-resources-ppp.json");
const OUTDIR = path.join(ROOT, "assets/downloads/teacher");
const SITE = "https://rcfenglish.com/";
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));

const { DOWNLOADS } = require("./gen.js");
const pages = JSON.parse(fs.readFileSync(SRC, "utf8")).pages;

// ---------- inline text: **bold** and [text](url) ----------
function runs(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: m[1], b: true });
    else out.push({ t: m[2], url: /^https?:/.test(m[3]) ? m[3] : SITE + m[3] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.map((r) => ({ ...r, t: r.t.replace(/\*([^*]+)\*/g, "$1") }));
}
const plain = (text) => runs(text).map((r) => r.t).join("");

// The printable content of a page: everything except the navigation cards
// and the download box itself.
function content(page) {
  // A grade page shows its plans on the web as a grid of cards, one per plan
  // page. The printed copy needs the plans themselves, so the grid is
  // replaced by the full plans that gen.js keeps in printBlocks.
  const blocks = page.blocks.flatMap((b) => (b.type === "planFinder" ? page.printBlocks || [] : [b]));
  const list = blocks.filter((b) => b.type !== "cards" && !b._download).map((b) => ({ ...b }));
  let first = true;
  list.forEach((b, i) => {
    if (!b._pageBreak) return;
    const prev = list[i - 1];
    if (prev && prev.type === "prose" && !(prev.text || []).length) { prev._pageBreak = true; b._pageBreak = false; }
  });
  // never break before the first content on the page
  for (const b of list) { if (b._pageBreak && first) b._pageBreak = false; if (b._pageBreak) break; if (b.type === "table" || b.type === "plan") first = false; }
  return list;
}

// ---------- DOCX ----------
const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wr = (r, extra = "") => `<w:r>${r.b || extra ? `<w:rPr>${r.b ? "<w:b/>" : ""}${extra}</w:rPr>` : ""}<w:t xml:space="preserve">${x(r.t)}</w:t></w:r>`;
function para(text, style, opts = {}) {
  const ppr = [style ? `<w:pStyle w:val="${style}"/>` : "", opts.keep ? "<w:keepNext/>" : ""].join("");
  const extra = (opts.bold ? "<w:b/>" : "") + (opts.colour ? `<w:color w:val="${opts.colour}"/>` : "");
  const body = runs(text).map((r) => r.url ? wr(r) + wr({ t: ` (${r.url})` }, '<w:sz w:val="18"/>') : wr(r, extra)).join("");
  return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${body}</w:p>`;
}
function widths(block, total) {
  const cols = block.columns.length;
  const w = block.columns.map((c, i) => {
    const longest = Math.max(c.length, ...block.rows.map((r) => plain(String(r[i] || "")).length));
    return Math.min(Math.max(longest, 8), 60);
  });
  if (block.rows.every((r) => r.slice(1).every((c) => !c))) w.fill(1); // blank template: equal columns
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((v) => Math.floor((total * v) / sum)).map((v, i, a) => (i === cols - 1 ? total - a.slice(0, -1).reduce((p, q) => p + q, 0) : v));
}
// The colour code, kept in one place because the Word file, the PDF and the
// web page all have to agree. Each entry is a pale row fill and a darker ink
// for the stage name, matching the CSS in assets/css/styles.css.
const STAGE_COLOURS = {
  presentation: { fill: "EFF4FB", ink: "0F2647", bar: "1E4276" },
  practice: { fill: "EDF7F4", ink: "08503F", bar: "0E7C66" },
  production: { fill: "FDF6E8", ink: "7D5205", bar: "B07C12" },
  close: { fill: "F7F9FB", ink: "33404F", bar: "8E98A4" }
};
function table(block, total) {
  const grid = widths(block, total);
  const styles = block.rowStyles || [];
  const cell = (text, i, head, stage) => {
    const c = stage ? STAGE_COLOURS[stage] : null;
    const fill = head ? "DCE6F2" : c && c.fill;
    // Only the stage name takes the colour, so the plan still reads as a plan
    // rather than as coloured text.
    const ink = c && i === 0 ? c.ink : null;
    // sz is in eighths of a point, so 18 is the 2.25pt bar down the left edge.
    const bar = ink ? `<w:tcBorders><w:left w:val="single" w:sz="18" w:space="0" w:color="${c.bar}"/></w:tcBorders>` : "";
    const tcPr = `<w:tcW w:w="${grid[i]}" w:type="dxa"/>${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ""}${bar}`;
    return `<w:tc><w:tcPr>${tcPr}</w:tcPr>${para(String(text || ""), "TableText", { bold: head || Boolean(ink), colour: ink })}</w:tc>`;
  };
  const head = `<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>${block.columns.map((c, i) => cell(c, i, true)).join("")}</w:tr>`;
  const rows = block.rows.map((r, ri) => {
    const blank = r.slice(1).every((c) => !c);
    const stage = STAGE_COLOURS[styles[ri]] ? styles[ri] : null;
    return `<w:tr><w:trPr><w:cantSplit/>${blank ? '<w:trHeight w:val="700"/>' : ""}</w:trPr>${block.columns.map((c, i) => cell(r[i], i, false, stage)).join("")}</w:tr>`;
  }).join("");
  const b = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="8FA3BF"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblBorders>${b}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid.map((g) => `<w:gridCol w:w="${g}"/>`).join("")}</w:tblGrid>${head}${rows}</w:tbl><w:p/>`;
}
// ---------- the plan card, in Word ----------
// Word has no panels, so each panel is a one-column table: a shaded header
// row for the stage and its time, and a plain row underneath for the text.
const BORDERS = (colour) => ["top", "left", "bottom", "right", "insideH", "insideV"]
  .map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="${colour}"/>`).join("");

function tcell(text, w, o = {}) {
  const shd = o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : "";
  const bar = o.bar ? `<w:tcBorders><w:left w:val="single" w:sz="24" w:space="0" w:color="${o.bar}"/></w:tcBorders>` : "";
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shd}${bar}</w:tcPr>${para(String(text || ""), "TableText", { bold: o.bold, colour: o.colour })}</w:tc>`;
}
const trow = (cells) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr>`;
const tbl = (rows, grid, border) =>
  `<w:tbl><w:tblPr><w:tblW w:w="${grid.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${BORDERS(border || "8FA3BF")}</w:tblBorders>` +
  `<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
  `<w:tblGrid>${grid.map((g) => `<w:gridCol w:w="${g}"/>`).join("")}</w:tblGrid>${rows}</w:tbl>`;

function planDocx(block, total) {
  let out = "";
  const banner = (block.eyebrow ? trow(tcell(block.eyebrow, total, { fill: "0F2647", colour: "C2913F", bold: true })) : "") +
    trow(tcell(block.heading || "", total, { fill: "0F2647", colour: "FFFFFF", bold: true }));
  out += tbl(banner, [total], "0F2647") + "<w:p/>";

  if (block.facts && block.facts.length) {
    const w1 = Math.round(total * 0.28);
    const grid = [w1, total - w1];
    const rows = block.facts
      .map(([label, value]) => trow(tcell(label, grid[0], { bold: true, fill: "F2F5FA" }) + tcell(value, grid[1])))
      .join("");
    out += para("At a glance", "TableText", { bold: true, keep: true }) + tbl(rows, grid) + "<w:p/>";
  }

  for (const stage of block.stages || []) {
    const c = STAGE_COLOURS[stage.style] || STAGE_COLOURS.close;
    const head = [stage.name, stage.time].filter(Boolean).join("  ·  ");
    out += tbl(
      trow(tcell(head, total, { fill: c.fill, colour: c.ink, bold: true, bar: c.bar })) +
      trow(tcell((stage.text || []).join(" "), total, { bar: c.bar })),
      [total]) + "<w:p/>";
  }

  if (block.homework) { out += para("**Homework:** " + block.homework, "TableText") + "<w:p/>"; }
  if (block.caption) { out += para("*" + block.caption + "*", "TableText") + "<w:p/>"; }
  return out;
}

function docxBody(page, landscape) {
  const margin = 900;
  const total = (landscape ? 16838 : 11906) - 2 * margin;
  const hs = { h2: "Heading1", h3: "Heading2", h4: "Heading3" };
  const PB = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  let body = para(page.title, "Title") + para(page.hero.text, "Subtitle");
  for (const b of content(page)) {
    if (b.type === "callout") {
      body += para(b.title, "Heading3", { keep: true });
      for (const t of b.text) body += para(t, "Note");
    } else if (b.type === "prose") {
      if (b._pageBreak) body += PB;
      if (b.heading) body += para(b.heading, hs[b.level || "h2"], { keep: true });
      for (const t of b.text || []) body += para(t);
    } else if (b.type === "table") {
      if (b._pageBreak) body += PB;
      if (b.heading) body += para(b.heading, hs[b.level || "h2"], { keep: true });
      for (const t of b.intro || []) body += para(t, null, { keep: true });
      body += table(b, total);
    } else if (b.type === "plan") {
      if (b._pageBreak) body += PB;
      body += planDocx(b, total);
    }
  }
  const pg = landscape ? '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' : '<w:pgSz w:w="11906" w:h="16838"/>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rId2"/>${pg}<w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:i/><w:color w:val="44546A"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:color w:val="0F6B63"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="200"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="40" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="666666"/><w:sz w:val="16"/></w:rPr></w:style>
</w:styles>`;
const FOOTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:t xml:space="preserve">RCF English · rcfenglish.com · Written by RCF English; free to copy and adapt for teaching · Page </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
function docx(page, landscape) {
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x(page.title)}</dc:title><dc:creator>RCF English</dc:creator></cp:coreProperties>`;
  return zip([
    ["[Content_Types].xml", ct], ["_rels/.rels", rels], ["word/_rels/document.xml.rels", docRels],
    ["word/document.xml", docxBody(page, landscape)], ["word/styles.xml", STYLES], ["word/footer1.xml", FOOTER], ["docProps/core.xml", core]
  ]);
}

// Minimal ZIP writer (deflate). A fixed timestamp keeps the files identical
// between builds when the content has not changed.
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, text] of entries) {
    const data = Buffer.from(text, "utf8");
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data);
    const nameBuf = Buffer.from(name, "utf8");
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt16LE(0, 10); h.writeUInt16LE(0x5a21, 12); // 2025-01-01 00:00
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22);
    h.writeUInt16LE(nameBuf.length, 26); h.writeUInt16LE(0, 28);
    locals.push(h, nameBuf, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(0x5a21, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24);
    c.writeUInt16LE(nameBuf.length, 28); c.writeUInt32LE(offset, 42);
    centrals.push(c, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------- PDF (through a plain print page and Edge) ----------
const h = (s) => x(s);
function htmlInline(text) {
  return runs(text).map((r) => r.url ? `<a href="${h(r.url)}">${h(r.t)}</a>` : r.b ? `<strong>${h(r.t)}</strong>` : h(r.t)).join("");
}
function printHtml(page, landscape) {
  let body = `<p class="brand">RCF English · rcfenglish.com</p><h1>${h(page.title)}</h1><p class="lead">${h(page.hero.text)}</p>`;
  for (const b of content(page)) {
    const tag = b.level === "h3" || b.level === "h4" ? b.level : "h2";
    const pb = b._pageBreak ? ' class="pb"' : "";
    if (b.type === "plan") {
      const facts = (b.facts || []).map(([k, v]) => `<div><dt>${h(k)}</dt><dd>${htmlInline(String(v))}</dd></div>`).join("");
      const stages = (b.stages || []).map(function (s) {
        return `<section class="pl-stage s-${h(s.style || "close")}">` +
          `<h4><span>${h(s.name)}</span><em>${h(s.time || "")}</em></h4>` +
          `<div class="pl-body"><p>${(s.text || []).map(htmlInline).join(" ")}</p></div></section>`;
      }).join("");
      body += `<article class="plan${b._pageBreak ? " pb" : ""}">` +
        `<header class="pl-banner">${b.eyebrow ? `<p class="pl-eyebrow">${h(b.eyebrow)}</p>` : ""}<h2>${htmlInline(b.heading || "")}</h2></header>` +
        (facts ? `<div class="pl-panel"><h4 class="pl-label">At a glance</h4><dl class="pl-facts">${facts}</dl></div>` : "") +
        stages +
        (b.homework ? `<p class="pl-hw"><span>Homework</span> ${htmlInline(b.homework)}</p>` : "") +
        (b.caption ? `<p class="pl-cap">${htmlInline(b.caption)}</p>` : "") +
        `</article>`;
    }
    else if (b.type === "callout") body += `<div class="note"><h4>${h(b.title)}</h4>${b.text.map((t) => `<p>${htmlInline(t)}</p>`).join("")}</div>`;
    else if (b.type === "prose") body += `<section${pb}>${b.heading ? `<${tag}>${htmlInline(b.heading)}</${tag}>` : ""}${(b.text || []).map((t) => `<p>${htmlInline(t)}</p>`).join("")}</section>`;
    else if (b.type === "table") {
      const blank = (r) => r.slice(1).every((c) => !c);
      const styles = b.rowStyles || [];
      const cls = (r, ri) => {
        const c = [blank(r) ? "blank" : "", STAGE_COLOURS[styles[ri]] ? "s-" + styles[ri] : ""].filter(Boolean);
        return c.length ? ` class="${c.join(" ")}"` : "";
      };
      body += `<section class="t${b._pageBreak ? " pb" : ""}">${b.heading ? `<${tag}>${htmlInline(b.heading)}</${tag}>` : ""}${(b.intro || []).map((t) => `<p>${htmlInline(t)}</p>`).join("")}<table><thead><tr>${b.columns.map((c) => `<th>${h(c)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r, ri) => `<tr${cls(r, ri)}>${b.columns.map((c, i) => `<td>${htmlInline(String(r[i] || ""))}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`;
    }
  }
  body += `<p class="foot">Written by RCF English. Free to copy and adapt for teaching. The latest version is at ${h(SITE + page.slug + "/")}</p>`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${h(page.title)}</title><style>
@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 14mm; }
body { font: 10pt/1.4 Calibri, "Segoe UI", Arial, sans-serif; color: #1b1b1b; }
.brand { color: #0f6b63; font-weight: 700; font-size: 9pt; margin: 0; }
h1 { color: #1f3a5f; font-size: 19pt; margin: 4px 0 4px; }
.lead { color: #44546a; font-style: italic; margin-top: 0; }
h2 { color: #1f3a5f; font-size: 13pt; margin: 16px 0 4px; break-after: avoid; }
h3 { color: #1f3a5f; font-size: 11.5pt; margin: 14px 0 4px; break-after: avoid; }
h4 { margin: 0 0 4px; color: #0f6b63; }
p { margin: 3px 0; }
.note { border-left: 3px solid #0f6b63; background: #eef6f5; padding: 6px 10px; margin: 10px 0; break-inside: avoid; }
section.t { break-inside: auto; }
section.t > p { break-after: avoid; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; }
th, td { border: 1px solid #8fa3bf; padding: 4px 6px; text-align: left; vertical-align: top; }
th { background: #dce6f2; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
tr.blank td { height: 34px; }
/* The stage colours, from the one table above so the PDF, the Word file and
   the web page cannot drift apart. A PDF is not paper, so the fills have to
   be forced: Edge drops backgrounds when printing unless told otherwise. */
${Object.entries(STAGE_COLOURS).map(([k, c]) =>
  `tr.s-${k} td { background: #${c.fill}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
tr.s-${k} td:first-child { border-left: 2.25pt solid #${c.bar}; color: #${c.ink}; font-weight: 700; }`).join("\n")}
a { color: #1f3a5f; }
.pb { break-before: page; }

/* The plan card. Colours are forced: a PDF is not paper, and Edge drops
   backgrounds when printing unless it is told to keep them. */
.plan { border: 1px solid #c4cdd8; border-radius: 6px; overflow: hidden; margin: 10px 0 14px; break-inside: avoid; }
.pl-banner { background: #0f2647; border-bottom: 2pt solid #c2913f; padding: 6px 10px;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; break-after: avoid; }
.pl-banner h2 { color: #fff; margin: 0; font-size: 13pt; }
.pl-eyebrow { color: #c2913f; margin: 0 0 1px; font-size: 8pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.pl-panel { margin: 8px; padding: 6px 8px; border: 1px solid #dde3ea; border-radius: 4px; background: #f7f9fb;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; break-inside: avoid; }
.pl-label { margin: 0 0 4px; color: #56616f; font-size: 8pt; letter-spacing: 0.06em; text-transform: uppercase; }
.pl-facts { margin: 0; }
.pl-facts div { display: flex; gap: 8px; margin-bottom: 2px; }
.pl-facts dt { flex: 0 0 26%; margin: 0; font-weight: 700; color: #0f2647; }
.pl-facts dd { flex: 1 1 auto; margin: 0; }
.pl-stage { margin: 8px; border: 1px solid #dde3ea; border-radius: 4px; overflow: hidden; break-inside: avoid; }
.pl-stage h4 { display: flex; justify-content: space-between; gap: 8px; margin: 0; padding: 4px 8px;
  border-bottom: 1px solid #dde3ea; font-size: 10pt; letter-spacing: 0.04em; text-transform: uppercase;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pl-stage h4 em { font-style: normal; font-size: 8.5pt; }
.pl-body { padding: 5px 8px; }
.pl-body p { margin: 0; }
.pl-hw { margin: 8px; padding: 4px 8px; border: 1px dashed #c4cdd8; border-radius: 4px; break-inside: avoid; }
.pl-hw span { color: #0f2647; font-weight: 700; font-size: 8pt; letter-spacing: 0.05em; text-transform: uppercase; margin-right: 4px; }
.pl-cap { margin: 0 8px 8px; color: #56616f; font-size: 8pt; }
${Object.entries(STAGE_COLOURS).map(([k, c]) =>
  `.pl-stage.s-${k} { border-left: 3pt solid #${c.bar}; }
.pl-stage.s-${k} h4 { background: #${c.fill}; color: #${c.ink}; }`).join("\n")}
h4 { font-size: 10.5pt; margin: 8px 0 2px; color: #1f3a5f; break-after: avoid; }
.foot { margin-top: 16px; color: #666; font-size: 8.5pt; }
</style></head><body>${body}</body></html>`;
}
function pdf(page, landscape, outFile) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rcf-pdf-"));
  const src = path.join(tmp, "page.html");
  fs.writeFileSync(src, printHtml(page, landscape));
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${path.join(tmp, "profile")}`,
    "--no-pdf-header-footer", `--print-to-pdf=${outFile}`, "file:///" + src.replace(/\\/g, "/")], { stdio: "ignore", timeout: 120000 });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!fs.existsSync(outFile)) throw new Error("PDF not made: " + outFile);
}

// ---------- run ----------
fs.mkdirSync(OUTDIR, { recursive: true });
if (!EDGE) console.log("Microsoft Edge not found: PDFs will be skipped.");
for (const d of DOWNLOADS) {
  const page = pages.find((p) => p.slug === d.slug);
  if (!page) throw new Error("No page " + d.slug);
  fs.writeFileSync(path.join(OUTDIR, d.file + ".docx"), docx(page, d.landscape));
  if (EDGE) pdf(page, d.landscape, path.join(OUTDIR, d.file + ".pdf"));
  const kb = (f) => Math.round(fs.statSync(path.join(OUTDIR, f)).size / 1024);
  console.log(`${d.file}: docx ${kb(d.file + ".docx")} KB` + (EDGE ? `, pdf ${kb(d.file + ".pdf")} KB` : ""));
}
