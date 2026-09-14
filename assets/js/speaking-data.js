/* ==========================================================================
   RCF English - speaking question bank

   Original questions written by RCF English in the style of the IELTS
   Speaking test, read-aloud sentences and everyday situations. Shared by
   Speaking Practice, the mock speaking test and the conversation partner.
   Not official IELTS material.
   ========================================================================== */

/* ------------------------------------------------------------------ tasks */

export const PART1 = [
  ["Hometown", ["Where is your hometown?", "What do you like most about your hometown?", "Has your hometown changed much since you were a child?", "Would you like to live there in the future? Why or why not?"]],
  ["Work or studies", ["Do you work, or are you a student?", "Why did you choose that subject or that job?", "What is the most difficult part of your studies or your work?", "What would you like to do in the future?"]],
  ["Free time", ["What do you usually do in your free time?", "Do you prefer spending your free time alone or with other people?", "Is there a hobby you would like to try?", "How has the way you spend your free time changed over the years?"]],
  ["Food", ["What kind of food do you enjoy eating?", "Do you often cook at home?", "Is there any food you disliked as a child but enjoy now?", "Do people in your country eat out more often than they used to?"]],
  ["Weather", ["What is the weather usually like where you live?", "What kind of weather do you like best?", "Does the weather affect your mood?", "Do you prefer the rainy season or the dry season?"]],
  ["Technology", ["How often do you use your mobile phone?", "What do you mainly use the internet for?", "Is there any piece of technology you could not live without?", "Do you think people spend too much time on their phones?"]],
  ["Transport", ["How do you usually travel to school or work?", "What is public transport like in your area?", "Do you prefer travelling by bus or by train?", "How could transport in your town be improved?"]],
  ["Reading", ["Do you enjoy reading?", "What kind of books did you read as a child?", "Do you prefer printed books or reading on a screen?", "Is reading popular among young people where you live?"]]
];

export const PART2 = [
  { title: "A teacher who influenced you", prompt: "Describe a teacher who has influenced you.",
    points: [["who this teacher was", ["teacher", "sir", "madam", "miss", "mr", "mrs", "name"]], ["what subject they taught", ["subject", "taught", "teach", "lesson", "class"]], ["what was special about them", ["special", "different", "always", "never", "kind", "strict", "patient"]], ["how they influenced you", ["influence", "changed", "helped", "because of", "now i", "taught me", "learned", "learnt"]]] },
  { title: "A place you would recommend to visitors", prompt: "Describe a place in your country that you would recommend to visitors.",
    points: [["where it is", ["located", "near", "in the", "province", "district", "south", "north", "east", "west", "coast", "hill"]], ["how to get there", ["bus", "train", "car", "drive", "hours", "road", "get there", "travel"]], ["what visitors can do there", ["can", "visit", "see", "walk", "swim", "climb", "enjoy", "try"]], ["why you would recommend it", ["recommend", "because", "worth", "reason", "best"]]] },
  { title: "A useful skill you learned", prompt: "Describe a skill you learned that has been useful to you.",
    points: [["what the skill is", ["skill", "learn", "learned", "learnt", "how to"]], ["when and how you learned it", ["when i was", "years ago", "taught", "course", "class", "practised", "practiced", "myself", "youtube"]], ["how difficult it was", ["difficult", "hard", "easy", "challenge", "struggled", "mistakes"]], ["why it has been useful", ["useful", "helps", "helped", "because", "save", "now i can"]]] },
  { title: "A memorable celebration", prompt: "Describe a memorable celebration you attended.",
    points: [["what was celebrated", ["wedding", "birthday", "festival", "new year", "avurudu", "vesak", "christmas", "deepavali", "ramadan", "eid", "anniversary", "celebrat"]], ["where and when it was", ["last year", "ago", "held", "at the", "in the", "when"]], ["who was there", ["family", "friends", "relatives", "people", "guests", "everyone"]], ["why it was memorable", ["memorable", "remember", "never forget", "because", "special"]]] },
  { title: "A useful piece of technology", prompt: "Describe a piece of technology you find useful.",
    points: [["what it is", ["phone", "laptop", "computer", "app", "device", "machine", "tablet", "internet"]], ["how often you use it", ["every day", "daily", "often", "always", "hours", "times a"]], ["what you use it for", ["use it", "for", "to"]], ["why it is useful to you", ["useful", "because", "helps", "without it", "save"]]] },
  { title: "A time you helped someone", prompt: "Describe a time when you helped someone.",
    points: [["who you helped", ["friend", "neighbour", "neighbor", "stranger", "classmate", "old", "brother", "sister", "mother", "father"]], ["what their problem was", ["problem", "needed", "lost", "couldn't", "could not", "trouble", "difficult"]], ["how you helped", ["helped", "i gave", "i took", "i showed", "i called", "i explained"]], ["how you felt about it", ["felt", "happy", "proud", "glad", "good", "satisfied"]]] }
].map((t) => ({ ...t, notes: "You will have one minute to prepare. You can make notes. Then speak for one to two minutes." }));

export const PART3 = [
  ["Education and teachers", ["What makes a good teacher?", "Should students be allowed to choose what they study at school?", "How has technology changed the way students learn?", "Do you think computers will replace teachers in the future?"]],
  ["Tourism", ["Why do people like travelling to other countries?", "What are the advantages and disadvantages of tourism for a local community?", "How can tourists be encouraged to respect local culture?", "Will people travel more or less in the future?"]],
  ["Skills and learning", ["Which skills are most important for young people today?", "Is it better to learn a skill from a teacher or from the internet?", "Why do some adults stop learning new things?", "Should schools teach practical skills such as cooking?"]],
  ["Traditions and celebrations", ["Why are traditional celebrations important?", "How have celebrations changed compared with the past?", "Do you think traditional festivals will disappear in the future?", "Should governments spend money on public celebrations?"]],
  ["Technology and society", ["How has technology changed the way families communicate?", "Are there any dangers in children using technology?", "Should older people be taught to use new technology?", "Which technology do you think will change our lives most in the future?"]],
  ["Helping others", ["Why do some people volunteer to help others?", "Should helping in the community be part of school life?", "Is it the government's responsibility to help people in need?", "Are people less willing to help strangers than in the past?"]]
];

export const READ = [
  ["V and W", "Keep your top teeth on your lower lip for V. Round your lips for W, with no teeth.", ["We visited the village every Wednesday.", "Vimal waited very patiently for the van.", "Would you like a vegetable wrap with your tea?"]],
  ["TH", "Put the tip of your tongue lightly between your teeth. Do not say T or D.", ["I think these three things are worth thinking about.", "The weather this Thursday will be better than yesterday.", "Thank you both for the birthday gift."]],
  ["F and P", "F is a long sound through your teeth and lip. P is a short puff of air from closed lips.", ["Please fill in the form before five o'clock.", "My father prefers fresh pineapple for breakfast.", "The price of paper has fallen a little."]],
  ["S, SH and Z", "SH is softer and wider than S. Z has a buzz you can feel in your throat.", ["She sells fresh fish at the shop on Sunday.", "The zoo is closed on Tuesdays and Thursdays.", "Sheela usually uses sugar in her coffee."]],
  ["Word endings", "Say the last sound of every word clearly: asked, fixed, desks, helped.", ["I asked him to fix the desk last week.", "She walked past the shops and helped her friends.", "They finished the tests and packed their bags."]],
  ["Useful phrases", "Say each phrase as one smooth group of words, not word by word.", ["Could you tell me how to get to the railway station, please?", "I'm sorry, could you say that again a little more slowly?", "I'd like to make an appointment for Monday morning."]]
];

export const SITUATIONS = [
  { title: "At the pharmacy", prompt: "You are at a pharmacy. Ask for something for a headache, and ask how often you should take it.",
    functions: [["a polite request", /\b(could i|can i|could you|i would like|i'd like|may i|do you have)\b/], ["a question about how often", /\b(how often|how many times|how many)\b/], ["thanks", /\bthank/]] },
  { title: "Late for a meeting", prompt: "You arrive late for a meeting. Apologise and explain why you are late.",
    functions: [["an apology", /\b(sorry|apologi[sz]e)\b/], ["a reason", /\b(because|the bus|traffic|since|as the|my train)\b/], ["a promise for next time", /\b(won't happen|will not happen|next time|make sure|it won't)\b/]] },
  { title: "Booking a hotel room", prompt: "Telephone a hotel to book a room for two nights next weekend, and ask about the price.",
    functions: [["a booking request", /\b(i'd like to (book|reserve)|i would like to (book|reserve)|could i (book|reserve)|can i (book|reserve)|book a room|reserve a room)\b/], ["the dates", /\b(nights?|weekend|friday|saturday|sunday)\b/], ["a question about the price", /\b(how much|price|cost|rate)\b/]] },
  { title: "Declining an invitation", prompt: "A friend invites you to a party, but you cannot go. Say no politely and suggest another time.",
    functions: [["thanks for the invitation", /\b(thank|that's kind|that is kind|sounds (great|lovely|fun)|i'd love to|i would love to)\b/], ["a polite refusal", /\b(afraid|can't|cannot|unfortunately|won't be able|will not be able)\b/], ["a reason", /\b(because|i have to|i've got to|i have got to)\b/], ["another suggestion", /\b(maybe|another time|next time|how about|what about|shall we)\b/]] },
  { title: "Asking for directions", prompt: "Stop a stranger in the street and ask for directions to the nearest bank.",
    functions: [["a polite opening", /\bexcuse me\b/], ["a question about the way", /\b(could you|can you|do you know|where is|where's|how do i get|how can i get)\b/], ["thanks", /\bthank/]] },
  { title: "Introducing yourself at an interview", prompt: "You are at a job interview. Introduce yourself in about thirty seconds.",
    functions: [["your name", /\b(my name is|i'm|i am)\b/], ["your studies or experience", /\b(studied|study|studying|worked|work|working|experience|graduated|qualification)\b/], ["why you want the job", /\b(interested|because|would like|i'd like|hope|keen|excited)\b/]] },
  { title: "A polite complaint", prompt: "In a restaurant, your food has arrived cold. Complain politely to the waiter.",
    functions: [["a polite opening", /\b(excuse me|sorry to)\b/], ["the problem", /\b(cold|not hot|isn't hot|is not hot|wrong)\b/], ["a request", /\b(could you|would you|can you|please)\b/]] },
  { title: "A message for your teacher", prompt: "Leave a voice message for your teacher saying you are unwell and will miss class tomorrow.",
    functions: [["a greeting and your name", /\b(hello|hi|good (morning|afternoon|evening)|this is)\b/], ["that you are unwell", /\b(ill|sick|fever|unwell|not well|not feeling well)\b/], ["that you will miss class", /\b(miss|can't come|cannot come|won't be|will not be|absent)\b/], ["a request about the work", /\b(homework|notes|work|let me know|could you|catch up)\b/]] }
];

