/* ==========================================================================
   RCF English - printable flashcard maker

   The build writes every word set into the page as a plain table, so with
   JavaScript off a teacher can still read and copy the words. This module
   reads those tables and adds a maker on top:

     choose a set (or type your own words)  ->  choose the card style  ->
     see the cards  ->  print, cut and fold

   Two styles:
     fold     word on one half, meaning on the other; fold on the dotted line
     word     the word alone, as large as the card allows, for games and drills

   Nothing is sent anywhere. Typed words stay in this browser only.
   ========================================================================== */

import { esc } from "./lib.js";

const OWN = "__own";
const DRAFT_KEY = "rcf-flashcards-own";

function readSets(root) {
  return Array.from(root.querySelectorAll("[data-set]")).map((d) => ({
    id: d.dataset.set,
    group: d.dataset.group,
    label: d.dataset.label,
    pairs: Array.from(d.querySelectorAll("tr")).map((tr) => [
      tr.querySelector("th").textContent.trim(),
      (tr.querySelector("td") || { textContent: "" }).textContent.trim()
    ])
  }));
}

/* "word = meaning", "word - meaning", "word: meaning" or just "word". */
function parseOwn(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 60)
    .map((line) => {
      const m = line.match(/^(.+?)\s*(?:=|\s-\s|:)\s*(.*)$/);
      return m ? [m[1].trim(), m[2].trim()] : [line, ""];
    });
}

function loadDraft() {
  try { return window.localStorage.getItem(DRAFT_KEY) || ""; } catch (e) { return ""; }
}

function saveDraft(text) {
  try { window.localStorage.setItem(DRAFT_KEY, text); } catch (e) { /* not remembered */ }
}

function cardHtml(pair, style) {
  const [word, meaning] = pair;
  if (style === "word" || !meaning) {
    return `<li class="fcard fcard--word"><span class="fcard__word">${esc(word)}</span></li>`;
  }
  return `
    <li class="fcard fcard--fold">
      <span class="fcard__half fcard__half--front"><span class="fcard__word">${esc(word)}</span></span>
      <span class="fcard__half fcard__half--back"><span class="fcard__back"><span class="fcard__meaning">${esc(meaning)}</span><span class="fcard__small">${esc(word)}</span></span></span>
    </li>`;
}

function setUp(root) {
  const sets = readSets(root);
  const app = root.querySelector("[data-flash-app]");
  const setsNode = root.querySelector("[data-flash-sets]");

  const groups = [...new Set(sets.map((s) => s.group))];
  const options = groups
    .map((g) => `<optgroup label="${esc(g)}">${sets
      .filter((s) => s.group === g)
      .map((s) => `<option value="${esc(s.id)}">${esc(s.label)} (${s.pairs.length})</option>`)
      .join("")}</optgroup>`)
    .join("");

  app.innerHTML = `
    <div class="flash__controls">
      <div class="field">
        <label for="flash-set">Word set</label>
        <select id="flash-set" data-flash-choice>
          <option value="${OWN}">My own words</option>
          ${options}
        </select>
      </div>
      <fieldset class="flash__style">
        <legend>Card style</legend>
        <label><input type="radio" name="flash-style" value="fold" checked> Word and meaning (fold in half)</label>
        <label><input type="radio" name="flash-style" value="word"> Word only, large</label>
      </fieldset>
      <div class="field">
        <label for="flash-size">Cards on each page</label>
        <select id="flash-size" data-flash-size>
          <option value="8">8 (large)</option>
          <option value="12" selected>12</option>
          <option value="16">16 (small)</option>
        </select>
      </div>
    </div>
    <div class="field flash__own" data-flash-own-wrap>
      <label for="flash-own">Type one card on each line, as <em>word = meaning</em>. Up to 60 cards.</label>
      <textarea id="flash-own" rows="6" data-flash-own placeholder="happy = feeling good&#10;brave = not afraid&#10;quickly"></textarea>
    </div>
    <div class="flash__bar">
      <p class="flash__count" role="status" aria-live="polite" data-flash-count></p>
      <button type="button" class="btn btn--accent" data-flash-print>Print the cards</button>
    </div>
    <p class="text-small text-muted">Print on thick paper if you can. Cut along the solid lines; for word-and-meaning cards, fold along the dotted line so the meaning is on the back.</p>
    <ul class="flash__preview" data-flash-preview aria-label="Card preview"></ul>`;
  app.hidden = false;
  setsNode.hidden = true;
  root.classList.add("flash--ready");

  const choice = app.querySelector("[data-flash-choice]");
  const size = app.querySelector("[data-flash-size]");
  const own = app.querySelector("[data-flash-own]");
  const ownWrap = app.querySelector("[data-flash-own-wrap]");
  const count = app.querySelector("[data-flash-count]");
  const preview = app.querySelector("[data-flash-preview]");
  const printBtn = app.querySelector("[data-flash-print]");

  own.value = loadDraft();
  /* Start on a ready-made set unless the teacher has words in progress. */
  if (!own.value && sets.length) choice.value = sets[0].id;

  function current() {
    const style = app.querySelector("input[name=flash-style]:checked").value;
    const pairs = choice.value === OWN ? parseOwn(own.value) : (sets.find((s) => s.id === choice.value) || { pairs: [] }).pairs;
    const label = choice.value === OWN ? "My own words" : (sets.find((s) => s.id === choice.value) || {}).label;
    return { style, pairs, label, perPage: Number(size.value) || 12 };
  }

  function update() {
    const c = current();
    ownWrap.hidden = choice.value !== OWN;
    preview.className = `flash__preview flash__preview--${c.style} flash__preview--n${c.perPage}`;
    preview.innerHTML = c.pairs.map((p) => cardHtml(p, c.style)).join("");
    const pages = Math.max(1, Math.ceil(c.pairs.length / c.perPage));
    count.textContent = c.pairs.length
      ? `${c.pairs.length} ${c.pairs.length === 1 ? "card" : "cards"} · ${pages} ${pages === 1 ? "page" : "pages"} when printed`
      : "No cards yet. Type some words above.";
    printBtn.disabled = c.pairs.length === 0;
  }

  function print() {
    const c = current();
    if (!c.pairs.length) return;
    const sheet = document.createElement("div");
    sheet.className = `fprint fprint--${c.style} fprint--n${c.perPage}`;
    let html = "";
    for (let i = 0; i < c.pairs.length; i += c.perPage) {
      html += `<section class="fprint__page"><p class="fprint__head">RCF English flashcards · ${esc(c.label)}</p><ul class="fprint__grid">${c.pairs
        .slice(i, i + c.perPage)
        .map((p) => cardHtml(p, c.style))
        .join("")}</ul></section>`;
    }
    sheet.innerHTML = html;
    document.body.appendChild(sheet);
    document.documentElement.classList.add("is-printing-flashcards");
    const done = () => {
      document.documentElement.classList.remove("is-printing-flashcards");
      sheet.remove();
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    window.setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
  }

  let typing;
  own.addEventListener("input", () => {
    clearTimeout(typing);
    typing = setTimeout(() => { saveDraft(own.value); update(); }, 200);
  });
  choice.addEventListener("change", update);
  size.addEventListener("change", update);
  app.querySelectorAll("input[name=flash-style]").forEach((r) => r.addEventListener("change", update));
  printBtn.addEventListener("click", print);

  update();
}

document.querySelectorAll("[data-flash]").forEach(setUp);
