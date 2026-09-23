// ENGLISH CONVERSATION QUESTIONS BY TOPIC - a collection built to
// tools/esl/STANDARD.md, section 3b. Each "activity" here is a topic set:
// the questions, the language they need, and how to run them.

exports.collection = {
  slug: "conversation-questions",
  path: "speaking-activities/conversation-questions",
  title: "12 Sets of English Conversation Questions, by Topic",
  cefr: "A2-B2",
  audience: "Teenagers and adults",
  teaches: "Conversation practice by topic",
  minutes: 20,
  category: "ESL Conversation Questions",
  noun: "sets of conversation questions",
  tags: ["Speaking","Conversation"],
  keywords: "ESL conversation questions, English conversation questions by topic, speaking questions for English class, discussion questions ESL, conversation topics for adults learning English",
  hashtags: ["ESL","EFL","TEFL","ConversationClass","EnglishTeachers"],
  cardText: "Graded question sets by topic, with follow-ups that keep talk going.",

  intro: [
    "Twelve sets of conversation questions, graded from A2 to B2, with the language each topic needs and a way to run it that keeps everyone talking rather than one confident learner answering everything.",
    "Every set gives easier and harder questions, so one page serves a mixed class. The topics are ones any class in any country can discuss safely."
  ],

  running: {
    heading: "Making conversation questions actually work",
    items: [
      "**Never ask the whole class a conversation question.** One learner answers, thirty listen. Put the questions in pairs or threes, and move round.",
      "**Give the answering language, not just the question.** Two or three phrases on the board - *It depends. I'd say ... The thing is ...* - turn one-word answers into conversations.",
      "**Let them choose.** Pairs pick four questions from the set rather than working through all of them. Choice raises the quality of the answers.",
      "**Thirty seconds of silent thinking first.** With questions of opinion, this is the difference between a real answer and \"I don't know\".",
      "**Ask for a follow-up, always.** The rule \"you must ask one more question after each answer\" is what makes it a conversation rather than an interview.",
      "**Change partners once.** The second telling is always better than the first, which is where the fluency gain comes from."
    ]
  },

  groups: [
    {
      key: "everyday",
      label: "Everyday life (A2)",
      blurb: "Concrete topics with simple tenses: safe ground for a class that has not talked much before.",
      activities: [
        {
          name: "Food and meals",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "Present simple; *like / prefer*; frequency; food vocabulary",
          steps: [
            "**Easier:** What do you usually have for breakfast? Who cooks in your home? What food do you eat every week? Is there a food you really do not like?",
            "**Harder:** What dish would you cook for a visitor from another country, and why? Has your diet changed in the last five years? Should schools decide what children eat?",
            "Put three phrases on the board first: *It depends. I'd rather ... To be honest, ...*",
            "Pairs choose four questions; after each answer the partner must ask one more question."
          ],
          variation: "Each learner describes one dish in detail without naming it; the partner guesses.",
          bigClass: "Pairs throughout; hear three answers at the end, not thirty."
        },
        {
          name: "Home and where you live",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "*There is / there are*; prepositions; comparatives",
          steps: [
            "**Easier:** Where do you live? What is near your home? What is the best thing about your area? Do you prefer a city or the countryside?",
            "**Harder:** What would you change about your town? Is it better to live where you grew up or to move away? What makes a place feel like home?",
            "Give the comparative forms on the board if the class is A2.",
            "After four questions, learners change partners and answer two of them again - better the second time."
          ],
          variation: "Learners draw their ideal home in two minutes and describe it to a partner.",
          bigClass: "No change needed."
        },
        {
          name: "Free time and weekends",
          time: "20 minutes", grouping: "Pairs, then groups of four", prep: "None",
          language: "Present simple; past simple; *enjoy / prefer* + -ing",
          steps: [
            "**Easier:** What do you do at the weekend? What did you do last Saturday? Do you prefer doing things alone or with other people?",
            "**Harder:** Has the way people spend free time changed since your parents were young? Is being busy a good thing? What would you do with one completely free day?",
            "Pairs first, then join two pairs and compare answers to the last question.",
            "One learner from each four reports the most interesting answer."
          ],
          variation: "Rank five free-time activities and agree an order in the group of four.",
          bigClass: "The join-into-fours step works with any class size; nobody presents from the front."
        }
      ]
    },
    {
      key: "people",
      label: "People and experience (B1)",
      blurb: "Personal but safe: nothing here asks a learner to reveal family or money troubles.",
      activities: [
        {
          name: "Friends",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "Present perfect; *know / meet*; adjectives of character",
          steps: [
            "**Easier:** How did you meet your best friend? What makes a good friend? How often do you see your friends?",
            "**Harder:** Is it possible to be real friends with someone you have never met in person? Do friendships change when people move away? Can a friend be too honest?",
            "Board four character adjectives before you start, and require one in every answer.",
            "Pairs choose four questions; partner asks one follow-up each time."
          ],
          variation: "Each learner describes a friend without naming them; the class guesses whether they are older or younger.",
          bigClass: "No change needed."
        },
        {
          name: "Travel and journeys",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "Present perfect for experience; past simple for detail",
          steps: [
            "**Easier:** Have you ever travelled by train? What is the longest journey you have made? Where would you like to go?",
            "**Harder:** Does travel really change people, or only the photographs they have? What is the difference between a traveller and a tourist? Should there be limits on flying?",
            "Point out the pattern: the present perfect asks, the past simple answers - *Have you ever been to ...? Yes, I went in 2019.*",
            "After four questions, change partners and retell one of your partner's answers."
          ],
          variation: "Plan a two-day trip for your partner based on what they said.",
          bigClass: "Pairs; hear two retellings."
        },
        {
          name: "Learning English",
          time: "20 minutes", grouping: "Pairs, then whole class", prep: "None",
          language: "*used to*; comparatives; *find it easy/hard to ...*",
          steps: [
            "**Easier:** How long have you studied English? What is easy for you? What is hard? Where do you use English outside class?",
            "**Harder:** What is the fastest way to improve speaking? Does your first language help or get in the way? Should everyone learn a second language at school?",
            "Collect the best advice on the board as a class list at the end - it becomes a poster for the room.",
            "This set is worth doing in the first week of a course and again in the last."
          ],
          variation: "Learners write one piece of advice for a learner one level below them.",
          bigClass: "The class list at the end is the whole-class stage; the talking stays in pairs."
        }
      ]
    },
    {
      key: "opinion",
      label: "Opinions and ideas (B1 to B2)",
      blurb: "For classes that can hold a position and give a reason. Safe subjects, real disagreement.",
      activities: [
        {
          name: "Technology and phones",
          time: "20 minutes", grouping: "Pairs, then fours", prep: "None",
          language: "*Should*; *would*; agreeing and disagreeing",
          steps: [
            "**Easier:** How long do you use your phone each day? What do you use it for most? Could you live without it for a week?",
            "**Harder:** Should phones be allowed in schools? Has technology made people better at communicating, or worse? What should children not be allowed to do online?",
            "Board three phrases for disagreeing politely: *I see your point, but ... That depends on ... I'm not so sure.*",
            "Pairs discuss, then fours try to agree one answer to the second harder question."
          ],
          variation: "Take a vote before and after the discussion, and see whether anyone changed their mind.",
          bigClass: "The fours stage needs no space and no presenting."
        },
        {
          name: "Work and jobs",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "Future forms; conditionals; job vocabulary",
          steps: [
            "**Easier:** What job would you like? What jobs are common in your area? What makes a job good?",
            "**Harder:** Is it better to have work you love or work that pays well? Will people still do the same jobs in twenty years? Should everybody retire at the same age?",
            "Avoid asking what learners' parents earn or do, which is not safe ground in every class.",
            "Pairs choose four questions and must reach a conclusion, not just exchange views."
          ],
          variation: "Each pair invents a job that will exist in 2050 and explains it.",
          bigClass: "No change needed."
        },
        {
          name: "School and learning",
          time: "20 minutes", grouping: "Groups of three", prep: "None",
          language: "*Should*; passive forms; giving examples",
          steps: [
            "**Easier:** What is your favourite subject and why? What time does your school day start? What would you change about it?",
            "**Harder:** Are exams a fair way to measure what someone knows? Should students choose all their own subjects? Is homework useful?",
            "Require one example from experience in each answer: *For example, last year we ...*",
            "Groups of three so that a quiet learner can enter the conversation more easily than in a four."
          ],
          variation: "Groups write one new school rule and argue for it.",
          bigClass: "Threes work at once; take three conclusions."
        }
      ]
    },
    {
      key: "imagination",
      label: "Imagination and hypotheticals (B1 to B2)",
      blurb: "Conditionals in real use, and the questions learners remember after the lesson.",
      activities: [
        {
          name: "If you could choose",
          time: "20 minutes", grouping: "Pairs", prep: "None",
          language: "Second conditional; *would*; reasons",
          steps: [
            "**Easier:** If you could visit any country, where would you go? If you had one free day, what would you do? If you could learn one new skill, what?",
            "**Harder:** If you could change one decision you have made, would you? If you had to live in another century, which would you choose? If you could know one thing about the future, would you want to?",
            "Drill the form once: *If + past, would + verb*. Beginners tend to answer with *will*.",
            "Partner must ask *why* after every answer - the reason is where the language is."
          ],
          variation: "Answer as somebody else - a grandparent, a famous person - and the partner guesses who.",
          bigClass: "No change needed."
        },
        {
          name: "Rules of a new country",
          time: "25 minutes", grouping: "Groups of four", prep: "None",
          language: "*Must / mustn't*; *should*; obligation and permission",
          steps: [
            "Each group invents a small country and agrees five rules everyone must follow.",
            "Two rules must be about school, and two about the environment.",
            "Groups swap rules with another group and ask three hard questions about them.",
            "Which country would the class prefer to live in?"
          ],
          variation: "Each group also invents one rule that would be unpopular but useful.",
          bigClass: "Swapping between neighbouring groups means nothing goes to the front."
        },
        {
          name: "Ten years from now",
          time: "20 minutes", grouping: "Pairs, then new pairs", prep: "None",
          language: "Future forms; *I hope to ...*; *I might ...*",
          steps: [
            "**Easier:** Where do you think you will live? What will you be doing? What will be the same?",
            "**Harder:** What will have changed in your town? Will people read fewer books? What is one thing you hope will not change?",
            "Teach the difference between *will* for prediction and *might* for possibility before they start.",
            "Change partners once and report your first partner's answer to the new one."
          ],
          variation: "Write a two-sentence message to yourself in ten years, and read it to a partner.",
          bigClass: "The change of partner works as \"turn and face the row behind you\"."
        }
      ]
    }
  ],

  faq: [
    ["Learners answer in one word and stop.", "Two causes: the question had a yes/no answer, or they had no thinking time. Use questions that begin with *what, why, how*, give thirty seconds of silence first, and make the follow-up question a rule rather than a hope."],
    ["Can I use these with a mixed-level class?", "That is why each set has easier and harder questions. Weaker pairs take the first group, stronger pairs the second, and the topic is the same across the room, so feedback at the end works for everybody."],
    ["Should I correct their English during a conversation?", "No. Note what you hear and put four sentences on the board at the end for the class to repair, unnamed. Correcting mid-conversation teaches learners that speaking is dangerous."],
    ["How do I stop the confident ones dominating?", "Give turns a shape: each learner answers one question fully before anyone answers a second; or in threes, one asks, one answers, one listens for the follow-up question and then swaps. Structure beats asking people to speak less."],
    ["How many questions should one lesson use?", "Four, well answered, with follow-ups and a change of partner, is a better twenty minutes than twelve questions rushed."]
  ]
};
