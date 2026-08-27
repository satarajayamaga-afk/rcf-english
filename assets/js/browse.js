/* ==========================================================================
   RCF English - resource / past-paper browser

   Progressive enhancement. The build script already writes the full list into
   the page, so it is visible and searchable by search engines without any
   JavaScript. This module adds live filtering, a keyword box, a result count
   and a reset button on top of that list.

   A container opts in like this:

     <div class="browse"
          data-source="papers"
          data-fixed='{"subject":"ol-english"}'
          data-filters="examination,level,year,term,paper,type,medium,source">
   ========================================================================== */

import {
  ROOT,
  esc,
  safeHref,
  loadData,
  el,
  countLabel,
  optionsFrom,
  matchesFilters,
  matchesText,
  queryParams,
  updateQuery,
  formatDate,
  announce
} from "./lib.js";

const LABELS = {
  subject: "Subject",
  examination: "Examination",
  level: "Grade or level",
  year: "Year",
  term: "Term",
  paper: "Paper number",
  type: "Resource type",
  medium: "Medium",
  source: "Source",
  category: "Category",
  skill: "Skill",
  duration: "Lesson length",
  learnerLevel: "Learner level"
};

const TYPE_LABELS = {
  lesson: "Lesson",
  article: "Article",
  "past-paper": "Past paper",
  "model-paper": "Model paper",
  "marking-scheme": "Marking scheme",
  "model-answer": "Model answer",
  worksheet: "Worksheet",
  "lesson-plan": "Lesson plan",
  quiz: "Interactive activity",
  "teaching-guide": "Teaching guide",
  "literature-text": "Literature text",
  "class": "Class",
  "revision-paper": "Revision paper",
  "question-bank": "Question bank",
  guidance: "Examination guidance"
};

function typeLabel(value) {
  return TYPE_LABELS[value] || (value ? String(value) : "Resource");
}

function humanise(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/* ------------------------------------------------------------ rendering */

function renderResult(record) {
  const href = safeHref(record.url || record.file || "");
  const external = /^https?:/i.test(href);
  const title = esc(record.title || "Untitled resource");

  const tags = [];
  if (record.type) tags.push(`<span class="tag tag--type">${esc(typeLabel(record.type))}</span>`);
  if (record.level) tags.push(`<span class="tag tag--level">${esc(humanise(record.level))}</span>`);
  if (record.year) tags.push(`<span class="tag tag--year">${esc(record.year)}</span>`);
  if (record.paper) tags.push(`<span class="tag">Paper ${esc(record.paper)}</span>`);
  if (record.medium) tags.push(`<span class="tag">${esc(humanise(record.medium))}</span>`);

  const meta = [];
  if (record.subject) meta.push(`Subject: ${esc(humanise(record.subject))}`);
  if (record.examination) meta.push(`Examination: ${esc(humanise(record.examination))}`);
  if (record.source) meta.push(`Source: ${esc(record.source)}`);
  if (record.fileSize) meta.push(`File size: ${esc(record.fileSize)}`);
  if (record.updated) meta.push(`Updated: ${esc(formatDate(record.updated))}`);

  const actions = [];
  if (href) {
    actions.push(
      `<a class="btn btn--sm btn--primary${external ? " ext" : ""}" href="${esc(href)}"${
        external ? ' target="_blank" rel="noopener"' : ""
      }>${external ? "Open on the official site" : "Open resource"}</a>`
    );
  }
  if (record.markingScheme) {
    const ms = safeHref(record.markingScheme);
    if (ms) actions.push(`<a class="btn btn--sm btn--outline" href="${esc(ms)}">Marking scheme</a>`);
  }
  if (record.answers) {
    const ans = safeHref(record.answers);
    if (ans) actions.push(`<a class="btn btn--sm btn--outline" href="${esc(ans)}">Model answers</a>`);
  }

  const copyright = record.copyright
    ? `<p class="text-small text-muted mb-0">Copyright status: ${esc(record.copyright)}</p>`
    : "";

  const thumb = record.thumbnail
    ? `<img class="result__thumb" src="${esc(ROOT + record.thumbnail)}" alt="" loading="lazy" width="84" height="112">`
    : `<span class="result__thumb" aria-hidden="true">${esc(typeLabel(record.type))}</span>`;

  return `<li class="result">
      ${thumb}
      <div>
        <div class="tag-row">${tags.join("")}</div>
        <h3>${href ? `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${title}</a>` : title}</h3>
        ${record.description ? `<p>${esc(record.description)}</p>` : ""}
        ${meta.length ? `<div class="result__meta">${meta.map((m) => `<span>${m}</span>`).join("")}</div>` : ""}
        ${actions.length ? `<div class="result__actions">${actions.join("")}</div>` : ""}
        ${copyright}
      </div>
    </li>`;
}

function emptyState(hasRecords) {
  return hasRecords
    ? `<div class="empty-state">
         <h3>No results found</h3>
         <p>No resource matches the filters you have chosen. Try removing a filter, or select <strong>Reset filters</strong> to see everything again.</p>
       </div>`
    : `<div class="empty-state">
         <h3>No resources have been published here yet</h3>
         <p>Approved resources will appear on this page as they are added. In the meantime you can
            <a href="${ROOT}search/">search the whole site</a> or
            <a href="${ROOT}contact/">ask for a particular resource</a>.</p>
       </div>`;
}

/* -------------------------------------------------------------- browser */

function setUpBrowser(container) {
  const source = container.getAttribute("data-source");
  if (!source) return;

  const fixed = JSON.parse(container.getAttribute("data-fixed") || "{}");
  const filterKeys = (container.getAttribute("data-filters") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const listNode = container.querySelector("[data-results]");
  const countNode = container.querySelector("[data-count]");
  const controlsNode = container.querySelector("[data-controls]");
  const liveNode = container.querySelector("[data-live]");
  if (!listNode) return;

  let records = [];
  const state = {};

  function apply() {
    const term = state.q || "";
    const active = {};
    filterKeys.forEach((key) => {
      if (state[key]) active[key] = state[key];
    });

    const matched = records.filter(
      (record) =>
        matchesFilters(record, active) &&
        matchesText(record, term, ["title", "description", "keywords", "subject", "type", "source"])
    );

    listNode.innerHTML = matched.length
      ? matched.map(renderResult).join("")
      : emptyState(records.length > 0);
    listNode.className = matched.length ? "result-list" : "";

    if (countNode) countNode.textContent = countLabel(matched.length);
    announce(liveNode, `${countLabel(matched.length)} shown.`);
    updateQuery(state);
  }

  function buildControls() {
    if (!controlsNode) return;

    const search = `
      <div class="field">
        <label for="browse-q">Search these resources</label>
        <input type="search" id="browse-q" name="q" placeholder="Title, year or keyword" autocomplete="off">
      </div>`;

    const selects = filterKeys
      .map((key) => {
        const values = optionsFrom(records, key);
        if (!values.length) return "";
        const options = values
          .map((value) => `<option value="${esc(value)}">${esc(humanise(value))}</option>`)
          .join("");
        return `
          <div class="field">
            <label for="browse-${esc(key)}">${esc(LABELS[key] || humanise(key))}</label>
            <select id="browse-${esc(key)}" name="${esc(key)}">
              <option value="">All</option>
              ${options}
            </select>
          </div>`;
      })
      .filter(Boolean)
      .join("");

    controlsNode.innerHTML = `
      <div class="toolbar__row">
        ${search}
        ${selects ? `<div class="filters">${selects}</div>` : ""}
        <div class="btn-row">
          <button type="button" class="btn btn--sm btn--outline" data-reset>Reset filters</button>
        </div>
      </div>`;

    const qInput = el("browse-q");
    if (qInput) {
      qInput.value = state.q || "";
      let timer = null;
      qInput.addEventListener("input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          state.q = qInput.value.trim();
          apply();
        }, 180);
      });
    }

    filterKeys.forEach((key) => {
      const select = el(`browse-${key}`);
      if (!select) return;
      if (state[key]) select.value = state[key];
      select.addEventListener("change", () => {
        state[key] = select.value;
        apply();
      });
    });

    const reset = controlsNode.querySelector("[data-reset]");
    if (reset) {
      reset.addEventListener("click", () => {
        Object.keys(state).forEach((key) => delete state[key]);
        controlsNode.querySelectorAll("select").forEach((s) => {
          s.value = "";
        });
        if (qInput) qInput.value = "";
        apply();
        if (qInput) qInput.focus();
      });
    }
  }

  loadData(source).then((data) => {
    if (!data) return;
    const all = Array.isArray(data) ? data : data.items || [];
    records = all.filter((record) => matchesFilters(record, fixed) && record.published !== false);

    const params = queryParams();
    filterKeys.concat(["q"]).forEach((key) => {
      if (params[key]) state[key] = params[key];
    });

    buildControls();
    apply();
  });
}

document.querySelectorAll(".browse").forEach(setUpBrowser);
