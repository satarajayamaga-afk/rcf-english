// ASK RCF ENGLISH - the site guide.
//
// This is not artificial intelligence and the page says so plainly. It is a
// keyword matcher over the written answers in data/assistant.json, with the
// site's own search index behind it as a fallback.
//
// That is a deliberate choice rather than a limitation being hidden. A real
// AI assistant needs an API key, and a key shipped inside a static site is
// readable by anyone who opens the developer tools - it would be scraped and
// billed to the owner within days. Until there is somewhere server-side to
// hold a key, an honest search is better than a dishonest robot.
//
// Everything runs in the browser. No question anybody types is sent anywhere.

const form = document.getElementById("ask-form");
if (form) {
  const input = document.getElementById("ask-input");
  const thread = document.getElementById("ask-thread");
  const status = document.getElementById("ask-status");
  const chips = document.getElementById("ask-suggestions");
  const root = document.body.dataset.root || "";

  let intents = null;
  let index = null;
  let loading = null;

  // Words that carry no meaning for matching. Kept short on purpose: an
  // over-long stop list throws away words like "past" in "past papers".
  const STOP = new Set(["a", "an", "and", "are", "as", "at", "be", "can", "do", "does", "for",
    "from", "get", "give", "have", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
    "please", "s", "so", "some", "that", "the", "there", "to", "want", "was", "what", "when",
    "where", "which", "who", "why", "will", "with", "you", "your"]);

  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w));
  const isAbsolute = (u) => /^(https?:)?\/\//i.test(String(u || ""));

  // Whole words, not substrings. Matching on substrings made "ai" match
  // inside "emails" and "available", which is how a question about AI came
  // back with the Terms of Use page.
  const wordSet = (s) => new Set(norm(s).split(" ").filter(Boolean));

  // Crude but effective: papers/paper, games/game. Anything cleverer needs a
  // stemmer, and a stemmer is not worth 20 KB here.
  function has(set, t) {
    if (set.has(t)) return true;
    if (t.length > 3 && t.endsWith("s") && set.has(t.slice(0, -1))) return true;
    if (t.length > 2 && set.has(t + "s")) return true;
    return false;
  }

  async function load() {
    if (intents && index) return;
    if (loading) return loading;
    loading = Promise.all([
      fetch(root + "data/assistant.json").then((r) => r.json()),
      fetch(root + "data/search-index.json").then((r) => r.json())
    ]).then(([a, i]) => {
      intents = a.intents || [];
      // The word sets are built once here rather than per question: 837
      // entries scanned on every keystroke of a search would be wasteful.
      index = (Array.isArray(i) ? i : []).map((e) => ({
        title: e.title,
        url: e.url,
        section: e.section,
        t: wordSet(e.title),
        h: wordSet([e.title, e.keywords, e.description, e.section].join(" "))
      }));
      if (chips && a.suggestions) {
        a.suggestions.forEach((q) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "ask__chip";
          b.textContent = q;
          b.addEventListener("click", () => { input.value = q; submit(q); });
          chips.appendChild(b);
        });
        chips.hidden = false;
      }
    });
    return loading;
  }

  // A question mentioning a grade should prefer that grade's pages. This is
  // the single most useful piece of the whole matcher, because most questions
  // on this site have a grade in them.
  const gradeIn = (q) => {
    const m = norm(q).match(/\bgrade\s*(\d{1,2})\b/);
    return m && +m[1] >= 1 && +m[1] <= 13 ? m[1] : null;
  };

  function matchIntent(q) {
    const n = norm(q);
    const w = words(q);
    let best = null;
    for (const it of intents) {
      // A "must" phrase has to appear, either as a phrase or as a word.
      const hit = (it.must || []).some((m) => (m.includes(" ") ? n.includes(m) : w.includes(m)));
      if (!hit) continue;
      let score = 3;
      for (const a of it.any || []) {
        if (a.includes(" ") ? n.includes(a) : w.includes(a)) score += 1;
      }
      if (!best || score > best.score) best = { intent: it, score };
    }
    return best && best.score >= 3 ? best.intent : null;
  }

  // minScore drops weak pages; minRatio refuses a result that matched only a
  // fraction of what was asked. Without the ratio, "the capital of France"
  // came back with the capital-letters pages, which is a coincidence rather
  // than an answer.
  function searchIndex(q, limit, minScore, minRatio) {
    const w = words(q);
    if (!w.length) return [];
    const g = gradeIn(q);
    const out = [];
    for (const e of index) {
      let s = 0;
      let matched = 0;
      for (const t of w) {
        if (has(e.t, t)) { s += 3; matched++; }
        else if (has(e.h, t)) { s += 1; matched++; }
      }
      if (!s || s < (minScore || 0)) continue;
      if (minRatio && matched / w.length < minRatio) continue;
      // A grade in the question, and the page is for that grade.
      if (g && String(e.url || "").includes("grade-" + g)) s += 6;
      // Prefer shorter, more specific titles when the score ties.
      s -= String(e.title || "").length / 400;
      out.push({ e, s });
    }
    out.sort((a, b) => b.s - a.s);
    // Thirty-five urls are indexed more than once - a page carrying several
    // activities gets an entry for each. That is right for the site search
    // and wrong for a list of links, so only the best-scoring entry for any
    // one url survives here.
    const seen = new Set();
    const unique = [];
    for (const x of out) {
      const u = String(x.e.url || "");
      if (seen.has(u)) continue;
      seen.add(u);
      unique.push(x.e);
      if (unique.length >= limit) break;
    }
    return unique;
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function linkList(items) {
    const ul = el("ul", "ask__links");
    items.forEach((it) => {
      const li = el("li");
      const a = el("a", null, it.title);
      const url = String(it.url || "");
      // Some index entries point at a file on Google Drive rather than at a
      // page here. Those are already absolute and must not be given the
      // relative prefix, or they become ../https://drive.google.com/...
      if (isAbsolute(url)) {
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.appendChild(el("span", "visually-hidden", " (opens in a new tab)"));
      } else {
        a.href = root + url;
      }
      li.appendChild(a);
      if (it.description) li.appendChild(el("span", "ask__desc", " - " + it.description));
      ul.appendChild(li);
    });
    return ul;
  }

  function answer(q) {
    const wrap = el("div", "ask__answer");
    const intent = matchIntent(q);

    if (intent) {
      wrap.appendChild(el("p", "ask__text", intent.answer));
      if (intent.links && intent.links.length) wrap.appendChild(linkList(intent.links));
      // Extra pages, but only ones that genuinely match: a written answer
      // followed by three irrelevant links reads worse than no extras.
      const extra = searchIndex(q, 8, 3, 0.6)
        .filter((e) => !(intent.links || []).some((l) => l.url === e.url))
        .slice(0, 3);
      if (extra.length) {
        wrap.appendChild(el("p", "ask__more", "Also on the site:"));
        wrap.appendChild(linkList(extra.map((e) => ({ title: e.title, url: e.url }))));
      }
      return wrap;
    }

    const found = searchIndex(q, 5, 3, 0.6);
    if (found.length) {
      wrap.appendChild(el("p", "ask__text", "I have not got a written answer for that, but these pages look closest:"));
      wrap.appendChild(linkList(found.map((e) => ({ title: e.title, url: e.url, description: e.section }))));
      return wrap;
    }

    wrap.appendChild(el("p", "ask__text", "I could not find anything for that. This guide only knows the pages on this site, so if your question is about something else it will not have an answer. Try different words, or use the full site search - it looks inside every page rather than only at the titles."));
    wrap.appendChild(linkList([
      { title: "Search the whole site", url: "search/" },
      { title: "Ask in the teacher groups", url: "about/online-communities/" },
      { title: "Contact RCF English", url: "contact/" }
    ]));
    return wrap;
  }

  async function submit(q) {
    const question = String(q || "").trim();
    if (!question) return;
    if (chips) chips.hidden = true;
    status.textContent = "Looking...";
    await load();

    const turn = el("div", "ask__turn");
    const asked = el("p", "ask__q");
    asked.appendChild(el("span", "ask__qlabel", "You asked"));
    asked.appendChild(document.createTextNode(question));
    turn.appendChild(asked);
    turn.appendChild(answer(question));
    thread.appendChild(turn);

    status.textContent = "";
    input.value = "";
    turn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    input.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(input.value);
  });

  // Load in the background as soon as the page is idle, so the first question
  // does not wait for a 500 KB index. If the browser has no idle callback,
  // a short timeout does the same job.
  const warm = () => {
    load().catch(() => {
      status.textContent = "The site guide could not load its index. The full site search still works.";
    });
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1200);
}
