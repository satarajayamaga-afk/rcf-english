// REPORTED SPEECH (statements and questions) - lesson plan and worksheet,
// built to tools/esl/STANDARD.md. All content is RCF English's own.

exports.lesson = {
  slug: "reported-speech",
  topic: "Reported Speech",
  cefr: "B1",
  cefrNote: "B1, with a B2 extension in the notes",
  learners: "Teenagers and adults",
  minutes: 60,
  shortRoute: "For a 45-minute lesson, teach statements only and leave reported questions for a second lesson.",
  skills: "Speaking, listening and writing",
  focus: "Reported speech: statements with said and told, reported questions with asked, and the changes to tense, pronouns and time words",
  materials: "The worksheet, a board; slips of paper for the message game",
  prep: "10 minutes, including cutting slips",
  framework: "Guided discovery: learners find the changes in an example themselves before the rule is named, then practise and use it",

  intro: [
    "A complete 60-minute lesson on reported speech for B1: learners carry real messages around the room, then work out for themselves what changes when we report what somebody said.",
    "It covers statements and questions, the difference between said and told, and the changes to pronouns and time words that most textbooks rush - and it ends with a task where reporting is genuinely necessary, not an exercise."
  ],

  aims: {
    main: "By the end of the lesson, learners will be able to report statements and questions that other people made, changing the tense, the pronouns and the time words correctly.",
    subsidiary: [
      "Learners will be able to choose between said and told according to whether the listener is named.",
      "Learners will be able to form a reported question without do, does or did, and without question word order."
    ]
  },

  text: {
    title: "Three messages",
    body: "At break, three people spoke to the teacher. Sara said, \"I can't come to the trip on Friday.\" Karim said, \"I finished the project yesterday, and I gave it to my sister to check.\" Then Lucia asked, \"Where does the bus leave from?\" and, a moment later, \"Have you seen my bag?\" - The teacher wrote it all down for the class teacher, like this: Sara said that she couldn't come to the trip on Friday. Karim told me that he had finished the project the day before, and that he had given it to his sister to check. Lucia asked where the bus left from, and whether I had seen her bag.",
    gist: "Which words changed when the teacher wrote the messages down? Find three kinds of change.",
    detail: ["Who could not come on Friday?", "When did Karim finish the project?", "What did Lucia want to know first?", "Why is it \"her bag\" and not \"my bag\"?"]
  },

  analysis: {
    meaning: [
      "Reported speech tells somebody what another person said, at a later moment and often in another place. Because the moment has moved, the words that point to a time, a person or a place move with it.",
      "The tense usually steps back one: present becomes past, past becomes past perfect, will becomes would, can becomes could. This is called backshift, and it happens because the speaking is now over.",
      "If the thing said is still true - *She said she lives in Kandy* - fluent speakers often keep the present. Teach the backshift as the safe form, and accept the unshifted one when the fact still holds."
    ],
    ccqs: [
      ["\"Sara said she couldn't come.\" Are these Sara's exact words?", "No."],
      ["Did Sara speak before or after this sentence?", "Before."],
      ["\"I finished it yesterday\" becomes \"the day before\". Why not \"yesterday\"?", "Because we are reporting it on a different day."],
      ["\"Lucia asked where the bus left from.\" Is that a question?", "No - it is a sentence about a question, so there is no question mark."]
    ],
    form: [
      ["Statement", "said (that) + clause; told + person + (that) + clause", "She **said that** she couldn't come. He **told me that** he had finished."],
      ["Wh- question", "asked + (person) + question word + subject + verb", "She **asked where the bus left from**. (Not *where did the bus leave*.)"],
      ["Yes/no question", "asked + (person) + if / whether + subject + verb", "She **asked whether I had seen** her bag."],
      ["Tense steps back", "present → past; past → past perfect; will → would; can → could", "*I am tired* → he said he **was** tired."]
    ],
    spelling: "Nothing unusual to spell, but two pairs of words decide the sentence: *said* takes no person after it (*said that ...*), *told* must have one (*told me that ...*); and in a reported question there is no *do*, *does* or *did*, and no inversion.",
    pronunciation: [
      "**that is nearly always weak** and is often dropped altogether: *She said (that) she couldn't come* - /ðət/, never /ðæt/.",
      "**told me** links into one piece: /ˈtoʊldmi/.",
      "**The reported clause keeps normal statement intonation**, falling at the end, even when it reports a question. Learners who keep the rising question tune give themselves away."
    ],
    problems: [
      ["Question word order kept in the report: *She asked where did the bus leave.*", "This is the mistake of the lesson. Show the two sentences one above the other and cross out the *did*: a reported question is a statement inside a sentence."],
      ["said and told swapped: *He said me that ...* / *He told that ...*", "One line on the board: *tell* needs a person, *say* does not. Drill four quick pairs."],
      ["Time words left alone: *He said he finished it yesterday* reported a week later.", "Make it real: report something a classmate actually said last lesson, and ask whether *yesterday* is still true."],
      ["Backshift applied where it is not needed: *She said the earth went round the sun.*", "Teach the safe rule first, then show this exception once. It rewards the strong learners without confusing the rest."],
      ["Pronouns not changed: *He said I was tired* meaning the speaker was tired.", "Ask *who is tired?* every time until the class hears the ambiguity themselves."]
    ]
  },

  stages: [
    {
      style: "warmer", name: "Lead-in: the message chain", time: "6 min", pattern: "Two teams in lines",
      aim: "To create a real need to report what somebody said.",
      steps: [
        "Two lines. Whisper a sentence to the first learner in each: *My cousin is moving to Dubai next month and she has sold her car.*",
        "Each learner whispers it to the next. The last one says it aloud.",
        "Compare the two endings with the original. The class will laugh; that is the point.",
        "Ask: when you tell somebody what another person said, what has to change?"
      ]
    },
    {
      style: "presentation", name: "Three messages: noticing the changes", time: "12 min", pattern: "Pairs, then whole class",
      aim: "To let learners discover the changes for themselves before any rule is given.",
      steps: [
        "Learners read the text and answer the gist question in pairs: which words changed, and what kind of change was it?",
        "Take the three kinds from the class and put them on the board as headings: tense, pronouns, time words.",
        "Work through the four detail questions, especially the last one - why *her bag* and not *my bag*.",
        "Only now give the name: this is reported speech."
      ]
    },
    {
      style: "presentation", name: "Clarify: said, told, and reported questions", time: "8 min", pattern: "Whole class",
      aim: "To make the form clear, including the question without do and without inversion.",
      steps: [
        "Board the two statement patterns side by side: *said (that)* and *told + person + (that)*. Drill four short pairs.",
        "Write Lucia's two questions in direct speech, then the reports underneath, and cross out *does* and the inversion in front of the class.",
        "Elicit the tense ladder onto the board: present → past, past → past perfect, will → would, can → could.",
        "Ask the CCQs to check that a report is a statement, not a question."
      ]
    },
    {
      style: "practice", name: "Controlled practice", time: "14 min", pattern: "Individual, then pairs to check",
      aim: "To practise both patterns accurately.",
      steps: [
        "Learners do Worksheet Tasks 1 to 3 alone, then compare with a partner.",
        "Check as a class, asking each time which word changed and why.",
        "Any sentence with *asked* should be read aloud, so the falling intonation is heard."
      ]
    },
    {
      style: "production", name: "Freer task: the interview relay", time: "15 min", pattern: "Groups of three",
      aim: "To use reported speech where it is genuinely needed.",
      steps: [
        "In each group of three, A interviews B with four questions of A's own while C sits with their back to them and cannot hear.",
        "A then reports the whole exchange to C: *I asked her where she was born, and she said that ...*",
        "C writes down what they are told, then checks the facts with B: *Is it true that ...?*",
        "Rotate roles once if time allows. Two groups report one interesting fact to the class."
      ]
    },
    {
      style: "close", name: "Feedback and exit task", time: "5 min", pattern: "Whole class, then individual",
      aim: "To correct the common mistakes and check the main aim.",
      steps: [
        "Write four sentences you heard, two right and two with question word order or the wrong verb, and let the class repair them.",
        "Exit task: report one statement and one question that you actually heard in this lesson. Collect them."
      ]
    }
  ],

  support: "Give weaker learners the tense ladder and the two patterns on a slip of paper for the freer stage, and let them report statements only.",
  stretch: "Stronger learners use a wider range of reporting verbs - explained, admitted, complained, promised - and notice that some take a person and some do not.",

  adaptations: [
    ["A class of 40 or more", "The message chain runs in four lines at once. In the freer stage, groups of three work simultaneously; hear two groups, not twenty."],
    ["No photocopier", "Write the three messages on the board before the lesson. The interview relay needs nothing but the learners themselves."],
    ["Online", "Use breakout rooms of three for the relay, with C turning their camera and sound off during the interview. It works better online than in a noisy classroom."],
    ["Exam classes", "Point out that reported speech appears in most B1 exams as a sentence-transformation task, and that the marks go for the tense and the word order, exactly what Task 3 drills."]
  ],

  check: "The exit task asks learners to report real speech from the lesson, so it cannot be answered from memory of a rule. Look for question word order, which is the thing that fails first.",
  homework: "Worksheet Task 5: report five things somebody said to you today.",
  worksheetSlug: "reported-speech"
};

exports.worksheet = {
  slug: "reported-speech",
  topic: "Reported Speech",
  cefr: "B1",
  minutes: 40,
  intro: [
    "A printable reported speech worksheet for B1 learners: said and told, statements, reported questions, and the changes to tense, pronouns and time words, ending with a task using things people really said to them. Full answer key and teacher's notes.",
    "It goes with the Reported Speech lesson plan but works on its own, in class or as homework."
  ],
  tasks: [
    {
      title: "Task 1. said or told?",
      instruction: "Complete each sentence with said or told.",
      items: [
        "**0** She **told** me that she was tired.",
        "He ________ that the shop was closed.",
        "They ________ us the bus had already left.",
        "My teacher ________ that we could leave early.",
        "Nobody ________ me about the meeting.",
        "The doctor ________ her to rest for a week."
      ]
    },
    {
      title: "Task 2. Report the statement",
      instruction: "Rewrite each sentence as reported speech. Change the tense, the pronouns and the time words.",
      items: [
        "**0** \"I am busy today,\" she said. → She said that she was busy that day.",
        "\"We live in Colombo,\" they said. → ________________________",
        "\"I will call you tomorrow,\" he said. → ________________________",
        "\"I can't swim,\" she said. → ________________________",
        "\"I finished the book yesterday,\" he told me. → ________________________",
        "\"We are waiting outside,\" they told us. → ________________________"
      ]
    },
    {
      title: "Task 3. Report the question",
      instruction: "Rewrite each question as a reported question. Remember: no do, does or did, and no question word order.",
      items: [
        "**0** \"Where do you live?\" she asked. → She asked where I lived.",
        "\"What time does the film start?\" he asked. → ________________________",
        "\"Have you seen my keys?\" she asked. → ________________________",
        "\"Why did you leave early?\" they asked. → ________________________",
        "\"Are you coming with us?\" he asked. → ________________________",
        "\"Who wrote this?\" the teacher asked. → ________________________"
      ]
    },
    {
      title: "Task 4. Find the mistake",
      instruction: "Each sentence has one mistake. Write it correctly.",
      items: [
        "**0** He said me that he was late. → He told me that he was late.",
        "She asked where did I work. → ________________________",
        "They told that the office was closed. → ________________________",
        "He said he will help me tomorrow. → ________________________",
        "She asked me do I like the food. → ________________________"
      ]
    },
    {
      title: "Task 5. Your turn",
      instruction: "Write five sentences reporting things people really said to you today or yesterday. Use said at least twice, told at least twice, and asked at least once.",
      items: [
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
    ["Task 1", "1 said  2 told  3 said  4 told  5 told"],
    ["Task 2", "1 They said that they lived in Colombo.  2 He said that he would call me the next day.  3 She said that she couldn't swim.  4 He told me that he had finished the book the day before.  5 They told us that they were waiting outside."],
    ["Task 3", "1 He asked what time the film started.  2 She asked whether/if I had seen her keys.  3 They asked why I had left early.  4 He asked whether/if I was going with them.  5 The teacher asked who had written it. (With who as the subject, the word order does not change.)"],
    ["Task 4", "1 She asked where I worked.  2 They said that the office was closed. (or: They told me that ...)  3 He said he would help me the next day.  4 She asked me whether/if I liked the food."],
    ["Task 5", "Answers will vary. Check: told always has a person after it, said does not; reported questions have statement word order and no did."]
  ],
  notes: [
    "**Timing:** Tasks 1 to 4 take about 30 minutes; Task 5 about 10, or set it as homework.",
    "**The one to watch:** question word order in Task 3 (*she asked where did I live*). If most of the class does this, stop and put one pair of sentences on the board rather than correcting thirty scripts.",
    "**Task 3, item 5** is worth showing to everyone: when the question word is the subject (*who wrote this?*), the word order was never inverted, so nothing moves.",
    "**A fair point learners raise:** *She said she lives in Kandy* is also correct if she still lives there. The backshifted form is never wrong, so teach it first and accept the other when a learner can explain why.",
    "**Extension:** learners write a short dialogue of six lines, swap with a partner, and report their partner's dialogue in a paragraph."
  ],
  lessonSlug: "reported-speech"
};
