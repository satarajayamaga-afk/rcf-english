/* ==========================================================================
   RCF English - lesson plan finder

   The build writes every plan into the page as a grid of small cards, grouped
   by grade, so the list works and can be read by search engines with no
   script at all. This adds a search box and, where there is more than one
   grade, a grade choice, on top of that list.

   Matching is forgiving on purpose. Every word typed must appear somewhere in
   a card - its grade, unit, title, focus or book activity - but a word may be
   the start of a longer one, so "past" finds "past tense" and "continu" finds
   "present continuous". A filter that demands exact words is the kind that
   returns nothing and gets abandoned.

   ?grade=grade-6&q=past opens with those choices made, so a result can be
   shared or bookmarked.
   ========================================================================== */

// Words that say nothing about which plan is wanted. "tense" is here because
// teachers say "past tense" where the plans say "simple past": with "tense"
// required, the most natural search in the list found nothing.
const STOP = new Set(["a", "an", "the", "and", "of", "for", "to", "in", "on", "with", "lesson", "lessons", "plan", "plans", "tense", "tenses"]);

function words(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

function setUp(root) {
  const groups = Array.from(root.querySelectorAll(".planfind__group"));
  const cards = Array.from(root.querySelectorAll(".pthumb")).map((li) => ({
    li,
    group: li.closest(".planfind__group").dataset.group,
    // Normalised the same way as the query, so "am/is/are" and "(Activity 7)"
    // are found as the separate words they are.
    haystack: " " + words(li.dataset.search).join(" ") + " "
  }));
  const empty = root.querySelector(".planfind__empty");
  const total = cards.length;

  // ---- the controls
  const bar = document.createElement("form");
  bar.className = "planfind__bar";
  bar.setAttribute("role", "search");
  bar.addEventListener("submit", (e) => e.preventDefault());

  const uid = Math.random().toString(36).slice(2, 8);
  const qWrap = document.createElement("div");
  qWrap.className = "field planfind__q";
  qWrap.innerHTML = `<label for="pf-q-${uid}">Find a plan</label>` +
    `<input type="search" id="pf-q-${uid}" autocomplete="off" placeholder="A unit, a grammar point or a word from the book">`;
  bar.appendChild(qWrap);
  const q = qWrap.querySelector("input");

  let grade = null;
  if (groups.length > 1) {
    const gWrap = document.createElement("div");
    gWrap.className = "field planfind__g";
    gWrap.innerHTML = `<label for="pf-g-${uid}">Grade</label><select id="pf-g-${uid}"><option value="">All grades</option></select>`;
    grade = gWrap.querySelector("select");
    groups.forEach((g) => grade.appendChild(new Option(g.dataset.label, g.dataset.group)));
    bar.appendChild(gWrap);
  }

  const count = document.createElement("p");
  count.className = "planfind__total";
  count.setAttribute("aria-live", "polite");
  bar.appendChild(count);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "btn btn--sm btn--outline planfind__clear";
  clear.textContent = "Clear";
  clear.hidden = true;
  bar.appendChild(clear);

  root.insertBefore(bar, root.firstChild);

  // ---- filtering
  function apply(save = true) {
    let text = q.value;
    let g = grade ? grade.value : "";
    // "grade 6 past tense": the grade is a choice, not a word to look for -
    // otherwise Unit 6 of every other grade would match as well.
    const named = /\bgrade\s*(\d{1,2})\b/i.exec(text);
    if (named && grade && !g) {
      const hit = groups.find((x) => x.dataset.label.toLowerCase() === "grade " + named[1]);
      if (hit) { g = hit.dataset.group; text = text.replace(named[0], " "); }
    }
    // "unit 4" and "activity 4" are one thing each, not two words: on its own
    // the 4 also matched "Activity 4" in every other unit.
    const phrases = [];
    text = text.replace(/\b(unit|activity)\s*(\d{1,2})\b/gi, (m, kind, n) => { phrases.push(` ${kind.toLowerCase()} ${n} `); return " "; });
    const want = words(text);
    let shown = 0;
    cards.forEach((c) => {
      const ok = (!g || c.group === g) &&
        phrases.every((p) => c.haystack.includes(p)) &&
        want.every((w) => c.haystack.includes(" " + w));
      c.li.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach((grp) => { grp.hidden = !grp.querySelector(".pthumb:not([hidden])"); });
    empty.hidden = shown !== 0;
    count.textContent = shown === total ? `${total} plans` : `${shown} of ${total} plans`;
    const chosen = grade ? grade.value : "";
    clear.hidden = !q.value && !chosen;
    if (save) {
      // The address records what the reader did - the words and the grade
      // they chose - so opening it again gives the same list.
      const url = new URL(window.location.href);
      if (q.value.trim()) url.searchParams.set("q", q.value.trim()); else url.searchParams.delete("q");
      if (chosen) url.searchParams.set("grade", chosen); else url.searchParams.delete("grade");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }

  let typing;
  q.addEventListener("input", () => { clearTimeout(typing); typing = setTimeout(apply, 120); });
  if (grade) grade.addEventListener("change", () => apply());
  clear.addEventListener("click", () => {
    q.value = "";
    if (grade) grade.value = "";
    apply();
    q.focus();
  });

  // ---- restore from the address
  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) q.value = params.get("q");
  if (grade && params.get("grade") && groups.some((g) => g.dataset.group === params.get("grade"))) grade.value = params.get("grade");

  root.classList.add("planfind--ready");
  apply(false);
}

document.querySelectorAll("[data-planfind]").forEach(setUp);
