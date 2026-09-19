// Checks that every activity or lesson a plan cites really appears in that
// unit of the Pupil's Book. Needs the extracted book texts (made with
// `pdftotext -layout book.pdf gN.txt`).
// Usage: node tools/ppp/verify-citations.js <folder with g3.txt, g4.txt, ...>
const fs = require("fs");
const path = require("path");
const L = Object.assign({}, require("./g3-g6.js"), require("./g4.js"), require("./g7-g8.js"), require("./g9-g11.js"));
const dir = process.argv[2];

// How each book labels its tasks, and how its units are found.
const BOOKS = {
  g4: { file: "g4.txt", label: (u, n) => `Lesson\\s*0?${n}\\b`, unit: /^\s*(\d{1,2})\s+[A-Z][a-z]/ },
  g6: { file: "g6.txt", label: (u, n) => `Activity\\s*0?${n}\\b`, unit: /^\s*UNIT\s*0?(\d+)/i },
  g7: { file: "g7new.txt", label: (u, n) => `Activity\\s*0?${n}\\b`, unit: /^\s*UNIT\s*0?(\d+)\s*$/i },
  g8: { file: "g8.txt", label: (u, n) => `Activity\\s*${u}\\.${n}\\b`, unit: null },
  g9: { file: "g9.txt", label: (u, n) => `Activity\\s*0?${n}\\b`, unit: null },
  g10: { file: "g10.txt", label: (u, n) => `Activity\\s*0?${n}\\b`, unit: null },
  g11: { file: "g11.txt", label: (u, n) => `Activity\\s*0?${n}\\b`, unit: null }
};
// Unit start lines for the books whose headings the text loses. Grade 4 needs
// them because one unit heading is printed on the same line as a lesson.
const STARTS = {
  g4: [1, 183, 374, 510, 670, 877, 1129, 1365, 1550, 1747],
  g8: [382, 815, 1250, 1661, 2210, 2706, 3020, 3531, 3921, 4186],
  g9: [380, 613, 933, 1244, 1707, 2185, 2579, 2946, 3155, 3728],
  g10: [47, 408, 697, 1084, 1358, 1712, 2087, 2704, 3038, 3358, 3775, 4076, 4337, 4674],
  g11: [435, 852, 1161, 1470, 1934, 2224, 2642, 3227, 3573, 3919]
};

let problems = 0, checked = 0;
for (const [key, cfg] of Object.entries(BOOKS)) {
  const file = path.join(dir, cfg.file);
  if (!fs.existsSync(file)) { console.log(`${key}: no book text (${cfg.file}) - skipped`); continue; }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let starts = STARTS[key];
  if (!starts) {
    starts = [];
    lines.forEach((l, i) => { const m = cfg.unit && cfg.unit.exec(l); if (m && Number(m[1]) === starts.length + 1) starts.push(i); });
  } else {
    starts = starts.map((n) => n - 1);
  }
  const plans = L[key].plans;
  let bad = 0;
  for (const [unit, title, act] of plans) {
    const from = starts[unit - 1];
    const to = unit < starts.length ? starts[unit] : lines.length;
    if (from === undefined) { console.log(`  ${key} unit ${unit}: unit start not found`); bad++; continue; }
    const text = lines.slice(from, to).join("\n");
    // "Activities 9.2 to 9.5" cites 9.2 and 9.5, not the numbers 9, 2, 9, 5,
    // so read a unit.activity pair as one citation where the book uses them.
    const cited = [...act.matchAll(/(\d+)\.(\d+)|(\d+)/g)].map((m) => Number(m[2] !== undefined ? m[2] : m[3]));
    for (const n of cited) {
      checked++;
      if (!new RegExp(cfg.label(unit, n), "i").test(text)) { console.log(`  ${key} unit ${unit} (${title}): "${act}" - ${n} not found in that unit`); bad++; }
    }
  }
  console.log(`${key}: ${plans.length} plans, ${bad ? bad + " problem(s)" : "all citations found"}`);
  problems += bad;
}
console.log(`\n${checked} citations checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
