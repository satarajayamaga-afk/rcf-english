// Builds _src/pages/teacher-resources-ppp.json from the plan data files in
// this folder. Usage: node tools/ppp/gen.js _src/pages/teacher-resources-ppp.json
const fs = require("fs");
const path = require("path");
const OUT = process.argv[2];
const D = __dirname;
const L = Object.assign({}, require(D + "/g3-g6.js"), require(D + "/g7-g8.js"), require(D + "/g9-g11.js"), require(D + "/al.js"));
const ORDER = ["g3", "g6", "g7", "g8", "g9", "g10", "g11", "al"];

const HUB = "teacher-resources/ppp-lesson-plans";
const TR = { label: "English Teachers Resources", url: "teacher-resources/" };
const PREMIUM = {
  type: "callout", style: "info", title: "Complete lesson plan books are coming",
  text: ["These are simple sample plans. **Complete lesson plan books for every grade** will be part of **RCF Premium Resources**, which will be ready in the future. [See RCF Premium Resources](premium-resources/)"]
};
const OWN = "Every plan on this page was written by RCF English. The unit and activity names refer to the government Pupil's Book so that you can find the right page; no textbook text is reproduced here. Print the page or save it as a PDF from your browser's print option.";
const join = (a) => a.join(" ");

function planPage(key) {
  const g = L[key];
  const who = key === "al" ? "students" : "pupils";
  const blocks = [
    { type: "callout", style: "tip", title: "About these plans", text: [g.note, OWN] },
    { type: "prose", heading: "The PPP stages in one line each", text: [
      "**Presentation:** the teacher shows the new language in a clear context. **Practice:** " + who + " use it in controlled tasks, usually from the Pupil's Book. **Production:** " + who + " use it more freely for their own purpose. **Check and close:** a quick check of learning, then homework."
    ] }
  ];
  g.plans.forEach((p, i) => {
    const [unit, title, act, focus, outcome, materials, pres, prac, prod, close, hw] = p;
    blocks.push({
      type: "table", level: "h2",
      heading: `Plan ${i + 1}: Unit ${unit}, ${title}`,
      intro: [
        `**Book activity:** ${act}. **Focus:** ${focus}.`,
        `**Learning outcome:** by the end of the lesson, ${who} will be able to ${outcome}`,
        `**Materials:** ${materials}.`
      ],
      caption: `${g.label}, Unit ${unit}: ${focus}. A 40-minute PPP lesson.`,
      columns: ["Stage", "Time", "What happens"],
      rows: [
        ["Presentation", "10 min", join(pres)],
        ["Practice", "12 min", join(prac)],
        ["Production", "13 min", join(prod)],
        ["Check and close", "5 min", `${close} **Homework:** ${hw}`]
      ]
    });
  });
  blocks.push(PREMIUM);
  blocks.push({ type: "cards", heading: "Plans for other grades", columns: "4", items: ORDER.filter((k) => k !== key).map((k) => ({ title: L[k].label, url: `${HUB}/${L[k].slug}/`, more: `${L[k].plans.length} plans` })) });
  return {
    slug: `${HUB}/${g.slug}`,
    title: `${g.label} PPP Lesson Plans`,
    metaTitle: `${g.label} English PPP Lesson Plans (sample) | RCF English`,
    description: `${g.plans.length} free sample PPP (Presentation, Practice, Production) English lesson plans for ${g.label}, each linked to a unit and activity in the ${g.book}.`,
    keywords: `${g.label} English lesson plans, PPP lesson plan, Sri Lanka English lesson plan, ${g.label} English Pupil's Book`,
    kicker: "Teacher Resources",
    kind: "teacher-resource",
    schema: "LearningResource",
    breadcrumbs: [TR, { label: "PPP Lesson Plans", url: HUB + "/" }],
    backTo: { label: "PPP Lesson Plans", url: HUB + "/" },
    hero: { text: `${g.plans.length} ready-to-teach sample plans that follow the ${g.book}.` },
    blocks
  };
}

const hub = {
  slug: HUB,
  title: "Sample PPP Lesson Plans, Grades 3 to 13",
  metaTitle: "Sample PPP English Lesson Plans for Grades 3 to 13 | RCF English",
  description: "Free sample PPP (Presentation, Practice, Production) English lesson plans for Sri Lankan classrooms, linked to Pupil's Book units for Grades 3, 6 to 11 and A/L General English.",
  keywords: "PPP lesson plan, English lesson plans Sri Lanka, presentation practice production, Grade 6 to 11 English lesson plans, A/L General English lesson plan",
  kicker: "Teacher Resources",
  kind: "teacher-resource",
  schema: "LearningResource",
  breadcrumbs: [TR],
  backTo: TR,
  hero: { text: "Simple 40-minute lessons in three stages, each built on a unit activity in the government Pupil's Book." },
  blocks: [
    { type: "prose", heading: "What a PPP lesson is", text: [
      "PPP stands for **Presentation, Practice and Production**. The teacher first presents a small piece of language in a clear situation. Pupils then practise it in controlled tasks, and finally use it for a purpose of their own. It suits large classes because each stage has a clear start and end, and it fits the activity sequence of the Sri Lankan Pupil's Books well.",
      "Each plan below gives the book unit and activity, the learning outcome, the materials, and what happens in each stage with timings for a 40-minute period. Adapt the timings to your own timetable."
    ] },
    { type: "cards", heading: "Choose a grade", variant: "tint", columns: "4", items: ORDER.map((k) => ({ title: L[k].label, url: `${HUB}/${L[k].slug}/`, more: `${L[k].plans.length} plans`, text: [L[k].book + "."] })) },
    { type: "table", heading: "Grades without sample plans yet", intro: ["These plans are built on the Pupil's Books we have. We do not yet have the books below, so we have not written plans for them rather than guess their contents."],
      columns: ["Grade", "Why there are no plans yet"],
      rows: [
        ["Grade 2", "We do not have the Grade 2 book yet."],
        ["Grades 4 and 5", "We do not have the Grade 4 and Grade 5 Pupil's Books yet."],
        ["Grade 6 (2026 book)", "The Grade 6 plans follow the 2014 to 2019 edition. We do not have the new 2026 Grade 6 book yet."],
        ["Grades 12 and 13", "There is one A/L General English textbook for both years, so the twenty A/L plans cover both grades together."]
      ] },
    PREMIUM,
    { type: "cards", heading: "More planning help", columns: "3", items: [
      { title: "Annual and Term Plan Templates", url: "teacher-resources/annual-term-plan-templates/", more: "Open", text: ["A yearly scheme and term plan for each grade, with the book's units listed."] },
      { title: "Daily and Weekly Notes Templates", url: "teacher-resources/daily-weekly-notes-templates/", more: "Open", text: ["Record-of-work forms with a sample entry for each grade."] },
      { title: "Lesson Plan Template", url: "teacher-resources/lesson-plan-template/", more: "Open", text: ["A blank plan, an observation checklist and a self-evaluation form."] }
    ] }
  ]
};

// ---------- Annual and term plans ----------
const UNITS = {
  "Grade 2": null,
  "Grade 3": L.g3,
  "Grade 4": null,
  "Grade 5": null,
  "Grade 6": L.g6,
  "Grade 7": L.g7,
  "Grade 8": L.g8,
  "Grade 9": L.g9,
  "Grade 10": L.g10,
  "Grade 11": L.g11,
  "Grade 12": L.al,
  "Grade 13": L.al
};
function unitList(g) {
  const seen = new Map();
  g.plans.forEach((p) => { if (!seen.has(p[0])) seen.set(p[0], p[1]); });
  return [...seen].map(([n, t]) => `Unit ${n}: ${t}`);
}
const annualBlocks = [
  { type: "callout", style: "tip", title: "How to use these templates", text: [
    "Copy the headings into your record book or print this page. The units are listed in the order of each grade's Pupil's Book. **Fill in the term, weeks and dates from your own school calendar**; term dates and the number of English periods change from year to year and from school to school, so we have not filled them in for you.",
    "These forms were written by RCF English and may be copied and adapted freely."
  ] },
  { type: "table", heading: "1. Annual plan (scheme of work)", caption: "Annual plan template. One row for each unit.",
    columns: ["Unit", "Competencies / competency levels", "Main activities", "Term", "Weeks / periods", "Planned dates", "Assessment (including SBA)", "Completed on", "Remarks"],
    rows: [["", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", ""]] },
  { type: "table", heading: "2. Term plan", caption: "Term plan template. One row for each week of the term.",
    columns: ["Week", "Dates", "Unit and activities", "Skills and grammar focus", "Periods", "Resources", "Assessment", "Done / not done", "Reason and catch-up plan"],
    rows: [["Week 1", "", "", "", "", "", "", "", ""], ["Week 2", "", "", "", "", "", "", "", ""], ["Week 3", "", "", "", "", "", "", "", ""]] },
  { type: "prose", heading: "3. Grade by grade", text: ["Each table lists the units of that grade's book, ready to copy into the annual plan. Add the term, weeks and dates yourself."] }
];
Object.entries(UNITS).forEach(([grade, g]) => {
  if (!g) {
    annualBlocks.push({ type: "table", heading: `${grade} annual plan`, level: "h3",
      intro: [`We do not have the ${grade} book yet, so the units are not listed. Copy them from your ${grade} Teacher's Guide or Pupil's Book into the blank rows.`],
      columns: ["Unit", "Term", "Weeks / periods", "Planned dates", "Completed on", "Remarks"],
      rows: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`Unit ${n}:`, "", "", "", "", ""]) });
    return;
  }
  const intro = [g === L.al ? "Grades 12 and 13 share one A/L General English textbook. Your school's scheme decides which units are taught in each year." : `Units from the ${g.book}.`];
  if (g === L.g6) intro.push("These are the 2014 to 2019 edition units. Schools using the new 2026 Grade 6 book should copy that book's units instead.");
  annualBlocks.push({ type: "table", heading: `${grade} annual plan`, level: "h3", intro,
    columns: ["Unit", "Term", "Weeks / periods", "Planned dates", "Completed on", "Remarks"],
    rows: unitList(g).map((u) => [u, "", "", "", "", ""]) });
});
annualBlocks.push(PREMIUM);
const annual = {
  slug: "teacher-resources/annual-term-plan-templates",
  title: "Annual and Term Plan Templates for Grades 2 to 13",
  metaTitle: "English Annual Plan and Term Plan Templates, Grades 2 to 13 | RCF English",
  description: "Free annual plan (scheme of work) and term plan templates for English teachers, with the Pupil's Book units listed for each grade from 2 to 13.",
  keywords: "English annual plan template, term plan template, scheme of work Sri Lanka, English teacher record book",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "A yearly scheme and a term plan you can copy into your record book, with each grade's units already listed." },
  blocks: annualBlocks
};

// ---------- Daily and weekly notes ----------
const sample = {
  "Grade 2": ["Topic from your Teacher's Guide (for example, greetings)", "Pupils listened to and sang a greeting song and greeted three friends.", "Most pupils greet confidently; four need more practice."],
  "Grade 4": ["Unit and topic from your Pupil's Book", "Pupils read a short text aloud and answered oral questions.", "Group reading went well; revise new words next lesson."],
  "Grade 5": ["Unit and topic from your Pupil's Book", "Pupils wrote four sentences about a picture after oral practice.", "Six pupils need help with capital letters."]
};
function sampleRow(grade, g) {
  if (!g) return [grade, ...sample[grade]];
  const p = g.plans[0];
  return [grade, `Unit ${p[0]}, ${p[1]}: ${p[2]}`, `${p[3]}. ${p[8][0]}`, "Most pupils achieved the outcome; note the names of those who need support."];
}
const notes = {
  slug: "teacher-resources/daily-weekly-notes-templates",
  title: "Daily and Weekly Notes Templates for Grades 2 to 13",
  metaTitle: "Daily and Weekly Lesson Notes Templates for English Teachers | RCF English",
  description: "Free daily notes and weekly notes (record of work) templates for English teachers, in versions for primary, junior secondary, O/L and A/L classes, with a sample entry for each grade.",
  keywords: "daily lesson notes template, weekly notes template, record of work English teacher, Sri Lanka teacher record book",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Short forms that record what was taught, what worked and what to do next, without taking an hour to fill in." },
  blocks: [
    { type: "callout", style: "tip", title: "Before you use these", text: [
      "If your school or zone gives you its own record book format, use that; these forms are a simple model. They were written by RCF English and may be copied and adapted freely. Print this page or save it as a PDF from your browser."
    ] },
    { type: "table", heading: "1. Daily notes", caption: "Daily notes template. One row for each lesson.",
      columns: ["Date and period", "Grade and class", "Unit and activity", "Learning outcome", "What was done", "Homework", "Reflection: what worked, who needs help"],
      rows: [["", "", "", "", "", "", ""], ["", "", "", "", "", "", ""], ["", "", "", "", "", "", ""]] },
    { type: "table", heading: "2. Weekly notes (record of work)", caption: "Weekly notes template. One row for each class.",
      columns: ["Week and dates", "Grade and class", "Units and activities covered", "Competency levels", "Periods planned / held", "Assessment done", "Follow-up for next week", "Signature (teacher / SI or principal)"],
      rows: [["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""]] },
    { type: "table", heading: "3. What to add at each level", columns: ["Level", "Add these to the daily and weekly notes"],
      rows: [
        ["Primary (Grades 2 to 5)", "Songs, rhymes and games used; the words pupils can now say; pupils who have not yet spoken in English this week."],
        ["Junior secondary (Grades 6 to 9)", "The grammar point and the Pupil's Book activity numbers; workbook pages set; spelling or dictation results."],
        ["O/L (Grades 10 and 11)", "Which O/L paper question type was practised; timed writing done; marks from term-test style tasks."],
        ["A/L (Grades 12 and 13)", "The skill section of the unit (reading, listening, speaking, writing, grammar); essay or email tasks set and returned; SBA tasks completed."]
      ] },
    { type: "table", heading: "4. A sample daily entry for each grade", intro: ["One filled-in example per grade shows the level of detail that is enough. Grades 2, 4 and 5 use general examples because we do not have those books yet."],
      columns: ["Grade", "Unit and activity", "What was done", "Reflection"],
      rows: Object.entries(UNITS).map(([grade, g]) => sampleRow(grade, g)) },
    PREMIUM
  ]
};

// ---------- SBA samples ----------
const sba = (heading, level, time, task, rows) => ({
  type: "table", level: "h3", heading,
  intro: [`**Level:** ${level}. **Time:** ${time}.`, `**Task:** ${task}`],
  columns: ["Criterion", "Marks", "What earns full marks"], rows
});
const sbaPage = {
  slug: "teacher-resources/sba-samples",
  title: "Sample School Based Assessment (SBA) Tasks for English",
  metaTitle: "Sample English SBA Tasks and Rubrics, Grades 2 to 13 | RCF English",
  description: "Sample School Based Assessment (SBA) tasks for English from primary to A/L, each with instructions and a simple marking rubric.",
  keywords: "SBA English, school based assessment Sri Lanka, English SBA tasks, English assessment rubric",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Ready-to-use sample tasks with clear marking, from a Grade 2 show-and-tell to an A/L presentation." },
  blocks: [
    { type: "callout", style: "warn", title: "These are samples, not official instructions", text: [
      "These tasks and rubrics were written by RCF English as examples. **Follow the SBA guidelines issued for your grade and year** for the number of tasks, their timing and how marks are recorded and reported. The marks below are suggestions; scale them to whatever total your guidelines require."
    ] },
    { type: "prose", heading: "Primary (Grades 2 to 5)" },
    sba("1. Show and tell", "Grades 2 and 3", "1 to 2 minutes per pupil", "Bring an object from home and say three sentences about it: what it is, its colour or size, and why you like it.",
      [["Says what the object is", "3", "Names the object in a full sentence."], ["Adds detail", "3", "Gives colour, size or use."], ["Clarity", "2", "Can be heard and understood."], ["Confidence", "2", "Speaks without heavy prompting."]]),
    sba("2. Listen and do", "Grades 2 and 3", "10 minutes", "The teacher gives ten simple instructions (Stand up. Touch your nose. Draw a red ball.). Pupils carry them out.",
      [["Correct responses", "10", "One mark for each instruction followed correctly."]]),
    sba("3. My picture book", "Grades 4 and 5", "Two periods", "Draw four pictures about your family or your school and write one or two sentences under each.",
      [["Content", "4", "Every picture has a matching sentence."], ["Language", "4", "Simple sentences with correct capital letters and full stops."], ["Presentation", "2", "Neat and complete."]]),
    sba("4. Reading aloud", "Grades 4 and 5", "2 minutes per pupil", "Read aloud a short passage of about 60 words that the class has practised.",
      [["Accuracy", "4", "Reads almost every word correctly."], ["Fluency", "3", "Reads in phrases, not word by word."], ["Expression", "3", "Uses pauses and a clear voice."]]),
    { type: "prose", heading: "Junior secondary (Grades 6 to 9)" },
    sba("5. Role play", "Grades 6 and 7", "3 minutes per pair", "In pairs, act out a situation such as asking for directions or buying things at a shop.",
      [["Task completion", "5", "The situation is completed with a clear start and end."], ["Language", "5", "Uses the unit's expressions correctly."], ["Fluency", "5", "Speaks with few long pauses."], ["Pronunciation and interaction", "5", "Clear, and responds to the partner."]]),
    sba("6. Instruction poster", "Grades 6 and 7", "Two periods", "Make a poster that gives at least six instructions, for example how to prevent dengue or how to make a cup of tea.",
      [["Content", "6", "At least six relevant instructions in order."], ["Language", "6", "Imperatives and sequence words used correctly."], ["Layout", "4", "Heading, pictures and clear order."], ["Neatness", "4", "Easy to read from a distance."]]),
    sba("7. Reading log", "Grades 7 to 9", "Over one term", "Keep a record of three short books or stories read, with a five-sentence summary and an opinion for each.",
      [["Summaries", "8", "Each summary gives the main events."], ["Opinion", "6", "Gives reasons for the opinion."], ["Language", "6", "Mostly accurate sentences."]]),
    sba("8. Class wall newspaper", "Grades 8 and 9", "Group project over two weeks", "In groups, produce a wall newspaper with a news report, a notice, a poem or story, and a puzzle.",
      [["Content", "8", "All four items present and relevant."], ["Language", "6", "Accurate, with correct formats."], ["Teamwork", "3", "Each member's part is shown."], ["Presentation", "3", "Attractive and readable."]]),
    { type: "prose", heading: "O/L (Grades 10 and 11)" },
    sba("9. Formal letter under timed conditions", "Grades 10 and 11", "30 minutes", "Write a formal letter of complaint or request on a given local issue (about 150 words).",
      [["Format", "4", "Addresses, date, salutation, subject line and close."], ["Content", "6", "All points covered with detail."], ["Organisation", "4", "Clear paragraphs."], ["Language", "6", "Accurate grammar, suitable formal tone."]]),
    sba("10. Two-minute speech", "Grades 10 and 11", "2 minutes per student", "Give a prepared speech on a topic from the textbook, such as healthy food or your future career.",
      [["Content", "5", "Clear main idea with supporting points."], ["Organisation", "5", "Opening, body and closing."], ["Language", "5", "Accurate and varied."], ["Delivery", "5", "Audible, with eye contact."]]),
    sba("11. Survey and report", "Grades 10 and 11", "Two periods", "Carry out a class survey, draw a bar chart and write a short report on the findings.",
      [["Data and chart", "5", "Chart is accurate and labelled."], ["Report", "10", "Describes the main findings using comparison language."], ["Language", "5", "Accurate sentences."]]),
    { type: "prose", heading: "A/L General English (Grades 12 and 13)" },
    sba("12. Group presentation", "Grades 12 and 13", "5 minutes per group", "Give a presentation on a topic from the textbook, such as the cyber world or continuing education.",
      [["Content", "5", "Well researched and relevant."], ["Structure", "5", "Introduction, signposting, conclusion."], ["Language", "5", "Accurate and appropriate."], ["Delivery and teamwork", "5", "Clear, confident, all members take part."]]),
    sba("13. Formal email", "Grades 12 and 13", "30 minutes", "Write a formal email to a principal of another school about a joint event.",
      [["Format", "4", "Subject line, greeting, closing."], ["Content", "6", "All required points."], ["Tone", "4", "Polite and formal."], ["Language", "6", "Accurate."]]),
    sba("14. Discursive essay", "Grades 12 and 13", "45 minutes", "Write an essay of about 250 words discussing both sides of a question.",
      [["Content", "6", "Both sides with examples."], ["Organisation", "6", "Introduction, balanced body, conclusion."], ["Language", "8", "Accurate and varied."]]),
    sba("15. Job interview role play", "Grades 12 and 13", "5 minutes per student", "Respond to a job advertisement with a covering letter, then take part in a short interview.",
      [["Letter", "8", "Correct format and relevant content."], ["Interview answers", "8", "Clear, relevant answers."], ["Language and manner", "4", "Polite, fluent."]]),
    PREMIUM
  ]
};

// ---------- Project proposals ----------
function proposal(n, title, background, objectives, target, activities, committee, resources, evaluation, outcomes) {
  return {
    type: "table", heading: `${n}. ${title}`,
    columns: ["Section", "What to write"],
    rows: [
      ["Project title", title],
      ["Submitted by", "Name, subject (English) and school"],
      ["Submitted to", "The Principal, through the relevant sectional head"],
      ["Background", background],
      ["Objectives", objectives],
      ["Target group", target],
      ["Proposed date and duration", "To be decided with the school administration and entered in the school calendar."],
      ["Venue", "To be decided (for example, the school hall or classrooms)."],
      ["Activities", activities],
      ["Committee and responsibilities", committee],
      ["Resources needed", resources],
      ["Estimated budget", "List each item with quantity and a local price you have checked. Leave out anything the school already has."],
      ["Source of funds", "For example, school development funds, class funds or sponsorship. Confirm with the principal."],
      ["Evaluation", evaluation],
      ["Expected outcomes", outcomes],
      ["Approval", "Signatures and dates: teacher in charge, sectional head, principal."]
    ]
  };
}
const propPage = {
  slug: "teacher-resources/school-project-proposals",
  title: "Sample School-Based English Project Proposals",
  metaTitle: "Sample English Project Proposals: English Day, English Only Day and more | RCF English",
  description: "Free sample project proposals for school English activities: English Only Day, English Day, a reading programme, a wall newspaper, an English Literary Association and a spelling bee and quiz.",
  keywords: "English Only Day proposal, English Day project proposal, school project proposal Sri Lanka, English activity proposal",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Six proposals you can adapt and hand to your principal, each in the same simple format." },
  blocks: [
    { type: "callout", style: "tip", title: "How to use these", text: [
      "Replace the general wording with your school's details. Dates, venues and costs are left for you to fill in, because they depend on your school; check prices locally before you submit a budget. These proposals were written by RCF English and may be copied and adapted freely."
    ] },
    proposal(1, "English Only Day",
      "Many pupils understand English but rarely use it outside the English period. One day a week or a month when English is spoken throughout the school gives them a real reason to use it.",
      "To give pupils regular practice in everyday spoken English; to build confidence; to involve all staff in supporting English.",
      "All pupils from the selected grades, with teachers and non-academic staff.",
      "A short English assembly; English announcements; a list of useful phrases displayed in each classroom; English greetings at the gate; a small reward for classes that use English well.",
      "Teacher in charge; English teachers to prepare phrase lists; prefects to encourage English use; class teachers to record participation.",
      "Phrase charts, a notice board, simple certificates or badges.",
      "Class participation records; a short pupil questionnaire after each month.",
      "Pupils use more spoken English and feel less afraid of making mistakes."),
    proposal(2, "English Day",
      "An annual English Day lets pupils show their English skills to parents and the school community.",
      "To give pupils a stage for English; to discover talent; to raise interest in English.",
      "Pupils of all grades, parents and staff.",
      "Inter-house or inter-class competitions (recitation, speech, singing, drama, spelling); a final programme with the winners; an exhibition of pupils' written work.",
      "Organising committee; competition judges; stage and sound; hospitality; publicity.",
      "Hall, sound system, certificates, trophies or prizes, decorations.",
      "Participation numbers, feedback from parents and staff, a short report with photographs.",
      "Greater interest in English and a list of talented pupils for zonal competitions."),
    proposal(3, "Class Reading Programme",
      "Many pupils read very little in English. A short daily or weekly reading time with a class reading corner builds the reading habit.",
      "To build the reading habit; to improve vocabulary and comprehension.",
      "Pupils of the selected grades.",
      "A class reading corner with graded books; a regular reading time; a simple reading log; a monthly best-reader recognition.",
      "Teacher in charge; class teachers; librarian; pupil reading monitors.",
      "Graded readers, a shelf or box, reading logs.",
      "Reading logs; a short reading test at the start and end of the term.",
      "Pupils read more and show better comprehension."),
    proposal(4, "English Wall Newspaper",
      "A wall newspaper gives pupils a real audience for their writing.",
      "To encourage writing; to develop teamwork; to display pupils' work.",
      "Pupils of Grades 6 to 11.",
      "Each class or group produces a wall newspaper in turn with news, notices, stories, poems and puzzles.",
      "Teacher in charge; class editors; a design team for each issue.",
      "Notice board, paper, markers.",
      "Quality of issues; number of pupils contributing.",
      "More pupils write in English and take pride in their work."),
    proposal(5, "English Literary Association",
      "An English club gives interested pupils regular opportunities beyond the classroom.",
      "To provide regular English activities; to prepare pupils for competitions; to develop leadership.",
      "Interested pupils of all grades.",
      "Regular meetings with debates, quizzes, drama, film discussions and guest speakers; election of office bearers.",
      "Teacher in charge; president, secretary and treasurer elected by members.",
      "Meeting room, stationery, a membership register.",
      "Attendance, activities completed, competition results.",
      "An active group of pupils who lead English activities in the school."),
    proposal(6, "Spelling Bee and English Quiz",
      "Competitions make vocabulary and general knowledge practice enjoyable.",
      "To improve spelling and vocabulary; to encourage healthy competition.",
      "Pupils of the selected grades, by class or house.",
      "Class-level rounds followed by a school final; word lists given in advance.",
      "Teacher in charge; question setters; judges; timekeepers.",
      "Word lists, question sheets, a timer, certificates.",
      "Participation and scores across rounds.",
      "Better spelling and more interest in words."),
    PREMIUM
  ]
};

const out = {
  _readme: [
    "PPP LESSON PLANS, PLANNING TEMPLATES, SBA SAMPLES AND PROJECT PROPOSALS",
    "Generated by a script from the RCF English plan data. All content is",
    "written by RCF English; Pupil's Book units and activities are named, not copied."
  ],
  pages: [hub, ...ORDER.map(planPage), annual, notes, sbaPage, propPage]
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log("pages:", out.pages.length, ORDER.map((k) => `${k}:${L[k].plans.length}`).join(" "));
