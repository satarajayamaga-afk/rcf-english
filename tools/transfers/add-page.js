// Creates the Mutual Transfers page, once the Google Form exists.
// Usage: node tools/transfers/add-page.js https://forms.gle/XXXXXXXX
//
// The page is made by a script and not kept in _src/pages until then, so the
// site never shows a service whose form has not been set up yet. Run it again
// with a new link to change the link. See SETUP.md for the form itself.
const fs = require("fs");
const path = require("path");

const url = process.argv[2];
if (!url || !/^https:\/\/(forms\.gle|docs\.google\.com\/forms)\//.test(url)) {
  console.error("Give the form's link: node tools/transfers/add-page.js https://forms.gle/...");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "../..");
const SLUG = "teacher-resources/mutual-transfers";
const TR = { label: "English Teachers Resources", url: "teacher-resources/" };

const page = {
  slug: SLUG,
  title: "Mutual Transfers for English, Mathematics and Science Teachers",
  // The title fits in the 60 characters a search result shows, and the
  // description in the 140 to 160 Google displays whole.
  metaTitle: "Teacher Mutual Transfers in Sri Lanka | RCF English",
  description: "Free, private matching for English, Mathematics and Science teachers in Sri Lankan government schools who want to exchange posts with each other.",
  keywords: "teacher mutual transfer Sri Lanka, English teacher mutual transfer, maths teacher mutual transfer, science teacher mutual transfer, teacher transfer district",
  kicker: "English Teachers Resources",
  kind: "teacher-resource",
  tags: ["Mutual transfers", "English", "Mathematics", "Science", "All 25 districts"],
  breadcrumbs: [TR],
  backTo: TR,
  hero: {
    text: "Do you teach English, Mathematics or Science, and want to exchange places with a teacher of your subject? Tell us what you teach, where you teach and where you would go. When another teacher's request matches yours, we introduce you both - privately.",
    buttons: [{ label: "Enter your request", url, style: "btn--accent" }]
  },
  blocks: [
    {
      type: "callout", style: "legal", title: "This is not a transfer application",
      text: [
        "RCF English only helps teachers find each other. If you find a partner, each of you still applies through the Ministry of Education or your Provincial Department of Education in the usual way. A match does not mean that a transfer is possible or will be approved, and RCF English cannot advise on eligibility."
      ]
    },
    {
      type: "steps", heading: "How it works", level: "h2",
      items: [
        { title: "Enter your request", text: ["Your subject, the district and type of school you teach in now, the level you teach, and the districts you would accept. It takes about three minutes and needs a Google account, so nobody can enter a request in your name."] },
        { title: "We look for a match", text: ["Every new request is compared with every open one. The subject must be the same - a Mathematics post is not a swap for an English one. Everything else is weighed rather than demanded, because insisting on a perfect fit means almost nobody is ever introduced. Three-way exchanges are found too: A to B's district, B to C's, C to A's."] },
        { title: "You are introduced by email", text: ["When there is a match, each teacher receives the others' names and contact details. That is the only time your details are shared."] },
        { title: "You talk it over and apply", text: ["If you agree, you each apply through the official channel. Close your request once you no longer need it."] }
      ]
    },
    {
      type: "prose", heading: "How close a match has to be", level: "h2",
      text: ["Exact matches are rare. There are 25 districts, three subjects, two types of school and two levels, so waiting for a perfect fit means waiting for a long time. Every introduction therefore says how close it actually is, and what is not the same, so that you can judge it yourself."],
      bullets: [
        "**Exact.** Same subject, same type of school, same level, and each of you named the other's district.",
        "**Close.** Each of you named the other's district, but the type of school or the level differs. The email says which.",
        "**Possible.** One of you asked for a different district in the same province - Galle when the post is in Matara, for instance. Worth a look, not a fit. The email says so plainly.",
        "**Never.** A different subject. An English post is not a swap for a Mathematics one, so those are never put together."
      ]
    },
    {
      type: "prose", heading: "What is shared, and with whom", level: "h2",
      bullets: [
        "**Nothing is published.** There is no public list of teachers. Your request is kept in a private sheet that only RCF English can open.",
        "**Your details go only to a matching teacher:** your name, email address, WhatsApp number if you give one, subject, district, school type, level, medium, service and any note you add.",
        "**Nothing else is asked for.** The form does not ask for your school's name, your NIC number or your address.",
        "**Requests close after six months** unless you renew them, so an old request cannot introduce you to someone long after you stopped looking."
      ]
    },
    {
      type: "prose", heading: "Changing or closing your request", level: "h2",
      text: [
        "When you submit the form, Google emails you a copy with a link to edit it. Use that link to change your districts, to renew your request, or to close it by answering \"No - remove my request\". To have your entry deleted completely, ask RCF English on WhatsApp."
      ]
    },
    {
      type: "share", heading: "Tell a colleague", level: "h2",
      text: "A free, private way for English, Maths and Science teachers in Sri Lanka to find a teacher of the same subject to exchange places with.",
      hashtags: ["SriLanka", "TeacherTransfers", "EnglishTeachers", "MathsTeachers", "ScienceTeachers"]
    }
  ]
};

const out = {
  _readme: [
    "MUTUAL TRANSFERS FOR ENGLISH, MATHEMATICS AND SCIENCE TEACHERS",
    "Generated by tools/transfers/add-page.js. Do not edit by hand: change the",
    "script and run it again with the form's link. The matching itself runs in",
    "the owner's Google account (tools/transfers/Code.gs, SETUP.md), not here."
  ],
  pages: [page]
};
fs.writeFileSync(path.join(ROOT, "_src/pages/teacher-resources-transfers.json"), JSON.stringify(out, null, 2) + "\n");

// A button in the hero and a card lower down, both on the English Teachers
// Resources hub. Written here rather than by hand so that they stay in step
// with the page, and so running this script twice changes nothing.
const hubFile = path.join(ROOT, "_src/pages/teacher-resources.json");
const raw = fs.readFileSync(hubFile, "utf8");
const bom = raw.charCodeAt(0) === 0xFEFF ? "﻿" : "";
const tr = JSON.parse(bom ? raw.slice(1) : raw);
const hub = tr.pages.find((p) => p.slug === "teacher-resources");

const more = hub.blocks.find((b) => b.type === "cards" && b.heading === "More for teachers");
if (!more) throw new Error('"More for teachers" cards not found on the teacher resources hub');
const card = { title: "Mutual Transfers", url: SLUG + "/", more: "Open", text: ["For English, Maths and Science teachers: find a teacher of your subject to exchange places with. Private: your details go only to a teacher whose request matches yours."] };
const at = more.items.findIndex((c) => c.url === card.url);
if (at === -1) more.items.push(card); else more.items[at] = card;

// The button goes first in the hero, because a teacher looking for a transfer
// is not browsing for lesson plans.
const button = { label: "Mutual transfers", url: SLUG + "/", style: "btn--accent" };
hub.hero.buttons = hub.hero.buttons || [];
const buttonAt = hub.hero.buttons.findIndex((b) => b.url === button.url);
if (buttonAt === -1) {
  // The hero holds three buttons comfortably; the one it already led with
  // becomes an outline button so that only one is highlighted.
  hub.hero.buttons.forEach((b) => { if (b.style === "btn--accent") b.style = "btn--ghost-light"; });
  hub.hero.buttons.unshift(button);
} else {
  hub.hero.buttons[buttonAt] = button;
}
fs.writeFileSync(hubFile, bom + JSON.stringify(tr, null, 2) + "\n");

console.log(`Mutual Transfers page written, linking to ${url}; hub button and card ${at === -1 ? "added" : "updated"}. Now run the build.`);
