// CLASSROOM GAMES - GRADE 11
//
// The examination year. A game in Grade 11 has to be defensible in November,
// so every one of these is a piece of the paper done under a clock. They are
// still games - there is a score, a winner and a reason to hurry - but
// nothing here is played for its own sake.
//
// The clock is the point of most of them. Pupils lose marks at O/L for
// unfinished answers far more often than for bad English.

exports.grade = {
  number: 11,
  focus: "the O/L paper itself - each section done against a clock, marked against the criteria, and repaired",
  intro: [
    "In the examination year a game has to be defensible in November, so every one of these is a piece of the Ordinary Level paper done under a clock. They are still games, with a score and a reason to hurry, but nothing here is played for its own sake.",
    "The clock is the design. Marks at O/L are lost to unfinished answers far more often than to poor English, and no amount of explaining fixes that - only doing it repeatedly, against a visible timer, until finishing in the time becomes ordinary."
  ],
  faq: [
    {
      q: "We have no time for anything but past papers.",
      a: ["Then use these on the past papers you are already doing. Most of them are ways of working through a paper rather than alternatives to one: marking each other's answers, repairing a weak paragraph, finding where the marks went. The paper is still the material; what changes is what the class does with it."]
    },
    {
      q: "My class panics about the time.",
      a: ["Panic comes from not knowing how long an answer takes, and the only cure is having done it often enough to know. Put the clock where everybody can see it and stop exactly on time every single occasion, including when they are close. A class that has been stopped forty times stops being frightened of it."]
    },
    {
      q: "Is it worth letting pupils mark each other?",
      a: ["It is the most valuable thing on this page. A pupil who has marked six answers against the criteria understands where marks come from in a way that no amount of having their own work marked achieves. Your marking tells them about their answer; marking six tells them about the paper."]
    },
    {
      q: "What about the pupils who have already given up?",
      a: ["Score by row so they are contributing to something, and give them the marking and checking roles, which are less exposed than producing. A pupil who will not write a letter will often happily find four faults in somebody else's, and that is real engagement with the paper."]
    }
  ],
  games: [
    {
      name: "Beat the clock",
      time: "10 minutes",
      grouping: "Individually",
      prep: "One writing question from a past paper",
      language: "Whichever section you are working on",
      steps: [
        "Put the real time allowance for that question on the board as a countdown, and take two minutes off it.",
        "Everybody writes. No questions once it starts.",
        "Stop dead on time. Ask for a show of hands: finished, nearly finished, not finished.",
        "Repeat the same question type next week at the real allowance, and compare the hands. The improvement is visible within a month."
      ],
      variation: "Once the class can finish comfortably, cut another minute rather than lengthening the question.",
      bigClass: "Silent and individual, so class size is irrelevant. The show of hands is the whole feedback mechanism and it costs ten seconds."
    },
    {
      name: "The examiner's eye",
      time: "9 minutes",
      grouping: "Pairs",
      prep: "Two answers to the same question, written by you at different levels",
      language: "The marking criteria",
      steps: [
        "Board or read out two answers to the same question - one worth about half marks, one worth most of them. Do not say which is which.",
        "Pairs decide which is better and list three specific things that separate them. Not *better English* - three things.",
        "Collect the reasons and board them. The list the class produces is the marking criteria in their own words, which they will remember.",
        "Keep that list on the wall for the rest of the year."
      ],
      variation: "Make the two answers closer in quality each time you use it.",
      bigClass: "The list on the wall is what makes this worth the period. A criteria list the class wrote themselves gets read; one you hand out does not."
    },
    {
      name: "The rewrite challenge",
      time: "8 minutes",
      grouping: "Rows as teams",
      prep: "One weak paragraph on the board",
      language: "Repairing rather than producing",
      steps: [
        "Board a weak paragraph - genuinely weak, with repetition, short choppy sentences and one good idea buried in it.",
        "Each row rewrites it. Five minutes, one sheet passed along.",
        "Rows read their versions. The class votes, and must say what made the winner better.",
        "Then ask what the original's one good idea was, and whether every version kept it. Usually one row has lost it, which is worth a minute."
      ],
      variation: "Harder: the rewrite must be shorter than the original while keeping everything that mattered.",
      bigClass: "The buried good idea is the design. It stops the game being about polish and makes it about reading the original properly first."
    },
    {
      name: "Twenty marks in ten minutes",
      time: "10 minutes",
      grouping: "Rows as teams",
      prep: "A past paper section",
      language: "Reading the question and allocating effort",
      steps: [
        "Give the rows a section of a past paper and its mark allocation, but do not let them start writing.",
        "Two minutes: each row plans how many minutes it would spend on each question and why. That is the whole first half of the game.",
        "Compare the plans. Rows almost always over-allocate to the question they like and under-allocate to the one worth the most marks.",
        "Then write for the remaining time according to the class's agreed plan."
      ],
      variation: "Include a question worth very few marks that looks time-consuming, and see which rows spot it.",
      bigClass: "The planning half is the lesson and it is free. Most classes have never once been asked to decide where the time should go before writing."
    },
    {
      name: "The dialogue under time",
      time: "7 minutes",
      grouping: "Pairs",
      prep: "None",
      language: "Completing a dialogue at speed",
      steps: [
        "Board a dialogue with four gaps and give four minutes.",
        "Pairs fill it, then read it aloud to the pair behind them, both parts.",
        "The listening pair says which line sounded wrong. Something always does, and hearing it is faster than analysing it.",
        "Fix the two commonest wrong lines with the whole class."
      ],
      variation: "Harder: one gap is the last line, which has to close the conversation - the hardest of the four.",
      bigClass: "Reading to the pair behind means twenty-two dialogues are heard and judged in two minutes, which no whole-class reading round could achieve."
    },
    {
      name: "Spot the lost marks, again",
      time: "8 minutes",
      grouping: "Rows",
      prep: "A complete answer with faults, from the class's own work, anonymised",
      language: "Where marks actually go",
      steps: [
        "Take a real answer from the class's books - no name, and rewritten in your hand so it cannot be recognised.",
        "Rows find every place a mark would be lost and say why.",
        "Total the losses. The class's total is almost always higher than the real one, which is worth discussing: pupils over-punish grammar and under-punish an unanswered part.",
        "Give the real mark and where it actually went."
      ],
      variation: "Use an answer that is strong in English but misses half the task, which is the most instructive kind.",
      bigClass: "Anonymising properly matters more in a large class, not less - rewrite it in your own hand, and never use an answer whose writer could be guessed from its content."
    },
    {
      name: "The essay plan race",
      time: "6 minutes",
      grouping: "Individually",
      prep: "Three essay titles",
      language: "Planning: thesis, three points, conclusion",
      steps: [
        "Give three titles. Everybody plans all three in six minutes - plans only, four lines each, no prose.",
        "The point is that planning an essay should take three minutes, not fifteen, and most pupils have never timed it.",
        "Take one title and compare four plans aloud. Ask which plan would produce the best essay, not which sounds cleverest.",
        "Then they write the essay from the winning plan, for homework or next period."
      ],
      variation: "Harder: one of the three titles should be awkward and unfamiliar, since that is the one that appears in November.",
      bigClass: "Silent and individual. Comparing four plans aloud takes three minutes and shows the class that a good plan is short, which is the thing they least believe."
    },
    {
      name: "The last five minutes",
      time: "5 minutes",
      grouping: "Pairs",
      prep: "Answers the class wrote earlier",
      language: "Checking: tense, agreement, full stops, the word count",
      steps: [
        "Take an answer the class wrote earlier in the week. Give them five minutes and a checking list of four items on the board.",
        "They check their own first, alone, for two minutes, then swap and check a partner's for three.",
        "Count how many errors each pupil found in their own work, and how many their partner found in it. The second number is always larger.",
        "That gap is the lesson: you cannot see your own mistakes well, which is why the checking list exists."
      ],
      variation: "Use the four errors the class actually makes most, taken from your own marking, and change the list each month.",
      bigClass: "Five minutes, no materials, and it can be done at the end of any period with anything they have written. The comparison of the two numbers is what makes them believe in checking at all."
    }
  ]
};
