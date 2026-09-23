// PASSIVE VOICE (present and past simple) - lesson plan and worksheet, built
// to tools/esl/STANDARD.md. All content is RCF English's own.

exports.lesson = {
  slug: "passive-voice",
  topic: "Passive Voice",
  cefr: "B1",
  cefrNote: "B1, with a B2 extension in the notes",
  learners: "Teenagers and adults",
  minutes: 60,
  shortRoute: "For a 45-minute lesson, teach the present passive only and leave the past passive for a second lesson.",
  skills: "Reading, speaking and writing",
  focus: "The passive in the present and past simple: form with be + past participle, when to use it, and by + agent",
  materials: "The two texts, the worksheet, a board",
  prep: "10 minutes",
  framework: "Guided discovery: learners compare two versions of the same information and work out why one uses the passive",

  intro: [
    "A complete 60-minute lesson on the passive voice for B1: learners compare an active and a passive description of the same thing, work out for themselves why the passive exists, and then use it to write about how something is made.",
    "The lesson answers the question every class asks - why not just say who did it? - instead of teaching the transformation as a puzzle with no purpose."
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to form and use the passive in the present and past simple to describe processes and facts where the doer is unknown, obvious or unimportant.",
    subsidiary: [
      "Learners will be able to decide when the passive is the better choice and when the active is.",
      "Learners will be able to add by + agent only when the doer carries real information."
    ]
  },

  text: {
    title: "Two ways to say the same thing",
    body: "A. Somebody built this bridge in 1908. Workers repaired it after the flood in 1996, and every year the council paints it. People call it the Iron Bridge, and thousands of drivers use it every day. - B. This bridge was built in 1908. It was repaired after the flood in 1996, and it is painted every year. It is called the Iron Bridge, and it is used by thousands of drivers every day. - Text B is the one you would find on the sign beside the bridge.",
    gist: "Which text is about the bridge, and which is about the people? Which one belongs on a sign?",
    detail: ["When was the bridge built?", "How often is it painted?", "Who uses it?", "In text B, why is \"by thousands of drivers\" kept, when \"by somebody\" is not?"]
  },

  analysis: {
    meaning: [
      "The passive puts the important thing first. In a text about a bridge, the bridge is the subject of every sentence, and who did the work is secondary - often unknown, obvious, or simply not the point.",
      "So we choose the passive when the doer is unknown (*my bike was stolen*), obvious (*the road is cleaned every night*), or unimportant (*the forms are checked on Monday*), and in writing that describes processes, rules and facts.",
      "We add *by + agent* only when the doer is worth saying: *It is used by thousands of drivers* is information; *it was built by somebody* is not."
    ],
    ccqs: [
      ["\"This bridge was built in 1908.\" Do we know who built it?", "No."],
      ["Is that a problem here?", "No - the bridge is the subject."],
      ["\"It is painted every year.\" Once, or regularly?", "Regularly."],
      ["\"My bike was stolen.\" Do I know who did it?", "No - if I did, I would say so."]
    ],
    form: [
      ["Present simple passive", "am / is / are + past participle", "The forms **are checked** on Monday."],
      ["Past simple passive", "was / were + past participle", "The bridge **was built** in 1908."],
      ["Negative", "is not / was not + past participle", "The road **wasn't repaired** last year."],
      ["Question", "Is / Was + subject + past participle", "**Was** it **repaired** after the flood?"],
      ["With the doer", "... + by + agent", "It **is used by** thousands of drivers."]
    ],
    spelling: "Nothing new to spell: the passive uses the past participle, the same third form learners already need for the present perfect. Regular verbs repeat the past form (repair → repaired); irregular verbs use their own (build → built, take → taken, write → written, make → made).",
    pronunciation: [
      "**is and was are weak** inside the sentence: /ɪz/ and /wəz/. *It was built* runs together as /ɪtwəzˈbɪlt/.",
      "**were** is very weak indeed: /wə/. Learners who expect /wɜː/ often miss it entirely when listening.",
      "**The stress falls on the participle**, not on be: it was **BUILT**, they are **CHECKED**. This is what makes a passive sentence sound natural."
    ],
    problems: [
      ["The verb be is dropped: *The bridge built in 1908.*", "This is the mistake of the lesson. Board the pattern with a box round *be*, and drill short pairs until the box is never empty."],
      ["Past participle confused with past simple: *It was build. / It was wrote.*", "Return to the three forms. Test the third column only, since that is the one the passive needs."],
      ["by + agent added everywhere: *The window was broken by somebody.*", "Give the test: does the doer tell the reader anything? If not, leave it out."],
      ["The passive used where the active is natural: *The ball was kicked by me.*", "Show two versions and ask which sounds like a report and which like a person talking. The passive is a choice, not a better form."],
      ["Intransitive verbs made passive: *The accident was happened.*", "Some verbs take no object, so they cannot be passive: happen, arrive, come, go, die. Give the five and move on."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in: what is it made of?", time: "5 min", pattern: "Whole class, then pairs",
      aim: "To create interest and let the target language appear naturally.",
      steps: [
        "Hold up or name three ordinary objects: a pencil, a plastic bottle, a shirt.",
        "Ask what each is made of and where it was made. Accept any answer, in any form.",
        "In pairs, learners choose one object in the room and say three things about it. Do not correct yet."
      ]
    },
    {
      style: "presentation", name: "Two ways to say the same thing", time: "12 min", pattern: "Pairs, then whole class",
      aim: "To let learners discover why the passive exists before it is named.",
      steps: [
        "Learners read texts A and B and answer the gist question in pairs: which is about the bridge, and which is about the people?",
        "Take the answers, then work through the four detail questions. The last one - why keep *by thousands of drivers* - is the heart of the lesson.",
        "Elicit the three reasons onto the board: the doer is unknown, obvious, or not important.",
        "Only now name it: this is the passive."
      ]
    },
    {
      style: "presentation", name: "Clarify the form", time: "8 min", pattern: "Whole class",
      aim: "To make the form clear in both tenses and to fix the stress.",
      steps: [
        "Board the pattern with a box around be: *be + past participle*. Fill the box with is, are, was, were from sentences in text B.",
        "Elicit the negative and the question from the same text.",
        "Drill four sentences, with the stress on the participle: *it was BUILT, they are CHECKED.*",
        "Ask the CCQs to check that a regular action and a finished one are told apart."
      ]
    },
    {
      style: "practice", name: "Controlled practice", time: "13 min", pattern: "Individual, then pairs to check",
      aim: "To practise the form accurately in both tenses.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then compare with a partner.",
        "Check as a class. For every answer, ask which tense and why.",
        "Put two sentences with a missing *be* on the board - your own - and let the class repair them."
      ]
    },
    {
      style: "practice", name: "Choose: active or passive?", time: "7 min", pattern: "Pairs",
      aim: "To practise the decision, not only the form.",
      steps: [
        "Read out six short situations: *You are writing a notice about the library. You are telling a friend what you did yesterday.*",
        "Pairs decide active or passive for each, and say why in one sentence.",
        "Take the answers quickly. Disagreement is useful here: some are genuinely either."
      ]
    },
    {
      style: "production", name: "Freer writing: how it is made", time: "10 min", pattern: "Pairs, then groups of four",
      aim: "To use the passive for its real purpose: describing a process.",
      steps: [
        "Pairs choose something they know how it is made or done: tea, a school timetable, a cricket pitch, a dish from home.",
        "They write four or five sentences describing the process, in the passive where it fits.",
        "Two pairs join and read their processes to each other, who ask one question each.",
        "Collect two good sentences for the board."
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct the common mistakes and check the main aim.",
      steps: [
        "Write four sentences from the freer stage on the board - two correct, two with a missing be or a past simple instead of a participle - for the class to repair.",
        "Exit task: two sentences about your town, one present passive and one past passive. Collect them."
      ]
    }
  ],

  support: "Give weaker learners the three forms of ten verbs on a slip, and let them write their process sentences in the present passive only.",
  stretch: "Stronger learners use the passive with modals - *it must be checked, it can be repaired* - and try one sentence with the present perfect passive: *it has been painted*.",

  adaptations: [
    ["A class of 40 or more", "The choose-active-or-passive stage works as a whole-class vote by hands, which is fast and shows you immediately who is guessing. Collect exit tasks from two rows."],
    ["No photocopier", "Write texts A and B on the board before the lesson, one above the other - the comparison is easier to see that way than on paper."],
    ["Online", "Put texts A and B on screen side by side. The process-writing stage works well in a shared document, one pair per line."],
    ["Exam classes", "Point out that the passive appears in nearly every B1 writing task about rules, processes or reports, and that Task 3 is the exact transformation exercise those exams use."]
  ],

  check: "The exit task requires one sentence in each tense, so a learner who can only manage one of them is visible at once.",
  homework: "Worksheet Task 5: describe a process from your own life in six sentences.",
  worksheetSlug: "passive-voice"
};

exports.worksheet = {
  slug: "passive-voice",
  topic: "Passive Voice",
  cefr: "B1",
  minutes: 35,
  intro: [
    "A printable passive voice worksheet for B1 learners: past participles, the present and past passive, active-to-passive transformation, when to use by, and a writing task describing a process. Full answer key and teacher's notes.",
    "It goes with the Passive Voice lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. The third form",
      instruction: "Write the past participle of each verb.",
      items: [
        "**0** build → built",
        "make → ________",
        "write → ________",
        "take → ________",
        "grow → ________",
        "send → ________",
        "repair → ________",
        "speak → ________",
        "find → ________"
      ]
    },
    {
      title: "Task 2. Complete the passive",
      instruction: "Use the present or past simple passive of the verb in brackets.",
      items: [
        "**0** The bridge **was built** (build) in 1908.",
        "Rice ________ (grow) in many parts of Asia.",
        "The letters ________ (send) last Friday.",
        "This room ________ (clean) every morning.",
        "My bicycle ________ (steal) last week.",
        "These shirts ________ (make) in Bangladesh.",
        "The results ________ (not / publish) yet.",
        "________ the windows ________ (repair) after the storm?"
      ]
    },
    {
      title: "Task 3. Active to passive",
      instruction: "Rewrite each sentence in the passive. Leave out the doer if it adds nothing.",
      items: [
        "**0** Somebody cleans the office every evening. → The office is cleaned every evening.",
        "They built the school in 1975. → ________________________",
        "Farmers grow tea on these hills. → ________________________",
        "Someone stole my phone at the station. → ________________________",
        "The council checks the water twice a year. → ________________________",
        "Millions of people watch this programme. → ________________________"
      ]
    },
    {
      title: "Task 4. With by, or without?",
      instruction: "Decide whether the doer is worth keeping. Write the sentence with by ... or without it.",
      items: [
        "**0** The window was broken (by somebody). → The window was broken.",
        "This novel was written (by a teenager). → ________________________",
        "The room is cleaned (by a cleaner). → ________________________",
        "The bridge is used (by thousands of drivers). → ________________________",
        "My car was repaired (by someone). → ________________________"
      ]
    },
    {
      title: "Task 5. Your turn",
      instruction: "Describe a process you know in six sentences: how something is made, grown, cooked or organised. Use the passive where the doer is not important.",
      items: [
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "________________________________________"
      ],
      answerLines: false
    }
  ],
  answers: [
    ["Task 1", "made, written, taken, grown, sent, repaired, spoken, found."],
    ["Task 2", "1 is grown  2 were sent  3 is cleaned  4 was stolen  5 are made  6 have not been published (or: were not published)  7 Were ... repaired"],
    ["Task 3", "1 The school was built in 1975.  2 Tea is grown on these hills.  3 My phone was stolen at the station.  4 The water is checked twice a year.  5 This programme is watched by millions of people. (Here the doer is worth keeping.)"],
    ["Task 4", "1 This novel was written by a teenager. (Keep: it is the surprise.)  2 The room is cleaned. (Drop: obvious.)  3 The bridge is used by thousands of drivers. (Keep: it is information.)  4 My car was repaired. (Drop: says nothing.)"],
    ["Task 5", "Answers will vary. Check: be is present in every passive sentence, the participle is the third form, and by is used only where the doer matters."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 25 minutes; Task 5 about 10, or set it as homework.",
    "**The one to watch:** the missing *be* (*the school built in 1975*) and the past simple used instead of the participle (*was build*). Both come from the same place - the passive needs two parts, and learners produce one.",
    "**Task 2, item 6** accepts two answers. *Have not been published* is the present perfect passive and is what a fluent speaker would say with *yet*; *were not published* is acceptable at B1. Praise the first if it appears.",
    "**Task 4 is the thinking task.** Learners who keep every *by* have the form but not the purpose, and that is what makes passive writing sound wrong.",
    "**Extension:** learners rewrite a short paragraph from their coursebook in the passive and decide whether it is improved. Often it is not, and noticing that is the point."
  ],
  lessonSlug: "passive-voice"
};
