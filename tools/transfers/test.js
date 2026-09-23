// Tests Code.gs without Google, by running it against stubs for the few
// Google services it uses. Run it after any change to Code.gs:
//
//   node tools/transfers/test.js
//
// The column headings below are the ones Google Forms actually creates from
// the live RCF English form, so a change that would break matching on the
// real sheet breaks this test first.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CODE = fs.readFileSync(path.join(__dirname, "Code.gs"), "utf8");

// The sheet's first row, exactly as the live form produces it.
const HEAD = [
  "Timestamp",
  "Email Address",
  "Full name",
  "WhatsApp number",
  "Subject you teach",
  "District you teach in now",
  "Type of school you teach in now",
  "Level you teach",
  "Medium of your school",
  "Your service and grade (optional)",
  "Districts you would accept",
  "Anything a matching teacher should know (optional)",
  "Is your request still open?",
  "Consent"
];
const CONSENT = "I agree that RCF English may send my name...";
const OPEN = "Yes - keep looking";

// A response row. Anything not given takes a sensible default.
function row(o) {
  return [
    o.when || new Date(),
    o.email,
    o.name || o.email.split("@")[0],
    o.whatsapp || "",
    o.subject || "English",
    o.district,
    o.schoolType || "Provincial school",
    o.level || "Secondary (Grades 6 to 13)",
    o.medium || "Sinhala",
    o.service || "",
    (o.wants || []).join(", "),
    o.note || "",
    o.status || OPEN,
    o.consent === false ? "" : CONSENT
  ];
}

// Runs Code.gs over one set of rows and returns what it tried to send.
function run(rows, opts) {
  opts = opts || {};
  const head = opts.head || HEAD;
  const responses = [head].concat(rows);
  const matches = [["Sent on", "Match", "Teachers", "Districts"]].concat(opts.alreadySent || []);
  const sent = [];
  const sheetOf = (data) => ({
    getFormUrl: () => data === responses ? "https://docs.google.com/forms/d/e/TEST/viewform" : null,
    getDataRange: () => ({ getValues: () => data }),
    appendRow: (r) => data.push(r)
  });
  const sandbox = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheets: () => [sheetOf(responses), sheetOf(matches)],
        getSheetByName: (n) => n === "Matches sent" ? sheetOf(matches) : null,
        insertSheet: () => sheetOf(matches)
      })
    },
    MailApp: { sendEmail: (o) => sent.push(o) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => "owner@example.com" }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => { throw new Error("not tested"); } },
    Logger: { log: () => {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(CODE + "\nonFormSubmit({});", sandbox);
  return { sent, matches: matches.slice(1) };
}

// ------------------------------------------------------------------ checks
let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("  ok    " + name);
  } catch (err) {
    failed++;
    console.log("  FAIL  " + name + "\n          " + err.message);
  }
}
const eq = (got, want, what) => {
  if (String(got) !== String(want)) throw new Error(`${what}: expected ${want}, got ${got}`);
};

console.log("\nMutual transfers matching\n");

check("a two-way swap emails both teachers", () => {
  const r = run([
    row({ email: "a@x.com", name: "Anoma", district: "Kandy", wants: ["Galle", "Matara"] }),
    row({ email: "b@x.com", name: "Bimal", district: "Galle", wants: ["Kandy"] })
  ]);
  eq(r.sent.length, 2, "emails");
  eq(r.sent.map((m) => m.to).sort().join(","), "a@x.com,b@x.com", "recipients");
  // Each teacher is given the other's details, and not their own again.
  const toAnoma = r.sent.find((m) => m.to === "a@x.com");
  const toBimal = r.sent.find((m) => m.to === "b@x.com");
  if (!toAnoma.body.includes("Email: b@x.com")) throw new Error("Anoma was not given Bimal's email");
  if (!toBimal.body.includes("Email: a@x.com")) throw new Error("Bimal was not given Anoma's email");
  if (toAnoma.body.includes("Email: a@x.com")) throw new Error("Anoma was sent her own address back");
  eq(r.matches.length, 1, "rows recorded");
});

check("a WhatsApp number is passed on when given", () => {
  const r = run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"], whatsapp: "0771234567" }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
  ]);
  const toB = r.sent.find((m) => m.to === "b@x.com");
  if (!toB.body.includes("0771234567")) throw new Error("the number was not included");
});

check("a different subject is never matched", () => {
  const r = run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"], subject: "English" }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"], subject: "Mathematics" })
  ]);
  eq(r.sent.length, 0, "emails");
});

check("a different school type or level is never matched", () => {
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"], schoolType: "National school" }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"], schoolType: "Provincial school" })
  ]).sent.length, 0, "school type");
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"], level: "Primary (Grades 1 to 5)" }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
  ]).sent.length, 0, "level");
});

check("one-sided interest is not a match", () => {
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Colombo"] })
  ]).sent.length, 0, "emails");
});

check("a three-way swap emails all three, once", () => {
  const r = run([
    row({ email: "a@x.com", name: "Anoma", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", name: "Bimal", district: "Galle", wants: ["Colombo"] }),
    row({ email: "c@x.com", name: "Chandi", district: "Colombo", wants: ["Kandy"] })
  ]);
  eq(r.sent.length, 3, "emails");
  eq(r.matches.length, 1, "rows recorded");
  if (!r.sent[0].subject.includes("three-way")) throw new Error("not sent as a three-way");
});

check("a closed request is ignored", () => {
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"], status: "No - remove my request" })
  ]).sent.length, 0, "emails");
});

check("a request with no consent is ignored", () => {
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"], consent: false })
  ]).sent.length, 0, "emails");
});

check("a request older than 180 days is ignored until renewed", () => {
  const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
  eq(run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"], when: old })
  ]).sent.length, 0, "emails");
});

check("a match already sent is not sent again", () => {
  const rows = [
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
  ];
  const first = run(rows);
  eq(first.sent.length, 2, "first run");
  const again = run(rows, { alreadySent: first.matches });
  eq(again.sent.length, 0, "second run");
});

check("only the newest row counts when a teacher has two", () => {
  const older = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const r = run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Colombo"], when: older }),
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
  ]);
  eq(r.sent.length, 2, "emails");
});

check("a missing optional column does not stop the script", () => {
  const head = HEAD.filter((h) => h !== "WhatsApp number");
  const strip = (r) => r.filter((_, i) => i !== HEAD.indexOf("WhatsApp number"));
  const r = run([
    strip(row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] })),
    strip(row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] }))
  ], { head });
  eq(r.sent.length, 2, "emails");
});

check("a missing required column fails loudly, naming the columns", () => {
  const head = HEAD.map((h) => h === "Subject you teach" ? "Subject" : h);
  let message = "";
  try {
    run([row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] })], { head });
  } catch (err) { message = err.message; }
  if (!message.includes("Subject you teach")) throw new Error("did not name the missing column");
  if (!message.includes("Subject")) throw new Error("did not list the sheet's actual columns");
});

check("the email column is found under any of its names", () => {
  ["Email Address", "Email address", "Email", "Username"].forEach((name) => {
    const head = HEAD.map((h) => h === "Email Address" ? name : h);
    eq(run([
      row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
      row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
    ], { head }).sent.length, 2, name);
  });
});

check("no email column at all fails with an explanation", () => {
  const head = HEAD.map((h) => h === "Email Address" ? "Who" : h);
  let message = "";
  try {
    run([row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] })], { head });
  } catch (err) { message = err.message; }
  if (!/Collect email addresses/.test(message)) throw new Error("no explanation offered");
});

check("the email says it is not an application", () => {
  const r = run([
    row({ email: "a@x.com", district: "Kandy", wants: ["Galle"] }),
    row({ email: "b@x.com", district: "Galle", wants: ["Kandy"] })
  ]);
  if (!/not an\s+application/.test(r.sent[0].body)) throw new Error("the disclaimer is missing");
  if (!r.sent[0].body.includes("owner@example.com")) throw new Error("no contact address");
});

console.log("");
if (failed) {
  console.log(failed + " check(s) failed.\n");
  process.exit(1);
}
console.log("All checks passed.\n");
