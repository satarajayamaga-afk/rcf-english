// Per-plan overrides for the parser in ./index.js, keyed by the plan's file
// name without the extension.
//
// The lesson-plan documents are self-describing, so almost nothing is needed
// here. What is needed is a short public name for the handful of plans whose
// own grammar point runs too long for an <h1>, a page title and a URL: a CELTA
// plan is right to call it "Present Continuous and Present Simple for the
// Future, Future Time Clauses", and a teacher searching for it is not.
//
// Any field of a lesson may be overridden: topic, learners, skills, focus,
// prep, shortRoute, adaptations, metaTitle, description.
module.exports = {
  // Keeps the URL this plan has had since it was first published.
  "02-C1": { topic: "Inversion and Participle Clauses" },

  "04-B1": { topic: "Present Forms for the Future" },

  // "A and An" alone is too thin to search for, and too thin as a page title.
  "05-A1": { topic: "Indefinite Articles A and An" },

  "05-C1": { topic: "Articles in Academic Writing" },

  "06-C1": { topic: "Complex Prepositions" },

  // The document's own name carries a parenthesis in the middle, which a title
  // cannot: "Causative Have and Get (have something done) and the Get Passive".
  "09-B2": { topic: "Causative Have and Get" },

  // The document's name starts with a bracket - "(Not) As ... As, Modifiers
  // and Less, The Least" - and a slug cannot keep the "not" that matters.
  "11-B1": { topic: "Comparisons with As ... As" },

  // "Who and That / Which for Describing People and Things". Cutting the list
  // at the slash would drop "which", which is half the lesson.
  "12-A1": { topic: "Who, That and Which" },

  // The document names the unit "Countable and Uncountable Nouns and
  // Quantifiers", which leaves no room for "ESL Lesson Plans" in a 60-character
  // title. Every plan in the unit must carry the same short name, or they land
  // under two different hubs.
  "15-A1": { unit: "Quantifiers and Uncountable Nouns" },
  "15-A2": { unit: "Quantifiers and Uncountable Nouns" },
  "15-B1": { unit: "Quantifiers and Uncountable Nouns" },
  "15-B2": { unit: "Quantifiers and Uncountable Nouns" },
  "15-C1": {
    unit: "Quantifiers and Uncountable Nouns",
    // "Formal Quantity Expressions and Agreement in Report Writing".
    topic: "Formal Quantity Expressions and Agreement"
  },

  // "Past Simple Questions and Subject vs Object Questions" - the "vs" is the
  // part a teacher would not search for.
  "14-A2": { topic: "Past Simple Subject and Object Questions" },

  // "... in Persuasive Speech" is where the plan uses them, not what they are.
  "14-C1": { topic: "Rhetorical and Emphatic Questions" },

  // "Order of Adjectives and Gradable vs Ungradable Adjectives" - the phrase
  // teachers search for is "order of adjectives".
  "17-B2": { topic: "Order of Adjectives and Gradability" },

  // "Stance Adverbs and Adverb + Adjective Collocations in Opinion Writing".
  "17-C1": { topic: "Stance Adverbs and Collocations" },

  // "Advanced Linkers and Cohesion in Academic Writing".
  "18-C1": { topic: "Advanced Linkers and Cohesion" }
};
