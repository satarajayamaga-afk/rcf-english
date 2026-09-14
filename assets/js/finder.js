/* ==========================================================================
   RCF English - resource finder

   The build writes every resource, paper, listening set and ebook into the
   page as one plain list, each item carrying what it is in data- attributes.
   With JavaScript off that list is the page. This module adds the filters:
   grade, subject area, term, kind of resource, who it is for, free or
   premium, and a keyword box - then shows the count and a page at a time.

   The choices are written into the address bar, so a link such as
   resources/?grade=8&term=second&type=papers opens with those filters set.
   The grade dashboards link here that way.
   ========================================================================== */

import { normaliseQuery, announce } from "./lib.js";

const FACETS = [
  { key: "grade", label: "Grade", attr: "grades", options: null },
  {
    key: "area", label: "Subject area", attr: "area",
    options: { english: "English", literature: "English Literature", general: "General English" }
  },
  {
    key: "term", label: "School term", attr: "term",
    options: { first: "First term", second: "Second term", third: "Third term" }
  },
  {
    key: "type", label: "Kind of resource", attr: "type",
    options: {
      papers: "Papers", answers: "Marking schemes and answers", worksheets: "Worksheets",
      "study-packs": "Study packs", textbooks: "Textbooks", guides: "Teacher's guides and plans",
      listening: "Listening", ebooks: "Ebooks", other: "Other resources"
    }
  },
  {
    key: "for", label: "For", attr: "audience",
    options: { student: "Students", teacher: "Teachers" }
  },
  {
    key: "access", label: "Free or premium", attr: "access",
    options: { free: "Free", premium: "Premium (RCF Publications)" }
  }
];

const GRADE_LABEL = (g) => (g === 12 ? "Grade 12 (A/L)" : g === 13 ? "Grade 13 (A/L)" : g === 11 ? "Grade 11 (O/L)" : `Grade ${g}`);

function setUp(root) {
  const list = root.querySelector("[data-finder-list]");
  const items = Array.from(list.querySelectorAll(".fres"));
  if (!items.length) return;

  const controls = root.querySelector("[data-finder-controls]");
  const countNode = root.querySelector("[data-finder-count]");
  const live = root.querySelector("[data-finder-live]");
  const empty = root.querySelector("[data-finder-empty]");
  const more = root.querySelector("[data-finder-more]");
  const pageSize = Number(root.dataset.pageSize) || 24;

  /* Pre-read each item once. */
  const records = items.map((li) => ({
    li,
    grades: li.dataset.grades.trim().split(/\s+/).filter(Boolean).map(Number),
    area: li.dataset.area,
    term: li.dataset.term,
    type: li.dataset.type,
    audience: li.dataset.audience,
    access: li.dataset.access,
    words: li.dataset.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean)
  }));

  /* Only offer choices that at least one item actually has. */
  const present = {
    grade: [...new Set(records.flatMap((r) => r.grades))].sort((a, b) => a - b),
    area: new Set(records.map((r) => r.area)),
    term: new Set(records.map((r) => r.term).filter(Boolean)),
    type: new Set(records.map((r) => r.type)),
    for: new Set(["student", "teacher"]),
    access: new Set(records.map((r) => r.access))
  };

  /* ------------------------------------------------------------ controls */

  let uid = 0;
  const selects = {};
  const form = document.createElement("form");
  form.className = "finder__form";
  form.setAttribute("role", "search");
  form.addEventListener("submit", (e) => { e.preventDefault(); if (applyInterpretation()) apply(); });

  const qId = `finder-q-${++uid}`;
  const qWrap = document.createElement("div");
  qWrap.className = "finder__field finder__field--q";
  qWrap.innerHTML = `<label for="${qId}">Keywords, or ask</label><input id="${qId}" type="search" placeholder="e.g. Grade 8 second term papers with marking schemes" autocomplete="off" enterkeyhint="search"><span class="finder__tip">Type a request and press Enter to set the filters for you.</span>`;
  form.appendChild(qWrap);
  const qInput = qWrap.querySelector("input");

  FACETS.forEach((f) => {
    const id = `finder-${f.key}-${++uid}`;
    const wrap = document.createElement("div");
    wrap.className = "finder__field";
    const sel = document.createElement("select");
    sel.id = id;
    sel.appendChild(new Option("All", ""));
    if (f.key === "grade") {
      present.grade.forEach((g) => sel.appendChild(new Option(GRADE_LABEL(g), String(g))));
    } else {
      Object.entries(f.options).forEach(([value, label]) => {
        if (present[f.key].has(value)) sel.appendChild(new Option(label, value));
      });
    }
    if (sel.options.length <= 2 && f.key !== "grade" && f.key !== "for") return; /* nothing to choose between */
    const lab = document.createElement("label");
    lab.htmlFor = id;
    lab.textContent = f.label;
    wrap.append(lab, sel);
    form.appendChild(wrap);
    selects[f.key] = sel;
  });

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn btn--sm btn--outline finder__reset";
  reset.textContent = "Clear filters";
  form.appendChild(reset);
  controls.appendChild(form);

  /* --------------------------------------------------------------- state */

  let shown = pageSize;

  function readState() {
    const s = { q: qInput.value };
    Object.keys(selects).forEach((k) => { s[k] = selects[k].value; });
    return s;
  }

  function writeUrl(state) {
    const url = new URL(window.location.href);
    ["q", ...FACETS.map((f) => f.key)].forEach((k) => {
      if (state[k]) url.searchParams.set(k, state[k]);
      else url.searchParams.delete(k);
    });
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  /* Plain-language requests. "Find Grade 8 second term papers with marking
     schemes" sets Grade 8, Second term and Papers, and keeps any words it
     did not recognise as keywords. It only ever sets filters this list
     already offers, so it cannot point at something that is not here. */
  const understood = document.createElement("p");
  understood.className = "finder__understood";
  understood.setAttribute("aria-live", "polite");
  understood.hidden = true;
  controls.appendChild(understood);

  const RULES = [
    { facet: "type", value: "answers", re: /\b(marking schemes?|answer (keys?|sheets?)|model answers?|answers?)\b/ },
    { facet: "type", value: "papers", re: /\b(past papers?|model papers?|term tests?|test papers?|question papers?|papers?|exams? papers?)\b/ },
    { facet: "type", value: "worksheets", re: /\b(worksheets?|exercises?)\b/ },
    { facet: "type", value: "study-packs", re: /\b(study packs?|self[- ]?learning packs?|packs?)\b/ },
    { facet: "type", value: "textbooks", re: /\b(text ?books?|pupil'?s books?|work ?books?)\b/ },
    { facet: "type", value: "guides", re: /\b(teacher'?s? guides?|lesson plans?|guides?)\b/ },
    { facet: "type", value: "listening", re: /\b(listening|audio)\b/ },
    { facet: "type", value: "ebooks", re: /\b(e-?books?|publications?)\b/ },
    { facet: "area", value: "literature", re: /\bliterature\b/ },
    { facet: "area", value: "general", re: /\bgeneral english\b/ },
    { facet: "for", value: "teacher", re: /\b(for )?teachers?\b/ },
    { facet: "for", value: "student", re: /\b(for )?(students?|pupils?)\b/ },
    { facet: "access", value: "free", re: /\bfree\b/ },
    { facet: "access", value: "premium", re: /\b(premium|paid)\b/ }
  ];
  const FILLER = /\b(find|show|me|i|want|need|looking|look|for|some|any|all|the|a|an|of|on|with|and|to|please|get|give|resources?|materials?|activities|activity|english)\b/g;

  function interpret(raw) {
    let text = ` ${String(raw || "").toLowerCase()} `;
    const set = {};
    // Grade: "grade 8", "gr 8", "g8", "grade eight", "O/L" (11), "A/L" (12 and 13 share a list).
    const g = normaliseQuery(text).join(" ").match(/\bgrade (\d{1,2})\b/);
    if (g) set.grade = g[1];
    else if (/\bo\s*\/\s*l\b|\bordinary level\b/.test(text)) set.grade = "11";
    else if (/\ba\s*\/\s*l\b|\badvanced level\b/.test(text)) set.grade = "12";
    text = text.replace(/\b(grade|gr|g)\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen)\b/g, " ")
      .replace(/\bo\s*\/\s*l\b|\bordinary level\b|\ba\s*\/\s*l\b|\badvanced level\b/g, " ");
    const t = normaliseQuery(text).join(" ").match(/\b(first|second|third) term\b/);
    if (t) set.term = t[1];
    text = text.replace(/\b(term\s*(1|2|3|one|two|three)|(1st|2nd|3rd|first|second|third|one|two|three)\s+term|year end)\b/g, " ");
    // "papers with marking schemes" asks for papers; the answers are what
    // the person hopes comes with them, not a separate kind of resource.
    if (/\bpapers?\b/.test(text) && /\bwith (the )?(marking schemes?|answers?|answer keys?)\b/.test(text)) {
      set.type = "papers";
      text = text.replace(/\bwith (the )?(marking schemes?|answers?|answer keys?)\b/g, " ").replace(/\b(past |model |question |test )?papers?\b/g, " ");
    }
    RULES.forEach((rule) => {
      if (set[rule.facet]) return;
      if (rule.re.test(text)) { set[rule.facet] = rule.value; text = text.replace(rule.re, " "); }
    });
    const rest = text.replace(FILLER, " ").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
    return { set, rest };
  }

  function applyInterpretation() {
    const raw = qInput.value.trim();
    if (raw.split(/\s+/).length < 2) { understood.hidden = true; return false; }
    const { set, rest } = interpret(raw);
    const labels = [];
    Object.keys(set).forEach((k) => {
      const sel = selects[k];
      if (!sel || !Array.from(sel.options).some((o) => o.value === set[k])) return;
      sel.value = set[k];
      labels.push(sel.options[sel.selectedIndex].text);
    });
    if (!labels.length) { understood.hidden = true; return false; }
    qInput.value = rest;
    understood.innerHTML = `Understood as: <strong>${labels.map((l) => l.replace(/[<>&]/g, "")).join(" · ")}</strong>${rest ? ` with the keywords “${rest.replace(/[<>&"]/g, "")}”` : ""}. <button type="button" class="finder__undo">Undo</button>`;
    understood.hidden = false;
    const before = raw;
    understood.querySelector("button").addEventListener("click", () => {
      Object.keys(selects).forEach((k) => { selects[k].value = ""; });
      qInput.value = before;
      understood.hidden = true;
      apply();
      qInput.focus();
    });
    return true;
  }

  function matches(r, s) {
    if (s.grade && !r.grades.includes(Number(s.grade))) return false;
    if (s.area && r.area !== s.area) return false;
    if (s.term && r.term !== s.term) return false;
    if (s.type && r.type !== s.type) return false;
    if (s.for && !(r.audience === s.for || r.audience === "both")) return false;
    if (s.access && r.access !== s.access) return false;
    if (s.q) {
      const words = normaliseQuery(s.q);
      const ok = words.every((w) =>
        /^\d+$/.test(w) ? r.words.includes(w) : r.words.some((h) => h === w || h.startsWith(w)));
      if (!ok) return false;
    }
    return true;
  }

  function apply(resetPaging = true) {
    if (resetPaging) shown = pageSize;
    const s = readState();
    const hits = records.filter((r) => matches(r, s));
    records.forEach((r) => { r.li.hidden = true; });
    hits.slice(0, shown).forEach((r) => { r.li.hidden = false; });

    const n = hits.length;
    const text = n === 1 ? "1 resource" : `${n} resources`;
    countNode.textContent = n === records.length ? `${text} available` : `${text} found`;
    announce(live, text);
    empty.hidden = n !== 0;
    more.hidden = n <= shown;
    if (!more.hidden) more.textContent = `Show more (${n - shown} more)`;
    writeUrl(s);
  }

  /* ------------------------------------------------------------- restore */

  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) qInput.value = params.get("q");
  Object.keys(selects).forEach((k) => {
    const v = params.get(k);
    if (v && Array.from(selects[k].options).some((o) => o.value === v)) selects[k].value = v;
  });

  /* ---------------------------------------------------------------- wire */

  let typing;
  qInput.addEventListener("input", () => { clearTimeout(typing); typing = setTimeout(() => apply(), 180); });
  Object.values(selects).forEach((sel) => sel.addEventListener("change", () => apply()));
  reset.addEventListener("click", () => {
    qInput.value = "";
    Object.values(selects).forEach((sel) => { sel.value = ""; });
    apply();
    qInput.focus();
  });
  more.addEventListener("click", () => {
    const firstNew = records.filter((r) => matches(r, readState()))[shown];
    shown += pageSize;
    apply(false);
    /* Move focus to the first newly shown result so keyboard users continue
       from where the new items begin, not from the top of the list. */
    const link = firstNew && firstNew.li.querySelector("a");
    if (link) link.focus();
  });

  root.classList.add("finder--ready");
  apply();
}

document.querySelectorAll("[data-finder]").forEach(setUp);
