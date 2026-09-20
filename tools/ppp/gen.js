// Builds _src/pages/teacher-resources-ppp.json from the plan data files in
// this folder. Usage: node tools/ppp/gen.js _src/pages/teacher-resources-ppp.json
const fs = require("fs");
const path = require("path");
const OUT = process.argv[2] || path.join(__dirname, "../../_src/pages/teacher-resources-ppp.json");
const D = __dirname;
const L = Object.assign({}, require(D + "/g3-g6.js"), require(D + "/g4.js"), require(D + "/g7-g8.js"), require(D + "/g9-g11.js"), require(D + "/al.js"));
const ORDER = ["g3", "g4", "g6", "g7", "g8", "g9", "g10", "g11", "al"];

const HUB = "teacher-resources/ppp-lesson-plans";
const TR = { label: "English Teachers Resources", url: "teacher-resources/" };
const PREMIUM = {
  type: "callout", style: "info", title: "Complete lesson plan books are coming",
  text: ["These are simple sample plans. **Complete lesson plan books for every grade** will be part of **RCF Premium Resources**, which will be ready in the future. [See RCF Premium Resources](premium-resources/)"]
};
const OWN = "Every plan on this page was written by RCF English. The unit and activity names refer to the government Pupil's Book so that you can find the right page; no textbook text is reproduced here. Download it as an editable Word document or a print-ready PDF.";
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
  description: "Free sample PPP (Presentation, Practice, Production) English lesson plans for Sri Lankan classrooms, linked to Pupil's Book units for Grades 3, 4, 6 to 11 and A/L General English.",
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
        ["Grade 5", "We do not have the Grade 5 Pupil's Book yet."],
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
  "Grade 4": L.g4,
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
    "Copy the headings into your record book or print this page. For the Competencies column, see [English Competencies and Competency Levels by Grade](teacher-resources/competency-levels/). The units are listed in the order of each grade's Pupil's Book. **Fill in the term, weeks and dates from your own school calendar**; term dates and the number of English periods change from year to year and from school to school, so we have not filled them in for you.",
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
// Laid out like the school's SBA assessment tool form: the details of the
// tool, the instructions for teacher and students, the marking criteria, and
// the signatures. One tool per printed page in the downloads.
const BLANK = "______________________";
let sbaCount = 0;
function sbaTool(t) {
  sbaCount++;
  return [
    {
      type: "table", level: "h3", _pageBreak: true,
      heading: `SBA plan ${sbaCount}: ${t.title}`,
      columns: ["Item", "Details"],
      rows: [
        ["School name", BLANK],
        ["Grade", t.grade],
        ["Subject", t.subject],
        ["Date", BLANK],
        ["Term", t.term || "1st / 2nd / 3rd (as set in your school's SBA plan)"],
        ["Selected evaluation", t.evaluation],
        ["Time duration", t.time],
        ["Competency", t.competency],
        ["Competency level", t.official ? t.level : t.level + " *(Sample wording: use the competency level in your Teacher's Guide.)*"],
        ["Subject content", t.content],
        ["Nature of the tool", t.nature],
        ["Learning outcome", t.outcome],
        ["Teacher's activity", t.teacher],
        ["Students' activity", t.students]
      ]
    },
    {
      type: "table", level: "h4",
      heading: "Criteria for marking",
      columns: ["Criteria", "Marks"],
      rows: [...t.criteria.map((c) => [c, "05"]), ["**Total**", `**${String(t.criteria.length * 5).padStart(2, "0")}**`]]
    },
    { type: "prose", text: [`**In-charge teacher:** ${BLANK}`, `**Principal:** ${BLANK}`] }
  ];
}
const ENG = "English";
const sbaEnglish = [
  { group: "Primary (Grades 2 to 5)", tools: [
    { title: "Show and tell", grade: "2 / 3", subject: ENG, evaluation: "Oral presentation", time: "1 to 2 minutes per pupil (over two periods)",
      competency: "Uses simple spoken English to talk about familiar things.", level: "Names and describes a familiar object in simple sentences.",
      content: "Things at home and in school; colours and sizes", nature: "Individual oral presentation",
      outcome: "Pupils will be able to say three simple sentences about an object they bring from home.",
      teacher: "Models a short show-and-tell with an object, gives the sentence frames (This is my ... It is ... I like it because ...), and calls pupils one by one.",
      students: "Bring an object from home and say at least three sentences about it to the class.",
      criteria: ["Names the object in a full sentence", "Describes it (colour, size or use)", "Speaks clearly enough to be understood", "Speaks with confidence and little prompting"] },
    { title: "Listen and do", grade: "2 / 3", subject: ENG, evaluation: "Listening test (practical)", time: "One period",
      competency: "Listens to and follows simple spoken instructions.", level: "Responds correctly to one-step and two-step instructions.",
      content: "Action words, classroom objects, colours", nature: "Whole-class practical listening task",
      outcome: "Pupils will be able to carry out simple instructions given in English.",
      teacher: "Gives instructions one at a time (Stand up. Touch your nose. Colour the ball red.), repeating each once, and records each pupil's responses on a checklist.",
      students: "Listen and carry out each instruction, including drawing and colouring on a worksheet.",
      criteria: ["Follows action instructions", "Follows instructions with objects", "Follows colouring and drawing instructions", "Follows two-step instructions"] },
    { title: "My picture book", grade: "4 / 5", subject: ENG, evaluation: "Assignment (creative work)", time: "Two periods",
      competency: "Writes simple sentences about familiar topics.", level: "Writes one or two sentences to match a picture.",
      content: "My family / My school", nature: "Individual picture book",
      outcome: "Pupils will be able to write simple, correctly punctuated sentences about their own pictures.",
      teacher: "Shows a sample picture book, revises capital letters and full stops, and helps pupils plan four pages.",
      students: "Draw four pictures about their family or school and write one or two sentences under each.",
      criteria: ["Every picture has a matching sentence", "Sentences make sense", "Capital letters and full stops are correct", "Book is neat and complete"] },
    { title: "Reading aloud", grade: "4 / 5", subject: ENG, evaluation: "Oral test (reading)", time: "2 minutes per pupil",
      competency: "Reads short texts aloud with understanding.", level: "Reads a practised text accurately and fluently.",
      content: "A short practised passage of about 60 words", nature: "Individual reading-aloud test",
      outcome: "Pupils will be able to read a short passage aloud accurately, in phrases, with a clear voice.",
      teacher: "Chooses and practises the passage with the class, then listens to each pupil and marks on a class sheet.",
      students: "Read the practised passage aloud to the teacher.",
      criteria: ["Reads the words accurately", "Reads in phrases, not word by word", "Pauses at full stops and commas", "Uses a clear, audible voice"] }
  ] },
  { group: "Junior secondary (Grades 6 to 9)", tools: [
    { title: "Role play", grade: "6 / 7", subject: ENG, evaluation: "Role play", time: "One period for preparation, 3 minutes per pair",
      competency: "Competency 8: Communicates clearly, fluently and concisely", level: "8.13 Uses language in variety of contexts (Grades 6 and 7)", official: true,
      content: "Asking for and giving directions / shopping", nature: "Pair role play",
      outcome: "Students will be able to complete an everyday conversation using the expressions from the unit.",
      teacher: "Revises the useful expressions, gives each pair a situation card, and assesses each pair during the performance.",
      students: "Prepare and act out the situation in pairs, with a clear start and end.",
      criteria: ["Completes the task in the situation", "Uses the unit's expressions correctly", "Speaks fluently with few long pauses", "Pronounces clearly and responds to the partner"] },
    { title: "Instruction poster", grade: "6 / 7", subject: ENG, evaluation: "Assignment (poster)", time: "Two periods",
      competency: "Competency 7: Uses English creatively and innovatively in written communication", level: "7.4 Writes instructions (Grades 6 and 7)", official: true,
      content: "Preventing dengue / making a cup of tea", nature: "Individual or pair poster",
      outcome: "Students will be able to write at least six clear instructions using imperatives and sequence words.",
      teacher: "Shows a model poster, revises imperatives and sequence words, and gives the topics.",
      students: "Make a poster with a heading, pictures and at least six instructions in order.",
      criteria: ["Relevant instructions in the right order", "Correct imperatives and sequence words", "Clear layout with heading and pictures", "Neat and readable from a distance"] },
    { title: "Reading log", grade: "7 / 8 / 9", subject: ENG, evaluation: "Portfolio", time: "One term",
      competency: "Competency 5: Extracts necessary information from various types of texts", level: "5.5 Reads and understands simple folk stories (Grade 7) / Reads and responds to simple folk stories / stories (Grade 8) / Reads and responds to simple folk tales (Grade 9); 5.6 Extracts the general idea of a text (Grades 7, 8 and 9)", official: true,
      content: "Three short books or stories chosen by the student", nature: "Individual reading portfolio",
      outcome: "Students will be able to summarise stories and give reasons for their opinions.",
      teacher: "Explains the log format, helps students choose readers, and checks the log twice during the term.",
      students: "Keep a log with a five-sentence summary and an opinion with reasons for each of three books or stories.",
      criteria: ["Summaries give the main events", "Opinions are supported by reasons", "Sentences are mostly accurate", "Log is complete and regularly kept"] },
    { title: "Class wall newspaper", grade: "8 / 9", subject: ENG, evaluation: "Group project", time: "Two weeks",
      competency: "Competency 7: Uses English creatively and innovatively in written communication", level: "7.5 Writes simple compositions on different types of topics (Grades 8 and 9)", official: true,
      content: "Newspaper writing: news report, notice, story or poem, puzzle", nature: "Group project",
      outcome: "Students will be able to write in different formats and work together to publish them.",
      teacher: "Forms groups, shows sample wall newspapers, sets deadlines, and monitors each member's contribution.",
      students: "Plan, write, edit and display a wall newspaper with at least four items; each member writes one item.",
      criteria: ["All items present and relevant", "Correct formats and accurate language", "Teamwork: each member's part is shown", "Attractive and readable presentation"] }
  ] },
  { group: "O/L (Grades 10 and 11)", tools: [
    { title: "Formal letter under timed conditions", grade: "10 / 11", subject: ENG, evaluation: "Written test", time: "30 minutes",
      competency: "Competency 7: Uses English creatively and innovatively in written communication", level: "7.7 Writes for official purposes (Grades 10 and 11)", official: true,
      content: "Letter of complaint or request on a local issue", nature: "Individual timed writing",
      outcome: "Students will be able to write a formal letter of about 150 words with the correct format and tone.",
      teacher: "Sets the task with clear points to include, and supervises the timed writing.",
      students: "Write a formal letter covering all the given points in 30 minutes.",
      criteria: ["Correct format (addresses, date, salutation, subject, close)", "All points covered with detail", "Clear paragraphs", "Accurate grammar and a suitable formal tone"] },
    { title: "Two-minute speech", grade: "10 / 11", subject: ENG, evaluation: "Speech", time: "2 minutes per student",
      competency: "Competency 8: Communicates clearly, fluently and concisely", level: "8.4 Speaks on familiar topics (Grades 10 and 11)", official: true,
      content: "A topic from the textbook (for example healthy food or careers)", nature: "Individual speech",
      outcome: "Students will be able to deliver an organised two-minute speech.",
      teacher: "Gives topics a week ahead, shows how to open and close a speech, and marks each speech.",
      students: "Prepare and deliver a two-minute speech with an opening, main points and a closing.",
      criteria: ["Clear main idea with supporting points", "Opening, body and closing", "Accurate and varied language", "Audible delivery with eye contact"] },
    { title: "Survey and report", grade: "10 / 11", subject: ENG, evaluation: "Assignment", time: "Two periods",
      competency: "Competency 5: Extracts necessary information from various types of texts", level: "5.3 Transfers information into other forms (Grades 10 and 11)", official: true,
      content: "Class survey and bar chart", nature: "Individual or pair report",
      outcome: "Students will be able to present survey results in a bar chart and a short report.",
      teacher: "Explains how to conduct a survey and describe a chart, and gives useful phrases.",
      students: "Conduct a class survey, draw a bar chart and write a short report on the findings.",
      criteria: ["Accurate, labelled chart", "Main findings described", "Comparison language used correctly", "Accurate sentences"] }
  ] },
  { group: "A/L General English (Grades 12 and 13)", tools: [
    { title: "Group presentation", grade: "12 / 13", subject: "General English", evaluation: "Presentation", time: "5 minutes per group",
      competency: "Presents information clearly to an audience.", level: "Delivers a structured presentation with signposting.",
      content: "A textbook topic (for example the cyber world or continuing education)", nature: "Group presentation",
      outcome: "Students will be able to deliver a structured group presentation on a textbook topic.",
      teacher: "Forms groups, assigns topics, teaches signposting language, and assesses the presentations.",
      students: "Research, plan and deliver a five-minute presentation in which every member speaks.",
      criteria: ["Relevant, well-researched content", "Introduction, signposting and conclusion", "Accurate, appropriate language", "Clear delivery and every member takes part"] },
    { title: "Formal email", grade: "12 / 13", subject: "General English", evaluation: "Written test", time: "30 minutes",
      competency: "Writes formal emails for a specific purpose.", level: "Writes a clear formal email with the correct structure and tone.",
      content: "Email to the principal of another school about a joint event", nature: "Individual timed writing",
      outcome: "Students will be able to write a formal email that covers all the required points.",
      teacher: "Sets the task with the required points and supervises the writing.",
      students: "Write the email in 30 minutes.",
      criteria: ["Subject line, greeting and closing", "All required points covered", "Polite, formal tone", "Accurate language"] },
    { title: "Discursive essay", grade: "12 / 13", subject: "General English", evaluation: "Written test", time: "45 minutes",
      competency: "Writes an essay that discusses both sides of an issue.", level: "Organises a balanced argument with examples.",
      content: "An issue from the textbook units", nature: "Individual essay",
      outcome: "Students will be able to write a balanced essay of about 250 words.",
      teacher: "Gives two or three questions, revises essay structure, and supervises the writing.",
      students: "Choose one question and write an essay of about 250 words.",
      criteria: ["Both sides discussed with examples", "Introduction, balanced body and conclusion", "Accurate and varied language", "Clear link between ideas"] },
    { title: "Job application and interview", grade: "12 / 13", subject: "General English", evaluation: "Role play and written work", time: "One period for the letter, 5 minutes per interview",
      competency: "Uses English for employment purposes.", level: "Writes a covering letter and answers interview questions appropriately.",
      content: "Job advertisements and covering letters (Unit 8, Employment)", nature: "Individual written task and interview",
      outcome: "Students will be able to apply for a job in writing and answer interview questions politely and clearly.",
      teacher: "Provides advertisements, revises the covering-letter format, and conducts short interviews.",
      students: "Write a covering letter for one advertisement and take part in a short interview for that job.",
      criteria: ["Correct covering-letter format", "Relevant letter content", "Clear, relevant interview answers", "Polite and fluent manner"] }
  ] }
];
const LIT = "English Literature";
const sbaLiterature = [
  { title: "Poetry (analysing theme and techniques)", grade: "11", subject: LIT, term: "2nd Term", evaluation: "Assignment / Creative Portfolio", time: "1 week (independent study + 40-minute presentation)",
    competency: "Responds critically to poetry by identifying themes and poetic devices.", level: "Explores the underlying meanings, tone and imagery used by poets to convey central messages.",
    content: "Selected O/L poems (for example To the Evening Star or Richard Cory)", nature: "Individual literary commentary portfolio",
    outcome: "Students will be able to analyse poetic techniques such as metaphor, simile and personification and explain how they contribute to the poem's theme.",
    teacher: "Introduces the poem, explains core poetic devices, provides a rubric, and guides students on how to structure a literary commentary.",
    students: "Select one prescribed poem, analyse three major poetic devices used in it, write a 150-word commentary, and present their main findings to the class.",
    criteria: ["Understanding of themes and central message", "Correct identification and analysis of poetic devices", "Structure, organisation and language accuracy", "Presentation / oral defence"] },
  { title: "Short stories (character analysis)", grade: "10 / 11", subject: LIT, term: "1st / 2nd Term", evaluation: "Role play and character profile", time: "2 periods (preparation) + 1 period (execution)",
    competency: "Analyses character traits, motives and relationships within a short story.", level: "Demonstrates empathy and critical understanding of characters by interpreting their actions and dialogue.",
    content: "Prescribed short stories (for example The Lumber Room or The Fly)", nature: "Group role play and character sketch presentation",
    outcome: "Students will be able to extract textual evidence to justify a character's behaviour and mindset.",
    teacher: "Divides the class into small groups, assigns specific characters from a short story, and monitors the brainstorming sessions.",
    students: "Collaborate to create a visual character profile poster and perform a short three-minute role play depicting a crucial scene from that character's perspective.",
    criteria: ["Accurate depiction of character traits based on the text", "Use of textual evidence / references", "Teamwork and collaboration", "Creativity and expression (role play / poster)"] },
  { title: "Novel: The Vendor of Sweets (theme exploration)", grade: "11", subject: LIT, term: "2nd Term", evaluation: "Open-book analytical essay / test", time: "80 minutes",
    competency: "Evaluates major themes and cultural conflicts in an extended text.", level: "Examines the generation gap, the clash of East and West, and illusion versus reality in Malgudi.",
    content: "Novel: The Vendor of Sweets by R. K. Narayan", nature: "Structured analytical essay",
    outcome: "Students will write a coherent essay analysing how the conflict between Jagan and Mali represents the clash between traditional Indian values and Western modernisation.",
    teacher: "Formulates analytical essay prompts, sets clear guidelines for thesis statements, and ensures students have access to their unmarked novels during the session.",
    students: "Choose one prompt, formulate a thesis statement, select appropriate quotations from The Vendor of Sweets, and write a structured essay with an introduction, body paragraphs and a conclusion.",
    criteria: ["Depth of thematic understanding", "Effective use of textual quotations and references", "Logical flow and argumentative strength", "Grammar, vocabulary and mechanics"] },
  { title: "Drama (dramatised reading and stagecraft)", grade: "10 / 11", subject: LIT, evaluation: "Dramatised reading with director's notes", time: "2 periods (preparation) + 1 period (performance)",
    competency: "Interprets drama through performance and an understanding of dramatic techniques.", level: "Conveys character, mood and conflict through voice, movement and staging choices.",
    content: "Prescribed drama (The Bear or Twilight of a Crane)", nature: "Group dramatised reading with individual director's notes",
    outcome: "Students will be able to perform a key scene and explain how stage directions, dialogue and action reveal character and conflict.",
    teacher: "Selects key scenes, explains dramatic techniques (stage directions, dramatic irony, climax), forms groups and monitors rehearsals.",
    students: "Rehearse and perform a key scene of about four minutes, and each write a short set of director's notes (about 100 words) explaining their staging choices.",
    criteria: ["Understanding of character and conflict", "Voice, expression and movement", "Director's notes explain staging choices with reference to the text", "Teamwork and preparation"] },
  { title: "Novel (reading journal)", grade: "10 / 11", subject: LIT, evaluation: "Reading journal (portfolio)", time: "Over one term, with journal checks every two weeks",
    competency: "Responds personally and critically to an extended text.", level: "Tracks plot, character development and themes across a novel.",
    content: "The novel your school has selected for SBA", nature: "Individual reading journal",
    outcome: "Students will be able to record and reflect on plot, characters and themes as they read, supported by quotations.",
    teacher: "Explains the journal format (chapter summary, character notes, key quotation, personal response), sets the reading schedule and checks journals regularly.",
    students: "Keep a journal entry for each chapter or section with a short summary, notes on one character, one key quotation with a comment, and a personal response.",
    criteria: ["Accurate summaries of plot", "Insight into character development and themes", "Well-chosen quotations with comments", "Regular, complete and neatly kept journal"] }
];
const sbaPage = {
  slug: "teacher-resources/sba-samples",
  title: "Sample School Based Assessment (SBA) Tools for English and Literature",
  metaTitle: "Sample English and Literature SBA Assessment Tools, Grades 2 to 13 | RCF English",
  description: "Sample School Based Assessment (SBA) tools for English (Grades 2 to 13) and O/L English Literature, set out in the school assessment tool format with competency, activities and marking criteria.",
  keywords: "SBA English, SBA English Literature, school based assessment tool, assessment tool template Sri Lanka, SBA marking criteria",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Ready-to-use assessment tools in the familiar school format: details, instructions, marking criteria and signatures." },
  blocks: [
    { type: "callout", style: "warn", title: "These are samples, not official instructions", text: [
      "Each tool is set out in the usual **School Based Assessment tool** format. Fill in your school's name and the date. **For Grades 6 to 11 English, the competency and competency level numbers are taken from the NIE English Language Teachers' Guides** for those grades (see [Competency Levels by Grade](teacher-resources/competency-levels/)). The Grade 6 guide used is the edition implemented from 2015, so schools on the new 2026 Grade 6 syllabus should use the numbers in the new guide. For primary grades, A/L General English and Literature we do not yet have the Teachers' Guides, so the competency wording there is a sample: copy the official competency and level from your guide. Follow the SBA plan and circulars for your grade and year for the number of tools, their timing and how marks are recorded. The terms shown in the Literature tools are suggestions; change them to suit your school's plan."
    ] },
    ...sbaEnglish.flatMap((g) => [{ type: "prose", heading: "English: " + g.group, text: [] }, ...g.tools.flatMap(sbaTool)]),
    { type: "prose", heading: "English Literature (O/L)", text: ["One of the prescribed novels is assessed by the school as well as examined, and the school chooses which. The three novels on the list shown on our O/L Literature page are The Prince and the Pauper, Bringing Tony Home and The Vendor of Sweets; confirm the list for your examination year."] },
    ...sbaLiterature.flatMap(sbaTool),
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

// ---------- Competencies and competency levels ----------
const COMP = require(D + "/competencies.js");
for (const g of COMP.GRADES) for (const [n, w] of g.levels) if (!w) throw new Error(`No wording for ${g.grade} ${n}`);
const compPage = {
  slug: "teacher-resources/competency-levels",
  title: "English Competencies and Competency Levels by Grade",
  metaTitle: "English Competencies and Competency Levels, Grades 6 to 11 | RCF English",
  description: "The eight English Language competencies and the competency levels for each grade from 6 to 11, as listed in the NIE English Language Teachers' Guides.",
  keywords: "English competency levels, competency levels grade 6 to 11, NIE teachers guide English competencies, SBA competency level",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Every competency level for Grades 6 to 11 in one place, for lesson plans, term plans and SBA tools." },
  blocks: [
    { type: "callout", style: "info", title: "Where these come from", text: [
      "The competencies and competency levels below are taken from the **NIE English Language Teachers' Guides** for each grade. Each grade keeps its own guide's numbering and wording, because the guides do not always number the same level in the same way. Always check against the Teachers' Guide your school is using.",
      "**Not included yet:** the primary grades, Grades 12 and 13 (A/L General English) and English Literature, because we do not have those Teachers' Guides. The **new 2026 Grade 6 syllabus** uses a different set of competencies; the Grade 6 table here follows the earlier syllabus."
    ] },
    { type: "table", heading: "The eight competencies (Grades 6 to 11)", columns: ["Competency", "Description"],
      rows: Object.entries(COMP.NAMES).map(([n, t]) => [`Competency ${n}`, t]) },
    ...COMP.GRADES.map((g) => ({
      type: "table", heading: `${g.grade} competency levels`, _pageBreak: true,
      intro: [`**Source:** ${g.source}`, ...(g.note ? [g.note] : [])],
      columns: ["Competency", "Level", "Competency level"],
      rows: g.levels.map(([n, w]) => [`Competency ${n.split(".")[0]}`, n, w])
    })),
    PREMIUM
  ]
};

// ---------- Official books and Teachers' Guides ----------
const BK = require(D + "/books.js");
const bkLink = (title, path, d) => `[Download ${title}](${d.dl}) · [read online](${d.view})`;
const tgLink = (title, path, d) => `[Download ${title}](${d.dl}) · [read online](${d.view})`;
const booksPage = {
  slug: "teacher-resources/textbooks-and-teacher-guides",
  title: "English Pupil's Books, Workbooks and Teachers' Guides",
  metaTitle: "Download English Pupil's Books, Workbooks and Teachers' Guides, Grades 1 to 13 | RCF English",
  description: "Direct links to every English Pupil's Book, Workbook and Teachers' Guide published free by the Educational Publications Department and the National Institute of Education, Grades 1 to 13.",
  keywords: "English pupils book download, English teachers guide download, edupub English textbook, NIE English teachers guide, Sri Lanka English textbook PDF",
  kicker: "Teacher Resources", kind: "teacher-resource", schema: "LearningResource",
  breadcrumbs: [TR], backTo: TR,
  hero: { text: "Every English book and guide the government publishes free, with a direct link to each one." },
  blocks: [
    { type: "callout", style: "info", title: "These are links to the official sites", text: [
      "These are the government's own books and guides, published by the **Educational Publications Department** and the **National Institute of Education**. Nothing on this page is an RCF publication, and nothing here is sold.",
      "Everything below is served from the **RCF English Drive**, because the government download sites fail too often to be worth sending you to. **Download** saves the PDF straight to your device; **read online** opens it in Google Drive without downloading.",
      "Every link here was checked and opened a PDF. If one ever fails, tell us and we will replace it."
    ] },
    { type: "table", heading: "Pupil's Books, Workbooks and other books", intro: ["Published by the Educational Publications Department. Every link here is a **whole book**: where the department only publishes a book one unit at a time, we leave it out rather than send you to fourteen separate files. Grades 1 and 2 follow Activity Based Oral English (ABOE), so they have an Activity Book and a Song Book instead of a Pupil's Book."],
      columns: ["Grade", "Book", "Download"],
      rows: BK.BOOKS.filter(([, , , d]) => d).map(([g, t, p, d]) => [g, t, bkLink(t + " (PDF)", p, d)]) },
    { type: "table", heading: "Books we do not have a copy of yet",
      intro: ["These books exist, but we have no copy in the RCF English Drive, and we do not link the Educational Publications Department's own site because its downloads fail too often to be worth sending anyone to. They will appear above as copies are added."],
      columns: ["Grade", "Book"],
      rows: BK.BOOKS.filter(([, , , d]) => !d).map(([g, t]) => [g, t]) },
    { type: "table", heading: "Teachers' Guides", intro: ["Written by the National Institute of Education. Where a grade has two guides, the later one is the current guide and the earlier one is kept for reference."],
      columns: ["Grade", "Teachers' Guide", "Download"],
      rows: BK.GUIDES.filter(([, , , d]) => d).map(([g, t, p, d]) => [g, t, tgLink(t + " (PDF)", p, d)]) },
    { type: "table", heading: "Teachers' Guides we do not have a copy of yet",
      intro: ["These guides exist on the National Institute of Education's site, but we have no copy in the RCF English Drive yet. They will appear above as copies are added."],
      columns: ["Grade", "Teachers' Guide"],
      rows: BK.GUIDES.filter(([, , , d]) => !d).map(([g, t]) => [g, t]) },
    { type: "table", heading: "What is not on the official sites", intro: ["So that you do not spend an evening looking for them."],
      columns: ["What you may be looking for", "What we found"], rows: BK.MISSING },
    { type: "cards", heading: "What to do with these books", columns: "3", items: [
      { title: "Sample PPP Lesson Plans", url: HUB + "/", more: "113 plans", text: ["Ready lessons built on the unit activities in these books."] },
      { title: "Annual and Term Plan Templates", url: "teacher-resources/annual-term-plan-templates/", more: "Open", text: ["Each grade's units, ready for your scheme of work."] },
      { title: "Competency Levels by Grade", url: "teacher-resources/competency-levels/", more: "Grades 6 to 11", text: ["The competency levels these guides set out."] }
    ] }
  ]
};

// ---------- downloads (made by downloads.js) ----------
const DL = "assets/downloads/teacher/";
const DOWNLOADS = [
  ...ORDER.map((k) => ({ slug: `${HUB}/${L[k].slug}`, file: `rcf-english-${L[k].slug}-ppp-lesson-plans`, label: `${L[k].label} PPP lesson plans`, landscape: false })),
  { slug: annual.slug, file: "rcf-english-annual-term-plan-templates", label: "Annual and term plan templates", landscape: true },
  { slug: notes.slug, file: "rcf-english-daily-weekly-notes-templates", label: "Daily and weekly notes templates", landscape: true },
  { slug: booksPage.slug, file: "rcf-english-textbooks-and-teacher-guides", label: "Pupil's Books, Workbooks and Teachers' Guides (link list)", landscape: false },
  { slug: compPage.slug, file: "rcf-english-competency-levels-grades-6-11", label: "Competencies and competency levels (Grades 6 to 11)", landscape: false },
  { slug: sbaPage.slug, file: "rcf-english-sample-sba-tasks", label: "Sample SBA tools (English and Literature)", landscape: false },
  { slug: propPage.slug, file: "rcf-english-sample-project-proposals", label: "Sample project proposals", landscape: false }
];
const links = (d) => `[Word document (.docx)](${DL}${d.file}.docx) · [PDF](${DL}${d.file}.pdf)`;
const pages = [hub, ...ORDER.map(planPage), annual, notes, compPage, booksPage, sbaPage, propPage];
for (const d of DOWNLOADS) {
  pages.find((p) => p.slug === d.slug).blocks.unshift({
    type: "callout", style: "note", _download: true, title: "Download this page",
    text: [
      `**${links(d)}**`,
      "The Word file can be edited in Microsoft Word, Google Docs, WPS Office or LibreOffice, so you can add your school's name and change it for your class. The PDF is ready to print."
    ]
  });
}
hub.blocks.splice(2, 0, {
  type: "table", heading: "Download everything", _download: true,
  intro: ["Every page in this set as an editable Word document and a print-ready PDF. All of them are free to copy and adapt for teaching."],
  columns: ["Resource", "Download"],
  rows: DOWNLOADS.map((d) => [`[${d.label}](${d.slug}/)`, links(d)])
});

module.exports = { DOWNLOADS };

if (require.main === module) {
  const out = {
    _readme: [
      "PPP LESSON PLANS, PLANNING TEMPLATES, SBA SAMPLES AND PROJECT PROPOSALS",
      "Generated by tools/ppp/gen.js from the RCF English plan data. All content is",
      "written by RCF English; Pupil's Book units and activities are named, not copied.",
      "The Word and PDF downloads are made by tools/ppp/downloads.js."
    ],
    pages
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log("pages:", out.pages.length, ORDER.map((k) => `${k}:${L[k].plans.length}`).join(" "));
}
