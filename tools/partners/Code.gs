/**
 * RCF ENGLISH - PARTNER CLICK TRACKING
 *
 * Paste this into the Apps Script editor of a NEW Google Sheet, then deploy
 * it as a Web App. Full instructions are in SETUP.md next to this file.
 *
 * WHAT IT DOES
 *   Receives one small message per click from rcfenglish.com/go/<partner>/,
 *   writes a row to the Clicks sheet, and keeps a Dashboard sheet showing
 *   clicks per partner.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It does not record an IP address and it cannot: Apps Script is not given
 *   the visitor's IP. Nothing here identifies a person. The country is worked
 *   out from the browser's timezone, which is approximate and is meant to be.
 *
 * HONEST LIMITS - PUT THESE TO ANY ADVERTISER IN WRITING
 *   - The endpoint is public, as every browser endpoint is. A determined
 *     person could send false clicks. Watch the Dashboard for a partner whose
 *     clicks jump without the pages that feed them getting any busier.
 *   - Someone blocking scripts may not be counted, so the true number is at
 *     or above what is recorded, never below.
 *   - These are CLICKS. They are not enrolments and must never be presented
 *     as enrolments. The advertiser confirms enrolments against the referral
 *     code, and commission is paid on those.
 */

var CLICKS = 'Clicks';
var DASHBOARD = 'Dashboard';

/** Timezone to country. Only the ones that actually come up are listed; the
 *  rest fall back to the region, which is honest rather than wrong. */
var ZONES = {
  'Asia/Colombo': 'Sri Lanka',
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'Asia/Dubai': 'United Arab Emirates',
  'Asia/Qatar': 'Qatar',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Kuwait': 'Kuwait',
  'Asia/Bahrain': 'Bahrain',
  'Asia/Muscat': 'Oman',
  'Asia/Seoul': 'South Korea',
  'Asia/Tokyo': 'Japan',
  'Asia/Singapore': 'Singapore',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Perth': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  'Europe/London': 'United Kingdom',
  'Europe/Rome': 'Italy',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Europe/Zurich': 'Switzerland',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'America/New_York': 'United States',
  'America/Chicago': 'United States',
  'America/Los_Angeles': 'United States'
};

function countryFromZone(tz) {
  if (!tz) return 'Unknown';
  if (ZONES[tz]) return ZONES[tz];
  var slash = String(tz).indexOf('/');
  return slash > 0 ? String(tz).substring(0, slash) + ' (region)' : 'Unknown';
}

/** The page on our own site that the click came from. Query strings are
 *  stripped: they are never needed and are the place a stray identifier
 *  would hide. */
function tidyFrom(url) {
  if (!url) return '(direct)';
  var s = String(url).split('?')[0].split('#')[0];
  return s.length > 200 ? s.substring(0, 200) : s;
}

function sheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

/** A click. Called by the beacon from the /go/ page. */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var partner = String(body.partner || '').substring(0, 60);
    if (!partner) return ok('no partner');

    var now = new Date();
    var tz = String(body.tz || '').substring(0, 60);
    sheet(CLICKS, ['When', 'Date', 'Partner', 'Country', 'Timezone', 'Language', 'Came from'])
      .appendRow([
        now,
        Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        partner,
        countryFromZone(tz),
        tz,
        String(body.lang || '').substring(0, 20),
        tidyFrom(body.from)
      ]);
    return ok('recorded');
  } catch (err) {
    // Never throw. A failed count must not become a visible error.
    try {
      sheet('Errors', ['When', 'Error']).appendRow([new Date(), String(err)]);
    } catch (e2) { /* nothing further can be done */ }
    return ok('error');
  }
}

/** Opening the web app address in a browser shows this, rather than nothing.
 *  It carries no data: the numbers live in the Sheet, which is private. */
function doGet() {
  return ContentService
    .createTextOutput('RCF English partner tracking is running. The figures are in the Sheet.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function ok(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Rebuilds the Dashboard sheet: total clicks per partner, this month, last
 * seven days, and the last click. Run it from the menu, or let the daily
 * trigger do it.
 */
function buildDashboard() {
  var clicks = sheet(CLICKS, ['When', 'Date', 'Partner', 'Country', 'Timezone', 'Language', 'Came from']);
  var rows = clicks.getLastRow() > 1
    ? clicks.getRange(2, 1, clicks.getLastRow() - 1, 7).getValues()
    : [];

  var today = new Date();
  var monthKey = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM');
  var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  var byPartner = {};
  for (var i = 0; i < rows.length; i++) {
    var when = rows[i][0];
    var p = String(rows[i][2] || '');
    if (!p) continue;
    if (!byPartner[p]) byPartner[p] = { total: 0, month: 0, week: 0, last: null, countries: {} };
    var rec = byPartner[p];
    rec.total++;
    var d = (when instanceof Date) ? when : new Date(when);
    if (!isNaN(d.getTime())) {
      if (Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM') === monthKey) rec.month++;
      if (d >= weekAgo) rec.week++;
      if (!rec.last || d > rec.last) rec.last = d;
    }
    var c = String(rows[i][3] || 'Unknown');
    rec.countries[c] = (rec.countries[c] || 0) + 1;
  }

  var dash = sheet(DASHBOARD);
  dash.clear();
  var head = ['Partner', 'Clicks, all time', 'This month', 'Last 7 days', 'Last click', 'Top country'];
  dash.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  dash.setFrozenRows(1);

  var names = Object.keys(byPartner).sort(function (a, b) { return byPartner[b].total - byPartner[a].total; });
  var out = [];
  for (var j = 0; j < names.length; j++) {
    var r = byPartner[names[j]];
    var topCountry = '';
    var best = 0;
    for (var c2 in r.countries) {
      if (r.countries[c2] > best) { best = r.countries[c2]; topCountry = c2; }
    }
    out.push([
      names[j], r.total, r.month, r.week,
      r.last ? Utilities.formatDate(r.last, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '',
      topCountry ? topCountry + ' (' + best + ')' : ''
    ]);
  }
  if (out.length) dash.getRange(2, 1, out.length, head.length).setValues(out);
  else dash.getRange(2, 1).setValue('No clicks recorded yet.');

  dash.getRange(out.length + 3, 1).setValue(
    'Rebuilt ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') +
    '. These are CLICKS, not enrolments. Commission is paid on enrolments the advertiser confirms against the referral code.'
  );
  dash.autoResizeColumns(1, head.length);
}

/** Run once, by hand, after deploying: rebuilds the dashboard every night. */
function createDailyTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'buildDashboard') ScriptApp.deleteTrigger(existing[i]);
  }
  ScriptApp.newTrigger('buildDashboard').timeBased().everyDays(1).atHour(2).create();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RCF Partners')
    .addItem('Rebuild dashboard now', 'buildDashboard')
    .addToUi();
}
