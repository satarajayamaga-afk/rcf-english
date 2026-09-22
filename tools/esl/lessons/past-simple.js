// PAST SIMPLE - lesson plan and worksheet. Written to tools/esl/STANDARD.md.
// All text, examples and exercises are RCF English's own.

exports.lesson = {
  slug: "past-simple",
  topic: "Past Simple",
  cefr: "A2",
  cefrNote: "A2, adaptable for A1+ and B1",
  learners: "Teenagers and adults",
  minutes: 60,
  shortRoute: "For a 45-minute lesson, drop the \"Find someone who\" mingle and set Worksheet Task 5 as homework.",
  skills: "Speaking, reading and writing",
  focus: "Past simple: regular and irregular verbs; negatives with didn't; questions with did; -ed pronunciation",
  materials: "The reading text (on the board or the worksheet), the worksheet, a board",
  prep: "10 minutes",
  framework: "PPP (presentation, practice, production), with the language met first in a short text",

  intro: [
    "A complete 60-minute lesson for teaching the past simple to A2 learners: a short story to meet the verbs in context, a clear focus on form and on the three sounds of -ed, controlled practice, a speaking mingle, and a freer task where learners tell a partner about a day they remember.",
    "It works with teenagers and adults, and every stage has notes for large classes, classes without a photocopier, and online lessons."
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to talk about finished events in the past using the past simple of regular and common irregular verbs, in positive sentences, negatives and questions.",
    subsidiary: [
      "Learners will be able to pronounce regular past endings correctly as /t/, /d/ or /ɪd/.",
      "Learners will be able to read a short narrative for the main idea and for detail."
    ]
  },

  text: {
    title: "Lina's Saturday",
    body: "Last Saturday, Lina visited her grandmother in the countryside. She got up early and caught the eight o'clock bus. The journey took two hours, so she listened to music and read a book. When she arrived, her grandmother cooked a big lunch. After lunch, they walked to the river and watched the birds. Lina wanted to take some photos, but she didn't have her phone. She left it on the bus! Luckily, the driver found it and called her grandmother's number. Lina went back to the bus station and got her phone before she went home. It was a long day, but she enjoyed it.",
    gist: "Was Lina's day good or bad? Why?",
    detail: ["How did Lina travel?", "What did they do after lunch?", "What problem did Lina have?", "Who found the phone?"]
  },

  analysis: {
    meaning: [
      "We use the past simple for actions and states that are finished, at a time in the past that we know or that is clear: *Lina visited her grandmother last Saturday.*",
      "Time words that go with it: yesterday, last week, last Saturday, two days ago, in 2019, when I was a child."
    ],
    ccqs: [
      ["\"Lina visited her grandmother.\" Is she visiting her now?", "No."],
      ["Did it happen before now?", "Yes."],
      ["Is it finished?", "Yes."],
      ["Do we know when?", "Yes: last Saturday."]
    ],
    form: [
      ["Positive", "subject + past form", "She **visited** her grandmother. They **went** home."],
      ["Negative", "subject + didn't + base verb", "She **didn't have** her phone."],
      ["Question", "(question word) + did + subject + base verb", "**Did** she **enjoy** it? Where **did** she **go**?"],
      ["Short answers", "Yes, + subject + did. / No, + subject + didn't.", "Yes, she did. / No, she didn't."]
    ],
    spelling: "Regular verbs add -ed (walk → walked). Verbs ending in -e add -d (arrive → arrived). Consonant + y becomes -ied (study → studied). One vowel + one consonant, stressed, doubles the consonant (stop → stopped). Irregular verbs have their own past forms (go → went, get → got, take → took) and are learned as vocabulary.",
    pronunciation: [
      "**/t/** after voiceless sounds such as /k/, /p/, /s/, /tʃ/: worked, stopped, watched.",
      "**/d/** after voiced sounds and vowels: played, called, listened.",
      "**/ɪd/**, an extra syllable, only after /t/ and /d/: wanted, visited, needed.",
      "In \"didn't\" and \"did you\", the vowel is short and \"did you\" often sounds like /dɪdʒu/ in fast speech."
    ],
    problems: [
      ["Learners use the past form after didn't: *I didn't went.*", "Show that did already carries the past, so the verb goes back to the base form: *didn't go*. Board it as a rule: did + base verb."],
      ["Learners use was with a main verb: *I was go to the market.*", "Contrast *I was tired* (was + adjective) with *I went* (past verb). Many first languages use a past marker this way, so expect it and correct gently."],
      ["Regularising irregular verbs: *goed*, *buyed*.", "Treat irregular verbs as vocabulary: a short list each lesson, practised aloud."],
      ["Adding an extra syllable to every -ed: *walk-ed* /wɔːkɪd/.", "Drill the three sounds with gestures; only /t/ and /d/ endings add a syllable."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in", time: "5 min", pattern: "Whole class, then pairs",
      aim: "To create interest and find out what learners already know.",
      steps: [
        "Tell the class three things you did last weekend, one of them false: *I cooked for eight people. I went swimming. I watched a film.* Learners guess the false one.",
        "In pairs, learners do the same: three sentences, one false. Listen, but do not correct yet. Note who already uses the past simple, and which mistakes come up."
      ]
    },
    {
      style: "presentation", name: "Reading for meaning", time: "10 min", pattern: "Individual, then pairs",
      aim: "To meet the past simple in a context and understand the story.",
      steps: [
        "Write the gist question on the board: *Was Lina's day good or bad? Why?* Learners read the text quickly and answer. Check in pairs, then as a class.",
        "Learners read again and answer the four detail questions. Check answers.",
        "ICQ before they read: *Do you need to understand every word?* (No.) *How long do you have?* (Two minutes.)"
      ]
    },
    {
      style: "presentation", name: "Focus on form and sound", time: "8 min", pattern: "Whole class",
      aim: "To make the meaning, form and pronunciation of the past simple clear.",
      steps: [
        "Learners underline every past verb in the text. Elicit them onto the board in two columns: regular (visited, listened) and irregular (got, took).",
        "Use the CCQs to check the meaning. Build the positive, negative and question forms on the board from sentences in the text.",
        "Drill the three -ed sounds with a gesture for each: worked /t/, played /d/, wanted /ɪd/."
      ]
    },
    {
      style: "practice", name: "Controlled practice", time: "12 min", pattern: "Individual, then pairs to check",
      aim: "To practise the form accurately.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then compare answers with a partner.",
        "Check answers as a class. Ask learners to say the full sentence, not just the verb, so you hear the pronunciation."
      ]
    },
    {
      style: "practice", name: "Find someone who", time: "8 min", pattern: "Mingle",
      aim: "To practise past simple questions and short answers in speech.",
      steps: [
        "Learners each get or copy six prompts: *Find someone who ... cooked a meal yesterday / watched a film last weekend / got up before six today / visited a relative last month / didn't sleep well last night / went somewhere new this year.*",
        "Model the question first: *Did you cook a meal yesterday?* - *Yes, I did. / No, I didn't.* When someone says yes, they ask one more question: *What did you cook?*",
        "ICQ: *Do you write your own name or your classmate's name?* (My classmate's.) *What do you ask when someone says yes?* (One more question.)"
      ]
    },
    {
      style: "production", name: "Freer speaking: a day I remember", time: "12 min", pattern: "Pairs, then whole class",
      aim: "To use the past simple fluently to tell a short personal story.",
      steps: [
        "Learners think of a good day from last year and make short notes: where, who with, what happened. Give two minutes; no full sentences.",
        "In pairs, each learner tells their story. The listener asks at least three questions with *did*.",
        "While they talk, write down good sentences and common mistakes, without interrupting. Two or three learners share their partner's story with the class."
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct the most common mistakes and check the main aim.",
      steps: [
        "Write four sentences you heard on the board, two correct and two with mistakes, and let the class find and fix the mistakes.",
        "Exit task: each learner writes three sentences about yesterday: one positive, one negative, one question. Collect them to check who met the aim."
      ]
    }
  ],

  support: "Give weaker learners a list of the irregular verbs from the text with their past forms, and let them do the Lead-in with a partner who helps. In the freer task, they may use their notes.",
  stretch: "Stronger learners add time expressions and linking words to their story (first, then, after that, in the end), and in the mingle ask two follow-up questions instead of one.",

  adaptations: [
    ["A class of 40 or more", "Run the mingle in rows: learners ask the people on their left, right, in front and behind, then change seats with the next row once. Collect exit tasks from one row each lesson."],
    ["No photocopier", "Write the text and Tasks 2 and 3 on the board or a large sheet before the lesson. Learners write answers in their notebooks. The mingle prompts can be dictated."],
    ["Online", "Share the text on screen. Put learners in breakout rooms of two or three for the Lead-in and the freer task. Replace the mingle with a shared document: each learner writes a Did you ... question and answers two others'."],
    ["Younger learners (9 to 12)", "Use a picture story instead of the text, and keep the mingle to four prompts about school and home."]
  ],

  check: "The exit task shows who can form positive, negative and question sentences correctly. Anyone who wrote *didn't* + past form needs the Lead-in rule again next lesson.",
  homework: "Worksheet Task 5, if not done in class: five sentences about yesterday and two questions for a partner.",
  worksheetSlug: "past-simple"
};

exports.worksheet = {
  slug: "past-simple",
  topic: "Past Simple",
  cefr: "A2",
  minutes: 35,
  intro: [
    "A printable past simple worksheet for A2 learners, with five graded tasks - from forming the verbs to writing about their own day - and a full answer key with notes for the teacher.",
    "It goes with the Past Simple lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. Regular or irregular?",
      instruction: "These verbs are from the story about Lina. Write R (regular) or I (irregular) next to each one. The first one is done for you.",
      items: ["**0** visited → R", "got ____", "caught ____", "took ____", "listened ____", "read ____", "arrived ____", "cooked ____", "walked ____", "left ____", "found ____", "enjoyed ____"],
      answerLines: false
    },
    {
      title: "Task 2. Write the past simple form",
      instruction: "Write the past simple of each verb. Be careful with spelling.",
      items: ["**0** play → played", "watch → ________", "study → ________", "stop → ________", "arrive → ________", "go → ________", "have → ________", "see → ________", "buy → ________", "make → ________", "write → ________"]
    },
    {
      title: "Task 3. Complete the sentences",
      instruction: "Use the past simple of the verb in brackets. Some sentences are negative or questions.",
      items: [
        "**0** I **watched** (watch) a film last night.",
        "We ________ (not go) to school on Monday.",
        "________ you ________ (see) the match on Sunday?",
        "My sister ________ (buy) new shoes yesterday.",
        "They ________ (not like) the food at the new café.",
        "Where ________ you ________ (go) on holiday?",
        "Kenji ________ (study) for his test all evening.",
        "The bus ________ (stop) outside the museum.",
        "I ________ (not have) breakfast this morning."
      ]
    },
    {
      title: "Task 4. Three sounds",
      instruction: "Say the verbs aloud. Write each one under the sound of its -ed ending.",
      items: ["**/t/**: worked, ________, ________", "**/d/**: played, ________, ________", "**/ɪd/**: wanted, ________, ________", "Verbs to sort: watched, called, needed, cooked, listened, visited"],
      answerLines: false
    },
    {
      title: "Task 5. Your turn",
      instruction: "Write five sentences about what you did yesterday. Use at least one negative. Then write two questions to ask a partner about their day.",
      items: ["________________________________________", "________________________________________", "________________________________________", "________________________________________", "________________________________________", "Question 1: ________________________________", "Question 2: ________________________________"],
      answerLines: false
    }
  ],
  answers: [
    ["Task 1", "Regular: listened, arrived, cooked, walked, enjoyed. Irregular: got, caught, took, read, left, found."],
    ["Task 2", "watched, studied, stopped, arrived, went, had, saw, bought, made, wrote."],
    ["Task 3", "1 didn't go  2 Did ... see  3 bought  4 didn't like  5 did ... go  6 studied  7 stopped  8 didn't have"],
    ["Task 4", "/t/: worked, watched, cooked. /d/: played, called, listened. /ɪd/: wanted, needed, visited."],
    ["Task 5", "Answers will vary. Check: past forms correct, didn't + base verb in negatives, did + subject + base verb in questions."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 25 minutes; Task 5 about 10, or set it as homework.",
    "**Common mistakes:** *didn't went*, *did you saw*, *goed*, and saying walked as two syllables. Task 3 items 1, 4 and 8 and Task 4 target exactly these.",
    "**Using it:** learners check Tasks 1 to 3 in pairs before you give the answers, so every learner explains at least one answer aloud.",
    "**Extension:** learners swap their Task 5 questions with a partner and answer them in full sentences, then report one answer to the class."
  ],
  lessonSlug: "past-simple"
};
