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
  "12-A1": { topic: "Who, That and Which" }
};
