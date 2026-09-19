// Builds data/pick-of-the-day.json for the home page's "Pick of the Day".
// Usage: node tools/make-picks.js   (run after build.cmd, before committing)
//
// The list below is chosen by hand so the pick is always something worth
// opening. The title and the sentence come from the site's own search index,
// so they cannot drift out of date, and a URL that no longer exists stops the
// script instead of shipping a dead link.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const index = JSON.parse(fs.readFileSync(path.join(ROOT, "data/search-index.json"), "utf8"));
const byUrl = new Map(index.map((e) => [e.url, e]));

// [url, the line shown in the popup, who it is for]
const PICKS = [
  ["teacher-resources/ppp-lesson-plans/", "113 ready-to-teach lesson plans, built on the units of the Pupil's Book.", "For teachers"],
  ["teacher-resources/textbooks-and-teacher-guides/", "Every English book and guide the government publishes free, with a direct download.", "For teachers"],
  ["teacher-resources/annual-term-plan-templates/", "A yearly scheme and a term plan, with each grade's units already listed.", "For teachers"],
  ["teacher-resources/daily-weekly-notes-templates/", "Record-of-work forms that take a minute to fill in, not an hour.", "For teachers"],
  ["teacher-resources/sba-samples/", "Twenty SBA tools in the school assessment format, with marking criteria.", "For teachers"],
  ["teacher-resources/school-project-proposals/", "Six proposals you can adapt and hand to your principal.", "For teachers"],
  ["teacher-resources/competency-levels/", "Every competency level for Grades 6 to 11 in one place.", "For teachers"],
  ["teacher-resources/worksheets-by-grade/", "Sixty worksheets, ten for each grade from 6 to 11, each with an answer key.", "For teachers"],
  ["teacher-resources/worksheet-generator/", "Choose the grade and topics, and print a worksheet with its answer key.", "For teachers"],
  ["teacher-resources/flashcards-and-games/", "Print flashcards from ready-made word sets, with eight games to play.", "For teachers"],
  ["teacher-resources/lesson-plan-template/", "A blank plan, an observation checklist and a self-evaluation form.", "For teachers"],
  ["teacher-resources/classroom-activities/", "Activities that need no materials and almost no preparation.", "For teachers"],
  ["teacher-resources/mixed-ability-teaching/", "One class, six levels, one teacher: what actually works.", "For teachers"],
  ["teacher-resources/rubrics/", "Marking rubrics you can print and use tomorrow.", "For teachers"],
  ["teacher-resources/slow-learner-support/", "Smaller steps, more models, more repetition, done deliberately.", "For teachers"],
  ["speaking-practice/", "Speak to the site and hear how you sound. No partner needed.", "Practise speaking"],
  ["practical-english/ielts/mock-speaking-test/", "A full IELTS speaking test with all three parts, timed and marked.", "Practise speaking"],
  ["practical-english/conversation-partner/", "Hold a conversation with the site and see where it leads.", "Practise speaking"],
  ["practical-english/practical-conversations/", "The conversations you actually need: shops, buses, offices, interviews.", "Practise speaking"],
  ["listening-lab/", "Over a hundred listening tests, with the script afterwards.", "Practise listening"],
  ["essay-writing-exercises/", "Build an essay a step at a time instead of staring at a blank page.", "Practise writing"],
  ["writing-practice/", "Guided writing tasks with a model answer to compare against.", "Practise writing"],
  ["ol-english/", "Everything for the O/L English paper, question type by question type.", "O/L"],
  ["ol-literature/", "The prescribed texts, with themes, quotations and model answers.", "O/L"],
  ["general-english/", "A/L General English: the whole paper, explained and practised.", "A/L"],
  ["al-literature/", "A/L Literature: the texts, the essay questions and how to answer them.", "A/L"],
  ["practical-english/ielts/", "IELTS from the beginning: all four papers, with practice tests.", "IELTS"],
  ["past-papers/", "Past papers and marking schemes, sorted so you can find one fast.", "Exams"],
  ["exam-centre/", "Dates, formats and what each paper actually asks of you.", "Exams"],
  ["grades/", "Everything for your grade, from 6 to 11, in one place.", "By grade"],
  ["primary-english/", "English for the little ones: songs, games and simple practice.", "Primary"],
  ["primary-english/game-zone/", "Games that teach English without feeling like work.", "Primary"],
  ["english-games/", "Free English games for children, playable in the browser.", "Primary"],
  ["interactive/", "Quizzes and exercises that mark themselves as you go.", "Practise"],
  ["search/", "Looking for something particular? Search the whole site.", "Find it fast"]
];

const picks = PICKS.map(([url, text, tag]) => {
  const entry = byUrl.get(url);
  if (!entry) throw new Error(`No page at "${url}" - fix tools/make-picks.js`);
  const dir = path.join(ROOT, url.replace(/\/$/, ""), "index.html");
  if (!fs.existsSync(dir)) throw new Error(`Page not built: ${url}`);
  return { title: entry.title, text, tag, url };
});

const out = path.join(ROOT, "data/pick-of-the-day.json");
fs.writeFileSync(out, JSON.stringify(picks, null, 2) + "\n");
console.log(`${picks.length} picks written to data/pick-of-the-day.json`);
