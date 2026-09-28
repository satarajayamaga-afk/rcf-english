// Builds a /go/<id>/ page for every active partner in data/partners.json.
// Usage: node tools/partners/gen.js
//
// HOW THE TRACKING WORKS, AND WHAT IT CANNOT DO
//
// This is a static site. It has no server, so it cannot record anything by
// itself. The click is recorded by a Google Apps Script web app writing to a
// Google Sheet - the same arrangement the mutual transfer system already
// uses - and the Sheet is the dashboard.
//
// The page redirects first and records second, using navigator.sendBeacon,
// which exists precisely to survive the page being navigated away from. The
// visitor is not made to wait for the log to be written.
//
// WHAT IS RECORDED: the partner, the date and time, the page the visitor came
// from, their approximate country and their language.
//
// WHAT IS NOT RECORDED: the IP address, and any identifier for the person.
// The country is worked out from the browser's own timezone, not from an IP
// lookup - "Asia/Colombo" means Sri Lanka. That is approximate, and it is
// deliberately approximate: it needs no third-party geolocation service, it
// sends nobody's address anywhere, and it is accurate enough to tell a
// partner which countries their clicks came from.
//
// HONEST LIMITS, WHICH MUST BE PUT TO ANY ADVERTISER IN WRITING:
//   - The endpoint is public, as every browser endpoint is. Counts can in
//     principle be inflated by somebody determined to do so.
//   - A visitor blocking scripts, or closing the tab within milliseconds,
//     may not be counted. The true figure is at or above what is recorded.
//   - These are CLICKS, never enrolments. The advertiser confirms enrolments
//     against the referral code, and that is what commission is paid on.
// A partner told this at the start will trust the numbers. One who finds out
// later will not.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8").replace(/^﻿/, ""));

const data = read("data/partners.json");
const partners = data.partners || [];

const problems = [];
const seen = new Set();
for (const p of partners) {
  const where = `"${p.id || p.name || "?"}"`;
  if (!p.id || !/^[a-z0-9][a-z0-9-]*$/.test(p.id)) problems.push(`${where}: id must be lower case letters, numbers and hyphens`);
  if (seen.has(p.id)) problems.push(`${where}: this id is used twice`);
  seen.add(p.id);
  if (!p.name) problems.push(`${where}: no name`);
  if (!p.url) problems.push(`${where}: no url`);
  else if (!/^https:\/\//i.test(p.url)) problems.push(`${where}: the url must be https, not "${p.url}"`);
  if (!p.refCode) problems.push(`${where}: no refCode - without one the advertiser cannot credit an enrolment to you`);
  if (!p.disclosure) problems.push(`${where}: no disclosure sentence. A paid link must say so.`);
  // A partner file is published with the site. Catch the obvious mistake.
  for (const k of ["password", "secret", "apiKey", "token", "fee", "rate", "commission"]) {
    if (Object.prototype.hasOwnProperty.call(p, k)) {
      problems.push(`${where}: remove "${k}" - this file is published and anybody can read it`);
    }
  }
}
if (problems.length) {
  console.log("Nothing was written. Fix these first:\n");
  problems.forEach((x) => console.log("  " + x));
  process.exit(1);
}

const active = partners.filter((p) => p.active === true);

const destination = (p) => {
  const u = new URL(p.url);
  // The referral code travels with the visitor, so the advertiser can match
  // an enrolment back to us without asking the student to remember anything.
  u.searchParams.set("ref", p.refCode);
  const utm = p.utm || {};
  if (!utm.utm_source) u.searchParams.set("utm_source", "rcfenglish");
  if (!utm.utm_medium) u.searchParams.set("utm_medium", "referral");
  for (const [k, v] of Object.entries(utm)) u.searchParams.set(k, v);
  return u.toString();
};

const pages = active.map((p) => ({
  slug: `go/${p.id}`,
  title: `Going to ${p.name}`,
  metaTitle: `Going to ${p.name}`,
  description: `You are being sent to ${p.name}. This is a sponsored link from RCF English.`,
  // A redirect page must never be indexed, and must never be treated as
  // content. It is a doorway, and Google is right to dislike indexed ones.
  noindex: true,
  // NOT kind "redirect": the build already uses that for a "this page has
  // moved" stub, which silently replaced the whole page the first time.
  kind: "sponsored-link",
  blocks: [
    {
      type: "partnerGo",
      partner: p.id,
      name: p.name,
      url: destination(p),
      disclosure: p.disclosure
    }
  ]
}));

const target = path.join(ROOT, "_src/pages/partners-go.json");

// With no active partners the file is REMOVED, not written empty. A page
// file containing "pages": [] does not build: PowerShell reads an empty
// JSON array as a null, which becomes one page with an empty slug, and that
// collides with the home page and stops the entire build. Writing no file
// at all is both correct and safe.
if (!pages.length) {
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log("  Removed _src/pages/partners-go.json - there are no active partners.");
  }
} else {
  const out = {
    _readme: [
      "PARTNER REDIRECT PAGES",
      "Generated by tools/partners/gen.js from data/partners.json.",
      "Do not edit by hand. Every page here is noindex and kept out of the",
      "search index: they are doorways, not content."
    ],
    pages
  };
  fs.writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
}

if (!active.length) {
  console.log("  No active partners, so no /go/ pages were written.");
  console.log("  That is correct until a real agreement exists - never invent one.");
} else {
  console.log(`  ${active.length} partner link${active.length === 1 ? "" : "s"} built:`);
  active.forEach((p) => console.log(`    /go/${p.id}/  ->  ${p.name}   (ref ${p.refCode})`));
}
const parked = partners.length - active.length;
if (parked) console.log(`  ${parked} parked (active: false).`);
