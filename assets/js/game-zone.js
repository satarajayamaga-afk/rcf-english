/* ==========================================================================
   RCF English - Primary Game Zone: the page

   Three jobs, decided by a data attribute the build script writes:

     data-game-zone="hub"      the five grade doors
     data-game-zone="grade"    one grade: its topics, its games, and the player
     data-game-zone="teacher"  Teacher Mode: grade, then topic, then game,
                               opened large for a classroom screen

   The games themselves are in games/engine.js and games/types/*.js.
   The questions are in data/games/grade-*.json. This file only arranges
   things on the page.
   ========================================================================== */

import { loadData, esc } from "./lib.js";
import { play, progress, pictureHTML } from "./games/engine.js";
import match from "./games/types/match.js";
import memory from "./games/types/memory.js";
import quiz from "./games/types/quiz.js";
import sort from "./games/types/sort.js";
import order from "./games/types/order.js";
import missing from "./games/types/missing.js";

const types = { match, memory, quiz, sort, order, missing };

const TYPE_LABEL = {
  match: "Match", memory: "Memory", quiz: "Quiz",
  sort: "Sorting", order: "Sentences", missing: "Missing word"
};

const root = document.querySelector("[data-game-zone]");
if (root) start(root);

async function start(mount) {
  const mode = mount.dataset.gameZone;
  if (mode === "hub") return renderHub(mount);
  if (mode === "teacher") return renderTeacher(mount);
  return renderGrade(mount, Number(mount.dataset.grade || 1));
}

async function loadGrade(n) {
  const data = await loadData(`games/grade-${n}`);
  return data || null;
}

/**
 * Bring the game itself to the top of the screen when it opens.
 *
 * The page heading and breadcrumbs are useful when choosing a game and only
 * in the way once one is being played: on a 768px laptop they take a fifth of
 * the screen. Scrolling the board up means the whole of it is visible without
 * the child scrolling during play.
 */
/**
 * While a game is being played the page heading and the breadcrumbs are just
 * height: on a 768px laptop they take a fifth of the screen and push the
 * board below the fold. Marking the body puts them away for the duration, so
 * the board is on screen without anyone having to scroll. They come back the
 * moment the child leaves the game.
 *
 * This is done by hiding rather than by scrolling on purpose. Scrolling can
 * be undone by the reader or by the browser restoring a position; hiding
 * cannot.
 */
function showBoard(mount) {
  document.body.classList.add("gz-playing");
  try { mount.scrollIntoView({ block: "start", behavior: "smooth" }); } catch { /* nothing to do */ }
}

function hideBoard() {
  document.body.classList.remove("gz-playing");
}

/** The theme colours live on the .gz-page wrapper, which paints the whole
    background, so set it there rather than on the mount inside it. */
function setTheme(mount, theme) {
  const page = mount.closest(".gz-page") || mount;
  page.dataset.theme = theme || "sunshine";
}

/** Every activity in a pack, units first, then the practice topics. */
function activitiesOf(grade) {
  const fromUnits = (grade.units || []).flatMap((u) => (u.topics || []).flatMap((t) => t.activities || []));
  const fromTopics = (grade.topics || []).flatMap((t) => t.activities || []);
  return fromUnits.concat(fromTopics);
}

function unitActivities(unit) {
  return (unit.topics || []).flatMap((t) => t.activities || []);
}

/* ------------------------------------------------------------------ hub */

async function renderHub(mount) {
  const grades = [];
  for (let n = 1; n <= 5; n++) {
    const g = await loadGrade(n);
    if (g) grades.push(g);
  }
  mount.innerHTML = `
    <div class="gz-doors">
      ${grades.map((g) => {
        const ids = activitiesOf(g).map((a) => a.id);
        const stars = progress.starsForGrade(ids);
        return `
        <a class="gz-door" data-theme="${esc(g.theme)}" href="grade-${g.grade}/">
          <span class="gz-door__badge">${pictureHTML(g.icon, "")}</span>
          <span class="gz-door__grade">${esc(g.title)}</span>
          <span class="gz-door__blurb">${esc(g.blurb || "")}</span>
          <span class="gz-door__meta">
            <span class="gz-door__count">${ids.length} games</span>
            <span class="gz-door__stars">${stars}<span aria-hidden="true">★</span></span>
          </span>
        </a>`;
      }).join("")}
    </div>`;
}

/* ---------------------------------------------------------------- grade */

async function renderGrade(mount, gradeNumber) {
  const grade = await loadGrade(gradeNumber);
  if (!grade) {
    mount.innerHTML = `<p class="gz-error">The games for this grade could not be loaded.</p>`;
    return;
  }
  setTheme(mount, grade.theme);
  const all = activitiesOf(grade);
  let currentUnit = null;   // the unit being worked through, if any

  /** One topic and its game cards. Used by both the unit view and practice. */
  function topicHTML(topic) {
    return `
        <section class="gz-topic">
          <h2 class="gz-topic__title"><span class="gz-topic__icon" aria-hidden="true">${pictureHTML(topic.icon, "")}</span>${esc(topic.title)}</h2>
          <div class="gz-cards">
            ${(topic.activities || []).map((a) => {
              const saved = progress.get(a.id);
              return `
              <button type="button" class="gz-gamecard" data-play="${esc(a.id)}">
                <span class="gz-gamecard__type">${esc(TYPE_LABEL[a.type] || a.type)}</span>
                <span class="gz-gamecard__title">${esc(a.title)}</span>
                <span class="gz-gamecard__foot">
                  <span class="gz-gamecard__time">${esc(String(a.minutes || 3))} min</span>
                  <span class="gz-gamecard__stars">${[1, 2, 3].map((n) =>
                    `<span class="${saved && n <= saved.stars ? "is-on" : ""}">★</span>`).join("")}</span>
                </span>
              </button>`;
            }).join("")}
          </div>
        </section>`;
  }

  /** The units of the Pupil's Book, each one a door into its own games. */
  function unitsHTML() {
    const units = grade.units || [];
    if (!units.length) {
      const waiting = grade.unitsStatus === "awaiting-source";
      return `
        <section class="gz-units">
          <h2 class="gz-section-title">Pupil's Book units</h2>
          <p class="gz-note">${waiting
            ? "Unit games are built from the Pupil's Book itself. This grade's book has not been supplied yet, so there are none here."
            : "Unit games for this grade are being prepared."}</p>
        </section>`;
    }
    return `
      <section class="gz-units">
        <h2 class="gz-section-title">Pupil's Book units</h2>
        ${grade.book && grade.book.title ? `<p class="gz-note">From <strong>${esc(grade.book.title)}</strong>.</p>` : ""}
        <div class="gz-unitgrid">
          ${units.map((u) => {
            const acts = unitActivities(u);
            const stars = progress.starsForGrade(acts.map((a) => a.id));
            const ready = acts.length > 0;
            return `
            <button type="button" class="gz-unit${ready ? "" : " is-soon"}" data-unit="${esc(u.id)}"${ready ? "" : " disabled"}>
              <span class="gz-unit__no">${esc(String(u.number))}</span>
              <span class="gz-unit__body">
                <span class="gz-unit__title">${esc(u.title)}</span>
                <span class="gz-unit__meta">${ready
                  ? `${acts.length} game${acts.length === 1 ? "" : "s"}${stars ? ` &middot; ${stars}★` : ""}`
                  : "Coming soon"}</span>
              </span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
  }

  function unitView(unitId) {
    const unit = (grade.units || []).find((u) => u.id === unitId);
    if (!unit) return list();
    currentUnit = unitId;
    history.replaceState(null, "", `?u=${encodeURIComponent(unitId)}`);
    mount.innerHTML = `
      <div class="gz-unithead">
        <button type="button" class="gz-btn gz-btn--ghost" data-units-back>All units</button>
        <p class="gz-unithead__label">Unit ${esc(String(unit.number))}</p>
        <h2 class="gz-unithead__title">${esc(unit.title)}</h2>
        ${(unit.outcomes || []).length
          ? `<ul class="gz-outcomes">${unit.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
      </div>
      ${(unit.topics || []).map(topicHTML).join("")}`;
    window.scrollTo({ top: 0 });
  }

  function list() {
    const stars = progress.starsForGrade(all.map((a) => a.id));
    currentUnit = null;
    history.replaceState(null, "", location.pathname);
    mount.innerHTML = `
      <div class="gz-gradehead">
        <p class="gz-gradehead__stars">${stars}<span aria-hidden="true">★</span> collected</p>
      </div>
      ${unitsHTML()}
      ${(grade.topics || []).length ? `
        <section class="gz-practice">
          <h2 class="gz-section-title">Practice games</h2>
          <p class="gz-note">Extra games that are not tied to a unit.</p>
        </section>` : ""}
      ${(grade.topics || []).map(topicHTML).join("")}`;
  }

  function open(id) {
    const activity = all.find((a) => a.id === id);
    if (!activity) return list();
    const position = all.indexOf(activity);
    const next = all[position + 1];
    history.replaceState(null, "", `?a=${encodeURIComponent(id)}`);
    play(activity, mount, {
      types,
      nextTitle: next ? next.title : "",
      // Leaving a game returns to wherever the child came from: the unit they
      // were working through, or the grade list.
      onExit: () => {
        hideBoard();
        if (currentUnit) unitView(currentUnit);
        else { history.replaceState(null, "", location.pathname); list(); }
        window.scrollTo({ top: 0 });
      },
      onNext: () => open(next.id)
    });
    showBoard(mount);
  }

  mount.addEventListener("click", (event) => {
    const card = event.target.closest("[data-play]");
    if (card) { open(card.dataset.play); return; }
    const unit = event.target.closest("[data-unit]");
    if (unit) { unitView(unit.dataset.unit); return; }
    if (event.target.closest("[data-units-back]")) list();
  });

  const params = new URLSearchParams(location.search);
  const wantedGame = params.get("a");
  const wantedUnit = params.get("u");
  if (wantedGame && all.some((a) => a.id === wantedGame)) open(wantedGame);
  else if (wantedUnit && (grade.units || []).some((u) => u.id === wantedUnit)) unitView(wantedUnit);
  else list();
}

/* --------------------------------------------------------- teacher mode */

async function renderTeacher(mount) {
  const grades = [];
  for (let n = 1; n <= 5; n++) {
    const g = await loadGrade(n);
    if (g) grades.push(g);
  }

  let chosenGrade = grades[0];
  let chosenTopic = chosenGrade && chosenGrade.topics[0];

  function pickers() {
    setTheme(mount, chosenGrade.theme);
    mount.innerHTML = `
      <div class="gz-teacher">
        <div class="gz-teacher__row">
          <label class="gz-field">
            <span>Grade</span>
            <select data-teacher="grade">
              ${grades.map((g) => `<option value="${g.grade}" ${g === chosenGrade ? "selected" : ""}>${esc(g.title)}</option>`).join("")}
            </select>
          </label>
          <label class="gz-field">
            <span>Topic</span>
            <select data-teacher="topic">
              ${chosenGrade.topics.map((t, i) => `<option value="${i}" ${t === chosenTopic ? "selected" : ""}>${esc(t.title)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="gz-cards gz-cards--teacher">
          ${(chosenTopic.activities || []).map((a) => `
            <button type="button" class="gz-gamecard gz-gamecard--big" data-play="${esc(a.id)}">
              <span class="gz-gamecard__type">${esc(TYPE_LABEL[a.type] || a.type)}</span>
              <span class="gz-gamecard__title">${esc(a.title)}</span>
              <span class="gz-gamecard__foot"><span class="gz-gamecard__time">${esc(String(a.minutes || 3))} min</span></span>
            </button>`).join("")}
        </div>
        <p class="gz-teacher__note">Choose a game to open it large for the class. Press Escape to come back.</p>
      </div>`;
  }

  mount.addEventListener("change", (event) => {
    const which = event.target.dataset.teacher;
    if (which === "grade") {
      chosenGrade = grades.find((g) => String(g.grade) === event.target.value);
      chosenTopic = chosenGrade.topics[0];
      pickers();
    } else if (which === "topic") {
      chosenTopic = chosenGrade.topics[Number(event.target.value)];
      pickers();
    }
  });

  mount.addEventListener("click", (event) => {
    const card = event.target.closest("[data-play]");
    if (!card) return;
    const activity = (chosenTopic.activities || []).find((a) => a.id === card.dataset.play);
    if (!activity) return;
    document.body.classList.add("gz-classroom");
    play(activity, mount, {
      types,
      onExit: () => { document.body.classList.remove("gz-classroom"); pickers(); },
      onNext: () => { document.body.classList.remove("gz-classroom"); pickers(); }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("gz-classroom")) {
      document.body.classList.remove("gz-classroom");
      pickers();
    }
  });

  pickers();
}

export { pictureHTML };
