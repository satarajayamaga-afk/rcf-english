// 15 ESL LISTENING ACTIVITIES - a collection built to tools/esl/STANDARD.md,
// section 3b. Every activity works with the teacher's own voice, so no
// recording, no speakers and no copyright problem. Wording is RCF English's own.

exports.collection = {
  slug: "listening-activities",
  path: "listening/esl-listening-activities",
  title: "15 ESL Listening Activities With No Recording Needed",
  cefr: "A1-B2",
  audience: "Young learners, teenagers and adults; each activity says which",
  teaches: "Listening for gist, listening for detail, and listening to respond",
  minutes: 12,
  category: "ESL Listening Activities",
  noun: "listening activities",
  tags: ["Listening","No recording needed"],
  keywords: "ESL listening activities, listening activities without audio, teaching listening ESL, EFL listening tasks, dictogloss, picture dictation, listening for gist and detail",
  hashtags: ["ESL","EFL","TEFL","ListeningSkills","EnglishTeachers"],
  description: "15 free ESL listening activities needing no recording or speakers: gist, detail, listening and doing, and listening to each other, with steps for each.",
  cardText: "Listening tasks that need no audio file: your own voice is the source.",

  intro: [
    "Fifteen listening activities that need no audio file, no speakers and no internet. The source is your own voice, or the learners' voices, which in most classrooms is the only source that works every day.",
    "They are grouped by what kind of listening they train: listening for the general idea, listening for exact information, listening and doing something physical, and listening to each other. Each one says what it practises, how long it takes and how to run it with forty learners."
  ],

  running: {
    heading: "How to make a listening task work",
    items: [
      "**Set the task before you speak, not after.** A learner who knows what to listen for listens; a learner who hears \"listen carefully\" tries to hold everything and holds nothing. Put the question on the board first.",
      "**Play it twice, and change the task between the two.** First listening for the general idea, second for detail. Two listenings with one task is a test; two listenings with two tasks is teaching.",
      "**Speak naturally, then slow down the pauses, not the words.** Teachers who say each word separately remove exactly the features - linking, weak forms, contractions - that learners need to get used to. Keep normal speed and leave longer gaps between sentences.",
      "**Let them compare answers in pairs before you check.** It takes thirty seconds, it doubles what they hear from the second listening, and it saves the learner who got nothing from having to say so in front of everyone.",
      "**When they fail, find out why.** Did they not know the word, not catch it in the stream of speech, or not understand the question? Replay just that phrase and let them hear it again. \"Listen more carefully\" is not feedback.",
      "**Difficulty lives in the task, not only in the text.** The same short story can be A2 (\"how many people are in it?\") or B2 (\"why did she change her mind?\"). Keep your texts and grade the questions."
    ]
  },

  groups: [
    {
      key: "gist",
      label: "Listening for the general idea",
      blurb: "The first thing a listener needs: what is this about, who is talking, and why. These come before any detail work.",
      activities: [
        {
          name: "The three-guess story",
          time: "8 minutes", grouping: "Whole class, then pairs", prep: "None - think of a short true story from your week",
          language: "Past simple narrative; any topic vocabulary",
          steps: [
            "Tell the class you will describe something that happened to you this week, and that they must decide *where* it happened. Write three places on the board as options.",
            "Tell the story in six or seven sentences, at normal speed. Do not name the place.",
            "Learners vote by raising hands, then tell a partner which words made them choose.",
            "Tell the story again. This time they listen for one detail you changed - and there is one, so change it."
          ],
          variation: "Learners tell their own three-guess stories in groups of four while the others guess the place.",
          bigClass: "Vote by standing under one of three signs taped to the walls. Thirty seconds, and you can see every answer."
        },
        {
          name: "Headline it",
          time: "10 minutes", grouping: "Pairs", prep: "None - two short news-style items you can say from memory",
          language: "Present perfect and past simple; noun phrases",
          steps: [
            "Explain that a headline is short, has no unnecessary words, and says the main point.",
            "Read a four-sentence news item twice. Pairs write a headline of six words or fewer.",
            "Collect three or four headlines on the board and ask which one tells a reader the most. Do not rank them yourself - ask the class.",
            "Repeat with the second item. Headlines get noticeably better the second time, which is the point."
          ],
          variation: "Give the headline first and ask learners to predict three things the item will mention. Then read it.",
          bigClass: "One headline per pair on a slip of paper. Collect ten at random and read them out; the class chooses the clearest."
        },
        {
          name: "Two versions of the same day",
          time: "12 minutes", grouping: "Individual, then pairs", prep: "None",
          language: "Past simple; adjectives of feeling; time expressions",
          steps: [
            "Tell the class you will describe the same day twice: once as somebody who enjoyed it and once as somebody who did not.",
            "Describe the day twice, five sentences each, without saying which version is which.",
            "Learners decide which version was which and write down two words that told them - usually adjectives and the things each speaker chose to mention.",
            "Draw out the idea that a speaker's attitude is carried by what they leave out as much as by what they say."
          ],
          variation: "At B2, use the same technique with an opinion: describe one change to the school from two points of view.",
          bigClass: "Works unchanged - the pair discussion is the whole activity and needs no monitoring to be useful."
        }
      ]
    },
    {
      key: "detail",
      label: "Listening for exact information",
      blurb: "Numbers, names, times and facts - the listening that everyday life and every examination asks for.",
      activities: [
        {
          name: "Five planted mistakes",
          time: "10 minutes", grouping: "Individual, then pairs", prep: "A short text you know well - the last reading text works",
          language: "Whatever the text contains; excellent for recycling",
          steps: [
            "Learners close their books. Tell them you will read a text they know and change exactly five things.",
            "Read at normal speed. Learners raise a hand or tap the desk each time they hear a change, and write what it should be.",
            "In pairs they compare their five. Read once more so they can check the ones they argued about.",
            "Ask which mistake was hardest to catch. It is almost always a small grammatical one rather than a wrong fact, and that is worth saying out loud."
          ],
          variation: "Learners prepare the five changes themselves and read to their group. They listen much harder when they have had to plant the mistakes.",
          bigClass: "Tapping the desk beats hands up: you can hear the wave of recognition and see who is a beat behind."
        },
        {
          name: "Numbers, names and times",
          time: "8 minutes", grouping: "Individual", prep: "None - improvise a message with eight pieces of information",
          language: "Numbers, dates, times, spelling aloud, prices",
          steps: [
            "Learners draw a simple form: name, phone, date, time, place, price, two extras.",
            "Say a telephone message once at normal speed, containing all eight. Include a correction - \"sorry, that's the fourteenth, not the fourth\" - because real messages do.",
            "Say it a second time. Learners complete the form, then check in pairs.",
            "Check the two items most classes get wrong: the corrected item and any number between thirteen and nineteen."
          ],
          variation: "Learners write their own messages and dictate to a partner, who must read the completed form back.",
          bigClass: "No change needed. Project or draw the blank form on the board so nobody spends the listening time ruling lines."
        },
        {
          name: "Dictogloss in four steps",
          time: "20 minutes", grouping: "Individual, then groups of four", prep: "A text of about sixty words at the class's level",
          language: "Whatever grammar the text shows; excellent after a grammar lesson",
          steps: [
            "First reading: learners only listen, pens down, and get the general meaning.",
            "Second reading at normal speed: learners write down the words they catch - single words, not sentences.",
            "In groups of four, learners pool their words and rebuild the text so that it means the same and is grammatically correct. It does not have to be identical.",
            "Groups compare their version with the original, on the board or read aloud. The discussion of the differences is where the grammar is learnt."
          ],
          variation: "Choose a text containing the structure you taught last lesson. The rebuilding forces them to use it and to notice when they have not.",
          bigClass: "Groups of five or six work fine. One writer per group keeps the noise manageable; rotate the writer if you do this often."
        },
        {
          name: "Directions on a blank map",
          time: "12 minutes", grouping: "Individual, then pairs", prep: "Learners draw the grid themselves - no photocopying",
          language: "Prepositions of place; directions; ordinal numbers",
          steps: [
            "Learners draw four horizontal and four vertical lines: a simple street grid. Mark one square \"START\".",
            "Give directions aloud and name a building at the end: \"Go up two streets, turn right, it's the second building on your left. That's the post office.\" Learners write the name in the square.",
            "Give five or six such sets. Then learners compare maps in pairs and find where they diverged.",
            "Ask two learners with different maps to explain their route. The class decides who followed the instructions."
          ],
          variation: "Learners give the directions in pairs, back to back, with one describing and one drawing.",
          bigClass: "Perfect for large classes - everybody has a pen and paper, and pair-checking finds the errors without you."
        }
      ]
    },
    {
      key: "doing",
      label: "Listening and doing",
      blurb: "Listening checked by an action rather than an answer - the fastest way to see who understood, and the best for young learners and mixed levels.",
      activities: [
        {
          name: "Picture dictation",
          time: "10 minutes", grouping: "Individual, then pairs", prep: "None",
          language: "Prepositions of place; there is and there are; any object vocabulary",
          steps: [
            "Learners take a blank half-page. Warn them that drawing quality does not matter and will not be commented on.",
            "Describe a simple scene in eight sentences: \"There's a tree on the left. There are three birds above the tree.\" Pause after each.",
            "Learners compare drawings in pairs and find the differences, then say which sentence caused each one.",
            "Draw or describe the original and let them check. Keep the sentences, not the picture - you will use them again."
          ],
          variation: "At B1, describe the scene once at normal speed with no pauses, then again with pauses. The contrast teaches them something about their own listening.",
          bigClass: "No change needed. Learners who finish early add one thing you did not mention and challenge their partner to find it."
        },
        {
          name: "Listen and build",
          time: "8 minutes", grouping: "Pairs", prep: "None - one sheet of paper each",
          language: "Sequencing and instructions: first, then, next, fold, turn over, press",
          steps: [
            "Everybody takes one sheet of paper. Give folding instructions step by step, without showing anything: \"Fold it in half, long side to long side.\"",
            "Make no corrections and answer no questions for the first four steps - learners must listen rather than copy their neighbour.",
            "After six steps, hold up your own paper. Learners compare and work out which instruction lost them.",
            "Do it once more, faster, with learners giving the instructions."
          ],
          variation: "Instead of folding, learners arrange six objects from their bag on the desk in the order and position you describe.",
          bigClass: "Ideal: silent, visible, and you can see every learner's result from the front in one glance."
        },
        {
          name: "Minimal pair corners",
          time: "6 minutes", grouping: "Whole class, standing", prep: "None - choose the pair your learners confuse",
          language: "Pronunciation: ship and sheep, walk and work, sit and seat",
          steps: [
            "Write one word on the left of the board and one on the right. Say each three times so the class hears the difference before being asked to judge it.",
            "Learners point left or right as you say a word at random. Keep it fast, ten or twelve words.",
            "Include the same word twice in a row. It stops them guessing by alternation, which is how half of them survive this activity.",
            "Then reverse it: a learner says a word and the class points. This is the harder half and the more useful one."
          ],
          variation: "Put the two words in sentences - \"I can see a ship / I can see a sheep\" - so learners judge them in the stream of speech, where it actually matters.",
          bigClass: "Pointing works at any class size. Watch the back rows: they copy the front rows, so call words with your back turned occasionally."
        },
        {
          name: "Shadowing the teacher",
          time: "6 minutes", grouping: "Whole class, then pairs", prep: "Four or five sentences from a text they have read",
          language: "Stress, rhythm, linking and weak forms",
          steps: [
            "Read one sentence at natural speed. Learners listen only.",
            "Read it again; learners speak along with you, half a word behind, quietly. Tell them to copy the rhythm even if they lose some words.",
            "Read it a third time; learners say it with you at full volume. Then they say it alone.",
            "Ask what was hardest. It is usually the unstressed words they had not noticed were unstressed."
          ],
          variation: "Record nothing and demonstrate nothing else: shadow the same sentences at the start of five lessons and the change in rhythm is audible.",
          bigClass: "Better in a large class than a small one - nobody is exposed, and the whole room carries the rhythm."
        }
      ]
    },
    {
      key: "each-other",
      label: "Listening to each other",
      blurb: "The listening learners will do most of, and the listening classrooms practise least. These activities make not listening impossible.",
      activities: [
        {
          name: "The missing half",
          time: "12 minutes", grouping: "Pairs", prep: "Two short sets of information - a timetable, a price list, a family",
          language: "Question forms; asking for repetition; numbers",
          steps: [
            "Give learner A half the information and learner B the other half. Neither may look at the other's paper.",
            "Teach the three phrases they will need first: *Sorry, could you say that again? Do you mean ...? How do you spell that?*",
            "Pairs complete their own sheet by asking. Nothing may be shown or passed.",
            "Compare sheets at the end. Where the information is wrong, ask what happened - almost always a number or a name that was said once and not checked."
          ],
          variation: "Sit pairs back to back. It removes lip-reading and gesture, and the asking-for-repetition phrases suddenly get used.",
          bigClass: "Write both halves on the board's two ends before the lesson, have learners copy one half, then pair them across the aisle."
        },
        {
          name: "The note-taker's summary",
          time: "12 minutes", grouping: "Groups of three", prep: "None",
          language: "Reported speech; summarising; agreeing and disagreeing",
          steps: [
            "In each group of three, two learners discuss a question for three minutes while the third takes notes and says nothing.",
            "The note-taker then summarises what each speaker said, in reported speech: \"Nimal said he thought ..., but Ayesha disagreed because ...\"",
            "The two speakers correct the summary where it misrepresents them. This correction is the most useful minute in the activity.",
            "Rotate so all three take a turn as note-taker."
          ],
          variation: "The note-taker may not write full sentences, only five words in total. Summarising from five words forces real listening.",
          bigClass: "Groups of three are ideal in a crowded room; nobody needs to move, and the volume stays low because only two talk at a time."
        },
        {
          name: "Whose weekend was it?",
          time: "10 minutes", grouping: "Groups of five", prep: "None",
          language: "Past simple; listening for detail; question forms",
          steps: [
            "Each learner writes three sentences about their weekend on an unsigned slip of paper.",
            "Collect the slips within each group and redistribute. One learner reads a slip aloud, twice.",
            "The group guesses whose weekend it was and must give one reason from what they heard.",
            "The writer confirms and adds one sentence they did not write down. The group asks two follow-up questions."
          ],
          variation: "Slips describe a future plan instead, and the group guesses using *will* and *going to*.",
          bigClass: "Keep the slips inside each group - collecting for the whole class takes five minutes and gains nothing."
        },
        {
          name: "One fact before you speak",
          time: "10 minutes", grouping: "Groups of six", prep: "None",
          language: "Reported speech; linking words; any discussion topic",
          steps: [
            "Set a question the group will discuss - a real one, on which they will disagree.",
            "The rule: before saying anything of your own, you must repeat one thing the previous speaker said. \"You said the bus is cheaper. I think ...\"",
            "Run the discussion for five minutes. Enforce the rule strictly for the first two - the activity collapses without it.",
            "Afterwards, ask how the discussion was different. Learners usually say it was slower, which it is, and that they remembered more, which is the point."
          ],
          variation: "At B2, the repetition must be a paraphrase, not the speaker's own words.",
          bigClass: "Groups of six with one learner as rule-keeper. The rule-keeper role is a gift to the learner who never speaks."
        }
      ]
    }
  ],

  faq: [
    ["Can I really teach listening without recordings?", "You can teach most of it. Your own voice gives learners a real speaker who links words, uses weak forms and repairs himself, and you can repeat any phrase instantly, which no audio file allows. What your voice cannot give is other accents and other voices, so use recordings for that when you have them - and the activities on this page still work around them."],
    ["My learners say they understand nothing at natural speed.", "Then the task is too hard, not the speed. Keep the speed and ask for less: how many speakers, happy or angry, one number. Slowing your speech teaches learners to understand speech nobody outside the classroom produces."],
    ["How many times should I play or read a text?", "Twice as standard, with a different task each time, and a third time for the one phrase they argued about. More than three full listenings and they stop listening and start remembering."],
    ["Should learners see the text afterwards?", "Yes, at the end. Reading the text after listening is where a learner discovers that the word they could not catch was one they already knew - and that is the moment that improves their listening, not the score."],
    ["What do I do about the learners who never listen to each other?", "Make not listening impossible rather than asking for it: One fact before you speak, The note-taker's summary and The missing half all break down immediately if somebody has not listened, and learners feel that themselves."]
  ],

  closing: [
    "None of these need equipment, which means none of them can fail because the speakers do not work. What they do need is a task set before you speak and a second listening with a different question.",
    "If you use recordings as well, the same principles apply: task first, twice with two questions, pair-check before whole-class checking, and when they fail, find out which of the three reasons it was."
  ]
};
