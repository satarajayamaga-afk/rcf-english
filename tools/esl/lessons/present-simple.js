// PRESENT SIMPLE (routines and habits) - lesson plan and worksheet, built to
// tools/esl/STANDARD.md. All text, examples and exercises are RCF English's own.

exports.lesson = {
  slug: "present-simple",
  topic: "Present Simple",
  cefr: "A1",
  cefrNote: "A1, adaptable for A2",
  learners: "Teenagers and adults; works with young learners too",
  minutes: 60,
  shortRoute: "For a 45-minute lesson, drop the survey and set Worksheet Task 5 as homework.",
  skills: "Speaking, reading and writing",
  focus: "Present simple for routines and habits: the third-person -s, negatives with don't and doesn't, questions with do and does, and adverbs of frequency",
  materials: "The reading text, the worksheet, a board",
  prep: "10 minutes",
  framework: "PPP (presentation, practice, production), with the language met first in a short text",

  intro: [
    "A complete 60-minute lesson on the present simple for daily routines: learners meet it in a short text about two very different mornings, work out the third-person -s themselves, practise the question and negative forms, and finish by finding out who in the class has the earliest start.",
    "The lesson gives proper time to the two things beginners always drop - the -s on he, she and it, and do or does in the question - and every stage has a note for large classes."
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to describe daily routines and habits using the present simple in positive sentences, negatives and questions, with the third-person -s.",
    subsidiary: [
      "Learners will be able to place adverbs of frequency - always, usually, often, sometimes, never - correctly in a sentence.",
      "Learners will be able to hear and say the three sounds of the third-person -s: /s/, /z/ and /ɪz/."
    ]
  },

  text: {
    title: "Two mornings",
    body: "Ndidi wakes up at half past four. She works in a bakery, so she starts at five. She doesn't eat breakfast at home; she eats at work, after the first bread comes out of the oven. She usually finishes at one o'clock, and she sleeps for an hour in the afternoon. Her brother Emeka never gets up early. He studies at night, from nine until two in the morning, because the house is quiet then. He gets up at eleven, makes coffee and reads for an hour before his classes. \"We live in the same house,\" says Ndidi, \"but we don't often meet!\"",
    gist: "Why do Ndidi and Emeka almost never see each other?",
    detail: ["What time does Ndidi start work?", "Where does she eat breakfast?", "When does Emeka study?", "What does he do before his classes?"]
  },

  analysis: {
    meaning: [
      "We use the present simple for things that are generally true, and for routines and habits - what somebody does again and again: *She works in a bakery. He studies at night.*",
      "It does not mean now. For something happening at this moment we use the present continuous: *She is working now* is a different idea from *She works in a bakery.*",
      "Frequency words say how often: always, usually, often, sometimes, never. They go before the main verb - *He never gets up early* - but after *be*: *She is always tired.*"
    ],
    ccqs: [
      ["\"She works in a bakery.\" Is she working at this moment?", "We don't know - and it doesn't matter."],
      ["Is it her job every day?", "Yes."],
      ["Is it a habit or one time?", "A habit."],
      ["\"He never gets up early.\" How often does he get up early?", "Zero times."]
    ],
    form: [
      ["Positive", "I / you / we / they + verb; he / she / it + verb + -s", "They **live** here. She **works** in a bakery."],
      ["Negative", "don't + verb; doesn't + verb (no -s on the verb)", "We **don't** meet. She **doesn't eat** at home."],
      ["Question", "Do / Does + subject + verb (no -s on the verb)", "**Do** you work? **Does** he **study** at night?"],
      ["Short answers", "Yes, I do. / No, I don't. Yes, he does. / No, he doesn't.", "*Does she finish at one?* - *Yes, she does.*"]
    ],
    spelling: "Most verbs add -s (work → works). Verbs ending in -ch, -sh, -ss, -x or -o add -es (watch → watches, go → goes). Consonant + y becomes -ies (study → studies), but vowel + y just adds -s (play → plays). Two verbs are irregular: have → has, be → is.",
    pronunciation: [
      "**/s/** after voiceless sounds: works, starts, eats.",
      "**/z/** after voiced sounds and vowels: lives, reads, goes.",
      "**/ɪz/**, an extra syllable, after /s/, /z/, /ʃ/, /tʃ/, /dʒ/: finishes, watches, uses.",
      "**Does he** and **does she** run together in speech: /dəziː/, /dəʃiː/. Learners who expect two clear words often miss the question altogether when they hear it."
    ],
    problems: [
      ["The -s disappears: *She work in a bakery.*", "This is the mistake of the lesson. Drill he/she/it sentences alone, and make a class signal - a raised finger - that you use silently every time it is dropped, instead of correcting aloud."],
      ["The -s is added twice: *She doesn't works.* or *Does she works?*", "Show that do and does already carry the person: after do, does, don't or doesn't, the verb has no ending. Board it beside the positive so the pair is visible."],
      ["Frequency words in the wrong place: *She goes always early.*", "Give one rule: before the main verb, after *be*. Practise with three sentences on the board and let learners place the word themselves."],
      ["Present simple used for now: *Look! She works.*", "Contrast two pictures - a woman at work today, and the same woman's weekly timetable - and elicit which sentence fits which."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in: my morning in five verbs", time: "5 min", pattern: "Whole class, then pairs",
      aim: "To create interest and bring out what learners already know.",
      steps: [
        "Write five verbs about your own morning on the board, nothing else: *wake up, drink, walk, teach, eat.*",
        "Learners guess your routine: *You wake up at six?* Answer briefly and let them try again.",
        "In pairs, learners write five verbs for their own morning and their partner guesses the times."
      ]
    },
    {
      style: "presentation", name: "Reading: two mornings", time: "10 min", pattern: "Individual, then pairs",
      aim: "To meet the present simple in a context and read for meaning.",
      steps: [
        "Write the gist question on the board and give two minutes: *Why do Ndidi and Emeka almost never see each other?*",
        "Learners read, answer, and check in pairs. Take the answer from the class.",
        "Learners read again for the four detail questions, then check together.",
        "ICQ before reading: *Do you need every word?* (No.)"
      ]
    },
    {
      style: "presentation", name: "Focus on form: where does the -s go?", time: "10 min", pattern: "Whole class",
      aim: "To clarify the third-person -s, the negative and the question, and the sound of the ending.",
      steps: [
        "Learners find every verb in the text about Ndidi or Emeka and call them out. Write them in one column: *wakes, works, starts, eats, finishes, sleeps, gets up, studies, makes, reads.*",
        "Ask what all of them have in common, and elicit the -s. Then write *We live in the same house* beside them and ask why that one has no -s.",
        "Build the negative and the question from the text: *She doesn't eat at home. Does he study at night?* Point out that the -s has moved to does.",
        "Drill the three endings with a gesture each: works /s/, lives /z/, finishes /ɪz/."
      ]
    },
    {
      style: "practice", name: "Controlled practice", time: "12 min", pattern: "Individual, then pairs to check",
      aim: "To practise the form accurately.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then compare with a partner.",
        "Check as a class, asking for the whole sentence aloud so you hear the ending.",
        "Put two sentences with a dropped -s on the board - your own, not a learner's - and let the class repair them."
      ]
    },
    {
      style: "practice", name: "Class survey: who starts earliest?", time: "10 min", pattern: "Mingle",
      aim: "To ask and answer present simple questions many times.",
      steps: [
        "Each learner writes three questions: *What time do you get up? How do you come here? What do you eat for breakfast?*",
        "They ask five classmates and note the answers in three words each.",
        "Find out as a class: who gets up earliest, who travels furthest, what most people eat.",
        "ICQ: *Do you write full sentences?* (No, three words.)"
      ]
    },
    {
      style: "production", name: "Freer speaking: a day I would like", time: "8 min", pattern: "Pairs, then whole class",
      aim: "To use the present simple freely for a routine of their own invention.",
      steps: [
        "Learners invent a perfect daily routine - any job, any country - and make short notes.",
        "In pairs, each describes their day. The partner asks three questions with do or does.",
        "Two or three learners describe their partner's day to the class, which is where the third-person -s gets its real test."
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct the common mistakes and check the main aim.",
      steps: [
        "Write four sentences you heard, two correct and two with a missing or extra -s, and let the class find them.",
        "Exit task: three sentences about a family member - one positive, one negative, one question - all in the third person. Collect them."
      ]
    }
  ],

  support: "Give weaker learners a strip of paper with the three forms modelled - *I work / She works / She doesn't work / Does she work?* - to keep on the desk during the speaking stages.",
  stretch: "Stronger learners add frequency adverbs to every sentence in the freer stage, and use *hardly ever* and *once a week* as well as the five basic adverbs.",

  adaptations: [
    ["A class of 40 or more", "The survey becomes rows: ask the five people nearest you. Take the class results from five volunteers rather than everyone."],
    ["No photocopier", "Write the text and Tasks 2 and 3 on the board before the lesson; learners answer in their notebooks. The survey needs no materials at all."],
    ["Online", "Share the text on screen; use breakout rooms of three for the survey, with one learner asking and two answering, then rotate."],
    ["Young learners (8 to 11)", "Replace the freer stage with a drawing: learners draw their perfect day in four pictures and say one sentence about each."]
  ],

  check: "The exit task is written in the third person on purpose: it shows immediately who has taken on the -s and who has not.",
  homework: "Worksheet Task 5: eight sentences about a person in your family, with at least two negatives.",
  worksheetSlug: "present-simple"
};

exports.worksheet = {
  slug: "present-simple",
  topic: "Present Simple",
  cefr: "A1",
  minutes: 35,
  intro: [
    "A printable present simple worksheet for A1 learners: the third-person -s, negatives with don't and doesn't, questions, frequency adverbs and a writing task about their own family. Full answer key and teacher's notes.",
    "It goes with the Present Simple lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. Add the -s",
      instruction: "Write the he/she/it form of each verb. Be careful with spelling.",
      items: [
        "**0** work → works",
        "eat → ________",
        "go → ________",
        "watch → ________",
        "study → ________",
        "play → ________",
        "finish → ________",
        "have → ________",
        "teach → ________",
        "live → ________"
      ]
    },
    {
      title: "Task 2. Positive, negative, question",
      instruction: "Complete the sentences with the present simple of the verb in brackets.",
      items: [
        "**0** She **works** (work) in a bakery.",
        "My brother ________ (study) at night.",
        "We ________ (not / live) near the school.",
        "________ your father ________ (drive) to work?",
        "Ndidi ________ (not / eat) breakfast at home.",
        "________ you ________ (speak) three languages?",
        "The shop ________ (open) at eight o'clock.",
        "My friends ________ (not / like) football."
      ]
    },
    {
      title: "Task 3. How often?",
      instruction: "Put the frequency word in the right place and write the whole sentence.",
      items: [
        "**0** (always) She gets up at five. → She always gets up at five.",
        "(never) He eats meat. → ________________________",
        "(usually) We walk to school. → ________________________",
        "(often) My sister is late. → ________________________",
        "(sometimes) They play football on Friday. → ________________________",
        "(always) I am tired in the evening. → ________________________"
      ]
    },
    {
      title: "Task 4. Three sounds",
      instruction: "Say the verbs aloud. Write each one under the sound of its ending.",
      items: [
        "**/s/**: works, ________, ________",
        "**/z/**: lives, ________, ________",
        "**/ɪz/**: finishes, ________, ________",
        "Verbs to sort: reads, watches, starts, goes, teaches, eats"
      ],
      answerLines: false
    },
    {
      title: "Task 5. Your turn",
      instruction: "Write eight sentences about one person in your family: their routine, what they do not do, and how often. Use at least two negatives.",
      items: [
        "________________________________________",
        "________________________________________",
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
    ["Task 1", "eats, goes, watches, studies, plays, finishes, has, teaches, lives."],
    ["Task 2", "1 studies  2 don't live  3 Does ... drive  4 doesn't eat  5 Do ... speak  6 opens  7 don't like"],
    ["Task 3", "1 He never eats meat.  2 We usually walk to school.  3 My sister is often late.  4 They sometimes play football on Friday.  5 I am always tired in the evening. (After be, the adverb goes second.)"],
    ["Task 4", "/s/: works, starts, eats. /z/: lives, reads, goes. /ɪz/: finishes, watches, teaches."],
    ["Task 5", "Answers will vary. Check: -s on every third-person verb, don't/doesn't + verb with no ending, frequency words before the main verb."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 25 minutes; Task 5 about 10, or set it as homework.",
    "**The one to watch:** the missing -s in Task 2 and Task 5, and the *extra* -s after doesn't (*she doesn't works*). Both are worth one minute on the board rather than a correction on each script.",
    "**Task 3, item 5** is the exception: after *be*, the frequency word comes after the verb. Learners who put *always* first have applied the rule they were taught, so praise the logic before correcting.",
    "**Using it:** learners check Tasks 1 to 3 in pairs before you give answers, and read the sentence aloud when they check, so the ending is heard as well as written.",
    "**Extension:** learners swap their Task 5 paragraph and write three questions about the person described."
  ],
  lessonSlug: "present-simple"
};
