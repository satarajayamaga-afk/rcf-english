/* ==========================================================================
   RCF English - My RCF English

   A personal page built only from what this browser has kept:
     my grade            chosen here, used to point at the right pages
     saved pages         the "Save this page" button (personal.js)
     recently viewed     recorded by personal.js
     activity stars      from the interactive activities (quiz.js)
     examination date    from the Examination Centre countdown
   Nothing is sent anywhere. "Clear" removes it from this device.
   ========================================================================== */

import { esc } from "./lib.js";

const root = document.querySelector("[data-my]");
const ROOT = document.body.getAttribute("data-root") || "";

const read = (key, fallback) => {
  try { const v = JSON.parse(window.localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
};
const write = (key, value) => {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
};
const GRADE_KEY = "rcf-my-grade";

const GRADES = [
  { v: "1", label: "Grade 1", page: "primary-english/grade-1/" },
  { v: "3", label: "Grade 3", page: "primary-english/grade-3/" },
  { v: "4", label: "Grade 4", page: "primary-english/grade-4/" },
  { v: "5", label: "Grade 5", page: "primary-english/grade-5/" },
  { v: "6", label: "Grade 6", page: "grades/grade-6/" },
  { v: "7", label: "Grade 7", page: "grades/grade-7/" },
  { v: "8", label: "Grade 8", page: "grades/grade-8/" },
  { v: "9", label: "Grade 9", page: "grades/grade-9/" },
  { v: "10", label: "Grade 10", page: "grades/grade-10/" },
  { v: "11", label: "Grade 11 (O/L)", page: "grades/grade-11/", exam: "exam-centre/ol/" },
  { v: "al", label: "A/L (Grades 12 and 13)", page: "general-english/", exam: "exam-centre/al/" },
  { v: "teacher", label: "I am a teacher", page: "teacher-resources/" }
];

function when(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function listHtml(items, removable) {
  if (!items.length) return "";
  return `<ul class="my__list">${items
    .map((it) => `
      <li class="my__item">
        <a href="${esc(ROOT + it.url)}">${esc(it.title || it.url)}</a>
        <span class="my__meta">${it.section ? esc(it.section) + " · " : ""}${esc(when(it.at))}</span>
        ${removable ? `<button type="button" class="my__remove" data-remove="${esc(it.url)}">Remove<span class="visually-hidden">: ${esc(it.title || it.url)}</span></button>` : ""}
      </li>`)
    .join("")}</ul>`;
}

function gradeBlock(g) {
  if (!g) {
    return `<p>Choose your grade and this page will point you to the right places each time you come back.</p>`;
  }
  const links = [`<a class="btn btn--accent" href="${esc(ROOT + g.page)}">Open my ${g.v === "teacher" ? "teacher resources" : "grade page"}</a>`];
  if (/^\d+$/.test(g.v) && Number(g.v) >= 6) {
    links.push(`<a class="btn btn--outline" href="${esc(ROOT)}resources/?grade=${g.v}">All resources for ${esc(g.label)}</a>`);
    links.push(`<a class="btn btn--outline" href="${esc(ROOT)}listening-lab/?grade=${g.v}">Listening tests</a>`);
    links.push(`<a class="btn btn--outline" href="${esc(ROOT)}past-papers/?section=grade-${g.v}">Past papers</a>`);
  }
  if (g.exam) links.push(`<a class="btn btn--outline" href="${esc(ROOT + g.exam)}">Examination Centre</a>`);
  if (g.v === "teacher") {
    links.push(`<a class="btn btn--outline" href="${esc(ROOT)}teacher-resources/worksheet-generator/">Worksheet generator</a>`);
    links.push(`<a class="btn btn--outline" href="${esc(ROOT)}teacher-resources/flashcards-and-games/">Flashcards</a>`);
  }
  return `<div class="my__links">${links.join("")}</div>`;
}

function render() {
  const gradeValue = read(GRADE_KEY, "");
  const grade = GRADES.find((g) => g.v === gradeValue);
  const saved = read("rcf-saved", []);
  const recent = read("rcf-recent", []);
  const progress = read("rcf-activity-progress", {});
  const done = Object.keys(progress);
  const stars = done.reduce((s, id) => s + (progress[id].stars || 0), 0);
  const olDate = read("rcf-exam-date-ol", null) || window.localStorage.getItem("rcf-exam-date-ol");
  const alDate = read("rcf-exam-date-al", null) || window.localStorage.getItem("rcf-exam-date-al");

  root.innerHTML = `
    <section class="my__card" aria-labelledby="my-grade">
      <h2 id="my-grade">My grade</h2>
      <div class="field my__grade">
        <label for="my-grade-select">I am in</label>
        <select id="my-grade-select" data-grade>
          <option value="">Choose…</option>
          ${GRADES.map((g) => `<option value="${g.v}"${g.v === gradeValue ? " selected" : ""}>${esc(g.label)}</option>`).join("")}
        </select>
      </div>
      ${gradeBlock(grade)}
    </section>

    <section class="my__card" aria-labelledby="my-saved">
      <h2 id="my-saved">Saved pages <span class="my__count">${saved.length}</span></h2>
      ${saved.length ? listHtml(saved, true) : `<p>Nothing saved yet. Use the <strong>☆ Save this page</strong> button beside the breadcrumbs on any page.</p>`}
    </section>

    <section class="my__card" aria-labelledby="my-recent">
      <h2 id="my-recent">Recently viewed</h2>
      ${recent.length ? listHtml(recent.slice(0, 10), false) : `<p>Pages you open will appear here.</p>`}
    </section>

    <section class="my__card" aria-labelledby="my-progress">
      <h2 id="my-progress">My practice</h2>
      ${done.length
        ? `<p><span class="my__stars" aria-hidden="true">★</span> <strong>${stars} stars</strong> from ${done.length} ${done.length === 1 ? "activity" : "activities"} tried.</p>`
        : `<p>No activities tried on this device yet. <a href="${esc(ROOT)}interactive/">Try an interactive activity</a> and earn up to three stars each.</p>`}
      ${olDate && /^\d{4}-\d{2}-\d{2}$/.test(olDate) ? `<p>My O/L date: <strong>${esc(olDate)}</strong> · <a href="${esc(ROOT)}exam-centre/ol/#countdown">Countdown</a></p>` : ""}
      ${alDate && /^\d{4}-\d{2}-\d{2}$/.test(alDate) ? `<p>My A/L date: <strong>${esc(alDate)}</strong> · <a href="${esc(ROOT)}exam-centre/al/#countdown">Countdown</a></p>` : ""}
    </section>

    <section class="my__card my__card--quiet" aria-labelledby="my-clear">
      <h2 id="my-clear">Your information</h2>
      <p>All of this is stored only in this browser. It is not sent to RCF English or anyone else, and it is not on your other devices.</p>
      <p><button type="button" class="btn btn--outline btn--sm" data-clear>Clear everything saved on this device</button></p>
    </section>`;

  root.querySelector("[data-grade]").addEventListener("change", (e) => {
    write(GRADE_KEY, e.target.value);
    render();
    root.querySelector("[data-grade]").focus();
  });
  root.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    write("rcf-saved", read("rcf-saved", []).filter((s) => s.url !== b.dataset.remove));
    render();
    root.querySelector("#my-saved").setAttribute("tabindex", "-1");
    root.querySelector("#my-saved").focus();
  }));
  root.querySelector("[data-clear]").addEventListener("click", () => {
    if (!window.confirm("Remove your grade, saved pages, recently viewed pages, stars and dates from this device?")) return;
    ["rcf-saved", "rcf-recent", GRADE_KEY, "rcf-activity-progress", "rcf-exam-date-ol", "rcf-exam-date-al", "rcf-study-plan"].forEach((k) => {
      try { window.localStorage.removeItem(k); } catch (e) { /* nothing to remove */ }
    });
    render();
  });
}

if (root) render();
