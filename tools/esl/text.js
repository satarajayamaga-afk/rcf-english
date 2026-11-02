// Small text helpers shared by gen.js and the grammar plan parser.

// "the zero article" and "the passive" already carry their article; "present
// simple" needs one. Without this, a template reading "on the ${topic}" turns
// The Passive into "on the the passive".
const withThe = (s) => (/^(the|a|an)\s/i.test(s) ? s : `the ${s}`);

const sentenceCase = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

// A meta description has to land between 140 and 160 characters. The topics
// run from "A and An" to forty-four characters, so a description is built from
// a head plus whichever of the tails fit, longest first, rather than chosen
// from a fixed list of whole sentences that cannot suit both ends of that
// range. Tails that do not fit are skipped, not treated as the end of the
// list, so a short one can still fill the gap a long one left.
function padTo(head, tails, min, max) {
  let s = head;
  for (const t of tails) {
    if (s.length >= min) break;
    if ((s + t).length <= max) s += t;
  }
  return s;
}

// The tails used for lesson plans and for the grammar unit hubs, longest
// first. Each one is true of every plan: they all carry these parts.
const PLAN_TAILS = [
  " Aims, language analysis and timed stages.",
  " Printable handouts and a full answer key.",
  " Differentiation and large-class notes.",
  " Handouts and an answer key.",
  " Printable, with answers.",
  " Free to use in class.",
  " Printable."
];

module.exports = { withThe, sentenceCase, padTo, PLAN_TAILS };
