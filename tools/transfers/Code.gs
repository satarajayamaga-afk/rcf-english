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

// Two teachers are only matched if these answers are the same for both. A
// Maths teacher is not a swap for an English one, a primary teacher is not a
// swap for a secondary one, and a national school post is not a provincial
// one. Remove a question from this list to stop requiring it to match.
var MUST_MATCH = [Q.subject, Q.schoolType, Q.level];

// Entries older than this are ignored until the teacher renews them by
// editing their response. An old request is usually no longer wanted.
var EXPIRY_DAYS = 180;

// The answer to Q.status that closes a request.
var CLOSED = "No - remove my request";

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
      var a = teachers[i], b = teachers[j];
      if (compatible([a, b]) && wantsPlaceOf(a, b) && wantsPlaceOf(b, a)) {
        found.push([a, b]);
      }
    }
  }
  // Three-way swaps too. A teacher can be in a pair and in a cycle at the same
  // time; each is a different possibility and each is reported once.
  for (var x = 0; x < teachers.length; x++) {
    for (var y = 0; y < teachers.length; y++) {
      for (var z = 0; z < teachers.length; z++) {
        if (x === y || y === z || x === z) continue;
        var A = teachers[x], B = teachers[y], C = teachers[z];
        // Report each three-way cycle once: start it at the earliest row.
        if (!(A.row < B.row && A.row < C.row)) continue;
        if (!compatible([A, B, C])) continue;
        if (wantsPlaceOf(A, B) && wantsPlaceOf(B, C) && wantsPlaceOf(C, A)) {
          found.push([A, B, C]);
        }
      }
    }
  }

  found.forEach(function (group) {
    var key = matchKey(group);
    if (sent[key]) return;
    sendMatchEmail(group);
    recordMatch(key, group);
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
    if (String(v[c[Q.status]]).trim() === CLOSED) continue;
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

function wantsPlaceOf(mover, holder) {
  // A teacher never "wants" the district they are already in.
  return holder.district !== mover.district && mover.wants.indexOf(holder.district) !== -1;
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

function recordMatch(key, group) {
  matchSheet().appendRow([
    new Date(),
    key,
    group.map(function (t) { return t[Q.name]; }).join(", "),
    group.map(function (t) { return t.district; }).join(" -> ")
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

function sendMatchEmail(group) {
  var three = group.length === 3;
  var route = group.map(function (t, i) {
    var next = group[(i + 1) % group.length];
    return t[Q.name] + " (" + t.district + ") would move to " + next.district;
  }).join("\n");

  group.forEach(function (me) {
    var others = group.filter(function (t) { return t !== me; });
    var body = [
      "Dear " + me[Q.name] + ",",
      "",
      three
        ? "RCF English has found a possible three-way transfer that includes you:"
        : "RCF English has found a teacher whose transfer request matches yours:",
      "",
      route,
      "",
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
    ].join("\n");

    MailApp.sendEmail({
      to: me.email,
      subject: three ? "A possible three-way transfer for you - RCF English" : "A possible mutual transfer for you - RCF English",
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
