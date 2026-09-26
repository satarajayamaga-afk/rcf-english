/**
 * RCF English - Mutual Transfers for English, Mathematics and Science Teachers
 * Matching script for the Google Sheet that collects the form's responses.
 *
 * This runs in Google's servers, attached to the owner's private sheet. It is
 * NOT part of the website and adds nothing to it. See SETUP.md in this folder.
 *
 * WHAT IT DOES
 *   Every time a teacher submits (or edits) the form, it compares their entry
 *   with every other active entry and looks for:
 *     - a two-way swap:   A wants B's district and B wants A's;
 *     - a three-way swap: A wants B's, B wants C's, C wants A's.
 *   When it finds one it has not reported before, it emails every teacher in
 *   it the others' names and contact details. Nothing else is ever sent to
 *   anyone, and the sheet itself is never published.
 *
 * WHAT IT WILL NOT DO
 *   It does not apply for a transfer, check eligibility, or know the rules.
 *   The emails say so. A teacher who finds a partner still applies through
 *   the Ministry or the Provincial Department of Education in the usual way.
 */

// ---------------------------------------------------------------- settings

// The question titles, exactly as they appear in the form. If you change a
// question's wording in the form, change it here too.
var Q = {
  name: "Full name",
  whatsapp: "WhatsApp number",
  subject: "Subject you teach",
  district: "District you teach in now",
  schoolType: "Type of school you teach in now",
  level: "Level you teach",
  medium: "Medium of your school",
  service: "Your service and grade (optional)",
  wants: "Districts you would accept",
  note: "Anything a matching teacher should know (optional)",
  status: "Is your request still open?",
  consent: "Consent"
};
// Google Forms adds these columns itself. Which name it gives the email
// column has changed over the years, so every likely spelling is listed and
// the first one present in the sheet is used.
var TIMESTAMP = "Timestamp";
var EMAIL_TITLES = ["Email Address", "Email address", "Email", "Username"];

// The questions that may be left blank. If one of these is missing from the
// sheet - because the form words it differently - the answer is read as
// empty rather than stopping the script. The rest must be found: matching
// depends on them, so a missing one should fail loudly.
var OPTIONAL = ["whatsapp", "service", "note"];

// Renaming a question in the form does NOT rename the column already in the
// sheet, so a question whose title once ended in " (optional)" can leave a
// column that still says so, or the other way round. Both spellings are
// accepted, and the one actually in the sheet is used.
var SUFFIX = " (optional)";
function titlesFor(title) {
  var other = title.slice(-SUFFIX.length) === SUFFIX
    ? title.slice(0, -SUFFIX.length)
    : title + SUFFIX;
  return [title, other];
}

// The service covers these subjects only; the form offers exactly these. An
// answer outside the list - if the form were changed without this - is
// never matched, rather than matched on a guess.
var SUBJECTS = ["English", "Mathematics", "Science"];

// ------------------------------------------------------- how strict to be
//
// Only the subject is ever required. A Mathematics teacher is not a swap for
// an English one and never can be, so that stays absolute.
//
// Everything else is scored rather than required. Insisting on the same
// school type AND the same level AND a district each side had listed meant
// almost nobody matched: with a few hundred teachers spread over 25
// districts, an exact four-way coincidence is rare. A near match that two
// teachers can look at and reject costs them one email; a match that is
// never reported costs them the transfer.
var MUST_MATCH = [Q.subject];

// What a reported match is called, and how good it has to be to be sent.
// A group scores by what its members have in common; the worst pair in the
// group decides the grade.
var GRADE_EXACT = "exact";       // same school type and level, districts each asked for
var GRADE_CLOSE = "close";       // districts each asked for, but type or level differs
var GRADE_POSSIBLE = "possible"; // districts are in a province the other asked for

// The 25 districts by province. A teacher who would accept Galle will often
// accept Matara, and would rather be asked than not told. Used only to
// widen the search - the email always names the real district.
var PROVINCES = {
  "Western": ["Colombo", "Gampaha", "Kalutara"],
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern": ["Galle", "Matara", "Hambantota"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern": ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Uva": ["Badulla", "Monaragala"],
  "Sabaragamuwa": ["Ratnapura", "Kegalle"]
};
function provinceOf(district) {
  for (var name in PROVINCES) {
    if (PROVINCES[name].indexOf(district) !== -1) return name;
  }
  return "";
}

// Entries older than this are ignored until the teacher renews them by
// editing their response. An old request is usually no longer wanted.
var EXPIRY_DAYS = 180;

// The answer to Q.status that closes a request.
var CLOSED = "No - remove my request";

// A request counts as closed if the teacher chose the closing option, or if
// they typed anything beginning with "no" - which the form's "Other" box
// lets them do. Somebody who writes "no, I have found someone" plainly means
// to stop, and matching only the exact phrase would keep sending them
// introductions for six months. Switching "Other" off in the form is still
// the tidier fix; this makes the script right either way.
function isClosed(answer) {
  var said = String(answer || "").trim().toLowerCase();
  if (!said) return false;
  if (said === CLOSED.toLowerCase()) return true;
  return /^no\b/.test(said);
}

// Where teachers can ask about the service: the Google account that runs this
// script, read when it runs. It is deliberately not typed in here - this file
// is published with the website, and an address written in it would be
// public. The emails are sent from that account, so replies go there anyway.
function contactAddress() {
  return Session.getEffectiveUser().getEmail();
}
var SITE_PAGE = "https://rcfenglish.com/teacher-resources/mutual-transfers/";

// The sheet where reported matches are recorded, so each is sent only once.
var MATCH_SHEET = "Matches sent";

// ------------------------------------------------------------ the trigger

/** Runs on every form submission and every edit of a response. */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);            // two teachers submitting at once
  try {
    findAndReportMatches();
  } finally {
    lock.releaseLock();
  }
}

/** Can also be run by hand from the Apps Script editor, to test. */
function findAndReportMatches() {
  var teachers = activeTeachers();
  var sent = sentMatches();
  var found = [];

  for (var i = 0; i < teachers.length; i++) {
    for (var j = i + 1; j < teachers.length; j++) {
      var pair = [teachers[i], teachers[j]];
      var graded = gradeGroup(pair);
      if (graded) found.push({ group: pair, grade: graded.grade, differences: graded.differences });
    }
  }
  // Three-way swaps too. A teacher can be in a pair and in a cycle at the same
  // time; each is a different possibility and each is reported once.
  for (var x = 0; x < teachers.length; x++) {
    for (var y = 0; y < teachers.length; y++) {
      for (var z = 0; z < teachers.length; z++) {
        if (x === y || y === z || x === z) continue;
        var ring = [teachers[x], teachers[y], teachers[z]];
        // Report each three-way cycle once: start it at the earliest row.
        if (!(ring[0].row < ring[1].row && ring[0].row < ring[2].row)) continue;
        var gradedRing = gradeGroup(ring);
        if (gradedRing) found.push({ group: ring, grade: gradedRing.grade, differences: gradedRing.differences });
      }
    }
  }

  // Best first, so that if a teacher is in several groups the exact one
  // arrives before the maybes.
  var order = {};
  order[GRADE_EXACT] = 0; order[GRADE_CLOSE] = 1; order[GRADE_POSSIBLE] = 2;
  found.sort(function (a, b) { return order[a.grade] - order[b.grade]; });

  found.forEach(function (match) {
    var key = matchKey(match.group);
    if (sent[key]) return;
    sendMatchEmail(match.group, match.grade, match.differences);
    recordMatch(key, match.group, match.grade);
    sent[key] = true;
  });
}

// ----------------------------------------------------------------- reading

function activeTeachers() {
  var sheet = responseSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var head = values[0].map(function (h) { return String(h).trim(); });
  var col = function (title, optional) {
    var accepted = titlesFor(title);
    for (var i = 0; i < accepted.length; i++) {
      var at = head.indexOf(accepted[i]);
      if (at !== -1) return at;
    }
    if (!optional) {
      throw new Error('Column "' + title + '" not found in the sheet. The columns are: ' + head.join(" | ") +
        '. Change the matching title in Q at the top of this script so it is spelt exactly as the sheet spells it.');
    }
    return -1;
  };
  var c = {};
  c[TIMESTAMP] = col(TIMESTAMP);
  // The email column, whichever name this form gave it.
  var emailAt = -1;
  for (var e = 0; e < EMAIL_TITLES.length && emailAt === -1; e++) emailAt = head.indexOf(EMAIL_TITLES[e]);
  if (emailAt === -1) {
    throw new Error('No email column found. The columns are: ' + head.join(" | ") +
      '. Switch on "Collect email addresses: Verified" in the form, or add the column\'s name to EMAIL_TITLES.');
  }
  Object.keys(Q).forEach(function (k) { c[Q[k]] = col(Q[k], OPTIONAL.indexOf(k) !== -1); });

  var cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  var seenEmail = {};
  var out = [];
  // Newest first, so if a teacher somehow has two rows the newer one wins.
  for (var r = values.length - 1; r >= 1; r--) {
    var v = values[r];
    var email = String(v[emailAt] || "").trim().toLowerCase();
    if (!email || seenEmail[email]) continue;
    seenEmail[email] = true;
    if (isClosed(v[c[Q.status]])) continue;
    if (!String(v[c[Q.consent]]).trim()) continue;
    var when = toDate(v[c[TIMESTAMP]]);
    if (!when || when < cutoff) continue;
    var t = {
      row: r + 1,
      email: email,
      when: when,
      wants: splitList(v[c[Q.wants]])
    };
    Object.keys(Q).forEach(function (k) {
      var at = c[Q[k]];
      t[Q[k]] = at === -1 ? "" : String(v[at] || "").trim();
    });
    t.district = t[Q.district];
    out.push(t);
  }
  return out;
}

// The sheet normally gives a real date here. A row typed or pasted in by hand
// gives text, so that is accepted too rather than silently ignored.
function toDate(value) {
  if (value && typeof value.getTime === "function") {
    var ms = value.getTime();
    return isNaN(ms) ? null : value;
  }
  if (typeof value === "string" && value) {
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function splitList(cell) {
  return String(cell || "").split(",").map(function (s) { return s.trim(); }).filter(String);
}

// How well the holder's district suits the mover: "district" if the mover
// listed it, "province" if the mover listed somewhere else in the same
// province, and "" if neither. A teacher never "wants" their own district.
function wantsPlaceOf(mover, holder) {
  if (!holder.district || holder.district === mover.district) return "";
  if (mover.wants.indexOf(holder.district) !== -1) return "district";
  var province = provinceOf(holder.district);
  if (!province) return "";
  for (var i = 0; i < mover.wants.length; i++) {
    if (provinceOf(mover.wants[i]) === province) return "province";
  }
  return "";
}

function compatible(group) {
  var emails = {};
  for (var i = 0; i < group.length; i++) {
    if (emails[group[i].email]) return false;
    emails[group[i].email] = true;
    if (SUBJECTS.indexOf(group[i][Q.subject]) === -1) return false;
  }
  return MUST_MATCH.every(function (q) {
    return group.every(function (t) { return t[q] && t[q] === group[0][q]; });
  });
}

// Grades a ring of teachers - A moves to B's district, B to C's, C to A's -
// and returns null if it is not a match at all. The weakest link decides:
// one teacher who only reaches the province, or one difference of level,
// grades the whole group down, because all of them have to agree to it.
function gradeGroup(group) {
  if (!compatible(group)) return null;
  var grade = GRADE_EXACT;
  var differences = [];
  for (var i = 0; i < group.length; i++) {
    var me = group[i];
    var next = group[(i + 1) % group.length];
    var fit = wantsPlaceOf(me, next);
    if (!fit) return null;
    if (fit === "province") {
      grade = GRADE_POSSIBLE;
      differences.push(me[Q.name] + " did not list " + next.district + ", but asked for " +
        provinceOf(next.district) + " Province");
    }
  }
  // School type and level are no longer required, but a difference in either
  // is something both teachers must see before they waste a telephone call.
  [[Q.schoolType, "school type"], [Q.level, "level taught"]].forEach(function (pair) {
    var values = group.map(function (t) { return t[pair[0]]; });
    var same = values.every(function (v) { return v && v === values[0]; });
    if (!same) {
      if (grade === GRADE_EXACT) grade = GRADE_CLOSE;
      differences.push("The " + pair[1] + " is not the same for everybody: " +
        group.map(function (t) { return t[Q.name] + " (" + (t[pair[0]] || "not given") + ")"; }).join(", "));
    }
  });
  return { grade: grade, differences: differences };
}

// --------------------------------------------------------------- recording

function responseSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getFormUrl && sheets[i].getFormUrl()) return sheets[i];
  }
  return sheets[0];
}

function matchSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(MATCH_SHEET);
  if (!s) {
    s = ss.insertSheet(MATCH_SHEET);
    s.appendRow(["Sent on", "Match", "Teachers", "Districts"]);
  }
  return s;
}

// The same teachers moving between the same districts are one match, however
// often they edit their responses.
function matchKey(group) {
  return group.map(function (t) { return t.email + "@" + t.district; }).sort().join(" | ");
}

function sentMatches() {
  var s = matchSheet();
  var rows = s.getDataRange().getValues();
  var sent = {};
  for (var i = 1; i < rows.length; i++) sent[String(rows[i][1])] = true;
  return sent;
}

function recordMatch(key, group, grade) {
  matchSheet().appendRow([
    new Date(),
    key,
    group.map(function (t) { return t[Q.name]; }).join(", "),
    group.map(function (t) { return t.district; }).join(" -> "),
    grade || ""
  ]);
}

// ------------------------------------------------------------------ emails

function describe(t) {
  var lines = [
    t[Q.name],
    "  Email: " + t.email
  ];
  if (t[Q.whatsapp]) lines.push("  WhatsApp: " + t[Q.whatsapp]);
  lines.push("  Subject: " + t[Q.subject]);
  lines.push("  Teaches now in: " + t.district + " (" + t[Q.schoolType] + ", " + t[Q.level] + ", " + t[Q.medium] + " medium)");
  if (t[Q.service]) lines.push("  Service and grade: " + t[Q.service]);
  if (t[Q.note]) lines.push("  Note: " + t[Q.note]);
  return lines.join("\n");
}

function sendMatchEmail(group, grade, differences) {
  var three = group.length === 3;
  var route = group.map(function (t, i) {
    var next = group[(i + 1) % group.length];
    return t[Q.name] + " (" + t.district + ") would move to " + next.district;
  }).join("\n");

  // Said plainly at the top, because a teacher deciding whether to telephone
  // a stranger needs to know how close this actually is.
  var headline = {};
  headline[GRADE_EXACT] = "This is an exact match: the same subject, the same type of school and the same level, and each of you asked for the other's district.";
  headline[GRADE_CLOSE] = "This is a close match, not an exact one. Each of you asked for the other's district, but something else differs - please read the notes below before you decide.";
  headline[GRADE_POSSIBLE] = "This is a possible match rather than a close one. It is being sent because it is worth a look, not because it fits exactly. Please read the notes below.";
  var notes = (differences && differences.length)
    ? ["WHAT IS NOT THE SAME", differences.map(function (d) { return "- " + d; }).join("\n"), ""]
    : [];

  group.forEach(function (me) {
    var others = group.filter(function (t) { return t !== me; });
    var body = [
      "Dear " + me[Q.name] + ",",
      "",
      grade === GRADE_EXACT
        ? (three
          ? "RCF English has found a three-way transfer that matches your request:"
          : "RCF English has found a teacher whose transfer request matches yours:")
        : (three
          ? "RCF English has found a three-way transfer that may suit you:"
          : "RCF English has found a teacher whose request may suit yours:"),
      "",
      route,
      "",
      headline[grade] || headline[GRADE_POSSIBLE],
      ""
    ].concat(notes).concat([
      "Contact details of the other " + (three ? "teachers" : "teacher") + ":",
      "",
      others.map(describe).join("\n\n"),
      "",
      "WHAT HAPPENS NEXT",
      "Contact them directly to talk it over. If you agree, each of you applies",
      "through the Ministry of Education or your Provincial Department of Education in",
      "the usual way. RCF English only helps teachers find each other: this is not an",
      "application, and it does not mean a transfer is possible or approved.",
      "",
      "Your details have been sent only to the " + (three ? "teachers" : "teacher") + " named above.",
      "To close your request, edit your form response and choose \"" + CLOSED + "\".",
      "",
      "Questions: " + contactAddress(),
      SITE_PAGE,
      "",
      "RCF English"
    ]).join("\n");

    var kind = grade === GRADE_EXACT ? "" : (grade === GRADE_CLOSE ? "A close match" : "A possible match");
    MailApp.sendEmail({
      to: me.email,
      subject: kind
        ? kind + (three ? " - three-way transfer" : " for your transfer request") + " - RCF English"
        : (three ? "A three-way transfer that matches yours - RCF English" : "A teacher whose request matches yours - RCF English"),
      body: body,
      name: "RCF English Mutual Transfers",
      replyTo: contactAddress()
    });
  });
}

// ------------------------------------------------------------------ set-up

/**
 * Run this ONCE from the Apps Script editor (Run > installTrigger). It asks
 * for permission to read the sheet and send email, then connects the script
 * to the form so it runs on every submission.
 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onFormSubmit") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  matchSheet();
  Logger.log("Trigger installed. The script will now run on every form submission.");
}
