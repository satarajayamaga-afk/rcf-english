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

function activitiesOf(grade) {
  return (grade.topics || []).flatMap((t) => t.activities || []);
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

  function list() {
    const stars = progress.starsForGrade(all.map((a) => a.id));
    mount.innerHTML = `
      <div class="gz-gradehead">
        <p class="gz-gradehead__stars">${stars}<span aria-hidden="true">★</span> collected</p>
      </div>
      ${(grade.topics || []).map((topic) => `
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
        </section>`).join("")}`;
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
      onExit: () => { hideBoard(); history.replaceState(null, "", location.pathname); list(); window.scrollTo({ top: 0 }); },
      onNext: () => open(next.id)
    });
    showBoard(mount);
  }

  mount.addEventListener("click", (event) => {
    const card = event.target.closest("[data-play]");
    if (card) open(card.dataset.play);
  });

  const wanted = new URLSearchParams(location.search).get("a");
  if (wanted && all.some((a) => a.id === wanted)) open(wanted);
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
