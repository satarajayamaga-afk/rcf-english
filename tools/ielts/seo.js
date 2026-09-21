// What the IELTS answer pages tell search engines and sharing sites, kept in
// one place so the twenty essays and six Task 1 tutorials cannot drift apart.
//
// Two rules:
//   - Every tag is shown on the page. A tag nobody can see is keyword
//     stuffing, and it tells a visitor nothing.
//   - No claim the page cannot stand behind. None of these essays has been
//     marked by an IELTS examiner, and the hub itself says one of them is
//     deliberately a Band 7 to 7.5 model. So no title promises a band score.

// The subject each essay is about, in the word a candidate would search for.
exports.AREA = {
  "technology-and-teachers": "Technology and education",
  "free-university-education": "Education",
  "working-from-home": "Work",
  "traffic-congestion": "Transport",
  "children-and-screens": "Children and technology",
  "space-exploration": "Science and space",
  "museums-and-tourism": "Tourism and culture",
  "plastic-waste": "Environment",
  "ageing-populations": "Society",
  "traditional-skills": "Culture",
  "prison-or-rehabilitation": "Crime",
  "advertising-and-children": "Advertising",
  "online-learning": "Education",
  "unhealthy-food": "Health",
  "global-culture": "Globalisation",
  "sport-or-health-spending": "Government spending",
  "long-working-hours": "Work",
  "science-or-arts": "Education",
  "social-media-rules": "Social media",
  "climate-responsibility": "Environment"
};

// "Discussion: discuss both views" or "discussion" -> "Discussion essay".
exports.typeTag = (type) => {
  const t = String(type).split(":")[0].trim().toLowerCase();
  if (t === "two-part question") return "Two-part question";
  return t.charAt(0).toUpperCase() + t.slice(1) + " essay";
};

exports.essayTags = (slug, type) => {
  const area = exports.AREA[slug];
  if (!area) throw new Error("No subject area for essay " + slug + " in tools/ielts/seo.js");
  return ["IELTS Writing Task 2", exports.typeTag(type), area, "Academic and General Training"];
};

exports.ESSAY_SCHEMA = {
  schema: "LearningResource",
  educationalLevel: "IELTS Academic and General Training",
  resourceType: "Model answer"
};

exports.TASK1_SCHEMA = {
  schema: "LearningResource",
  educationalLevel: "IELTS Academic",
  resourceType: "Tutorial and model answer"
};

// The hashtags people actually follow for IELTS writing. Shown on the page
// and carried in the WhatsApp, X and Telegram share text.
exports.HASHTAGS_TASK2 = ["IELTS", "IELTSWriting", "IELTSTask2", "IELTSEssay", "IELTSPreparation"];
exports.HASHTAGS_TASK1 = ["IELTS", "IELTSWriting", "IELTSTask1", "IELTSAcademic", "IELTSPreparation"];

exports.shareBlock = (text, hashtags) => ({
  type: "share", heading: "Share this", level: "h2", text, hashtags
});

// Put the share row just before the closing "Next" links, or at the end, and
// replace an old one rather than adding a second.
exports.withShare = (blocks, share) => {
  const out = blocks.filter((b) => b.type !== "share");
  const at = out.map((b) => b.type).lastIndexOf("related");
  if (at === -1) out.push(share); else out.splice(at, 0, share);
  return out;
};
