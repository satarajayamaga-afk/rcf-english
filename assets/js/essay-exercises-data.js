/* ==========================================================================
   RCF English - essay writing exercises: content

   Everything here is written by RCF English. The IELTS tasks are original
   questions in the style of IELTS Writing Task 2, not official material.
   Checks are written as data: each is a small rule the page can apply to a
   student's writing, with the message to show when it passes or fails.
   ========================================================================== */

export const LEVELS = ["O/L", "A/L General English", "IELTS"];

/* --------------------------------------------------------- essay builder */

export const BUILDER = [
  {
    id: "ol-phones", level: "O/L", words: [160, 200], kind: "opinion",
    prompt: "Mobile phones should not be allowed in schools. Do you agree? Write an essay of about 180 words.",
    keywords: ["phone", "mobile", "school", "student", "class"],
    understand: ["Give your own opinion (agree, disagree or partly agree) and support it with reasons", "Describe the different ways students use their mobile phones", "Tell a story about something that happened with a phone at school"],
    why: "The words *Do you agree?* ask for your opinion. Describing or telling a story does not answer the question.",
    bodies: [["First reason", "Your strongest reason for your opinion."], ["Second reason, or the other side", "A second reason, or the opposing view and why you still hold your opinion."]]
  },
  {
    id: "ol-city", level: "O/L", words: [160, 200], kind: "advantages",
    prompt: "The advantages and disadvantages of living in a city. Write an essay of about 180 words.",
    keywords: ["city", "cities", "urban", "town", "live", "living"],
    understand: ["Explain both the good and the bad sides of living in a city", "Argue that cities are better places to live than villages", "Describe the city you know best"],
    why: "The title names *advantages and disadvantages*, so both must be covered. A description or a one-sided argument misses half the task.",
    bodies: [["Advantages", "The main benefits of city life."], ["Disadvantages", "The main problems of city life."]]
  },
  {
    id: "al-social", level: "A/L General English", words: [230, 270], kind: "opinion",
    prompt: "\"Social media has done more harm than good to young people.\" Discuss. (about 250 words)",
    keywords: ["social media", "online", "young", "teenager", "internet"],
    understand: ["Weigh the harm against the good and reach a clear judgement", "List the social media apps that young people use most", "Explain how young people can stay safe online"],
    why: "*Discuss* with a statement means examining whether the statement is true: weigh both sides, then judge. A list or a set of safety tips does not do that.",
    bodies: [["The harm", "The strongest evidence that social media harms young people."], ["The good, and your judgement", "The benefits, and why they do or do not outweigh the harm."]]
  },
  {
    id: "al-transport", level: "A/L General English", words: [230, 270], kind: "opinion",
    prompt: "Should the government spend more money on public transport than on building new roads? (about 250 words)",
    keywords: ["transport", "road", "bus", "train", "government", "traffic"],
    understand: ["Compare the two ways of spending money and argue which should come first", "Describe the traffic problems in a city you know", "Explain how the bus and train systems work"],
    why: "*Should... more... than...* asks you to compare two options and decide. Description alone is not an argument.",
    bodies: [["First reason for your choice", "Why your preferred option is the better use of money."], ["Second reason, or the other side", "Another reason, or the case for the other option and why it is weaker."]]
  },
  {
    id: "ielts-university", level: "IELTS", words: [260, 300], kind: "discuss",
    prompt: "Some people believe that university education should be free for everyone. Others think that students should pay for it. Discuss both views and give your own opinion. (at least 250 words)",
    keywords: ["university", "free", "pay", "fee", "education", "tuition", "student"],
    understand: ["Explain both views, then state and support your own opinion", "Give only your own opinion, with reasons", "Describe the universities in your country"],
    why: "The task has three parts: view one, view two, and your opinion. Leaving out any of them lowers your Task Response score.",
    bodies: [["View one: education should be free", "Why some people believe it should be free."], ["View two: students should pay", "Why others believe students should pay. Say which view you share in your introduction and conclusion."]]
  },
  {
    id: "ielts-ageing", level: "IELTS", words: [260, 300], kind: "problem",
    prompt: "In many countries, people are living longer than ever before. What problems does this cause, and what solutions can you suggest? (at least 250 words)",
    keywords: ["old", "older", "elderly", "age", "ageing", "aging", "longer", "retire", "pension"],
    understand: ["Explain the problems and suggest solutions to them", "Discuss whether living longer is a good or a bad thing", "Describe the older people in your family"],
    why: "The question asks two direct questions: *what problems* and *what solutions*. An opinion on whether it is good or bad answers a different question.",
    bodies: [["Problems", "The main problems caused by people living longer."], ["Solutions", "Practical solutions to the problems in your first paragraph."]]
  }
];

/* -------------------------------------------------- improve a paragraph */

export const IMPROVE = [
  {
    id: "imp-phones", level: "O/L", title: "Vague and repetitive",
    context: "From an essay: *Mobile phones should not be allowed in schools. Do you agree?* The writer disagrees.",
    weak: "Phones are good. Students can use phones. Phones are very good for students because students can use them for many things and phones are useful. So phones are good.",
    hints: ["The topic sentence says almost nothing: good in what way?", "The same words (phones, good, students) are repeated again and again.", "There is no real example. *Many things* is not an example."],
    checks: [
      { minWords: 45, ok: "Your paragraph is developed enough.", fix: "Develop the paragraph further: at least 45 words." },
      { maxCount: ["good", 1], ok: "You have avoided repeating *good*.", fix: "*Good* still appears more than once. Say exactly how phones help." },
      { has: ["for example", "for instance", "such as"], ok: "You signal an example.", fix: "Add an example with *for example* or *for instance*." },
      { has: ["dictionar", "calculat", "research", "search", "information", "emergenc", "parent", "project", "notes", "timetable"], ok: "Your example is specific.", fix: "Make the example specific: what exactly can a student use a phone for?" }
    ],
    model: "Mobile phones can help students learn when they are used in the right way. For example, a student who does not understand a word in an English lesson can check it in a dictionary app in seconds, and a class can find information for a project without waiting for the library. In an emergency, a phone also allows a student to contact their parents at once. So, banning phones would take away something useful instead of solving a problem.",
    notes: ["The topic sentence makes one clear point: phones *help students learn*.", "Two concrete examples show exactly how.", "Repetition is avoided with words such as *a phone*, *it* and *something useful*.", "The last sentence links the point back to the question about a ban."]
  },
  {
    id: "imp-city", level: "O/L", title: "A story instead of a point",
    context: "From an essay on *the advantages and disadvantages of living in a city*. This should be the disadvantages paragraph.",
    weak: "My uncle lives in Colombo. He goes to work by bus and it takes two hours. There is a lot of smoke. Sometimes he cannot sleep because of the noise.",
    hints: ["The paragraph starts with a story, so the reader does not know what the point is.", "It never says that these are disadvantages of city life.", "The details are there, but they are not explained or linked."],
    checks: [
      { firstHas: ["disadvantage", "problem", "drawback", "downside", "difficult"], ok: "Your first sentence states the point of the paragraph.", fix: "Begin with a topic sentence that says this paragraph is about the disadvantages of city life." },
      { has: ["for example", "for instance", "such as"], ok: "The personal detail now works as an example.", fix: "Introduce the uncle's experience as an example with *for example*." },
      { has: ["traffic", "pollution", "polluted", "noise", "noisy", "crowd"], ok: "You name the actual problems.", fix: "Name the problems directly: traffic, pollution, noise." },
      { minWords: 45, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 45 words." }
    ],
    model: "However, living in a city also has serious disadvantages. The most obvious is traffic, which makes short journeys long and tiring. For example, my uncle, who works in Colombo, spends two hours travelling to his office by bus every morning. Cities are also dirty and noisy, and this is bad for people's health and sleep. As a result, many city workers feel very tired even before they start work.",
    notes: ["A topic sentence with *However* signals the change from advantages to disadvantages.", "The general problem comes first; the uncle is used as supporting evidence.", "*As a result* explains why the problems matter."]
  },
  {
    id: "imp-social", level: "A/L General English", title: "Overgeneralisation",
    context: "From an essay: *Social media has done more harm than good to young people. Discuss.*",
    weak: "Everyone on social media is addicted. Social media always destroys young people's lives. All teenagers waste all their time online and never study.",
    hints: ["*Everyone*, *always*, *all* and *never* make claims that are obviously untrue, so the reader stops trusting the writer.", "There is no evidence or example.", "There is no explanation of *how* the harm happens."],
    checks: [
      { not: ["everyone", "always", "all teenagers", "all their", "never"], ok: "You have avoided sweeping words such as *everyone* and *always*.", fix: "Remove absolute words (*everyone*, *always*, *all*, *never*). They make the claim easy to disprove." },
      { has: ["many", "some", "often", "can ", "may ", "tend to", "a large number", "a number of", "frequently"], ok: "You use careful, hedged language.", fix: "Use careful language: *many*, *some*, *often*, *can*, *tend to*." },
      { has: ["for example", "for instance", "such as", "because", "this means", "as a result"], ok: "You explain or support the claim.", fix: "Explain how the harm happens, or give an example." },
      { minWords: 50, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 50 words." }
    ],
    model: "There is little doubt that social media can harm young people. Many teenagers spend several hours a day scrolling through posts, and this time is often taken from sleep or study. In addition, platforms that show carefully edited photographs can make young people feel that their own lives and appearance are not good enough. For example, a teenager who constantly compares herself with influencers may lose confidence. These effects are real, although they do not affect every user equally.",
    notes: ["*Can*, *many*, *often* and *may* make claims that are defensible.", "Each harm is explained, not just announced.", "The final sentence shows balance, which prepares for the other side of the argument."]
  },
  {
    id: "imp-transport", level: "A/L General English", title: "Too informal",
    context: "From an essay: *Should the government spend more money on public transport than on building new roads?*",
    weak: "Honestly, roads in our country are super bad and the govt should totally fix buses first coz they're like really crowded and stuff.",
    hints: ["*Super*, *totally*, *coz*, *like* and *stuff* belong in a text message, not an essay.", "*Govt* and *they're* are an abbreviation and a contraction.", "It is one long sentence with no clear point, reason and example."],
    checks: [
      { not: ["honestly", "super ", "totally", "coz", "cuz", "govt", "like really", "and stuff", "gonna", "wanna", "kinda"], ok: "You have removed the informal words.", fix: "Remove informal words such as *super*, *totally*, *coz*, *govt* and *stuff*." },
      { notRegex: "\\b(they're|don't|can't|won't|isn't|aren't|it's|that's|doesn't|wouldn't|shouldn't)\\b", ok: "You avoid contractions.", fix: "Write contractions in full: *they are*, *do not*, *cannot*." },
      { minSentences: [3, 6], ok: "The idea is developed over several sentences.", fix: "Use at least three full sentences: a point, a reason and an example." },
      { minWords: 45, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 45 words." }
    ],
    model: "The government should make improving public transport its first priority. At present, many buses are so overcrowded during rush hour that passengers cannot board them. If more buses were added to busy routes and trains ran more frequently, far more people could travel in comfort. This would benefit workers and students who cannot afford a private vehicle, and it would also encourage some car owners to leave their cars at home.",
    notes: ["Formal vocabulary: *priority*, *overcrowded*, *frequently*, *private vehicle*.", "No contractions or abbreviations.", "Point, explanation and consequence in separate, clear sentences."]
  },
  {
    id: "imp-university", level: "IELTS", title: "Off the point",
    context: "From an IELTS essay: *Some people believe university education should be free. Others think students should pay. Discuss both views and give your opinion.* This should be the paragraph for view one.",
    weak: "Education is very important. My cousin studied at a university in Kandy and she enjoyed the campus very much. The buildings are beautiful and there are many trees. She made many friends there.",
    hints: ["The paragraph never mentions whether education should be free, which is the whole question.", "The cousin's story is about enjoying university, not about paying for it.", "An examiner would mark this down for Task Response."],
    checks: [
      { has: ["free", "fee", "pay", "cost", "afford", "tuition", "money"], ok: "Your paragraph is about paying for university.", fix: "Make the paragraph answer the question: should university be free, and why?" },
      { has: ["because", "therefore", "this means", "as a result", "so that", "which means"], ok: "You explain the reasoning.", fix: "Explain the reason with *because*, *this means* or *as a result*." },
      { not: ["buildings are beautiful", "many trees"], ok: "Irrelevant details have been removed.", fix: "Remove details that do not answer the question, such as the buildings and trees." },
      { minWords: 50, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 50 words." }
    ],
    model: "Those who believe university education should be free argue that it gives everyone an equal chance. When there are no fees, talented students from poor families do not have to give up their studies because they cannot afford them. My cousin, for instance, was able to study engineering only because her course was free, and she now designs water systems for rural villages. In this view, free education is an investment that benefits the whole of society.",
    notes: ["The topic sentence states view one clearly.", "The cousin now supports the argument about cost.", "The final sentence links back to the question."]
  },
  {
    id: "imp-ageing", level: "IELTS", title: "Notes, not a paragraph",
    context: "From an IELTS essay: *People are living longer. What problems does this cause, and what solutions can you suggest?*",
    weak: "One problem is healthcare. Hospitals. For example, Japan.",
    hints: ["*Hospitals.* and *For example, Japan.* are not sentences.", "The problem is named but not explained: what exactly happens to healthcare?", "The example is a single word, so it proves nothing."],
    checks: [
      { minSentences: [3, 6], ok: "Every idea is a full sentence.", fix: "Write at least three full sentences of six words or more. Notes score very low." },
      { has: ["because", "this means", "as a result", "which", "so ", "since", "therefore"], ok: "You explain the problem.", fix: "Explain how the problem happens, with *because*, *this means* or *as a result*." },
      { has: ["for example", "for instance", "such as"], ok: "You give an example.", fix: "Give a developed example with *for example*." },
      { minWords: 50, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 50 words." }
    ],
    model: "The most serious problem is the pressure on healthcare systems. Older people are more likely to suffer from long-term illnesses, which means they need more visits to doctors, more medicines and more time in hospital. As a result, waiting lists grow longer and the cost of healthcare rises. For example, in countries with a large elderly population, hospitals often report a shortage of beds during the busiest months of the year.",
    notes: ["Every idea is a complete sentence.", "*Which means* and *as a result* explain the chain of cause and effect.", "The example is general and accurate rather than an invented statistic."]
  },
  {
    id: "imp-reading", level: "O/L", title: "A list with no linking",
    context: "From an essay on *the value of reading*.",
    weak: "Reading is important. Reading gives knowledge. Reading improves vocabulary. Reading is also relaxing. Reading is good for everyone.",
    hints: ["Every sentence begins with *Reading*.", "The sentences are a list: nothing connects one idea to the next.", "No idea is explained or supported."],
    checks: [
      { maxStarts: ["reading", 2], ok: "Your sentences begin in different ways.", fix: "Too many sentences begin with *Reading*. Vary them: *It*, *For example*, *As a result*, *This*..." },
      { minLinks: 2, ok: "You use linking words to connect ideas.", fix: "Connect the ideas with at least two linking words: *because*, *for example*, *as a result*, *in addition*." },
      { minWords: 45, ok: "The paragraph is developed.", fix: "Develop the paragraph: at least 45 words." }
    ],
    model: "Reading regularly brings benefits that go far beyond the classroom. It builds vocabulary, because readers meet new words again and again in context. In addition, following a long story improves concentration. A student who reads for twenty minutes every evening, for example, often finds it easier to focus in lessons. As a result, the habit of reading can make every other subject a little easier.",
    notes: ["Only the first sentence begins with *Reading*.", "*Because*, *in addition*, *for example* and *as a result* join the ideas.", "The ideas build towards a conclusion instead of sitting side by side."]
  },
  {
    id: "imp-conclusion", level: "IELTS", title: "A conclusion that starts a new argument",
    context: "The conclusion of an IELTS essay: *Some people believe university education should be free. Others think students should pay. Discuss both views and give your opinion.*",
    weak: "In conclusion, free university education has benefits and problems. Another important point is that online courses are becoming cheaper, and many companies now train their own staff.",
    hints: ["A conclusion should never introduce a new idea; online courses and company training were not discussed.", "The writer never gives the opinion the question asks for.", "It sums up in the vaguest possible way: *benefits and problems*."],
    checks: [
      { has: ["in conclusion", "to conclude", "overall", "to sum up", "on balance"], ok: "You signal the conclusion.", fix: "Signal the conclusion with *In conclusion* or *On balance*." },
      { has: ["i believe", "in my view", "in my opinion", "i think", "should", "i would argue"], ok: "You give a clear opinion.", fix: "State your opinion clearly: the question asks for it." },
      { not: ["another", "online courses", "companies"], ok: "You do not introduce new ideas.", fix: "Remove the new ideas. A conclusion only sums up what the essay has already argued." },
      { maxWords: 80, ok: "The conclusion is concise.", fix: "Keep the conclusion short: two or three sentences." }
    ],
    model: "In conclusion, free university education would give more young people the chance to study, but it would place a heavy burden on taxpayers. On balance, I believe the fairest approach is for students to pay reasonable fees through loans, while grants cover the costs of those from low-income families.",
    notes: ["It sums up both views in one sentence.", "It gives a clear, specific opinion.", "It adds nothing that the essay has not already discussed."]
  }
];

/* ------------------------------------------ choose the best sentence */

export const CHOOSE = [
  { level: "IELTS", question: "Essay: *Some people believe university education should be free. Others think students should pay. Discuss both views and give your opinion.* Which is the best thesis statement?",
    options: [
      ["University education is a very interesting topic.", false, "Too vague: it takes no position and answers nothing."],
      ["Although free tuition would widen access, I believe students should contribute part of the cost, with grants for those who cannot afford it.", true, "It gives a clear, specific opinion and shows awareness of the other view."],
      ["In this essay I will talk about universities.", false, "It announces a topic instead of answering the question."],
      ["Some people think it should be free and some people think students should pay.", false, "It repeats the question and gives no opinion."]
    ] },
  { level: "O/L", question: "Essay: *Mobile phones should not be allowed in schools. Do you agree?* Which is the best topic sentence for a paragraph about safety?",
    options: [
      ["Another reason is that phones help parents make sure their children are safe.", true, "It states one clear point, and *Another reason* links it to the essay."],
      ["My friend has a new phone with a very good camera.", false, "A personal detail, not a point, and nothing to do with safety."],
      ["There are many things to say about phones.", false, "Too vague to tell the reader what the paragraph is about."],
      ["Phones cost a lot of money and some of them are expensive.", false, "Not about safety, and it says the same thing twice."]
    ] },
  { level: "A/L General English", question: "Essay: *Social media has done more harm than good to young people. Discuss.* Which is the best thesis statement?",
    options: [
      ["Social media is bad.", false, "Too simple: no reason and no sense of the other side."],
      ["Social media can harm young people, but its overall effect depends on how it is used, so teaching sensible use matters more than banning it.", true, "A clear, arguable judgement that points to what the essay will show."],
      ["Many social media platforms were started in the early 2000s.", false, "A fact, not an argument."],
      ["Do young people really benefit from social media?", false, "A question is not a thesis: the essay must answer it."]
    ] },
  { level: "IELTS", question: "Essay: *People are living longer. What problems does this cause, and what solutions can you suggest?* Which is the best topic sentence for the solutions paragraph?",
    options: [
      ["There are several practical measures that governments can take to ease these pressures.", true, "It clearly introduces the solutions and links back to the problems."],
      ["Old people are very nice.", false, "An opinion unrelated to solutions, and too informal."],
      ["In Japan there are many old people.", false, "This could be an example, but it is not a topic sentence."],
      ["Finally, in conclusion, old age.", false, "Not a sentence, and it confuses a body paragraph with a conclusion."]
    ] },
  { level: "O/L", question: "Essay: *The advantages and disadvantages of living in a city.* Which is the best opening sentence?",
    options: [
      ["Cities are places.", false, "True, but it says nothing worth reading."],
      ["Every year, thousands of young people leave their villages for cities, hoping for better jobs and schools, but city life brings problems as well as opportunities.", true, "It gives background and leads naturally to both advantages and disadvantages."],
      ["I am going to write about cities now.", false, "It announces the topic instead of beginning the essay."],
      ["Hello reader, do you like cities?", false, "Too informal for an essay."]
    ] },
  { level: "A/L General English", question: "Which example best supports this point: *Public transport reduces pollution.*",
    options: [
      ["Buses are big.", false, "True, but it does not show why pollution is reduced."],
      ["A single full bus can replace dozens of private cars, so fewer engines are running on the same road.", true, "It shows exactly how the point is true."],
      ["Pollution is a very bad thing for everyone.", false, "It repeats a general idea instead of supporting the point."],
      ["My father drives to work every day.", false, "A personal detail that does not support the point."]
    ] },
  { level: "IELTS", question: "Essay: *Some people believe university education should be free. Others think students should pay. Discuss both views and give your opinion.* Which is the best conclusion?",
    options: [
      ["In conclusion, while free tuition would help many students, I believe a fair system of shared costs, supported by grants, is the most sustainable approach.", true, "It sums up and gives a clear final opinion without adding anything new."],
      ["In conclusion, there are many other issues in education, such as teachers' salaries.", false, "It introduces a new topic."],
      ["That is all I want to say about this topic.", false, "It ends without summing up or giving an opinion."],
      ["In conclusion, universities.", false, "Not a complete sentence."]
    ] },
  { level: "IELTS", question: "The question says: *In many countries, people are living longer.* Which is the best paraphrase for your introduction?",
    options: [
      ["In many countries, people are living longer.", false, "Copied from the question. Copied words are not credited."],
      ["Life expectancy is rising in many parts of the world.", true, "The same meaning in different words."],
      ["People in many countries are very old.", false, "It changes the meaning: living longer is not the same as being very old."],
      ["Old people are living in many countries.", false, "It changes the meaning completely."]
    ] },
  { level: "O/L", question: "Which topic sentence fits this paragraph? *...For example, a child who reads every evening meets hundreds of new words in a year. Many of these words then appear in his own writing.*",
    options: [
      ["Reading regularly builds a much wider vocabulary.", true, "The example is about new words, so the topic sentence must be about vocabulary."],
      ["Libraries are open on Saturdays.", false, "Nothing in the paragraph is about libraries."],
      ["Reading is boring for some children.", false, "The paragraph argues the opposite."],
      ["Children enjoy watching television.", false, "Unrelated to the paragraph."]
    ] },
  { level: "A/L General English", question: "Which sentence is written in the right register for a formal essay?",
    options: [
      ["The government should invest more in railways, as they carry large numbers of passengers efficiently.", true, "Formal vocabulary, a full reason, and no contractions or slang."],
      ["The govt should put loads of money into trains.", false, "*Govt* and *loads of* are informal."],
      ["Trains are awesome and everyone loves them!", false, "Informal, exaggerated, and ends with an exclamation mark."],
      ["I reckon trains are kinda better.", false, "*Reckon* and *kinda* are conversational."]
    ] }
];

/* ------------------------------------------------ linking and order */

export const ORDER = [
  { level: "O/L", title: "The value of reading",
    sentences: ["Reading for pleasure brings benefits that go far beyond the classroom.", "For one thing, it builds vocabulary, because readers meet words in context again and again.", "It also improves concentration, since following a story requires attention over a long period.", "As a result, students who read regularly often find other subjects easier.", "For these reasons, reading deserves a place in every young person's day."],
    clue: "The general topic sentence comes first. *For one thing* introduces the first point and *also* adds a second. *As a result* needs something before it to be the cause, and *For these reasons* sums everything up." },
  { level: "O/L", title: "The disadvantages of city life",
    sentences: ["Living in a city also has serious disadvantages.", "The most obvious is traffic, which can turn a short journey into an hour-long wait.", "Traffic also causes air pollution, which is harmful to health.", "Moreover, housing in cities is usually far more expensive than in villages.", "Therefore, city life is not always as attractive as it first appears."],
    clue: "*The most obvious* follows the sentence that introduces disadvantages. *Traffic also* needs traffic to have been mentioned. *Moreover* adds a new disadvantage, and *Therefore* concludes." },
  { level: "A/L General English", title: "Social media: a balanced view",
    sentences: ["Social media is not entirely harmful to young people.", "On the one hand, it can expose them to bullying and unrealistic images.", "On the other hand, it helps them keep in touch with friends and find information quickly.", "However, the benefits depend largely on how carefully it is used.", "This suggests that education, rather than a ban, is the best response."],
    clue: "*On the one hand* must come before *On the other hand*. *However* qualifies the benefits just mentioned, and *This suggests* draws the conclusion from everything before it." },
  { level: "A/L General English", title: "Public transport before roads",
    sentences: ["Investing in public transport would benefit far more people than building new roads.", "New roads tend to fill with extra cars within a few years.", "Buses and trains, by contrast, can move large numbers of people in the same space.", "They are also cheaper to use, which matters to people on low incomes.", "Consequently, public transport should be the government's first priority."],
    clue: "The claim comes first. *By contrast* compares buses and trains with the roads just mentioned. *They are also* refers back to buses and trains, and *Consequently* concludes." },
  { level: "IELTS", title: "Solutions to an ageing population",
    sentences: ["Governments can take several steps to deal with an ageing population.", "The most effective is probably to raise the retirement age gradually.", "This would allow people who are healthy and willing to keep working to contribute for longer.", "In addition, investment in community care would let older people stay in their own homes.", "Such measures would reduce pressure on both pensions and hospitals."],
    clue: "*The most effective* refers back to *several steps*. *This would* explains the step just named. *In addition* adds a second step, and *Such measures* refers to both." }
];

export const GAPS = [
  { level: "O/L", title: "Phones in schools",
    text: "Many students use their phones to study. [[For example|However|Therefore]], they look up words in online dictionaries. [[However|For example|Because]], phones can also be a distraction, [[because|although|so]] messages arrive during lessons. [[Therefore|For instance|Although]], schools need clear rules rather than a complete ban.",
    explain: ["*For example* introduces an example of studying.", "*However* introduces the opposite side.", "*Because* gives the reason phones distract.", "*Therefore* introduces the conclusion drawn from both sides."] },
  { level: "O/L", title: "Cities and villages",
    text: "Cities offer better job opportunities [[than|then|that]] villages. [[What is more|Although|Instead]], they usually have better hospitals and schools. [[Nevertheless|Furthermore|Similarly]], life in a city can be stressful [[because of|because|despite]] the noise and the crowds.",
    explain: ["*Than* is used for comparisons; *then* is about time.", "*What is more* adds another advantage.", "*Nevertheless* introduces a contrast with the advantages.", "*Because of* is followed by a noun (*the noise*); *because* needs a clause (*because it is noisy*)."] },
  { level: "A/L General English", title: "Checking what you read online",
    text: "Social media allows young people to share ideas [[and|but|so]] build communities. [[However|Moreover|For example]], it can also spread false information quickly. [[This means that|In contrast|Although]] users need to check sources carefully. [[For instance|Therefore|Whereas]], a student who reads a surprising claim should look for it on a reliable news website first.",
    explain: ["*And* joins two similar benefits.", "*However* turns to a problem.", "*This means that* shows the consequence.", "*For instance* introduces an example of checking a source."] },
  { level: "IELTS", title: "Paying for university",
    text: "Free university education would allow talented students from poor families to study. [[In addition|On the other hand|As a result]], it would produce more skilled workers for the economy. [[On the other hand|In addition|For instance]], it would be extremely expensive for governments. [[As a result|Although|For example]], taxes might have to rise. [[Although|Because|Therefore]] free education is attractive, a shared system may be more realistic.",
    explain: ["*In addition* adds a second benefit.", "*On the other hand* introduces the opposing view.", "*As a result* shows the consequence of the cost.", "*Although* sets the attraction against the conclusion in one sentence."] },
  { level: "IELTS", title: "Living longer",
    text: "People are living longer [[due to|because|so]] better healthcare. [[While|Consequently|For instance]] this is good news, it puts pressure on pension systems. [[Consequently|While|Despite]], many countries are raising the retirement age. [[Despite|Although|Even]] this, some people will still need support from the state.",
    explain: ["*Due to* is followed by a noun phrase (*better healthcare*).", "*While* sets two ideas against each other in one sentence.", "*Consequently* introduces a result.", "*Despite* is followed by a noun or pronoun (*this*); *although* needs a clause."] }
];

/* ------------------------------------------- how a model essay works */

export const ROLES = {
  background: ["Background", "Introduces the topic and why it matters, so the reader is ready for the question."],
  paraphrase: ["Question in new words", "Restates the question in the writer's own words, which shows understanding."],
  thesis: ["Thesis", "The writer's answer to the question, in one sentence. Everything in the essay supports it."],
  topic: ["Topic sentence", "The main point of the paragraph, stated first so the reader knows what is coming."],
  explain: ["Explanation", "Explains why or how the point is true."],
  example: ["Example", "Specific evidence that makes the point convincing."],
  link: ["Link back", "Connects the paragraph back to the question or the thesis."],
  counter: ["The other side", "Fairly states the view the writer disagrees with, which makes the argument stronger."],
  rebuttal: ["Reply to the other side", "Shows why the opposing view does not change the writer's opinion."],
  summary: ["Summary", "Sums up the main points without adding new ones."],
  final: ["Final opinion", "Ends with a clear final judgement that answers the question."]
};

export const MODELS = [
  { level: "O/L", title: "Mobile phones in schools", prompt: "Mobile phones should not be allowed in schools. Do you agree?",
    paragraphs: [
      [["background", "Today almost every teenager has a mobile phone, and many schools are deciding whether to allow them."], ["thesis", "In my opinion, phones should be allowed in schools, but only under clear rules."]],
      [["topic", "The main reason is that phones can be useful learning tools."], ["explain", "Students can use them to find the meaning of words, do calculations and look for information for projects."], ["example", "For example, in an English lesson a student can check the meaning of a new word in a few seconds."], ["link", "If phones are banned, students lose this useful help."]],
      [["counter", "It is true that phones can stop students from paying attention, because of messages and games."], ["rebuttal", "However, this problem can be solved with rules rather than a ban."], ["example", "For instance, a school could ask students to keep their phones switched off in their bags unless a teacher asks them to use them."], ["explain", "In this way, students also learn to use technology carefully, which will help them when they are adults."]],
      [["summary", "In conclusion, mobile phones bring both benefits and risks to the classroom."], ["final", "With good rules, schools can have the benefits of phones without the problems."]]
    ] },
  { level: "A/L General English", title: "Public transport or new roads?", prompt: "Should the government spend more money on public transport than on building new roads?",
    paragraphs: [
      [["background", "Traffic jams have become a daily frustration in most of our towns, and the government must decide how best to spend limited money on transport."], ["thesis", "I believe that improving public transport should take priority over building new roads."]],
      [["topic", "Firstly, public transport can move far more people using the same amount of space."], ["explain", "A single full bus carries as many passengers as dozens of cars, so it makes much better use of existing roads."], ["link", "New roads, in contrast, tend to attract more private vehicles and are soon as crowded as the old ones."]],
      [["topic", "Secondly, better buses and trains would benefit the people who need help most."], ["explain", "Many workers and students cannot afford a car or a motorcycle and depend entirely on public transport."], ["example", "If trains ran more frequently and buses were less crowded, a worker travelling from a suburb to the city could save time and money every day."]],
      [["counter", "Admittedly, some rural areas still lack good roads, and these are essential for moving goods and reaching hospitals."], ["example", "Farmers in remote villages, for example, need a usable road to take their harvest to market before it spoils."], ["rebuttal", "However, this is an argument for repairing and maintaining roads where they are needed, not for building large new highways."], ["link", "Repairing existing roads also costs far less than building new ones, which leaves more money for buses and trains."]],
      [["summary", "In conclusion, public transport offers a more efficient and fairer use of public money than new roads."], ["final", "The government should therefore make it the first priority, while keeping essential rural roads in good condition."]]
    ] },
  { level: "IELTS", title: "Should university be free?", prompt: "Some people believe that university education should be free for everyone. Others think that students should pay for it. Discuss both views and give your own opinion.",
    paragraphs: [
      [["paraphrase", "Whether university students should pay for their education or receive it free of charge is a question that divides opinion in many countries."], ["thesis", "This essay will examine both positions before explaining why I favour a system in which the costs are shared."]],
      [["topic", "Those who support free university education argue that it gives everyone an equal chance to succeed."], ["explain", "When tuition costs nothing, talented students from poor families are not forced to give up their studies for financial reasons."], ["example", "A bright student whose parents are farmers, for instance, could train as a doctor and later contribute far more to society than the cost of her degree."], ["link", "In this view, free education is an investment rather than an expense."]],
      [["topic", "On the other hand, others believe that students should pay at least part of the cost."], ["explain", "Universities are expensive to run, and if the state pays for everything, the money must come from taxpayers who may never attend university themselves."], ["example", "Moreover, a student who has taken a loan is likely to think carefully before changing course or leaving early."]],
      [["thesis", "In my view, the fairest solution lies between these two positions."], ["explain", "Students could pay reasonable fees through loans that are repaid only once they earn a good salary, while grants would cover the costs of those from low-income families."], ["link", "This would protect access to education without placing the whole burden on taxpayers."]],
      [["summary", "In conclusion, free university education promotes equality, but charging fees spreads the cost more fairly."], ["final", "On balance, I believe a shared system, supported by grants for those in need, offers the best of both approaches."]]
    ] }
];
