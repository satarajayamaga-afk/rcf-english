// PRESENT PERFECT (experience) - lesson plan and worksheet, built to
// tools/esl/STANDARD.md. All text, examples and exercises are RCF English's own.

exports.lesson = {
  slug: "present-perfect",
  topic: "Present Perfect",
  cefr: "B1",
  cefrNote: "B1, usable with a strong A2 class",
  learners: "Teenagers and adults",
  minutes: 60,
  shortRoute: "For a 45-minute lesson, drop the mingle and set Worksheet Task 5 as homework.",
  skills: "Speaking, reading and writing",
  focus: "Present perfect for life experience: ever and never, questions and short answers, and the contrast with the past simple",
  materials: "The interview text, the worksheet, a board",
  prep: "10 minutes",
  framework: "Test-teach-test: learners try the language first, so you teach what they actually need",

  intro: [
    "A complete 60-minute lesson on the present perfect for talking about life experience: Have you ever ...? and I have never ... . Learners meet it in a short interview, work out the rule themselves, and finish by interviewing each other.",
    "The lesson deals head-on with the mistake every class makes - putting a finished time with the present perfect - and with the difference between been and gone."
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to ask about and describe life experiences using the present perfect with ever and never, and answer with short answers.",
    subsidiary: [
      "Learners will be able to choose the present perfect or the past simple according to whether a finished time is mentioned.",
      "Learners will be able to say have and has in their weak forms inside a question."
    ]
  },

  text: {
    title: "Two minutes with a new volunteer",
    body: "INTERVIEWER: You start on Monday. Have you ever worked with children before? - MAYA: Yes, I have. I've taught reading at a community centre for two summers. INTERVIEWER: And have you been abroad for work? - MAYA: No, I haven't. I've never left my country, actually. I went to the coast last year, and that was my longest journey! INTERVIEWER: Have you done any first-aid training? - MAYA: Yes, I've done a short course. I did it in March, at the hospital near my house. INTERVIEWER: Good. One more: have you ever managed a team? - MAYA: Not yet. But I've helped my aunt in her shop since I was fifteen, so I'm not afraid of hard work.",
    gist: "Is Maya a good person for the job? Find two reasons.",
    detail: ["Has Maya worked with children?", "Has she worked in another country?", "When did she do the first-aid course?", "What has she done since she was fifteen?"]
  },

  analysis: {
    meaning: [
      "We use the present perfect for an experience in someone's life, when the time is not stated and does not matter: *I have taught reading. She has never left her country.* The period - her life - is not finished, so the experience can still be added to.",
      "As soon as we say when, we change to the past simple: *I went to the coast last year. I did it in March.* This is the point the whole lesson turns on."
    ],
    ccqs: [
      ["\"I've taught reading at a community centre.\" Do we know when?", "No."],
      ["Is it important when?", "No - the experience matters."],
      ["\"I went to the coast last year.\" Do we know when?", "Yes: last year."],
      ["So which tense goes with a finished time?", "The past simple."],
      ["\"She has never left her country.\" Can that change tomorrow?", "Yes - her life is not finished."]
    ],
    form: [
      ["Positive", "subject + have/has + past participle", "I **have taught**. She **has done** a course."],
      ["Negative", "subject + haven't/hasn't + past participle", "I **haven't** worked abroad. She **has never** left."],
      ["Question", "(question word) + have/has + subject + (ever) + past participle", "**Have** you **ever managed** a team?"],
      ["Short answers", "Yes, + subject + have/has. / No, + subject + haven't/hasn't.", "Yes, I have. / No, I haven't."]
    ],
    spelling: "The past participle of regular verbs is the same as the past simple: work → worked, study → studied, stop → stopped. Irregular verbs have a third form to learn beside the past: go → went → gone, do → did → done, see → saw → seen, be → was → been. Note the pair *been* and *gone*: *She has been to Italy* means she went and came back; *She has gone to Italy* means she is there now.",
    pronunciation: [
      "**Have and has are weak** inside a sentence: /həv/ and /həz/, not /hæv/ and /hæz/. *Have you ever ...?* runs together as one piece: /həvjuːˈevə/.",
      "**Contractions are normal in speech**: I've /aɪv/, you've /juːv/, she's /ʃiːz/, we've /wiːv/. Learners who say every word in full sound formal and slow.",
      "**In the short answer, have is strong**: *Yes, I **have**.* The stress lands there, and \"Yes, I've\" is not possible.",
      "**She's** can be *she is* or *she has*. The word after it tells you which: *she's tired* (is), *she's finished* (has)."
    ],
    problems: [
      ["The commonest mistake of all: a finished time with the present perfect - *I have been to Paris last year.*", "Give the rule as a test, not a grammar label: if the sentence says when, use the past simple. Drill pairs: *I've been to Paris. / I went to Paris in June.*"],
      ["Using the past simple where English prefers the experience meaning: *Did you ever eat sushi?*", "Accept it as natural American usage, and teach *Have you ever eaten ...?* as the form expected in international exams and in British English. Learners meet both."],
      ["Wrong participle: *I have went, I have ate.*", "Teach the three forms together from the start - go, went, gone - and test the third column, not only the second."],
      ["been and gone confused.", "Two board pictures: a person back home with a suitcase (*has been to*), and an empty chair (*has gone to*)."],
      ["Learners put ever in the answer: *Yes, I have ever.*", "Show that ever belongs to the question only; the answer takes *once, twice, a few times*, or *never*."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in: three things about me", time: "5 min", pattern: "Whole class",
      aim: "To create interest and put the target language in the air before it is taught.",
      steps: [
        "Write three sentences about yourself on the board: *I have never eaten raw fish. I have ridden a horse. I have been to five countries.*",
        "Learners ask you two questions about any of them. Answer briefly.",
        "Do not explain the grammar yet. Just let them hear it."
      ]
    },
    {
      style: "presentation", name: "Test: what can they already do?", time: "8 min", pattern: "Pairs",
      aim: "To find out what learners know, so that the teaching fits them.",
      steps: [
        "Dictate four prompts: *eat / octopus*, *visit / another country*, *break / your arm*, *lose / your keys*.",
        "In pairs, learners make a question from each prompt and ask their partner.",
        "Walk round and write down exactly what they say. You are collecting evidence: *Did you ever ...?*, *Have you ever broke ...?*, silence - all of it is useful."
      ]
    },
    {
      style: "presentation", name: "Teach: the interview and the rule", time: "12 min", pattern: "Individual, then whole class",
      aim: "To clarify the meaning, form and pronunciation of the present perfect for experience.",
      steps: [
        "Learners read the interview and answer the gist question, then the four detail questions. Check in pairs, then as a class.",
        "Put two sentences from the text side by side on the board: *I've taught reading at a community centre.* and *I went to the coast last year.* Ask the CCQs and elicit the rule: a stated time means the past simple.",
        "Build the question and short-answer forms from the text. Drill *Have you ever ...?* with the weak /həv/, and the short answers with the stress on *have*.",
        "Board the three forms of the five irregular verbs in the text: be, do, go, teach, leave."
      ]
    },
    {
      style: "practice", name: "Test again: controlled practice", time: "12 min", pattern: "Individual, then pairs to check",
      aim: "To practise the form accurately, and to show learners their own progress since the first test.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then compare with a partner.",
        "Check as a class. For Task 3, always ask *why* - the answer is either \"it says when\" or \"it doesn't\".",
        "Put two of the mistakes you collected earlier on the board, unnamed, and let the class correct them."
      ]
    },
    {
      style: "practice", name: "Find someone who has", time: "8 min", pattern: "Mingle",
      aim: "To ask the question form many times with different partners.",
      steps: [
        "Six prompts: *Find someone who has ... slept in a tent / cooked for ten people / forgotten an important birthday / swum in the sea / ridden a motorbike / never drunk coffee.*",
        "Model: *Have you ever slept in a tent?* - *Yes, I have. / No, I haven't.* After a yes, one follow-up question in the past simple: *When was that? Where?*",
        "ICQ: *After yes, what tense is your next question?* (Past simple.)"
      ]
    },
    {
      style: "production", name: "Freer speaking: interview for the job", time: "10 min", pattern: "Pairs",
      aim: "To use the present perfect freely in a short, purposeful conversation.",
      steps: [
        "Pairs choose a job or a role together: a volunteer, a guide, a camp helper.",
        "Each pair writes four *Have you ever ...?* questions that matter for that job.",
        "They interview each other, answering with short answers and one extra detail in the past simple.",
        "Each interviewer tells the class one thing about their partner: *Sara has organised a school trip.*"
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct what you heard and check the main aim.",
      steps: [
        "Write four sentences from the freer stage on the board, two right and two wrong, and let the class fix them.",
        "Exit task: each learner writes two true sentences - one with *never*, one with a time expression in the past simple - and hands them in."
      ]
    }
  ],

  support: "Give weaker learners the three forms of ten common irregular verbs on a slip of paper to keep on the desk, and let them write their four interview questions before speaking.",
  stretch: "Stronger learners add *How many times ...?* and answer with *once, twice, a few times*, and use *been* and *gone* correctly in the report stage.",

  adaptations: [
    ["A class of 40 or more", "Replace the mingle with rows: each learner asks the four people nearest them. Collect exit tasks from two rows each lesson rather than all of them."],
    ["No photocopier", "Write the interview and Tasks 2 and 3 on the board before the lesson; learners answer in their notebooks. The mingle prompts can be dictated."],
    ["Online", "Share the interview on screen; use breakout rooms of three for the interview stage. Replace the mingle with a shared document where each learner writes one Have you ever question and answers two others'."],
    ["Monolingual class with a similar tense", "Ask early whether their language has a form like this and what it does. Where the first language allows a stated time with it, that is exactly where the mistakes will come, so spend longer on the contrast."]
  ],

  check: "The exit task shows whether learners can keep the two tenses apart. Anyone who wrote a time expression with the present perfect needs the contrast again at the start of the next lesson.",
  homework: "Worksheet Task 5: five sentences about your own experiences, two of them with never.",
  worksheetSlug: "present-perfect"
};

exports.worksheet = {
  slug: "present-perfect",
  topic: "Present Perfect",
  cefr: "B1",
  minutes: 35,
  intro: [
    "A printable present perfect worksheet for B1 learners: past participles, have and has, the contrast with the past simple, questions with ever, and a writing task about their own experiences. Full answer key and teacher's notes.",
    "It goes with the Present Perfect lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. The third form",
      instruction: "Write the past simple and the past participle of each verb.",
      items: [
        "**0** go → went → gone",
        "do → ________ → ________",
        "see → ________ → ________",
        "eat → ________ → ________",
        "write → ________ → ________",
        "break → ________ → ________",
        "take → ________ → ________",
        "study → ________ → ________",
        "swim → ________ → ________",
        "lose → ________ → ________"
      ]
    },
    {
      title: "Task 2. have or has",
      instruction: "Complete the sentences with have, has, haven't or hasn't, and the verb in brackets.",
      items: [
        "**0** She **has done** (do) a first-aid course.",
        "I ________ ________ (never / visit) another country.",
        "________ you ________ (ever / ride) a motorbike?",
        "My brother ________ ________ (not / finish) his homework.",
        "We ________ ________ (know) each other since primary school.",
        "________ your parents ________ (ever / work) abroad?",
        "Tomas ________ ________ (lose) his keys again."
      ]
    },
    {
      title: "Task 3. Present perfect or past simple?",
      instruction: "Choose the right tense. Look for a time expression: if the sentence says when, use the past simple.",
      items: [
        "**0** I **have been** to three countries. (No time is given, so it is the present perfect.)",
        "She ________ (live) in this town since 2019.",
        "They ________ (move) here in March.",
        "________ you ever ________ (meet) a famous person?",
        "We ________ (not / see) that film yet.",
        "My aunt ________ (teach) me to swim when I was six.",
        "He ________ (work) here for two years, and he is still here."
      ]
    },
    {
      title: "Task 4. Ask and answer",
      instruction: "Write a question with Have you ever ...? and a true short answer for yourself.",
      items: [
        "**0** sleep / in a tent → Have you ever slept in a tent? - Yes, I have.",
        "cook / for ten people → ________________________ - ________",
        "break / a bone → ________________________ - ________",
        "forget / someone's name → ________________________ - ________",
        "swim / in the sea → ________________________ - ________",
        "win / a competition → ________________________ - ________"
      ]
    },
    {
      title: "Task 5. Your turn",
      instruction: "Write five true sentences about your own experiences. Use never in two of them. Then add one sentence in the past simple giving the time of one experience.",
      items: [
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "________________________________________",
        "Past simple: ____________________________"
      ],
      answerLines: false
    }
  ],
  answers: [
    ["Task 1", "do/did/done; see/saw/seen; eat/ate/eaten; write/wrote/written; break/broke/broken; take/took/taken; study/studied/studied; swim/swam/swum; lose/lost/lost."],
    ["Task 2", "1 have never visited  2 Have ... ever ridden  3 hasn't finished  4 have known  5 Have ... ever worked  6 has lost"],
    ["Task 3", "1 has lived  2 moved  3 Have ... met  4 haven't seen  5 taught  6 has worked"],
    ["Task 4", "Have you ever cooked for ten people? / broken a bone? / forgotten someone's name? / swum in the sea? / won a competition? Short answers: Yes, I have. / No, I haven't. (not \"Yes, I have ever\")"],
    ["Task 5", "Answers will vary. Check: have/has + past participle, never before the participle, and the past simple sentence has a time expression."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 25 minutes; Task 5 about 10, or set it as homework.",
    "**The one to watch:** a finished time with the present perfect (*I have been there last year*). Task 3 is built on exactly this, so mark it carefully and ask learners *why*, not just *what*.",
    "**been or gone:** if learners ask, *has been to* means they went and came back; *has gone to* means they are still there. Task 1 gives the forms; the difference is worth two minutes on the board.",
    "**American usage:** *Did you ever see it?* is normal in American English. It is not wrong, but international exams expect *Have you ever seen it?*, and that is what Task 4 practises.",
    "**Extension:** learners turn their Task 4 questions into a class survey and report the results: *Four of us have swum in the sea.*"
  ],
  lessonSlug: "present-perfect"
};
