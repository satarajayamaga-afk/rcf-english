/* ==========================================================================
   RCF English - past paper library

   The build script writes every section and every paper card into the page.
   With the script switched off the page is a plain stack of sections with
   anchor links at the top: everything is reachable, nothing is hidden.

   This module turns that stack into a chooser:

     Select Grade or Literature  ->  optionally enter a year  ->  view or
     download.

   It deliberately does NOT do full-text searching. The old page did, and a
   paper the visitor could see in the collection would vanish because the
   words they typed were not the words in the filename. Choosing a section
   here always shows everything in it.
   ========================================================================== */

const root = document.querySelector("[data-paperlib]");

if (root) setUpLibrary(root);

function setUpLibrary(container) {
  const nav = container.querySelector(".paperlib__nav");
  const tabs = Array.from(container.querySelectorAll("[data-section]"));
  const panels = Array.from(container.querySelectorAll("[data-panel]"));
  const filter = container.querySelector("[data-paperlib-filter]");
  const heading = container.querySelector("[data-paperlib-heading]");
  const countNode = container.querySelector("[data-paperlib-count]");
  const yearInput = container.querySelector("[data-paperlib-year]");
  const yearChips = container.querySelector("[data-paperlib-years]");
  const live = container.querySelector("[data-paperlib-live]");
  // A narrowed page - "Model papers", "O/L Literature" - may have only one
  // section worth showing. It then has no chooser, and the papers are on
  // screen from the start.
  const single = container.getAttribute("data-single");
  if (!panels.length || (!tabs.length && !single)) return;

  const byKey = new Map();
  panels.forEach((panel) => {
    const key = panel.getAttribute("data-panel");
    byKey.set(key, {
      key,
      panel,
      label: (panel.querySelector(".paperlib__panel-title") || {}).textContent || key,
      groups: Array.from(panel.querySelectorAll("[data-year-group]")),
      cards: Array.from(panel.querySelectorAll("[data-paper-card]")),
      noYear: panel.querySelector("[data-paperlib-noyear]"),
      noYearText: panel.querySelector("[data-paperlib-noyear-text]")
    });
  });

  // "" means no filter at all. UNDATED is the filter that asks for the papers
  // whose year is not printed on them - a real choice, and a different thing
  // from having chosen nothing.
  const UNDATED = "none";

  const state = { section: null, year: "", term: "", kind: "", place: "" };

  const facetsNode = container.querySelector("[data-paperlib-facets]");
  const FACETS = [
    { key: "term", label: "School term", attr: "term", names: { first: "First term", second: "Second term", third: "Third term" } },
    { key: "kind", label: "Kind of paper", attr: "kind", names: { past: "Past papers", model: "Model papers", answers: "Marking schemes and answers", revision: "Revision papers and question banks", other: "Other papers" } },
    { key: "place", label: "Province, zone or school", attr: "place", names: null }
  ];
  const PLACE_GROUPS = { provincial: "Provinces", zonal: "Zones and divisions", school: "Schools" };
  const facetSelects = {};

  /* ------------------------------------------------------------- helpers */

  function papersLabel(n) {
    return n === 1 ? "1 paper" : `${n} papers`;
  }

  function yearName(value) {
    return value === UNDATED ? "Year not specified" : value;
  }

  // Years actually present in a section, newest first. An undated paper is
  // offered as its own choice rather than being made unreachable.
  function yearsIn(entry) {
    const seen = new Set();
    entry.groups.forEach((g) => seen.add(g.getAttribute("data-year-group") || ""));
    const dated = [...seen].filter(Boolean).sort((a, b) => b.localeCompare(a));
    return seen.has("") ? dated.concat([UNDATED]) : dated;
  }

  function announce(message) {
    if (live) live.textContent = message;
  }

  /* -------------------------------------------------------------- render */

  function showSection(key, options) {
    const entry = byKey.get(key);
    if (!entry) return;
    const opts = options || {};
    state.section = key;

    panels.forEach((p) => {
      p.hidden = p !== entry.panel;
    });
    tabs.forEach((t) => {
      const on = t.getAttribute("data-section") === key;
      t.classList.toggle("is-current", on);
      if (on) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });

    if (filter) filter.hidden = false;
    if (heading) heading.textContent = entry.label;
    // With the script running, the filter panel names the section, so the
    // panel's own heading would say it twice. It stays in the page for
    // screen readers and for the no-script stack of sections.
    container.classList.add("is-live");

    buildYearChips(entry);
    buildFacets(entry);
    if (yearInput) yearInput.value = state.year === UNDATED ? "" : state.year;
    applyFilters();

    if (!opts.silent) {
      // Move focus to the section itself so a keyboard or screen-reader user
      // lands on the papers, not back at the top of the page.
      entry.panel.focus({ preventScroll: true });
      if (opts.scroll !== false) {
        const top = (filter || entry.panel).getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      }
    }
    writeUrl();
  }

  function buildYearChips(entry) {
    if (!yearChips) return;
    const years = yearsIn(entry);
    if (years.length < 2) {
      yearChips.innerHTML = "";
      yearChips.hidden = true;
      return;
    }
    yearChips.hidden = false;
    yearChips.innerHTML = years
      .map((y) => {
        const on = state.year === y ? " is-current" : "";
        const pressed = state.year === y ? "true" : "false";
        return `<button type="button" class="paperlib__year-chip${on}" aria-pressed="${pressed}" data-year-pick="${y}">${yearName(y)}</button>`;
      })
      .join("");
  }

  // The term, kind and place choices are built from the papers actually in
  // the section, so a choice can never lead to an empty page on its own. A
  // filter with only one value in the section says nothing and is left out.
  function buildFacets(entry) {
    if (!facetsNode) return;
    facetsNode.innerHTML = "";
    Object.keys(facetSelects).forEach((k) => delete facetSelects[k]);

    FACETS.forEach((f) => {
      const counts = new Map();
      const types = new Map();
      entry.cards.forEach((card) => {
        const v = card.getAttribute(`data-${f.attr}`) || "";
        if (!v) return;
        counts.set(v, (counts.get(v) || 0) + 1);
        if (f.key === "place") types.set(v, card.getAttribute("data-place-type") || "");
      });
      // A value asked for in the address bar that this section does not have
      // is dropped, rather than silently emptying the page.
      if (state[f.key] && !counts.has(state[f.key])) state[f.key] = "";
      if (counts.size < 2) return;

      const id = `paperlib-${f.key}`;
      const wrap = document.createElement("div");
      wrap.className = "field paperlib__facet";
      const lab = document.createElement("label");
      lab.htmlFor = id;
      lab.textContent = f.label;
      const sel = document.createElement("select");
      sel.id = id;
      sel.appendChild(new Option("All", ""));

      const option = (v) => new Option(`${f.names ? f.names[v] || v : v} (${counts.get(v)})`, v);
      if (f.names) {
        Object.keys(f.names).filter((v) => counts.has(v)).forEach((v) => sel.appendChild(option(v)));
      } else {
        // Places grouped by who set the paper; anything unlabelled goes last.
        const groups = new Map();
        [...counts.keys()].sort((a, b) => a.localeCompare(b)).forEach((v) => {
          const g = PLACE_GROUPS[types.get(v)] || "Other";
          if (!groups.has(g)) groups.set(g, []);
          groups.get(g).push(v);
        });
        [...Object.values(PLACE_GROUPS), "Other"].forEach((g) => {
          if (!groups.has(g)) return;
          const og = document.createElement("optgroup");
          og.label = g;
          groups.get(g).forEach((v) => og.appendChild(option(v)));
          sel.appendChild(og);
        });
      }
      sel.value = state[f.key];
      sel.addEventListener("change", () => {
        state[f.key] = sel.value;
        applyFilters();
      });
      wrap.append(lab, sel);
      facetsNode.appendChild(wrap);
      facetSelects[f.key] = sel;
    });
    facetsNode.hidden = !facetsNode.children.length;
  }

  function cardMatches(card) {
    return FACETS.every((f) => !state[f.key] || card.getAttribute(`data-${f.attr}`) === state[f.key]);
  }

  function applyFilters() {
    const entry = byKey.get(state.section);
    if (!entry) return;
    const want = state.year;
    const picked = FACETS.filter((f) => state[f.key]);

    let shown = 0;
    entry.groups.forEach((group) => {
      const y = group.getAttribute("data-year-group") || "";
      // An empty filter means every year, which is the normal state.
      const yearOk = !want || (want === UNDATED ? y === "" : y === want);
      let inGroup = 0;
      group.querySelectorAll("[data-paper-card]").forEach((card) => {
        const ok = yearOk && cardMatches(card);
        card.hidden = !ok;
        if (ok) inGroup += 1;
      });
      group.hidden = inGroup === 0;
      const countNode2 = group.querySelector(".paperlib__year-count");
      if (countNode2) {
        if (!countNode2.dataset.all) countNode2.dataset.all = countNode2.textContent;
        countNode2.textContent = picked.length ? papersLabel(inGroup) : countNode2.dataset.all;
      }
      shown += inGroup;
    });

    const filtered = Boolean(want) || picked.length > 0;
    const nothing = filtered && shown === 0;
    if (entry.noYear) entry.noYear.hidden = !nothing;
    if (nothing && entry.noYearText) {
      entry.noYearText.textContent = want && !picked.length
        ? `${entry.label} has nothing from ${yearName(want)}. The years available in this section are: ${yearsIn(entry).map(yearName).join(", ")}.`
        : "Try removing one of the choices above.";
    }

    const parts = [];
    picked.forEach((f) => {
      const v = state[f.key];
      parts.push(f.names ? (f.names[v] || v).toLowerCase() : v);
    });
    if (want) parts.push(want === UNDATED ? "no year printed" : want);
    const label = filtered
      ? `${papersLabel(shown)}: ${parts.join(", ")}`
      : `${papersLabel(entry.cards.length)} in this section`;
    if (countNode) countNode.textContent = label;

    container.querySelectorAll("[data-paperlib-clear]").forEach((b) => {
      b.hidden = !filtered;
    });

    if (yearChips) {
      yearChips.querySelectorAll("[data-year-pick]").forEach((chip) => {
        const on = chip.getAttribute("data-year-pick") === want;
        chip.classList.toggle("is-current", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    announce(`${entry.label}. ${label}.`);
    writeUrl();
  }

  function setYear(value) {
    // Only a four-figure year filters. Anything else is treated as "show
    // everything", so a half-typed year never empties the page.
    const raw = String(value || "").trim();
    state.year = /^\d{4}$/.test(raw) ? raw : "";
    applyFilters();
  }

  function clearYear() {
    state.year = "";
    FACETS.forEach((f) => { state[f.key] = ""; if (facetSelects[f.key]) facetSelects[f.key].value = ""; });
    if (yearInput) yearInput.value = "";
    applyFilters();
    if (yearInput) yearInput.focus();
  }

  /* ---------------------------------------------------------------- url */

  function writeUrl() {
    if (!window.history || !window.history.replaceState) return;
    const params = new URLSearchParams(window.location.search);
    // On a page with no chooser the section is the page, so naming it in the
    // address bar would add noise and nothing else.
    if (state.section && !single) params.set("section", state.section);
    else params.delete("section");
    ["year", ...FACETS.map((f) => f.key)].forEach((k) => {
      if (state[k]) params.set(k, state[k]);
      else params.delete(k);
    });
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? "?" + query : "") + window.location.hash
    );
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const hash = (window.location.hash || "").replace(/^#papers-/, "");
    const section = params.get("section") || (hash && byKey.has(hash) ? hash : "");
    const year = params.get("year") || "";
    return {
      section: byKey.has(section) ? section : null,
      year: /^\d{4}$/.test(year) || year === UNDATED ? year : "",
      term: params.get("term") || "",
      kind: params.get("kind") || "",
      place: params.get("place") || ""
    };
  }

  /* ----------------------------------------------------------- listeners */

  if (nav) {
    nav.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-section]");
      if (!tab) return;
      event.preventDefault();
      showSection(tab.getAttribute("data-section"));
    });
  }

  if (yearChips) {
    yearChips.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-year-pick]");
      if (!chip) return;
      const value = chip.getAttribute("data-year-pick");
      // A second click on the current chip clears it.
      state.year = state.year === value ? "" : value;
      // The typed box only ever holds a real year, never the undated marker.
      if (yearInput) yearInput.value = state.year === UNDATED ? "" : state.year;
      applyFilters();
    });
  }

  if (yearInput) {
    let timer = null;
    yearInput.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setYear(yearInput.value), 160);
    });
    yearInput.addEventListener("search", () => setYear(yearInput.value));
    yearInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setYear(yearInput.value);
      }
    });
  }

  container.addEventListener("click", (event) => {
    if (event.target.closest("[data-paperlib-clear]")) clearYear();
  });

  window.addEventListener("popstate", () => {
    const next = readUrl();
    state.year = next.year;
    FACETS.forEach((f) => { state[f.key] = next[f.key]; });
    if (next.section) showSection(next.section, { scroll: false });
  });

  /* ------------------------------------------------------------- startup */

  const start = readUrl();
  state.year = start.year;
  FACETS.forEach((f) => { state[f.key] = start[f.key]; });

  if (single) {
    // Nothing to choose, so nothing is hidden and the page does not jump.
    showSection(single, { silent: true });
  } else if (start.section) {
    showSection(start.section, { scroll: Boolean(window.location.hash) });
  } else {
    // No section asked for: hide every panel and let the chooser do its job.
    // The nav is the whole interface at this point, which is the intention.
    panels.forEach((p) => {
      p.hidden = true;
    });
    if (filter) filter.hidden = true;
    container.classList.add("is-choosing");
  }

  container.addEventListener("click", () => container.classList.remove("is-choosing"), { once: true });
}
