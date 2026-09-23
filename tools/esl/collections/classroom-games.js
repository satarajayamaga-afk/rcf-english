// 18 ESL CLASSROOM GAMES - a collection built to tools/esl/STANDARD.md,
// section 3b. Every game has a language point; wording is RCF English's own.

exports.collection = {
  slug: "classroom-games",
  path: "games/esl-classroom-games",
  title: "18 ESL Classroom Games That Teach Something",
  cefr: "A1-B2",
  audience: "Young learners, teenagers and adults; each game says which",
  teaches: "Vocabulary, grammar and fluency through classroom games",
  minutes: 10,
  category: "ESL Classroom Games",
  noun: "classroom games",
  tags: ["Games","No materials needed"],
  keywords: "ESL classroom games, English games for the classroom, EFL games for adults, vocabulary games for English class, grammar games ESL, games for large English classes, no-materials ESL games",
  hashtags: ["ESL","EFL","TEFL","ESLGames","EnglishTeachers"],
  description: "18 free ESL classroom games for A1 to B2: the language point each one practises, numbered steps, a variation, and a note for classes of 40 or more.",
  cardText: "Every game has a language point, steps and a large-class note.",

  intro: [
    "Eighteen games, each aimed at a language point rather than at filling five minutes. Every one says what it practises, how long it takes, what you need and how to run it in a class of forty.",
    "They are grouped by what they are for: vocabulary, grammar, speaking and whole-class energy. Nothing here needs a projector, and most need nothing at all."
  ],

  running: {
    heading: "What makes a classroom game worth the time",
    items: [
      "**A game needs a language point, or it is a break.** Before you play, be able to finish this sentence: *while they play this, learners are practising ...* If you cannot, the game is entertainment, which is fine at the end of term and expensive in week three.",
      "**Everybody plays at once, or almost nobody plays.** A game where two learners compete at the front while thirty-eight watch gives two learners practice. Teams, pairs and simultaneous rounds are what make a game work in a real class.",
      "**Teach the language of the game first.** *It's my turn. You missed. Whose turn is it? That's not fair!* Five minutes spent on these, once, pays back all year.",
      "**Short and stopped early.** Three minutes of a fast game beats ten minutes of the same game dying. Stop while they still want to play.",
      "**Keep the scoring simple and the teams equal.** Long scoring arguments take the lesson. Two teams, points on the board, no half points.",
      "**Decide beforehand what happens to mistakes.** For fluency games, note errors and deal with them afterwards. For accuracy games, a wrong sentence loses the point - that is the game's own correction, and it stings less than yours."
    ]
  },

  groups: [
    {
      key: "vocabulary",
      label: "Vocabulary games",
      blurb: "For learning, recycling and testing words - the part of language that most needs repetition.",
      activities: [
        {
          name: "The word wall race",
          time: "6 minutes", grouping: "Two or four teams", prep: "None",
          language: "Any word set: food, jobs, verbs, adjectives",
          steps: [
            "Name a category: *things in a kitchen.* Each team has two minutes to write as many as they can.",
            "Teams swap lists and check each other's spelling; a misspelt word scores nothing.",
            "One point per correct word, two for a word no other team has.",
            "Board the best five words for the class to copy."
          ],
          variation: "Harder: every word must begin with the same letter, or have two syllables.",
          bigClass: "Four teams by rows; each row passes one sheet along, which also stops one learner writing everything."
        },
        {
          name: "Definition bingo",
          time: "8 minutes", grouping: "Individual, then pairs", prep: "Twelve words on the board",
          language: "Listening to definitions; the vocabulary of one unit",
          steps: [
            "Board twelve words from recent lessons. Each learner draws a grid of six squares and writes any six of the twelve in it.",
            "Read out definitions in random order, in your own words. Learners cross off a word when they recognise its definition.",
            "The first with all six shouts bingo and must read back the six words with their meanings - that check is the point of the game.",
            "Play a second round with the learners writing and reading the definitions."
          ],
          variation: "Read example sentences with the word missing instead of definitions.",
          bigClass: "Perfect for a large class: everyone plays at once and you speak only once per item."
        },
        {
          name: "Odd one out",
          time: "5 minutes", grouping: "Pairs", prep: "None",
          language: "Categories, reasons, *because*",
          steps: [
            "Write four words on the board: *apple, banana, carrot, mango.*",
            "Pairs choose the odd one and give a reason. Any answer with a good reason scores.",
            "Take two or three different answers: the reasoning is the language, not the choice.",
            "Learners write the next set for the class."
          ],
          variation: "Verbs instead of nouns: *run, swim, read, jump.*",
          bigClass: "Whole class works from the board; hear four reasons."
        },
        {
          name: "The memory tray",
          time: "8 minutes", grouping: "Whole class, then pairs", prep: "Ten small objects, or ten words on the board",
          language: "*There was / there were*; plurals; *I think there was ...*",
          steps: [
            "Show ten objects for thirty seconds, then cover them.",
            "In pairs, learners list everything they remember, in full sentences: *There was a red pen.*",
            "Uncover and check. One point per correct item, none for a list without a sentence.",
            "Play a second round with two objects changed, and ask what is different."
          ],
          variation: "No objects: ten words on the board, rubbed out after thirty seconds.",
          bigClass: "Words on the board work for any class size; objects only for small rooms."
        },
        {
          name: "Word tennis",
          time: "4 minutes", grouping: "Pairs", prep: "None",
          language: "Rapid recall of one word set",
          steps: [
            "Name a category. Partners say words alternately, one each, with no repeats and no long pauses.",
            "A learner who repeats or pauses loses the point; start a new category.",
            "Three categories is enough.",
            "Use the category you taught last lesson, and it becomes revision."
          ],
          variation: "Harder version: each word must begin with the last letter of the previous one.",
          bigClass: "No change needed - everyone plays in pairs at once."
        }
      ]
    },
    {
      key: "grammar",
      label: "Grammar games",
      blurb: "Accuracy practice that does not feel like a worksheet.",
      activities: [
        {
          name: "Sentence auction",
          time: "12 minutes", grouping: "Teams of four", prep: "Ten sentences, half of them wrong",
          language: "Whatever grammar you have taught: tenses, articles, word order",
          steps: [
            "Each team has an imaginary 100 points. Read out or board ten sentences, half correct and half not.",
            "Teams bid points on the sentences they believe are correct.",
            "Reveal after each one: a correct sentence wins the bid back doubled, a wrong one loses it.",
            "The team with most points explains two of the corrections."
          ],
          variation: "Use sentences you collected from the class's own writing, unnamed.",
          bigClass: "Teams by rows; bids written on paper and held up together, so nobody can hear the others first."
        },
        {
          name: "Beat the teacher",
          time: "6 minutes", grouping: "Whole class against you", prep: "None",
          language: "Any target structure",
          steps: [
            "You say a sentence using the target structure. Sometimes it is wrong.",
            "The class wins a point for spotting a mistake, and you win one for every mistake that passes.",
            "Learners must say what is wrong and correct it, not just shout.",
            "Six or eight sentences is enough."
          ],
          variation: "Let a learner take your place once the class knows the game.",
          bigClass: "Works best with a big class - the whole room can answer together."
        },
        {
          name: "Running dictation",
          time: "12 minutes", grouping: "Pairs", prep: "One short text on the wall, or on the board at the back",
          language: "Any grammar in a text; spelling; listening and reading",
          steps: [
            "Put the text where learners must walk to read it: the back wall, the corridor door.",
            "One learner walks, reads and remembers a piece; the other writes what they hear. No paper travels.",
            "Halfway through, they swap roles.",
            "The pair with the most accurate text wins - accuracy, not speed."
          ],
          variation: "Use a text with the target grammar in every sentence, and check those words most carefully.",
          bigClass: "Two copies on two walls. Where learners cannot move, the reader turns round and whispers from memory instead."
        },
        {
          name: "Question basketball",
          time: "8 minutes", grouping: "Two teams", prep: "A ball or a rolled paper, and a bin",
          language: "Question forms in any tense",
          steps: [
            "A team earns a throw by asking a correct question about a prompt you give: *the weekend, your family, last holiday.*",
            "The question must be grammatically correct, or no throw.",
            "One point for the question, two more for the throw that goes in.",
            "Change the tense each round."
          ],
          variation: "No ball: the throw is replaced by a spelling challenge for the bonus points.",
          bigClass: "Two teams of twenty; one thrower per round, chosen by the team in turn, so everyone gets a go over a term."
        },
        {
          name: "Grammar stations",
          time: "15 minutes", grouping: "Groups of four, rotating", prep: "Four sheets, one on each desk group",
          language: "Four different structures, revised in one lesson",
          steps: [
            "Four desks each have a different short task: a gap fill, a correction, a transformation, a question-writing task.",
            "Groups have three minutes at each, then rotate.",
            "The last group at each station reads the answers out; earlier groups check their own.",
            "Nobody sits still for more than three minutes, which is why it works after lunch."
          ],
          variation: "Station five: write the fifth task for next time.",
          bigClass: "Eight stations, two copies of each task; groups rotate within their half of the room."
        }
      ]
    },
    {
      key: "speaking",
      label: "Games that make them speak",
      blurb: "Fluency games with a rule that forces the target language out.",
      activities: [
        {
          name: "The yes-no game",
          time: "6 minutes", grouping: "Pairs", prep: "None",
          language: "Question forms; avoiding yes and no; short answers",
          steps: [
            "One learner answers questions for sixty seconds without saying yes or no.",
            "The partner asks anything, trying to trap them: *Are you a student? You live here, don't you?*",
            "Teach the escape phrases first: *That's right. Not at all. I'm afraid so. Possibly.*",
            "Swap, and see who lasts longer."
          ],
          variation: "Ban *maybe* as well, once the class is good at it.",
          bigClass: "No change needed."
        },
        {
          name: "Liar's interview",
          time: "10 minutes", grouping: "Groups of four", prep: "None",
          language: "Past simple questions; consistency in answers",
          steps: [
            "One learner claims an unusual experience: *I have met a famous singer.* It may be true or invented.",
            "The group has two minutes of questions to decide.",
            "The group votes, then the truth comes out. A convincing liar and a sharp group both score.",
            "Everyone takes a turn."
          ],
          variation: "The teacher goes first with a true story nobody believes.",
          bigClass: "All groups at once; no reporting stage needed."
        },
        {
          name: "The silent film",
          time: "10 minutes", grouping: "Groups of four", prep: "None",
          language: "Present continuous for actions happening now; adverbs",
          steps: [
            "Two learners in each group mime a short everyday scene - missing a bus, cooking badly, a first day at work - with no sound at all.",
            "The other two narrate it aloud as it happens: *He's running. Now she's laughing at him.*",
            "Swap roles and mime a new scene.",
            "The rule that makes it work: narrators must speak continuously, so hesitation costs the group its turn."
          ],
          variation: "Narrate afterwards in the past simple instead, which turns it into a storytelling task.",
          bigClass: "All groups play at once; two groups perform for the class at the end if there is time."
        },
        {
          name: "The one-minute story",
          time: "10 minutes", grouping: "Groups of four", prep: "None",
          language: "Narrative tenses; sequencing",
          steps: [
            "Give three words that must appear: *a key, a storm, a stranger.*",
            "Each group has three minutes to agree a story, then one minute to tell it.",
            "The listening groups hold up a hand when they hear each of the three words.",
            "Best story, by vote, not by teacher."
          ],
          variation: "Each group passes its three words to the next group.",
          bigClass: "Groups tell their story to one other group rather than to the class."
        }
      ]
    },
    {
      key: "energy",
      label: "Five-minute energy games",
      blurb: "For the moment when the class stops listening, with just enough language to justify them.",
      activities: [
        {
          name: "Right or wrong, on your feet",
          time: "4 minutes", grouping: "Whole class", prep: "None",
          language: "True/false statements; any grammar point",
          steps: [
            "Say a sentence. Learners stand if it is grammatically correct and stay seated if it is not.",
            "Anyone who moves late or wrongly sits out one round.",
            "Eight sentences, fast.",
            "It tells you in two minutes who has understood a grammar point, which is why it beats asking."
          ],
          variation: "True/false about the class's own reading text instead.",
          bigClass: "Better with a big class: you can see the whole room decide."
        },
        {
          name: "The alphabet chain",
          time: "5 minutes", grouping: "Whole class or rows", prep: "None",
          language: "Vocabulary recall; alphabet; spelling",
          steps: [
            "Name a category. Each learner in turn says a word beginning with the next letter of the alphabet.",
            "A learner who cannot, passes; the row loses a point.",
            "Go round twice with different categories.",
            "Say the letters aloud as you go, so the alphabet itself gets practised."
          ],
          variation: "Backwards from Z for a class that finds it too easy.",
          bigClass: "Row against row keeps it moving in a class of any size."
        },
        {
          name: "Change places if",
          time: "5 minutes", grouping: "Whole class", prep: "Chairs in a circle, if possible",
          language: "Present and past simple; *if* clauses",
          steps: [
            "One learner in the middle says: *Change places if you walked to school today.*",
            "Everyone it is true for moves; the one left without a seat goes to the middle.",
            "Teach the sentence pattern first and leave it on the board.",
            "Six or seven rounds."
          ],
          variation: "Where chairs cannot move: learners stand and sit instead of changing seats.",
          bigClass: "Do it in two halves of the room simultaneously, with one learner in the middle of each."
        },
        {
          name: "Board race",
          time: "5 minutes", grouping: "Two teams", prep: "None",
          language: "Spelling; word order; any short answer",
          steps: [
            "Two learners at the board, one from each team.",
            "Say a word to spell, or a jumbled sentence to write in order. First correct answer wins the point.",
            "Change the writers every round so everyone takes a turn.",
            "Insist the answer is correct, not just first, or the game teaches speed instead of English."
          ],
          variation: "Three teams if the board is wide enough.",
          bigClass: "The rest of the class writes the same answer in their notebooks, so nobody is only watching."
        }
      ]
    }
  ],

  faq: [
    ["Are games not just a waste of teaching time?", "A game with a language point is practice with the attention on meaning, which is when language sticks. Describe it, do not say it drills defining language harder than any exercise. The waste is a game with no language point, played because the lesson ran short."],
    ["My class becomes uncontrollable during games.", "Three fixes, in order: shorter rounds; teams rather than individuals; and a clear stop signal agreed and practised before you start. A game that ends while it is still enjoyable does not need controlling."],
    ["I have forty-five learners and fixed desks. Which games work?", "Every game here has a line for large classes. The safest are Beat the teacher, Right or wrong on your feet, Word tennis, Sentence auction and Board race with the class writing along - none need anyone to move."],
    ["How do I stop the same learners winning every time?", "Make teams, not individuals, and change them weekly. Score for things other than speed: best reason, best spelling, most words nobody else had. Then the strongest learner cannot carry every round."],
    ["Should I correct mistakes during a game?", "In accuracy games, a wrong answer simply loses the point, and that is correction enough. In fluency games, note the errors and put four sentences on the board afterwards for the class to repair."]
  ]
};
