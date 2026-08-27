/* ==========================================================================
   RCF English - site-wide search

   Searches one index file (data/search-index.json) that the build script
   writes from every page on the site plus every record in the data files.
   Each result says what kind of thing it is.
   ========================================================================== */

import { ROOT, esc, safeHref, el, countLabel, countLabel as count, announce } from "./lib.js";

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
  class: "RCF class",
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
const resetButton = el("search-reset");

let index = [];
let ready = false;

/* ------------------------------------------------------------- matching */

function score(entry, words) {
  const title = (entry.title || "").toLowerCase();
  const text = `${title} ${(entry.description || "").toLowerCase()} ${(entry.keywords || "").toLowerCase()} ${(
    entry.section || ""
  ).toLowerCase()}`;

  let total = 0;
  for (const word of words) {
    if (!text.includes(word)) return 0;
    if (title === word) total += 60;
    else if (title.startsWith(word)) total += 30;
    else if (title.includes(word)) total += 18;
    else total += 5;
  }
  return total;
}

function search(term, kind) {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length && !kind) return [];
  return index
    .filter((entry) => (kind ? entry.kind === kind : true))
    .map((entry) => ({ entry, rank: words.length ? score(entry, words) : 1 }))
    .filter((row) => row.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 80)
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

function render(term, kind) {
  if (!resultsNode) return;

  if (!ready) {
    resultsNode.innerHTML = `<p class="text-muted">Loading the search index…</p>`;
    return;
  }

  if (!term && !kind) {
    resultsNode.innerHTML = "";
    resultsNode.className = "";
    if (countNode) countNode.textContent = "";
    if (summaryNode) summaryNode.hidden = true;
    return;
  }

  const matches = search(term, kind);
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

function update() {
  const term = currentTerm();
  const kind = currentKind();
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (kind) params.set("kind", kind);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  render(term, kind);
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

if (resetButton) {
  resetButton.addEventListener("click", () => {
    if (input) input.value = "";
    if (kindFilter) kindFilter.value = "";
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
    render(q, kind);
  })
  .catch(() => {
    ready = true;
    if (resultsNode) {
      resultsNode.innerHTML = `<div class="empty-state"><h3>Search is unavailable</h3>
        <p>The search index could not be loaded. Please use the menu to browse, or
        <a href="${ROOT}contact/">report the problem</a>.</p></div>`;
    }
  });
