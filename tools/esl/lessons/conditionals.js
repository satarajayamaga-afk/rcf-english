// CONDITIONALS (first and second) - lesson plan and worksheet, built to
// tools/esl/STANDARD.md. All content is RCF English's own.

exports.lesson = {
  slug: "conditionals",
  topic: "First and Second Conditionals",
  cefr: "B1",
  cefrNote: "B1; the zero conditional is revised in the lead-in",
  learners: "Teenagers and adults",
  minutes: 60,
  teachPhrase: "teaching conditionals",
  teaches: "The first and second conditional in English",
  shortRoute: "For a 45-minute lesson, teach the first conditional only and use the second in a later lesson.",
  skills: "Speaking, reading and writing",
  focus: "First conditional for real future possibilities and second conditional for unreal or unlikely ones, with the form of both and the comma rule",
  materials: "The dilemma cards or the board, the worksheet",
  prep: "10 minutes",
  framework: "Test-teach-test: learners use both forms first, so you teach the difference they actually need",

  intro: [
    "A complete 60-minute lesson on the first and second conditionals for B1: learners meet the two forms through real decisions, discover that the difference is how likely the speaker thinks it is, and finish by arguing their way through dilemmas.",
    "It deals with the mistake that survives years of study - *if I will go* - and with the question that follows every explanation: how unlikely does something have to be?"
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to talk about future possibilities with the first conditional and about unreal or unlikely situations with the second, choosing between them according to how likely they think the situation is.",
    subsidiary: [
      "Learners will be able to form both conditionals correctly, with no will or would in the if-clause.",
      "Learners will be able to punctuate a conditional sentence written in either order."
    ]
  },

  text: {
    title: "Three decisions",
    body: "ONE. Dilan has an examination on Monday and his cousin's wedding is on Sunday. He says: \"If I go to the wedding, I won't have enough time to revise. But if I stay at home, my aunt will be upset.\" - TWO. Amina is looking at a job in another city. \"If they offer me the job, I'll take it,\" she says. \"It starts next month.\" - THREE. Her brother is listening. \"If I had a job like that,\" he says, \"I would move tomorrow. But nobody is offering me anything!\" - Notice: Amina may really get the job. Her brother has no offer at all.",
    gist: "Which of the three speakers is talking about something that may really happen, and which is imagining?",
    detail: ["What are Dilan's two choices?", "When does Amina's job start?", "Has her brother been offered a job?", "Why does the brother say \"would\" and Amina says \"will\"?"]
  },

  analysis: {
    meaning: [
      "The first conditional is for a real possibility in the future: the speaker thinks it may well happen. *If they offer me the job, I'll take it* - an offer is expected.",
      "The second conditional is for something unreal now, or unlikely in the future: *If I had a job like that, I would move* - he has no such job.",
      "The difference is not about time. Both can be about the future. It is about what the speaker thinks of the chances, and the same situation can take either form depending on the speaker's view.",
      "The zero conditional is a third, simpler case, for things that are always true: *If you heat water to 100 degrees, it boils.*"
    ],
    ccqs: [
      ["\"If they offer me the job, I'll take it.\" Is an offer possible?", "Yes."],
      ["Does she have the job now?", "No, not yet."],
      ["\"If I had a job like that, I would move.\" Does he have the job?", "No."],
      ["Is he likely to get one?", "He thinks not."],
      ["So which sentence shows more hope?", "The first one."]
    ],
    form: [
      ["First conditional", "If + present simple, + will / won't + verb", "**If I go** to the wedding, **I won't have** time to revise."],
      ["Second conditional", "If + past simple, + would / wouldn't + verb", "**If I had** a job like that, **I would move**."],
      ["Either order", "The if-clause may come second, with no comma", "I would move **if I had** a job like that."],
      ["Questions", "What will / would you do if ...?", "**What would you do if** you lost your phone?"]
    ],
    spelling: "One punctuation rule does all of it: when the if-clause comes first, put a comma after it. When it comes second, no comma. Also note *were* in the second conditional: *If I were you* is the form expected in exams, though *if I was* is very common in speech.",
    pronunciation: [
      "**'ll and 'd are easy to miss**: *I'll take it* /aɪlteɪkɪt/ and *I'd move* /aɪdmuːv/. Learners who never hear them never produce them, so drill the contractions, not the full forms.",
      "**would is weak** inside a sentence: /wəd/. It is strong only in a short answer: *Yes, I **would**.*",
      "**The comma is a pause**, and the voice rises before it: *If I had a job like that ↗, I would move ↘.*"
    ],
    problems: [
      ["will in the if-clause: *If I will go to the wedding ...*", "The mistake of the lesson, and it survives for years. One rule, boarded and drilled: no will and no would after if. Many first languages allow it, so expect it."],
      ["Mixing the two halves: *If I go, I would take it.*", "Board the two patterns one above the other and show that each sentence keeps to one line."],
      ["Choosing the second conditional to sound polite about a real plan: *If I would have time tomorrow ...*", "Ask the CCQ: is it possible? If yes, use the first. Politeness comes from *could* and *might*, not from the second conditional."],
      ["The comma everywhere, or nowhere.", "Give the single rule and practise it in both orders in Task 4."],
      ["\"How unlikely does it have to be?\"", "An honest answer: it is the speaker's choice. *If I win the lottery* takes either form, and the second sounds more realistic about the odds. Let learners hear both and decide."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in: what always happens?", time: "5 min", pattern: "Whole class, then pairs",
      aim: "To revise the zero conditional and bring if-sentences into the room.",
      steps: [
        "Write a half-sentence on the board: *If you don't water a plant ...* and let the class finish it.",
        "Two or three more: *If you heat ice ... If you mix blue and yellow ...*",
        "In pairs, learners write one of their own and read it to another pair. Keep it quick."
      ]
    },
    {
      style: "presentation", name: "Test: your own two sentences", time: "8 min", pattern: "Individual, then pairs",
      aim: "To find out what learners already do with both forms.",
      steps: [
        "Two prompts on the board: *Finish these. (a) If it rains tomorrow, ... (b) If I lived in another country, ...*",
        "Learners write both, then compare with a partner.",
        "Walk round and write down what they produce. This is the evidence that shapes the next stage."
      ]
    },
    {
      style: "presentation", name: "Teach: three decisions", time: "12 min", pattern: "Pairs, then whole class",
      aim: "To clarify the difference in meaning, then the form of each.",
      steps: [
        "Learners read the three short situations and answer the gist question in pairs: who may really do it, and who is imagining?",
        "Work through the detail questions, ending on the last: why *would* and not *will*?",
        "Board the two patterns from the text, one above the other. Ring the if-clause in each and show that neither contains will or would.",
        "Ask the CCQs. Then show the same idea both ways - *If I win the lottery, I'll ... / If I won the lottery, I'd ...* - and ask which speaker is more hopeful.",
        "Drill the contractions: I'll, we'll, I'd, they'd."
      ]
    },
    {
      style: "practice", name: "Test again: controlled practice", time: "12 min", pattern: "Individual, then pairs to check",
      aim: "To practise both forms accurately and see the progress since the first test.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then check with a partner.",
        "Check as a class, asking each time: real possibility, or imagining?",
        "Put two sentences from the first test on the board, unnamed, and let the class correct them."
      ]
    },
    {
      style: "practice", name: "Chain conditionals", time: "8 min", pattern: "Groups of five",
      aim: "To produce the form quickly and repeatedly.",
      steps: [
        "The first learner says a first-conditional sentence: *If it rains tomorrow, I'll stay at home.*",
        "The next takes the result and makes it the condition: *If I stay at home, I'll finish my book.* And so on round the group.",
        "The chain breaks when somebody uses will after if; the group starts again from that learner.",
        "Second round in the second conditional: *If I had a boat, I'd ...*"
      ]
    },
    {
      style: "production", name: "Freer speaking: the dilemma", time: "10 min", pattern: "Pairs, then whole class",
      aim: "To use both conditionals to argue a real decision.",
      steps: [
        "Give each pair a dilemma, or let them use Dilan's: a wedding or an examination; a good job far away or an ordinary job at home; telling a friend an uncomfortable truth or staying quiet.",
        "Each pair argues both sides, using *if* sentences, and must reach a decision.",
        "Each pair reports the decision and one reason in a conditional sentence.",
        "Write the best two sentences on the board as they are said."
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct the common mistakes and check the main aim.",
      steps: [
        "Four sentences on the board, two correct and two with will after if or mixed halves, for the class to repair.",
        "Exit task: one first conditional about this week and one second conditional about your life. Collect them."
      ]
    }
  ],

  support: "Give weaker learners the two patterns on a slip of paper and let them do the chain in the first conditional only.",
  stretch: "Stronger learners use *might* and *could* in the result clause - *I might go, I could take it* - and try one mixed sentence: *If I had studied, I would be at university now.*",

  adaptations: [
    ["A class of 40 or more", "The chain runs in groups of five at the same time, so forty learners each speak twice in eight minutes. Report from four groups, not forty."],
    ["No photocopier", "Everything here can go on the board: the three situations, the two patterns and the dilemmas. The chain and the dilemma need no materials at all."],
    ["Online", "Breakout rooms of four for the chain, with each learner typing their sentence in the chat as they say it, so the whole chain stays visible."],
    ["Exam classes", "Conditionals appear in B1 sentence-transformation tasks and in the speaking test, where *If I were you, I'd ...* is the standard way of giving advice. Task 5 practises exactly that."]
  ],

  check: "The exit task asks for one of each, so it shows both whether learners can form them and whether they can tell the two meanings apart.",
  homework: "Worksheet Task 5: give advice on three problems using *If I were you, I'd ...*",
  worksheetSlug: "conditionals"
};

exports.worksheet = {
  slug: "conditionals",
  topic: "First and Second Conditionals",
  cefr: "B1",
  minutes: 35,
  searchTerm: "conditionals",
  description: "Free B1 worksheet on the first and second conditional: gap-fill, matching, error correction and free writing, with a full answer key and notes.",
  intro: [
    "A printable conditionals worksheet for B1 learners: the first and second conditional, choosing between them, the comma rule, and giving advice with If I were you. Full answer key and teacher's notes.",
    "It goes with the Conditionals lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. First conditional",
      instruction: "Complete with the present simple or will / won't.",
      items: [
        "**0** If it **rains** (rain), we **will stay** (stay) at home.",
        "If you ________ (not hurry), you ________ (miss) the bus.",
        "I ________ (call) you if I ________ (finish) early.",
        "If she ________ (pass) the test, her parents ________ (be) very happy.",
        "We ________ (not go) to the beach if the weather ________ (be) bad.",
        "What ________ you ________ (do) if they ________ (say) no?"
      ]
    },
    {
      title: "Task 2. Second conditional",
      instruction: "Complete with the past simple or would / wouldn't.",
      items: [
        "**0** If I **had** (have) more time, I **would learn** (learn) the guitar.",
        "If I ________ (be) you, I ________ (talk) to the teacher.",
        "She ________ (travel) more if she ________ (not have) a small child.",
        "If we ________ (live) near the sea, we ________ (swim) every day.",
        "What ________ you ________ (say) if he ________ (ask) you?",
        "They ________ (not complain) if the food ________ (be) better."
      ]
    },
    {
      title: "Task 3. Which one?",
      instruction: "Choose the first or the second conditional, and write the sentence. Ask yourself: is this a real possibility?",
      items: [
        "**0** (my bus is late most days) If the bus ________ late again, I ________ walk. → If the bus is late again, I will walk.",
        "(I have no money for a trip) If I ________ (have) the money, I ________ (go) to Japan.",
        "(there is a test next week) If I ________ (study) every evening, I ________ (pass) it.",
        "(I am not the head teacher) If I ________ (be) the head teacher, I ________ (change) the timetable.",
        "(rain is forecast for tomorrow) If it ________ (rain), the match ________ (be) cancelled."
      ]
    },
    {
      title: "Task 4. Commas",
      instruction: "Write each sentence the other way round, and punctuate it correctly.",
      items: [
        "**0** If I see her, I'll tell her. → I'll tell her if I see her.",
        "If you need help, ask me. → ________________________",
        "I would buy a bicycle if I lived closer. → ________________________",
        "If we left now, we would arrive before dark. → ________________________",
        "She'll be angry if you forget again. → ________________________"
      ]
    },
    {
      title: "Task 5. Your turn: give advice",
      instruction: "Write advice for each problem using If I were you, I'd ... Then write one first conditional sentence about your own week.",
      items: [
        "A friend is always late for class. → ________________________",
        "Your cousin wants to learn English quickly. → ________________________",
        "Someone has lost their phone at school. → ________________________",
        "About my week: ________________________"
      ],
      answerLines: false
    }
  ],
  answers: [
    ["Task 1", "1 don't hurry / will miss  2 will call / finish  3 passes / will be  4 won't go / is  5 will ... do / say"],
    ["Task 2", "1 were / would talk  2 would travel / didn't have  3 lived / would swim  4 would ... say / asked  5 wouldn't complain / were"],
    ["Task 3", "1 If I had the money, I would go to Japan. (unreal)  2 If I study every evening, I will pass it. (real)  3 If I were the head teacher, I would change the timetable. (unreal)  4 If it rains, the match will be cancelled. (real)"],
    ["Task 4", "1 Ask me if you need help.  2 If I lived closer, I would buy a bicycle.  3 We would arrive before dark if we left now.  4 If you forget again, she'll be angry. (Comma only when the if-clause comes first.)"],
    ["Task 5", "Answers will vary. Check: *If I were you, I'd* + base verb; and the first conditional sentence has a present tense after if, never will."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 25 minutes; Task 5 about 10, or set it as homework.",
    "**The one to watch:** *will* after *if*. It is the most persistent mistake in the whole B1 syllabus, and it appears in Tasks 1, 3 and 5. One rule on the board beats twenty corrections.",
    "**If I were or if I was:** *were* is the form expected in exams and in writing, and *was* is very common in speech. Teach *were*, and do not mark *was* wrong when a learner says it aloud.",
    "**Task 3 is the thinking task.** Learners who can do Tasks 1 and 2 but not Task 3 have the forms without the meaning, which is exactly what to spend the next lesson on.",
    "**Extension:** learners write three dilemmas of their own and swap them with a partner, who answers each with one conditional sentence."
  ],
  lessonSlug: "conditionals"
};
