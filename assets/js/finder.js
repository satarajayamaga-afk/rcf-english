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
  form.addEventListener("submit", (e) => e.preventDefault());

  const qId = `finder-q-${++uid}`;
  const qWrap = document.createElement("div");
  qWrap.className = "finder__field finder__field--q";
  qWrap.innerHTML = `<label for="${qId}">Keywords</label><input id="${qId}" type="search" placeholder="e.g. grade 8 term 2 writing" autocomplete="off">`;
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
