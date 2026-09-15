/* ==========================================================================
   RCF English - conversation partner

   Everyday conversations the learner holds out loud with the website. The
   website plays the other person (a barista, a pharmacist, an interviewer),
   listens to the reply, and answers according to what was said: the scene
   branches on the learner's words. When it cannot understand, it asks the
   learner to say it again, the way a real person would; after a second try
   it shows an example and carries on.

   Scenes are written by RCF English as branching scripts. They cover the
   replies a learner is likely to give, not anything at all; that would need
   an AI service, which this site does not use.
   ========================================================================== */

import { esc } from "./lib.js";
import { Speech } from "./speech.js";
import { norm } from "./speaking-analysis.js";
import { SR, talk, listen, ensureConsent, langSelect, wireLangSelect, ERRORS } from "./voice.js";

const root = document.querySelector("[data-conversation]");

const YESISH = /\b(yes|yeah|yep|sure|ok|okay|fine|of course|certainly|please|that's fine|that one|sounds good|great)\b/;
const THANKS = /\b(thank|thanks|cheers|appreciate|great|lovely|perfect|ok|okay|bye|goodbye)\b/;
const ANY = /[a-z]/;
const POLITE = /\b(please|could|would|may i|can i|thank|thanks|excuse me|sorry|i'd like|i would like|i was wondering)\b/;

const SCENES = [
  {
    id: "cafe", title: "Ordering at a café", other: "Barista", setting: "You are at the counter of a busy café. Order a drink and something to eat.",
    phrases: ["Could I have a cup of tea, please?", "A large one, please.", "No sugar, thank you.", "Just one egg roll, please.", "By card, please."],
    start: "hello",
    nodes: {
      hello: { say: "Hi there! What can I get for you today?", task: "Order a drink.", polite: true, model: "Could I have a cup of tea, please?",
        routes: [{ re: /\b(tea|coffee|juice|milkshake|water|latte|cappuccino|hot chocolate|lime juice|milk tea)\b/, capture: ["drink", /\b(hot chocolate|lime juice|milk tea|tea|coffee|juice|milkshake|water|latte|cappuccino)\b/], next: "size" }],
        retry: "Sorry, what would you like to drink? We have tea, coffee and fresh juice.", fallback: { next: "size", set: { drink: "tea" } } },
      size: { say: "Sure, one {drink}. Small or large?", task: "Choose a size.", model: "Large, please.",
        routes: [{ re: /\b(small|large|big|medium|regular)\b/, capture: ["size", /\b(small|large|big|medium|regular)\b/, { big: "large", medium: "regular" }], next: "sugar" }],
        fallback: { next: "sugar", set: { size: "small" } } },
      sugar: { say: "And would you like sugar with that?", task: "Say yes or no, politely.", model: "No sugar, thank you.",
        routes: [{ re: /\b(no|without|don't|do not|not)\b/, next: "food" }, { re: /\b(yes|yeah|please|one|two|a little|some|little)\b/, next: "food" }],
        fallback: { next: "food" } },
      food: { say: "Anything to eat? We have fresh egg rolls and chocolate cake.", task: "Order something to eat, or say no thank you.", model: "Just one egg roll, please.",
        routes: [{ re: /\b(rolls?|cake|chocolate)\b/, capture: ["food", /\b(rolls?|cake|chocolate)\b/, { roll: "an egg roll", rolls: "an egg roll", cake: "a slice of chocolate cake", chocolate: "a slice of chocolate cake" }], next: "pay" },
          { re: /\b(no|nothing|that's all|that is all|not today|i'm fine|i'm good|just the)\b/, next: "payDrink" }],
        fallback: { next: "payDrink" } },
      pay: { say: "Lovely. So that's a {size} {drink} and {food}. That comes to eight hundred and fifty rupees. Cash or card?", task: "Say how you will pay.", model: "By card, please.",
        routes: [{ re: /\b(cash|card|credit|debit|money)\b/, next: "end" }], fallback: { next: "end" } },
      payDrink: { say: "No problem. So that's a {size} {drink}. That comes to four hundred rupees. Cash or card?", task: "Say how you will pay.", model: "Cash, please.",
        routes: [{ re: /\b(cash|card|credit|debit|money)\b/, next: "end" }], fallback: { next: "end" } },
      end: { say: "Thank you! Your order will be ready in a couple of minutes. Have a nice day!", end: true }
    }
  },
  {
    id: "pharmacy", title: "At the pharmacy", other: "Pharmacist", setting: "You have a headache and go to a pharmacy to ask for something to help.",
    phrases: ["Could I have something for a headache, please?", "Since yesterday evening.", "No, I'm not allergic to anything.", "How often should I take them?", "Thank you very much."],
    note: "This is language practice, not medical advice.",
    start: "hello",
    nodes: {
      hello: { say: "Good afternoon. How can I help you?", task: "Say what the problem is and ask for something for it.", polite: true, model: "Could I have something for a headache, please?",
        routes: [{ re: /\b(headache|head ache|head hurts|pain|fever|cold|cough|sore throat)\b/, capture: ["problem", /\b(headache|head ache|head hurts|fever|cold|cough|sore throat|pain)\b/, { "head ache": "headache", "head hurts": "headache" }], next: "howLong" }],
        retry: "Sorry, what seems to be the problem?", fallback: { next: "howLong", set: { problem: "headache" } } },
      howLong: { say: "I'm sorry to hear that. How long have you had the {problem}?", task: "Say how long.", model: "Since yesterday evening.",
        routes: [{ re: /\b(since|yesterday|today|morning|evening|night|days?|hours?|weeks?|last|this|two|three|one|a few|couple)\b/, next: "allergy" }],
        fallback: { next: "allergy" } },
      allergy: { say: "Are you allergic to any medicines?", task: "Answer the question.", model: "No, I'm not allergic to anything.",
        routes: [{ re: /\b(no|not|don't|do not|none|nothing)\b/, next: "give" }, { re: /\b(yes|allergic|penicillin|aspirin|i am)\b/, next: "allergic" }],
        fallback: { next: "give" } },
      allergic: { say: "Thank you for telling me. In that case, I'd like you to speak to the doctor before I give you anything. Please take a seat for a moment.", end: true },
      give: { say: "All right. These tablets should help. Do you have any questions?", task: "Ask how often you should take them.", model: "How often should I take them?",
        routes: [{ re: /\b(how often|how many|how much|when should|times a day|how do i take|how should i)\b/, next: "dose" }, { re: /\b(no|that's all|thank|thanks)\b/, next: "doseTold" }],
        fallback: { next: "doseTold" } },
      dose: { say: "The instructions are on the packet. Please read them carefully, and don't take more than it says. If you don't feel better in a few days, see a doctor.", task: "Thank the pharmacist.", model: "Thank you very much.",
        routes: [{ re: THANKS, next: "end" }], fallback: { next: "end" } },
      doseTold: { say: "Just so you know, the instructions are on the packet, and you shouldn't take more than it says. Is that clear?", task: "Say that you understand.", model: "Yes, that's clear. Thank you.",
        routes: [{ re: /\b(yes|yeah|clear|okay|ok|thank|got it|understand|sure)\b/, next: "end" }], fallback: { next: "end" } },
      end: { say: "You're welcome. I hope you feel better soon.", end: true }
    }
  },
  {
    id: "station", title: "Buying a train ticket", other: "Ticket clerk", setting: "You are at the ticket counter of a railway station.",
    phrases: ["Could I have a ticket to Kandy, please?", "A return ticket, please.", "Second class, please.", "Is there a later train?", "Which platform does it leave from?"],
    start: "hello",
    nodes: {
      hello: { say: "Good morning. Where would you like to go?", task: "Ask for a ticket to a town.", polite: true, model: "Could I have a ticket to Kandy, please?",
        routes: [{ re: /\b(kandy|galle|jaffna|colombo|matara|badulla|ella|anuradhapura|trincomalee|negombo|kurunegala|nuwara eliya|hatton|batticaloa)\b/, capture: ["place", /\b(kandy|galle|jaffna|colombo|matara|badulla|ella|anuradhapura|trincomalee|negombo|kurunegala|nuwara eliya|hatton|batticaloa)\b/, "title"], next: "type" }],
        retry: "Sorry, which station?", fallback: { next: "type", set: { place: "Kandy" } } },
      type: { say: "{place}. One way or return?", task: "Choose one way or return.", model: "A return ticket, please.",
        routes: [{ re: /\b(return|round trip|coming back|both ways)\b/, set: { type: "return" }, next: "cls" }, { re: /\b(one way|single|just one)\b/, set: { type: "one-way" }, next: "cls" }],
        fallback: { next: "cls", set: { type: "one-way" } } },
      cls: { say: "Which class would you like: first, second or third?", task: "Choose a class.", model: "Second class, please.",
        routes: [{ re: /\b(first|second|third|1st|2nd|3rd)\b/, next: "time" }], fallback: { next: "time" } },
      time: { say: "The next train to {place} leaves at ten fifteen from platform three. Would you like a ticket for that one?", task: "Say yes, or ask about a later train.", model: "Is there a later train?",
        routes: [{ re: /\b(later|next one|after that|another|afternoon|evening)\b/, next: "later" }, { re: YESISH, next: "pay" }], fallback: { next: "pay" } },
      later: { say: "There's another one at one thirty, from platform one. Would that be better?", task: "Choose a train.", model: "Yes, the one thirty, please.",
        routes: [{ re: ANY, next: "pay" }], fallback: { next: "pay" } },
      pay: { say: "Here you are: a {type} ticket to {place}. Please keep it with you, because the inspector may ask to see it.", task: "Thank the clerk, or ask anything else you need to know.", model: "Thank you. How long does the journey take?",
        routes: [{ re: /\b(platform|where|toilet|how long|arrive|what time|journey)\b/, next: "extra" }, { re: THANKS, next: "end" }], fallback: { next: "end" } },
      extra: { say: "The journey takes about three hours, and the platforms are through that gate on your left.", then: "end" },
      end: { say: "Have a good journey!", end: true }
    }
  },
  {
    id: "hotel", title: "Checking in at a hotel", other: "Receptionist", setting: "You arrive at a hotel where you have booked a room for two nights.",
    phrases: ["Hello, I have a booking for two nights.", "It's under the name Perera.", "Yes, here you are.", "What time is breakfast?", "Is there Wi-Fi in the room?"],
    start: "hello",
    nodes: {
      hello: { say: "Good evening, and welcome to the Lagoon View Hotel. How can I help you?", task: "Say that you have a booking.", model: "Hello, I have a booking for two nights.",
        routes: [{ re: /\b(booking|reservation|booked|reserved|check in|checking in|room)\b/, next: "name" }], retry: "Sorry, do you have a reservation with us?", fallback: { next: "name" } },
      name: { say: "Of course. May I have your name, please?", task: "Give your name.", model: "It's under the name Perera.",
        routes: [{ re: ANY, next: "id" }], fallback: { next: "id" } },
      id: { say: "Thank you. Yes, I have a room for you for two nights. Could I see your identity card or passport, please?", task: "Hand it over and say something polite.", model: "Yes, here you are.",
        routes: [{ re: /\b(here|sure|of course|yes|certainly|ok|okay|there you go)\b/, next: "questions" }], fallback: { next: "questions" } },
      questions: { say: "Thank you. Your room is on the third floor. Do you have any questions?", task: "Ask about breakfast or the Wi-Fi.", model: "What time is breakfast?",
        routes: [{ re: /\bbreakfast\b/, next: "breakfast" }, { re: /\b(wi ?fi|internet|password)\b/, next: "wifi" }, { re: /\b(no|that's all|nothing|thank)\b/, next: "end" }], fallback: { next: "end" } },
      breakfast: { say: "Breakfast is served from seven to ten in the restaurant on the ground floor. Is there anything else?", task: "Ask about the Wi-Fi, or say that's all.", model: "Is there Wi-Fi in the room?",
        routes: [{ re: /\b(wi ?fi|internet|password)\b/, next: "wifiLast" }, { re: ANY, next: "end" }], fallback: { next: "end" } },
      wifi: { say: "Yes, there's free Wi-Fi in every room. The password is on the card with your key. Is there anything else?", task: "Ask about breakfast, or say that's all.", model: "What time is breakfast?",
        routes: [{ re: /\bbreakfast\b/, next: "breakfastLast" }, { re: ANY, next: "end" }], fallback: { next: "end" } },
      wifiLast: { say: "Yes, there's free Wi-Fi. The password is on the card with your key.", then: "end" },
      breakfastLast: { say: "Breakfast is from seven to ten, on the ground floor.", then: "end" },
      end: { say: "Here is your key. The lift is just behind you. Enjoy your stay!", end: true }
    }
  },
  {
    id: "doctor", title: "Making a doctor's appointment", other: "Receptionist", setting: "You telephone a medical centre to make an appointment.",
    phrases: ["I'd like to make an appointment, please.", "I've had a bad cough for a week.", "Thursday would be better for me.", "In the morning, if possible.", "My name is Nimal Fernando."],
    start: "hello",
    nodes: {
      hello: { say: "Good morning, City Medical Centre. How can I help you?", task: "Ask to make an appointment.", polite: true, model: "I'd like to make an appointment with a doctor, please.",
        routes: [{ re: /\b(appointment|see a doctor|see the doctor|book|doctor)\b/, next: "reason" }], retry: "Sorry, would you like to make an appointment?", fallback: { next: "reason" } },
      reason: { say: "Certainly. Can I ask what the problem is?", task: "Say briefly what is wrong.", model: "I've had a bad cough for a week.",
        routes: [{ re: ANY, next: "day" }], fallback: { next: "day" } },
      day: { say: "Thank you. Doctor Silva has appointments on Tuesday and Thursday. Which day is better for you?", task: "Choose a day.", model: "Thursday would be better for me.",
        routes: [{ re: /\b(tuesday|thursday)\b/, capture: ["day", /\b(tuesday|thursday)\b/, "title"], next: "time" }, { re: /\b(monday|wednesday|friday|saturday|sunday|today|tomorrow)\b/, next: "notDay" }],
        fallback: { next: "time", set: { day: "Tuesday" } } },
      notDay: { say: "I'm sorry, the doctor isn't available then. Would Tuesday or Thursday be possible?", task: "Choose Tuesday or Thursday.", model: "Tuesday is fine.",
        routes: [{ re: /\b(tuesday|thursday)\b/, capture: ["day", /\b(tuesday|thursday)\b/, "title"], next: "time" }], fallback: { next: "time", set: { day: "Thursday" } } },
      time: { say: "On {day}, we have nine thirty in the morning or four o'clock in the afternoon. Which would you prefer?", task: "Choose a time.", model: "In the morning, if possible.",
        routes: [{ re: /\b(morning|nine|9|early|first)\b/, set: { time: "nine thirty" }, next: "name" }, { re: /\b(afternoon|four|4|later|second)\b/, set: { time: "four o'clock" }, next: "name" }],
        fallback: { next: "name", set: { time: "nine thirty" } } },
      name: { say: "That's fine. Could I have your name and a phone number, please?", task: "Give your name and number.", model: "My name is Nimal Fernando, and my number is zero seven seven, one two three, four five six seven.",
        routes: [{ re: ANY, next: "confirm" }], fallback: { next: "confirm" } },
      confirm: { say: "Thank you. So that's {day} at {time} with Doctor Silva. Please arrive ten minutes early.", task: "Confirm and say goodbye.", model: "Thank you. See you on {day}. Goodbye.",
        routes: [{ re: ANY, next: "end" }], fallback: { next: "end" } },
      end: { say: "See you then. Goodbye.", end: true }
    }
  },
  {
    id: "interview", title: "A job interview", other: "Interviewer", setting: "You are at an interview for a job as an office assistant. Give full answers.",
    phrases: ["I recently finished my degree in business studies.", "I'm interested in this job because...", "I'd say my greatest strength is...", "I've been working on...", "What would a typical day in this job look like?"],
    start: "about",
    nodes: {
      about: { say: "Good morning, and thank you for coming in. Please have a seat. Could you start by telling me a little about yourself?", task: "Introduce yourself: your studies or your experience.", model: "I recently finished my degree in business studies, and for the last six months I've worked part time in my uncle's shop.",
        routes: [{ re: ANY, minWords: 15, next: "why" }], retry: "Could you tell me a bit more? For example, what you studied, or where you have worked?", fallback: { next: "why" } },
      why: { say: "Thank you. And why are you interested in this job?", task: "Give a reason, with a detail.", model: "I'm interested in this job because I enjoy organising things, and I'd like to learn how a large office works.",
        routes: [{ re: ANY, minWords: 10, next: "strength" }], retry: "Can you tell me a little more about why?", fallback: { next: "strength" } },
      strength: { say: "What would you say is your greatest strength?", task: "Name a strength and give an example.", model: "I'm very organised. For example, at university I planned the timetable for our whole study group.",
        routes: [{ re: ANY, minWords: 10, next: "weakness" }], retry: "Could you give me an example of that?", fallback: { next: "weakness" } },
      weakness: { say: "And is there anything you're working to improve?", task: "Name something and say what you are doing about it.", model: "I used to find speaking in meetings difficult, so I've been practising by giving short presentations.",
        routes: [{ re: ANY, minWords: 10, next: "questions" }], retry: "And what are you doing to improve that?", fallback: { next: "questions" } },
      questions: { say: "Thank you. Do you have any questions for us?", task: "Ask a question about the job.", model: "Yes. What would a typical day in this job look like?",
        routes: [{ re: /\b(what|when|how|is there|are there|could you|would|will|do you|does)\b/, next: "answer" }, { re: /\b(no|not at the moment|that's all|nothing)\b/, next: "end" }], fallback: { next: "end" } },
      answer: { say: "That's a good question. You would be working with a small, friendly team, and we give full training in the first three months.", then: "end" },
      end: { say: "Thank you for your time today. We'll be in touch by the end of next week.", end: true }
    }
  },
  {
    id: "return", title: "Returning something to a shop", other: "Shop assistant", setting: "You bought an electric kettle last week, and it does not work. Take it back to the shop.",
    phrases: ["I bought this kettle last week, but it doesn't work.", "Yes, here's the receipt.", "I'd like a refund, please.", "Could I exchange it for a new one?"],
    start: "hello",
    nodes: {
      hello: { say: "Hello, how can I help?", task: "Explain the problem and say that you want to return the kettle.", polite: true, model: "I bought this kettle last week, but it doesn't work. I'd like to return it, please.",
        routes: [{ re: /\b(return|exchange|refund|broken|faulty|doesn't work|does not work|not working|damaged|stopped working|problem)\b/, next: "receipt" }], retry: "I'm sorry, is there a problem with something you bought?", fallback: { next: "receipt" } },
      receipt: { say: "I'm sorry about that. Do you have the receipt?", task: "Answer the question.", model: "Yes, here's the receipt.",
        routes: [{ re: /\b(no|lost|don't|do not|haven't|have not|can't find)\b/, next: "noReceipt" }, { re: /\b(yes|here|i do|i have|sure)\b/, next: "choice" }], fallback: { next: "choice" } },
      noReceipt: { say: "That's all right. If you paid by card, I can find the sale on our system. Did you pay by card?", task: "Say how you paid.", model: "Yes, I paid by card.",
        routes: [{ re: /\b(cash|no)\b/, next: "voucherOnly" }, { re: /\b(yes|card|credit|debit)\b/, next: "choice" }], fallback: { next: "choice" } },
      voucherOnly: { say: "Without a receipt, I can offer you an exchange or a gift voucher, but not a refund. Which would you prefer?", task: "Choose an exchange or a voucher.", model: "Could I exchange it for a new one, please?",
        routes: [{ re: /\b(exchange|another|new one|swap|replace)\b/, next: "exchanged" }, { re: /\b(voucher|credit)\b/, next: "voucher" }], fallback: { next: "voucher" } },
      choice: { say: "Thank you. Would you like a refund, or would you prefer to exchange it for a new one?", task: "Choose a refund or an exchange.", model: "I'd like a refund, please.",
        routes: [{ re: /\b(refund|money back)\b/, next: "refunded" }, { re: /\b(exchange|another|new one|swap|replace)\b/, next: "exchanged" }], fallback: { next: "exchanged" } },
      refunded: { say: "No problem. The money will go back to your account in three to five working days. Sorry again for the trouble.", end: true },
      exchanged: { say: "Of course. I'll get you a new one from the shelf, and I'll check that it works before you go.", end: true },
      voucher: { say: "Here's a voucher for the full amount. You can use it in any of our shops.", end: true }
    }
  },
  {
    id: "directions", title: "Asking for directions", other: "Passer-by", setting: "You are new to the town. Stop someone in the street and ask the way to the post office. This time, you speak first.",
    phrases: ["Excuse me, could you tell me how to get to the post office, please?", "Sorry, could you say that again more slowly?", "So, straight on, then the second turning on the left?", "Thank you so much for your help."],
    start: "ask",
    nodes: {
      ask: { say: "", task: "Stop someone politely and ask the way to the post office.", polite: true, model: "Excuse me, could you tell me how to get to the post office, please?",
        routes: [{ re: /\b(post office|bank|station|hospital|bus stand|bus station|library|market|pharmacy|police station)\b/, capture: ["place", /\b(post office|police station|bus station|bus stand|bank|station|hospital|library|market|pharmacy)\b/], next: "directions" }],
        retry: "Sorry? Where are you trying to get to?", fallback: { next: "directions", set: { place: "post office" } } },
      directions: { say: "The {place}? Yes, it's not far. Go straight along this road, take the second turning on the left, and it's next to the big supermarket.", task: "Check that you understood: repeat the directions back, or ask them to say it again.", model: "So, straight on, then the second turning on the left?",
        routes: [{ re: /\b(sorry|again|repeat|slowly|pardon)\b/, next: "repeat" }, { re: /\b(second|left|straight|supermarket)\b/, next: "confirm" }], fallback: { next: "confirm" } },
      repeat: { say: "Of course. Straight along this road. Then, the second turning on the left. It's next to the big supermarket.", task: "Repeat the directions back.", model: "Straight on, second on the left, next to the supermarket. Thank you.",
        routes: [{ re: ANY, next: "confirm" }], fallback: { next: "confirm" } },
      confirm: { say: "That's right. It's about a five-minute walk.", task: "Thank them.", model: "Thank you so much for your help.",
        routes: [{ re: THANKS, next: "end" }], fallback: { next: "end" } },
      end: { say: "You're welcome. Have a good day!", end: true }
    }
  },
  {
    id: "extension", title: "University: asking a lecturer for more time", other: "Lecturer", setting: "You have been ill and are behind with an assignment. You visit your lecturer during office hours.",
    phrases: ["Good afternoon. Is this a good time?", "I'm in your first-year Economics class.", "I've been ill this week, so I'm behind with the assignment.", "Would it be possible to have a few extra days?", "Thank you, that's really helpful."],
    start: "hello",
    nodes: {
      hello: { say: "Come in. How can I help you?", task: "Greet the lecturer and say who you are.", polite: true, model: "Good afternoon. I'm Nadeesha, from your first-year Economics class.",
        routes: [{ re: /\b(i'm|i am|my name|class|course|student|year)\b/, next: "problem" }], retry: "Sorry, which class are you in?", fallback: { next: "problem" } },
      problem: { say: "Nice to see you. What seems to be the problem?", task: "Explain why you are behind with the assignment.", model: "I've been ill this week, so I'm behind with the assignment.",
        routes: [{ re: /\b(ill|sick|fever|unwell|hospital|family|problem|behind|haven't finished|not finished|couldn't)\b/, next: "request" }], retry: "I see. Could you tell me a little more?", fallback: { next: "request" } },
      request: { say: "I'm sorry to hear that. Are you feeling better now?", task: "Answer, and ask politely for more time.", polite: true, model: "Yes, thank you. Would it be possible to have a few extra days?",
        routes: [{ re: /\b(extension|extra|more time|few days|later|next week|submit)\b/, next: "certificate" }], retry: "Is there something you would like to ask me?", fallback: { next: "certificate" } },
      certificate: { say: "That should be possible. Do you have a medical certificate?", task: "Answer the question.", model: "Yes, I have one. I can bring it tomorrow.",
        routes: [{ re: /\b(no|don't|do not|haven't|didn't)\b/, next: "noCertificate" }, { re: /\b(yes|i have|i do|here|bring|tomorrow)\b/, next: "agreed" }], fallback: { next: "agreed" } },
      noCertificate: { say: "Then please ask the doctor for one, or bring a letter from your parents. Once I have it, you can submit next Wednesday.", task: "Thank the lecturer.", model: "Thank you, that's really helpful.",
        routes: [{ re: THANKS, next: "end" }], fallback: { next: "end" } },
      agreed: { say: "Good. Bring it to my office, and you can submit the assignment next Wednesday.", task: "Thank the lecturer.", model: "Thank you, that's really helpful.",
        routes: [{ re: THANKS, next: "end" }], fallback: { next: "end" } },
      end: { say: "You're welcome. Take care of yourself.", end: true }
    }
  },
  {
    id: "library", title: "University: at the library desk", other: "Librarian", setting: "You need books for an assignment, and your student card is not working at the gate.",
    phrases: ["Could you tell me where I can find books on statistics?", "How long can I borrow a book for?", "My student card isn't working.", "My student number is two zero two six, one two three."],
    start: "hello",
    nodes: {
      hello: { say: "Hello. Can I help you?", task: "Ask where to find books on a subject.", polite: true, model: "Could you tell me where I can find books on statistics, please?",
        routes: [{ re: /\b(books?|find|where|section|shelf)\b/, next: "where" }], retry: "Sorry, what are you looking for?", fallback: { next: "where" } },
      where: { say: "Those books are on the second floor, near the windows. Anything else?", task: "Ask how long you can borrow a book for.", model: "How long can I borrow a book for?",
        routes: [{ re: /\b(how long|borrow|keep|return|weeks?|days?)\b/, next: "loan" }, { re: /\b(card|gate|id)\b/, next: "card" }], fallback: { next: "loan" } },
      loan: { say: "For two weeks. You can renew them online if nobody else has reserved them.", task: "Tell the librarian about the problem with your student card.", model: "Thank you. Also, my student card isn't working at the gate.",
        routes: [{ re: /\b(card|gate|id|working|problem)\b/, next: "card" }, { re: THANKS, next: "end" }], fallback: { next: "card" } },
      card: { say: "Let me check that for you. What's your student number?", task: "Give your student number.", model: "It's two zero two six, one two three.",
        routes: [{ re: /[a-z0-9]/, next: "fixed" }], fallback: { next: "fixed" } },
      fixed: { say: "Thank you. Your card had expired at the end of last semester. I've renewed it, so it will work now.", task: "Thank the librarian.", model: "Thank you very much for your help.",
        routes: [{ re: THANKS, next: "end" }], fallback: { next: "end" } },
      end: { say: "You're welcome. Good luck with your assignment.", end: true }
    }
  },
  {
    id: "first-day", title: "Work abroad: your first day", other: "Supervisor", setting: "It is your first morning at a warehouse job overseas. Your supervisor meets you at the door.",
    phrases: ["Good morning. I'm Kamal. I'm starting today.", "What time is my break?", "Where can I leave my bag?", "Who should I ask if I have a problem?", "Could you show me how this works, please?"],
    start: "hello",
    nodes: {
      hello: { say: "Morning! Are you the new starter?", task: "Say yes and introduce yourself.", model: "Yes. Good morning, I'm Kamal. I'm starting today.",
        routes: [{ re: /\b(yes|i'm|i am|my name|new|starting|start)\b/, next: "hours" }], retry: "Sorry, are you here for the new job?", fallback: { next: "hours" } },
      hours: { say: "Welcome. I'm Mark, the shift supervisor. Your shift is seven to four. Do you have any questions before we start?", task: "Ask about your break, or where to leave your things.", model: "What time is my break?",
        routes: [{ re: /\b(break|lunch|rest)\b/, next: "break" }, { re: /\b(bag|things|locker|leave|put)\b/, next: "locker" }, { re: /\b(no|not now|nothing)\b/, next: "help" }], fallback: { next: "break" } },
      break: { say: "You have a thirty-minute break at eleven. Lockers for your bag are over there, by the door.", task: "Ask who to talk to if you have a problem.", model: "Thank you. Who should I ask if I have a problem?",
        routes: [{ re: /\b(problem|ask|help|who)\b/, next: "help" }], fallback: { next: "help" } },
      locker: { say: "Lockers are over there, by the door. Your break is at eleven, for thirty minutes.", task: "Ask who to talk to if you have a problem.", model: "Thank you. Who should I ask if I have a problem?",
        routes: [{ re: /\b(problem|ask|help|who)\b/, next: "help" }], fallback: { next: "help" } },
      help: { say: "Ask me, or Priya on the next aisle. She has worked here for five years. Now, this is the scanner you will use.", task: "Ask the supervisor to show you how it works.", polite: true, model: "Could you show me how it works, please?",
        routes: [{ re: /\b(show|how|explain|use|work)\b/, next: "scanner" }], fallback: { next: "scanner" } },
      scanner: { say: "Of course. Point it at the barcode and press the green button. It beeps when the item is recorded.", task: "Repeat the instructions back to check.", model: "So I point it at the barcode, press the green button, and wait for the beep?",
        routes: [{ re: /\b(barcode|green|button|beep|press|point)\b/, next: "end" }], retry: "Sorry, could you tell me what you need to do, to check you've got it?", fallback: { next: "end" } },
      end: { say: "Exactly right. You're going to be fine here. Let's get started.", end: true }
    }
  },
  {
    id: "safety", title: "Work abroad: reporting a safety problem", other: "Site supervisor", setting: "You notice that a safety rail on the second floor of a building site is loose. Tell your supervisor.",
    phrases: ["Excuse me, I need to report a safety problem.", "The safety rail on the second floor is loose.", "It's the side near the stairs.", "I think someone could fall.", "Yes, I'll put a warning sign there now."],
    start: "report",
    nodes: {
      report: { say: "", task: "Get your supervisor's attention and report the problem.", polite: true, model: "Excuse me, I need to report a safety problem. The rail on the second floor is loose.",
        routes: [{ re: /\b(rail|loose|broken|danger|dangerous|safety|unsafe|problem|fall)\b/, next: "where" }], retry: "Sorry? What's the problem?", fallback: { next: "where" } },
      where: { say: "Thanks for telling me. Where exactly is it?", task: "Say exactly where the problem is.", model: "It's on the second floor, on the side near the stairs.",
        routes: [{ re: /\b(floor|side|near|stairs|next to|by the|corner|left|right)\b/, next: "risk" }], retry: "Which part of the building?", fallback: { next: "risk" } },
      risk: { say: "Is anyone working near it at the moment?", task: "Answer, and say what the danger is.", model: "Yes, two workers are there. I think someone could fall.",
        routes: [{ re: ANY, next: "action" }], fallback: { next: "action" } },
      action: { say: "Right. I'll stop work on that side now. Could you put a warning sign there while I call the maintenance team?", task: "Agree to help.", model: "Yes, of course. I'll do it now.",
        routes: [{ re: /\b(yes|ok|okay|sure|of course|right away|now|will)\b/, next: "end" }], fallback: { next: "end" } },
      end: { say: "Thank you. You did exactly the right thing. Always tell me straight away.", end: true }
    }
  }
];

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] || "");
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

function setUp() {
  root.innerHTML = `
    <div class="cp">
      <div class="cp__setup" data-setup>
        <div class="grid grid--2 cp__scenes">
          ${SCENES.map((s, i) => `<button type="button" class="cp__scene" data-scene="${i}"><strong>${esc(s.title)}</strong><span>${esc(s.setting)}</span></button>`).join("")}
        </div>
        <div class="sp__row">
          <div class="field">${SR ? langSelect("cp-lang") : ""}</div>
        </div>
        <label class="mst__check"><input type="checkbox" data-hints checked> Show what to say at each turn</label>
      </div>

      <div class="cp__room" data-room hidden>
        <div class="mst__bar"><strong data-title></strong><button type="button" class="btn btn--sm btn--outline" data-end>End conversation</button></div>
        <p class="cp__setting" data-setting></p>
        <details class="accordion cp__phrases"><summary>Useful phrases for this conversation</summary><div class="accordion__body"><ul data-phrases></ul></div></details>
        <ol class="dlg__lines cp__chat" data-chat></ol>
        <div class="cp__turn" data-turn hidden>
          <p class="cp__task" data-task></p>
          <p class="cp__heard" data-heard aria-live="polite"></p>
          <div class="sp__controls">
            <button type="button" class="btn btn--accent" data-done hidden>I've finished</button>
            <button type="button" class="btn btn--accent" data-answer hidden>Answer</button>
            <button type="button" class="btn btn--outline" data-example>Show an example</button>
          </div>
          <p class="cp__example" data-example-text hidden></p>
          <form class="cp__type" data-type-form hidden><label for="cp-type" class="visually-hidden">Your reply</label><input id="cp-type" type="text" data-type autocomplete="off" placeholder="Type what you would say"><button type="submit" class="btn btn--accent">Send</button></form>
        </div>
        <p class="sp__status" data-status role="status" aria-live="polite"></p>
      </div>

      <div data-report hidden></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  wireLangSelect(root);
  if (!SR) $("[data-setup]").insertAdjacentHTML("afterbegin", `<p class="sp__status">This browser cannot recognise speech, so you can type your replies instead. To speak them, open this page in Chrome, Edge or Safari.</p>`);

  let run = 0;
  let current = null;
  let scene = null;
  let turns = [];

  function bubble(who, text, side, extra = "") {
    const li = document.createElement("li");
    li.className = `dlg__line dlg__line--${side} is-shown`;
    li.innerHTML = `<span class="dlg__who">${esc(who)}</span><span class="dlg__bubble">${esc(text)}</span>${extra}`;
    $("[data-chat]").appendChild(li);
    li.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return li;
  }

  /* One reply from the learner: spoken, or typed where speech is unavailable. */
  async function reply(id) {
    const heard = $("[data-heard]");
    heard.textContent = "";
    if (!SR) {
      const form = $("[data-type-form]"), input = $("[data-type]");
      form.hidden = false; input.value = ""; input.focus();
      const text = await new Promise((go) => form.addEventListener("submit", (e) => { e.preventDefault(); go(input.value.trim()); }, { once: true }));
      form.hidden = true;
      return id === run ? { text } : null;
    }
    heard.textContent = "Listening…";
    $("[data-done]").hidden = false;
    current = listen({ maxMs: 45000, endSilenceMs: 2400, noSpeechMs: 10000, onInterim: (t) => { heard.textContent = t; } });
    const r = await current.promise;
    current = null;
    $("[data-done]").hidden = true;
    if (id !== run) return null;
    if (r.error) {
      $("[data-status]").textContent = ERRORS[r.error] || `Speech recognition stopped (${r.error}).`;
      if (r.error === "not-allowed" || r.error === "audio-capture") return null;
      $("[data-answer]").hidden = false;
      await new Promise((go) => $("[data-answer]").addEventListener("click", go, { once: true }));
      $("[data-answer]").hidden = true;
      $("[data-status]").textContent = "";
      return reply(id);
    }
    return r;
  }

  async function other(id, text) {
    if (id !== run || !text) return;
    bubble(scene.other, text, "a");
    await talk(text, 0.95);
  }

  async function play(index) {
    const id = ++run;
    scene = SCENES[index];
    turns = [];
    const vars = {};
    const hints = $("[data-hints]").checked;
    $("[data-setup]").hidden = true;
    $("[data-report]").hidden = true;
    $("[data-room]").hidden = false;
    $("[data-chat]").innerHTML = "";
    $("[data-title]").textContent = `${scene.title} · You are talking to the ${scene.other.toLowerCase()}`;
    $("[data-setting]").textContent = scene.setting + (scene.note ? ` ${scene.note}` : "");
    $("[data-phrases]").innerHTML = scene.phrases.map((p) => `<li>${esc(p)}</li>`).join("");
    root.scrollIntoView({ behavior: "smooth", block: "start" });

    let node = scene.nodes[scene.start];
    while (node && id === run) {
      await other(id, fill(node.say, vars));
      if (id !== run) return;
      if (node.end) break;
      if (node.then) { node = scene.nodes[node.then]; continue; }

      const turn = { other: fill(node.say, vars), task: node.task, answer: "", tries: 0, example: false, notes: [] };
      turns.push(turn);
      $("[data-turn]").hidden = false;
      $("[data-task]").textContent = hints ? `Your turn: ${node.task}` : "Your turn.";
      $("[data-example-text]").hidden = true;
      $("[data-example-text]").textContent = `For example: “${fill(node.model, vars)}”`;

      let next = null;
      for (let attempt = 0; attempt < 2 && !next; attempt++) {
        const r = await reply(id);
        if (!r) return;
        const text = norm(r.text || "");
        if (!text) {
          turn.tries++;
          if (attempt === 0) { await other(id, "Sorry, I didn't catch that."); continue; }
          break;
        }
        const li = bubble("You", r.text, "b");
        turn.answer = r.text;
        const words = text.split(" ").length;
        const route = node.routes.find((rt) => rt.re.test(text) && (!rt.minWords || words >= rt.minWords));
        if (route) {
          next = route;
          if (node.polite && !POLITE.test(text)) {
            turn.notes.push("This sounds a little direct. Add please or excuse me, or begin with Could I or Could you.");
            li.insertAdjacentHTML("beforeend", `<span class="dlg__heard dlg__heard--miss">Tip: add please, or begin with “Could I…” or “Could you…”</span>`);
          }
        } else {
          turn.tries++;
          if (attempt === 0) await other(id, node.retry || "Sorry, could you say that again?");
        }
      }
      $("[data-turn]").hidden = true;
      if (id !== run) return;

      const chosen = next || node.fallback;
      if (!next) {
        turn.example = true;
        bubble("Example", fill(node.model, vars), "b", `<span class="dlg__note">Here is one way to say it.</span>`);
      }
      if (next && next.capture) {
        const [name, re, map] = next.capture;
        const m = norm(turn.answer).match(re);
        if (m) vars[name] = map === "title" ? titleCase(m[1]) : (map && map[m[1]]) || m[1];
      }
      Object.assign(vars, chosen.set || {});
      // a captured value missing after a fallback gets the fallback's default
      if (!next && node.fallback.set) Object.assign(vars, node.fallback.set);
      node = scene.nodes[chosen.next];
    }
    if (id === run) finish(id);
  }

  function finish(id) {
    if (id !== run) return;
    const firstTime = turns.filter((t) => t.answer && !t.tries && !t.example).length;
    const examples = turns.filter((t) => t.example).length;
    const tips = turns.flatMap((t) => t.notes);
    const box = $("[data-report]");
    box.innerHTML = `
      <section class="wp__panel">
        <h3>Conversation finished</h3>
        <ul class="wp__notes">
          <li class="wp__note wp__note--${firstTime === turns.length ? "ok" : "fix"}"><span class="wp__icon" aria-hidden="true">${firstTime === turns.length ? "✓" : "!"}</span>You were understood first time in ${firstTime} of your ${turns.length} turns.</li>
          ${examples ? `<li class="wp__note wp__note--fix"><span class="wp__icon" aria-hidden="true">!</span>An example was shown ${examples} ${examples === 1 ? "time" : "times"}. Try the conversation again and use those phrases.</li>` : ""}
          ${tips.length ? `<li class="wp__note wp__note--fix"><span class="wp__icon" aria-hidden="true">!</span>${esc(tips[0])}</li>` : `<li class="wp__note wp__note--ok"><span class="wp__icon" aria-hidden="true">✓</span>Your requests sounded polite.</li>`}
        </ul>
        <p class="text-small text-muted">The website follows a prepared script, so it listens for the kind of reply the situation needs rather than judging your grammar. Try again with different words, or with <em>Show what to say</em> switched off.</p>
        <p><strong>Useful phrases:</strong></p><ul>${scene.phrases.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="sp__controls"><button type="button" class="btn btn--accent" data-again>Try this conversation again</button><button type="button" class="btn btn--outline" data-choose>Choose another conversation</button></div>
      </section>`;
    box.hidden = false;
    box.querySelector("[data-again]").addEventListener("click", () => play(SCENES.indexOf(scene)));
    box.querySelector("[data-choose]").addEventListener("click", () => { box.hidden = true; $("[data-room]").hidden = true; $("[data-setup]").hidden = false; });
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function end() {
    run++;
    if (current) current.stop();
    Speech.cancel();
    $("[data-turn]").hidden = true;
    $("[data-room]").hidden = true;
    $("[data-report]").hidden = true;
    $("[data-setup]").hidden = false;
  }

  root.querySelectorAll("[data-scene]").forEach((b) => b.addEventListener("click", async () => {
    if (SR && !(await ensureConsent($("[data-setup]")))) return;
    play(Number(b.dataset.scene));
  }));
  $("[data-done]").addEventListener("click", () => { if (current) current.stop(); });
  $("[data-example]").addEventListener("click", () => { $("[data-example-text]").hidden = false; });
  $("[data-end]").addEventListener("click", end);
  window.addEventListener("pagehide", () => { run++; if (current) current.stop(); Speech.cancel(); });
}

if (root) setUp();
