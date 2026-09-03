/* ==========================================================================
   RCF English - site-wide search

   Searches one index file (data/search-index.json) that the build script
   writes from every page on the site plus every record in the data files.
   Each result says what kind of thing it is.
   ========================================================================== */

import { ROOT, esc, safeHref, el, countLabel, countLabel as count, announce, normaliseQuery } from "./lib.js";

const KIND_LABEL = {
  page: "Page",
  lesson: "Lesson",
  article: "Article",
  section: "Section",
  "past-paper": "Past paper",
  "model-paper": "Model paper",
  "marking-scheme": "Marking scheme",
  "model-answer": "Model answer",
  worksheet: "Worksheet",
  "lesson-plan": "Lesson plan",
  "teacher-resource": "Teacher resource",
  quiz: "Interactive activity",
  "literature-text": "Literature text",
  class: "Academy course",
  guidance: "Examination guidance",
  policy: "Policy"
};

const form = el("site-search-form");
const input = el("site-search-input");
const resultsNode = el("search-results");
const countNode = el("search-count");
const liveNode = el("search-live");
const summaryNode = el("search-summary");
const kindFilter = el("search-kind");
const gradeFilter = el("search-grade");
const termFilter = el("search-term");
const yearFilter = el("search-year");
const provinceFilter = el("search-province");
const resetButton = el("search-reset");
const facetControls = [gradeFilter, termFilter, yearFilter, provinceFilter];

let index = [];
let ready = false;

/* ------------------------------------------------------------- matching */

/* People do not type the way filenames read. "Grade 7 second term", "gr 7
   term 2" and "Grade Seven 2nd Term" are the same request, and a search that
   only does raw substring matching answers none of them well: it also matches
   "ol" inside "school" and "7" inside "2017", which is worse than missing a
   paper because it looks like an answer. The query is normalised to one
   canonical form first, then matched a word at a time. */

/* The normaliser itself lives in lib.js so that this page and the browse
   lists cannot drift apart; they had, and the browse lists knew none of the
   synonyms. */
const normalise = normaliseQuery;
/** The words of an entry, for word-aware matching. */
function entryWords(entry) {
  if (entry._words) return entry._words;
  const text = [entry.title, entry.description, entry.keywords, entry.section, entry.level]
    .filter(Boolean).join(" ").toLowerCase();
  entry._words = text.replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean);
  entry._titleWords = String(entry.title || "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean);
  return entry._words;
}

/**
 * A query word matches an entry word when it is that word or the start of it,
 * so "west" finds "western". A purely numeric word must match exactly: "7" is
 * grade 7, never the 7 inside 2017, and "2" is not 2025.
 */
function wordMatches(queryWord, words) {
  if (/^\d+$/.test(queryWord)) return words.includes(queryWord);
  return words.some((w) => w === queryWord || w.startsWith(queryWord));
}

function score(entry, words) {
  const all = entryWords(entry);
  const titleWords = entry._titleWords || [];
  let total = 0;
  for (const word of words) {
    if (!wordMatches(word, all)) return 0;          // every word must be present
    if (titleWords.includes(word)) total += 30;
    else if (titleWords.some((w) => w.startsWith(word))) total += 18;
    else total += 6;
  }
  // A paper answering a structured question should outrank a page that merely
  // mentions the words.
  if (entry.grade || entry.term || entry.year) total += 12;
  return total;
}

function passesFacets(entry, f) {
  // A facet only ever narrows entries that carry that field. A page has no
  // grade, so a grade filter would silently delete the whole of the rest of
  // the site; instead, unfielded entries are kept out of faceted results only
  // when a facet is active, and paper fields are compared case-insensitively.
  if (f.grade && String(entry.grade || "") !== f.grade) return false;
  if (f.year && String(entry.year || "") !== f.year) return false;
  if (f.term && String(entry.term || "") !== f.term) return false;
  if (f.type && String(entry.paperType || entry.kind || "") !== f.type) return false;
  // The province control is a dropdown whose values come from the papers
  // themselves, so this compares exactly. A substring test here would make
  // "Western Province" quietly include every North Western paper.
  if (f.province && String(entry.province || "") !== f.province) return false;
  return true;
}

function search(term, kind, facets) {
  const words = normalise(term);
  const f = facets || {};
  const faceted = Boolean(f.grade || f.year || f.term || f.province || f.type);
  if (!words.length && !kind && !faceted) return [];
  return index
    .filter((entry) => (kind ? entry.kind === kind : true))
    .filter((entry) => (faceted ? passesFacets(entry, f) : true))
    .map((entry) => ({ entry, rank: words.length ? score(entry, words) : 1 }))
    .filter((row) => row.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 300)
    .map((row) => row.entry);
}

/* ------------------------------------------------------------ rendering */

function renderEntry(entry) {
  const href = safeHref(entry.url || "");
  const external = /^https?:/i.test(href);
  const url = external ? href : ROOT + href;
  const kind = KIND_LABEL[entry.kind] || "Page";

  return `<li class="result">
      <span class="result__thumb" aria-hidden="true">${esc(kind)}</span>
      <div>
        <div class="tag-row">
          <span class="tag tag--type">${esc(kind)}</span>
          ${entry.section ? `<span class="tag">${esc(entry.section)}</span>` : ""}
          ${entry.level ? `<span class="tag tag--level">${esc(entry.level)}</span>` : ""}
        </div>
        <h3><a href="${esc(url)}"${external ? ' target="_blank" rel="noopener" class="ext"' : ""}>${esc(
    entry.title
  )}</a></h3>
        ${entry.description ? `<p>${esc(entry.description)}</p>` : ""}
      </div>
    </li>`;
}

function render(term, kind, facets) {
  if (!resultsNode) return;

  if (!ready) {
    resultsNode.innerHTML = `<p class="text-muted">Loading the search index…</p>`;
    return;
  }

  const f = facets || {};
  const anyFacet = Boolean(f.grade || f.year || f.term || f.province || f.type);
  if (!term && !kind && !anyFacet) {
    resultsNode.innerHTML = "";
    resultsNode.className = "";
    if (countNode) countNode.textContent = "";
    if (summaryNode) summaryNode.hidden = true;
    return;
  }

  const matches = search(term, kind, f);
  if (summaryNode) summaryNode.hidden = false;

  if (!matches.length) {
    resultsNode.className = "";
    resultsNode.innerHTML = `<div class="empty-state">
        <h3>No results found</h3>
        <p>Nothing on the site matches <strong>${esc(term)}</strong>${
      kind ? ` in <strong>${esc(KIND_LABEL[kind] || kind)}</strong>` : ""
    }. Try a shorter word, check the spelling, or browse a section from the menu.</p>
        <p class="mt-4"><a class="btn btn--outline" href="${ROOT}how-to-use/">How to find things on this site</a></p>
      </div>`;
    if (countNode) countNode.textContent = "0 results";
    announce(liveNode, "No results found.");
    return;
  }

  resultsNode.className = "result-list";
  resultsNode.innerHTML = matches.map(renderEntry).join("");
  if (countNode) countNode.textContent = count(matches.length);
  announce(liveNode, `${count(matches.length)} found.`);
}

/* ------------------------------------------------------------------ run */

function currentTerm() {
  return input ? input.value.trim() : "";
}

function currentKind() {
  return kindFilter ? kindFilter.value : "";
}

function currentFacets() {
  return {
    grade: gradeFilter ? gradeFilter.value : "",
    term: termFilter ? termFilter.value : "",
    year: yearFilter ? yearFilter.value : "",
    province: provinceFilter ? provinceFilter.value : ""
  };
}

function update() {
  const term = currentTerm();
  const kind = currentKind();
  const facets = currentFacets();
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (kind) params.set("kind", kind);
  for (const key of ["grade", "term", "year", "province"]) {
    if (facets[key]) params.set(key, facets[key]);
  }
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  render(term, kind, facets);
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}

if (input) {
  let timer = null;
  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 200);
  });
}

if (kindFilter) kindFilter.addEventListener("change", update);
for (const control of facetControls) {
  if (control) control.addEventListener("change", update);
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    if (input) input.value = "";
    if (kindFilter) kindFilter.value = "";
    for (const control of facetControls) { if (control) control.value = ""; }
    update();
    if (input) input.focus();
  });
}

fetch(`${ROOT}data/search-index.json`, { cache: "no-cache" })
  .then((response) => (response.ok ? response.json() : []))
  .then((data) => {
    index = Array.isArray(data) ? data : [];
    ready = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const kind = params.get("kind") || "";
    if (input && q) input.value = q;
    if (kindFilter && kind) kindFilter.value = kind;
    const facets = {};
    for (const [key, control] of [["grade", gradeFilter], ["term", termFilter], ["year", yearFilter], ["province", provinceFilter]]) {
      const v = params.get(key) || "";
      facets[key] = v;
      if (control && v) control.value = v;
    }
    render(q, kind, facets);
  })
  .catch(() => {
    ready = true;
    if (resultsNode) {
      resultsNode.innerHTML = `<div class="empty-state"><h3>Search is unavailable</h3>
        <p>The search index could not be loaded. Please use the menu to browse, or
        <a href="${ROOT}contact/">report the problem</a>.</p></div>`;
    }
  });
