/* ==========================================================================
   RCF English - interactive activities

   Seven activity types, all driven by data/quizzes.json:

     mcq        multiple choice (grammar, literature, general knowledge)
     reading    a passage followed by comprehension questions
     gap        fill in the blank
     order      put the parts of a sentence in the right order
     match      match a word to its meaning
     error      find and correct the mistake in a sentence

   Every activity gives instructions, immediate feedback, an explanation where
   one is useful, a running score and a reset button. Nothing is sent anywhere:
   no login, no accounts, no personal information, no cookies.

   SUPPORT LEVELS (chosen by the student, remembered on the device)
     guided     hints shown, instant feedback, and a "clue" button on each
                question (removes two wrong choices, shows a first letter...)
     standard   hints shown, instant feedback
     challenge  no hints and no feedback until "Check my answers"
   Questions (except reading questions, which follow the passage) and answer
   choices are shuffled each time. "Try the wrong ones again" repeats only the
   questions missed. "Print my result" prints a result sheet.

   PROGRESS STARS are kept in this browser only (localStorage):
     3 stars 90% or more, 2 stars 70% or more, 1 star 50% or more,
   with the best result and the level it was earned at.

   Mount an activity with:  <div data-activity="grammar-tenses-1"></div>
   ========================================================================== */

import { esc, loadData, announce } from "./lib.js";

const RESET_LABEL = "Start again";

/* ------------------------------------------------------------- utilities */

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "")
    .trim();
}

function accepts(answer) {
  return (Array.isArray(answer) ? answer : [answer]).map(normalise);
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function band(percent) {
  if (percent >= 80) return "high";
  if (percent >= 50) return "mid";
  return "low";
}

function scoreNote(percent) {
  if (percent === 100) return "Every answer correct. Well done.";
  if (percent >= 80) return "A strong result. Read the explanations for anything you missed.";
  if (percent >= 50) return "A fair result. Work through the explanations, then try again.";
  return "Read the lesson again, then start this activity a second time.";
}

/* --------------------------------------------------- levels and progress */

const LEVELS = [
  { key: "guided", label: "Guided", note: "Hints, instant feedback, and a clue button on every question." },
  { key: "standard", label: "Standard", note: "Hints and instant feedback." },
  { key: "challenge", label: "Challenge", note: "No hints. Nothing is marked until you select Check my answers." }
];
const LEVEL_KEY = "rcf-activity-level";
const PROGRESS_KEY = "rcf-activity-progress";

const store = {
  get(key, fallback) {
    try { const v = window.localStorage.getItem(key); return v == null ? fallback : v; } catch (e) { return fallback; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* not kept */ }
  }
};

function currentLevel() {
  const v = store.get(LEVEL_KEY, "standard");
  return LEVELS.some((l) => l.key === v) ? v : "standard";
}

function readProgress() {
  try { return JSON.parse(store.get(PROGRESS_KEY, "{}")) || {}; } catch (e) { return {}; }
}

function starsFor(percent) {
  if (percent >= 90) return 3;
  if (percent >= 70) return 2;
  if (percent >= 50) return 1;
  return 0;
}

function starText(n) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

/* Only a full attempt counts towards stars: a retry of two missed questions
   scoring 100% is not the same as the whole activity at 100%. */
function recordResult(activity, percent, level) {
  const all = readProgress();
  const prev = all[activity.id] || { best: -1, stars: 0 };
  const stars = starsFor(percent);
  const rank = { guided: 0, standard: 1, challenge: 2 };
  const better = percent > prev.best || (percent === prev.best && rank[level] > rank[prev.level || "guided"]);
  if (better) {
    all[activity.id] = { best: percent, stars, level, date: new Date().toISOString().slice(0, 10) };
    store.set(PROGRESS_KEY, JSON.stringify(all));
  }
  return { stars, improved: better && percent > Math.max(prev.best, -1), prev };
}

/* Options such as "None of them" must stay last to make sense. */
const FIXED_LAST = /^(none|all|both|neither)\b.*\b(them|these|those|above)$/i;

/* A copy of the activity for one attempt: questions (and pairs) chosen,
   ordered and with their answer choices shuffled. Every type's own code only
   ever looks at this copy, so marking stays consistent with what is shown. */
function prepare(activity, level, onlyOriginal) {
  const copy = Object.assign({}, activity);
  const keepOrder = activity.type === "reading";
  const pick = (list) => {
    let items = list.map((item, i) => Object.assign({}, item, { __orig: i }));
    if (onlyOriginal) items = items.filter((item) => onlyOriginal.includes(item.__orig));
    if (!keepOrder && level !== "guided") items = shuffle(items);
    return items;
  };
  if (Array.isArray(activity.questions)) {
    copy.questions = pick(activity.questions).map((q) => {
      const out = Object.assign({}, q);
      if (level === "challenge") delete out.hint;
      if (Array.isArray(q.options)) {
        const opts = q.options.map((text, i) => ({ text, i }));
        const last = opts.filter((o) => FIXED_LAST.test(String(o.text).trim()));
        const moving = shuffle(opts.filter((o) => !last.includes(o)));
        const order = moving.concat(last);
        out.options = order.map((o) => o.text);
        out.answer = order.findIndex((o) => o.i === Number(q.answer));
      }
      return out;
    });
  }
  if (Array.isArray(activity.pairs)) copy.pairs = pick(activity.pairs);
  return copy;
}

/* --------------------------------------------------------------- shell */

function shell(activity, bodyHtml, instructions, state) {
  const id = esc(activity.id);
  const level = state.level;
  const progress = readProgress()[activity.id];
  const levelButtons = LEVELS.map(
    (l) => `<button type="button" class="activity__level-btn${l.key === level ? " is-on" : ""}" data-level="${l.key}" aria-pressed="${l.key === level}">${l.label}</button>`
  ).join("");
  const levelNote = (LEVELS.find((l) => l.key === level) || LEVELS[1]).note;
  return `
    <section class="activity activity--${level}" id="activity-${id}" data-activity-id="${id}" data-level="${level}">
      <header class="activity__head">
        <h3 id="activity-${id}-title">${esc(activity.title)}</h3>
        ${activity.description ? `<p>${esc(activity.description)}</p>` : ""}
        <p class="activity__instructions"><strong>What to do:</strong> ${esc(instructions)}</p>
        <div class="activity__tools">
          <div class="activity__levels" role="group" aria-label="Support level">${levelButtons}</div>
          <p class="activity__stars" data-stars>${progress ? `<span aria-hidden="true">${starText(progress.stars)}</span> <span>Best ${progress.best}% (${esc(progress.level)})</span>` : "Not tried on this device yet"}</p>
        </div>
        <p class="activity__level-note">${esc(levelNote)}${state.retry ? ` <strong>Repeating the ${state.retry} ${state.retry === 1 ? "question" : "questions"} you missed.</strong>` : ""}</p>
      </header>
      <div class="activity__body">${bodyHtml}</div>
      <footer class="activity__foot">
        <p class="score" id="score-${id}" hidden>
          <span class="score__value" data-band="low">0%</span>
          <span class="score__note"></span>
        </p>
        <button type="button" class="btn btn--sm btn--accent" data-check>Check my answers</button>
        <button type="button" class="btn btn--sm btn--outline" data-retry-wrong hidden>Try the wrong ones again</button>
        <span class="activity__print" data-print-wrap hidden>
          <label>Name for the printout <input type="text" data-result-name autocomplete="name" maxlength="60"></label>
          <button type="button" class="btn btn--sm btn--outline" data-print-result>Print my result</button>
        </span>
        <button type="button" class="btn btn--sm btn--outline" data-reset>${RESET_LABEL}</button>
      </footer>
      <p class="visually-hidden" role="status" aria-live="polite" data-live></p>
    </section>`;
}

/* -------------------------------------------------------------- clues */

/* Guided level only. Each clue can be used once per question. */
function addClues(root, activity) {
  const t = activity.type;
  if (t === "mcq" || t === "reading" || t === "gap" || t === "error" || t === "order") {
    root.querySelectorAll(".q").forEach((q) => {
      const index = Number(q.dataset.question);
      const question = activity.questions[index];
      const label =
        t === "gap" ? "Clue: first letter" :
        t === "error" ? "Clue: which word is wrong?" :
        t === "order" ? "Clue: place the first part" :
        "Clue: remove two wrong answers";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "activity__clue";
      btn.textContent = label;
      const out = document.createElement("span");
      out.className = "activity__clue-out";
      btn.addEventListener("click", () => {
        btn.disabled = true;
        if (t === "mcq" || t === "reading") {
          const wrong = shuffle(Array.from(q.querySelectorAll(".option")).filter((o) => Number(o.dataset.option) !== question.answer)).slice(0, 2);
          wrong.forEach((o) => { o.classList.add("is-removed"); o.querySelector("input").disabled = true; });
          out.textContent = "Two wrong answers have been removed.";
        } else if (t === "gap") {
          const answer = String(Array.isArray(question.answer) ? question.answer[0] : question.answer);
          out.textContent = `It begins with “${answer.charAt(0)}” and has ${answer.length} letters.`;
        } else if (t === "error") {
          const answer = String(Array.isArray(question.answer) ? question.answer[0] : question.answer);
          const a = normalise(question.sentence).split(" ");
          const b = normalise(answer).split(" ");
          let i = 0;
          while (i < a.length && i < b.length && a[i] === b[i]) i++;
          out.textContent = i < a.length ? `Look closely at “${question.sentence.split(/\s+/)[i] || a[i]}”.` : "Look closely at the end of the sentence.";
        } else if (t === "order") {
          const list = q.querySelector("[data-order]");
          const first = list.querySelector('li[data-index="0"]');
          if (first) { list.insertBefore(first, list.firstElementChild); refreshOrderButtons(list); }
          out.textContent = "The first part is now in place.";
        }
        announce(root.querySelector("[data-live]"), out.textContent);
      });
      const where = q.querySelector("[data-feedback]");
      const wrap = document.createElement("p");
      wrap.className = "activity__clue-row";
      wrap.append(btn, out);
      q.insertBefore(wrap, where);
    });
  }
  if (t === "match") {
    const foot = root.querySelector(".match-grid");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "activity__clue";
    btn.textContent = "Clue: fill in one match";
    btn.addEventListener("click", () => {
      const rows = Array.from(root.querySelectorAll(".match-row")).filter((row) => Number(row.querySelector("select").value) !== Number(row.dataset.question) || row.querySelector("select").value === "");
      if (!rows.length) { btn.disabled = true; return; }
      const row = rows[0];
      const select = row.querySelector("select");
      select.value = String(row.dataset.question);
      select.dispatchEvent(new Event("change"));
      select.disabled = true;
      if (rows.length === 1) btn.disabled = true;
    });
    const wrap = document.createElement("p");
    wrap.className = "activity__clue-row";
    wrap.append(btn);
    foot.after(wrap);
  }
}

/* ------------------------------------------------------------ results */

function wrongOriginals(root, activity) {
  const t = activity.type;
  const out = [];
  if (t === "match") {
    root.querySelectorAll(".match-row").forEach((row) => {
      const i = Number(row.dataset.question);
      const s = row.querySelector("[data-match]");
      if (s.value === "" || Number(s.value) !== i) out.push(activity.pairs[i].__orig);
    });
    return out;
  }
  root.querySelectorAll(".q").forEach((q) => {
    const i = Number(q.dataset.question);
    const question = activity.questions[i];
    let right = false;
    if (t === "mcq" || t === "reading") {
      const c = q.querySelector("input:checked");
      right = Boolean(c) && Number(c.value) === question.answer;
    } else if (t === "gap") {
      right = accepts(question.answer).includes(normalise(q.querySelector(".gap-input").value));
    } else if (t === "error") {
      right = accepts(question.answer).includes(normalise(q.querySelector("[data-answer]").value));
    } else if (t === "order") {
      right = Array.prototype.every.call(q.querySelector("[data-order]").children, (li, k) => Number(li.dataset.index) === k);
    }
    if (!right) out.push(question.__orig);
  });
  return out;
}

function resultRows(root, activity) {
  const t = activity.type;
  if (t === "match") {
    return Array.from(root.querySelectorAll(".match-row")).map((row) => {
      const i = Number(row.dataset.question);
      const s = row.querySelector("[data-match]");
      const given = s.value === "" ? "(no answer)" : s.options[s.selectedIndex].text;
      return { q: activity.pairs[i].term, given, correct: activity.pairs[i].meaning, right: s.value !== "" && Number(s.value) === i };
    });
  }
  return Array.from(root.querySelectorAll(".q")).map((q) => {
    const i = Number(q.dataset.question);
    const question = activity.questions[i];
    if (t === "mcq" || t === "reading") {
      const c = q.querySelector("input:checked");
      return { q: question.prompt, given: c ? question.options[Number(c.value)] : "(no answer)", correct: question.options[question.answer], right: Boolean(c) && Number(c.value) === question.answer };
    }
    if (t === "gap" || t === "error") {
      const input = q.querySelector(".gap-input, [data-answer]");
      const answer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
      return { q: question.sentence, given: input.value.trim() || "(no answer)", correct: answer, right: accepts(question.answer).includes(normalise(input.value)) };
    }
    const list = q.querySelector("[data-order]");
    const given = Array.prototype.map.call(list.children, (li) => li.querySelector(".order-list__text").textContent).join(" ");
    return { q: question.prompt, given, correct: question.parts.join(" "), right: Array.prototype.every.call(list.children, (li, k) => Number(li.dataset.index) === k) };
  });
}

function printResult(root, activity, state, correct, total) {
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const rows = resultRows(root, activity);
  const levelLabel = (LEVELS.find((l) => l.key === state.level) || {}).label || "";
  const nameInput = root.querySelector("[data-result-name]");
  const name = nameInput ? nameInput.value.trim() : "";
  const sheet = document.createElement("div");
  sheet.className = "qprint";
  sheet.innerHTML = `
    <p class="qprint__brand">RCF English · Activity result</p>
    <h1>${esc(activity.title)}</h1>
    <p>${name ? `Name: <strong>${esc(name)}</strong> · ` : ""}Date: ${esc(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))} · Level: ${esc(levelLabel)}${state.retry ? " (repeat of missed questions)" : ""}</p>
    <p class="qprint__score">Score: <strong>${correct} / ${total}</strong> (${percent}%) ${state.retry ? "" : `<span aria-hidden="true">${starText(starsFor(percent))}</span>`}</p>
    <table><thead><tr><th>#</th><th>Question</th><th>Answer given</th><th>Correct answer</th><th></th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.q)}</td><td>${esc(r.given)}</td><td>${esc(r.correct)}</td><td>${r.right ? "✓" : "✗"}</td></tr>`).join("")}
    </tbody></table>
    <p class="qprint__foot">rcfenglish.com · Results are not stored anywhere except on the device used.</p>`;
  document.body.appendChild(sheet);
  document.documentElement.classList.add("is-printing-result");
  const done = () => {
    document.documentElement.classList.remove("is-printing-result");
    sheet.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  window.setTimeout(() => document.addEventListener("pointerdown", done, { once: true }), 1000);
}

/* ---------------------------------------------------------------- types */

const TYPES = {
  /* ------------------------------------------------------------ mcq --- */
  mcq: {
    instructions: "Choose one answer for each question. You are told at once whether it is right, and why.",
    render(activity) {
      const questions = activity.questions
        .map((question, index) => {
          const name = `${activity.id}-q${index}`;
          const options = question.options
            .map(
              (option, optionIndex) => `
              <li>
                <label class="option" data-option="${optionIndex}">
                  <input type="radio" name="${esc(name)}" value="${optionIndex}">
                  <span class="option__text">${esc(option)}</span>
                  <span class="option__flag" aria-hidden="true"></span>
                </label>
              </li>`
            )
            .join("");
          return `
            <fieldset class="q" data-question="${index}">
              <legend><span class="q__num" aria-hidden="true">${index + 1}</span>${esc(question.prompt)}</legend>
              <ul class="options">${options}</ul>
              <p class="feedback" data-feedback hidden></p>
            </fieldset>`;
        })
        .join("");
      return questions;
    },
    wire(root, activity) {
      root.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", () => {
          if (root.dataset.level === "challenge") return;
          const fieldset = input.closest(".q");
          mark(fieldset, activity, Number(fieldset.dataset.question));
          updateScore(root, activity);
        });
      });
    },
    check(root, activity) {
      root.querySelectorAll(".q").forEach((fieldset) => {
        mark(fieldset, activity, Number(fieldset.dataset.question), true);
      });
    },
    total(activity) {
      return activity.questions.length;
    },
    correct(root, activity) {
      let n = 0;
      root.querySelectorAll(".q").forEach((fieldset) => {
        const index = Number(fieldset.dataset.question);
        const chosen = fieldset.querySelector("input:checked");
        if (chosen && Number(chosen.value) === activity.questions[index].answer) n += 1;
      });
      return n;
    }
  },

  /* -------------------------------------------------------- reading --- */
  reading: {
    instructions:
      "Read the passage carefully, then answer the questions below it. You may look back at the passage as often as you like.",
    render(activity) {
      const passage = `
        <div class="reading-passage">
          <h4>${esc(activity.passageTitle || "Reading passage")}</h4>
          ${activity.passage.map((p) => `<p>${esc(p)}</p>`).join("")}
        </div>`;
      return passage + TYPES.mcq.render(activity);
    },
    wire: (root, activity) => TYPES.mcq.wire(root, activity),
    check: (root, activity) => TYPES.mcq.check(root, activity),
    total: (activity) => activity.questions.length,
    correct: (root, activity) => TYPES.mcq.correct(root, activity)
  },

  /* ------------------------------------------------------------ gap --- */
  gap: {
    instructions:
      "Type one word (or the words asked for) in each space. Spelling matters, but capital letters do not.",
    render(activity) {
      return activity.questions
        .map((question, index) => {
          const parts = String(question.sentence).split("____");
          const sentence = parts
            .map((part, i) =>
              i === parts.length - 1
                ? esc(part)
                : `${esc(part)}<label class="visually-hidden" for="${esc(activity.id)}-g${index}">Answer for question ${
                    index + 1
                  }</label><input class="gap-input" type="text" id="${esc(activity.id)}-g${index}" autocomplete="off" spellcheck="false">`
            )
            .join("");
          return `
            <div class="q" data-question="${index}">
              <p><span class="q__num" aria-hidden="true">${index + 1}</span>${sentence}</p>
              ${question.hint ? `<p class="text-small text-muted">Hint: ${esc(question.hint)}</p>` : ""}
              <p class="feedback" data-feedback hidden></p>
            </div>`;
        })
        .join("");
    },
    wire(root, activity) {
      root.querySelectorAll(".gap-input").forEach((input) => {
        input.addEventListener("blur", () => {
          if (root.dataset.level === "challenge") return;
          if (input.value.trim()) {
            markGap(input.closest(".q"), activity);
            updateScore(root, activity);
          }
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
          }
        });
      });
    },
    check(root, activity) {
      root.querySelectorAll(".q").forEach((q) => markGap(q, activity, true));
    },
    total: (activity) => activity.questions.length,
    correct(root, activity) {
      let n = 0;
      root.querySelectorAll(".q").forEach((q) => {
        const index = Number(q.dataset.question);
        const input = q.querySelector(".gap-input");
        if (input && accepts(activity.questions[index].answer).includes(normalise(input.value))) n += 1;
      });
      return n;
    }
  },

  /* ---------------------------------------------------------- order --- */
  order: {
    instructions:
      "Put the parts in the correct order using the up and down buttons, then select Check my answers.",
    render(activity) {
      return activity.questions
        .map((question, index) => {
          const items = shuffle(question.parts.map((text, i) => ({ text, i })));
          const rows = items
            .map(
              (item) => `
              <li data-index="${item.i}">
                <span class="order-list__text">${esc(item.text)}</span>
                <span class="order-list__controls">
                  <button type="button" class="icon-btn" data-move="up" aria-label="Move &quot;${esc(
                    item.text
                  )}&quot; up">&#9650;</button>
                  <button type="button" class="icon-btn" data-move="down" aria-label="Move &quot;${esc(
                    item.text
                  )}&quot; down">&#9660;</button>
                </span>
              </li>`
            )
            .join("");
          return `
            <div class="q" data-question="${index}">
              <p><span class="q__num" aria-hidden="true">${index + 1}</span>${esc(question.prompt)}</p>
              <ol class="order-list" data-order>${rows}</ol>
              <p class="feedback" data-feedback hidden></p>
            </div>`;
        })
        .join("");
    },
    wire(root) {
      root.querySelectorAll("[data-order]").forEach((list) => {
        list.addEventListener("click", (event) => {
          const button = event.target.closest("[data-move]");
          if (!button) return;
          const item = button.closest("li");
          if (button.dataset.move === "up" && item.previousElementSibling) {
            list.insertBefore(item, item.previousElementSibling);
          } else if (button.dataset.move === "down" && item.nextElementSibling) {
            list.insertBefore(item.nextElementSibling, item);
          }
          button.focus();
          refreshOrderButtons(list);
        });
        refreshOrderButtons(list);
      });
    },
    check(root, activity) {
      root.querySelectorAll(".q").forEach((q) => {
        const index = Number(q.dataset.question);
        const list = q.querySelector("[data-order]");
        const order = Array.prototype.map.call(list.children, (li) => Number(li.dataset.index));
        const right = order.every((value, i) => value === i);
        Array.prototype.forEach.call(list.children, (li, i) => {
          li.setAttribute("data-state", Number(li.dataset.index) === i ? "correct" : "wrong");
        });
        const question = activity.questions[index];
        showFeedback(
          q,
          right,
          right
            ? question.explanation || `Correct: ${question.parts.join(" ")}`
            : `The correct order is: ${question.parts.join(" ")}${
                question.explanation ? ` ${question.explanation}` : ""
              }`
        );
      });
    },
    total: (activity) => activity.questions.length,
    correct(root) {
      let n = 0;
      root.querySelectorAll("[data-order]").forEach((list) => {
        const ok = Array.prototype.every.call(list.children, (li, i) => Number(li.dataset.index) === i);
        if (ok) n += 1;
      });
      return n;
    }
  },

  /* ---------------------------------------------------------- match --- */
  match: {
    instructions: "Choose the correct meaning for each word from the list beside it.",
    render(activity) {
      const meanings = shuffle(activity.pairs.map((pair, i) => ({ text: pair.meaning, i })));
      const rows = activity.pairs
        .map((pair, index) => {
          const options = meanings
            .map((m) => `<option value="${m.i}">${esc(m.text)}</option>`)
            .join("");
          return `
            <div class="match-row" data-question="${index}">
              <span class="match-row__term" id="${esc(activity.id)}-t${index}">${esc(pair.term)}</span>
              <select aria-labelledby="${esc(activity.id)}-t${index}" data-match>
                <option value="">Choose a meaning…</option>
                ${options}
              </select>
              <span class="match-row__flag" aria-hidden="true"></span>
            </div>`;
        })
        .join("");
      return `<div class="match-grid">${rows}</div><p class="feedback" data-feedback hidden></p>`;
    },
    wire(root, activity) {
      root.querySelectorAll("[data-match]").forEach((select) => {
        select.addEventListener("change", () => {
          if (root.dataset.level === "challenge") return;
          const row = select.closest(".match-row");
          const index = Number(row.dataset.question);
          if (select.value === "") {
            row.removeAttribute("data-state");
            row.querySelector(".match-row__flag").textContent = "";
            return;
          }
          const right = Number(select.value) === index;
          row.setAttribute("data-state", right ? "correct" : "wrong");
          row.querySelector(".match-row__flag").textContent = right ? "Correct" : "Try again";
          updateScore(root, activity);
        });
      });
    },
    check(root, activity) {
      root.querySelectorAll(".match-row").forEach((row) => {
        const index = Number(row.dataset.question);
        const select = row.querySelector("[data-match]");
        const right = Number(select.value) === index;
        row.setAttribute("data-state", right ? "correct" : "wrong");
        row.querySelector(".match-row__flag").textContent = right
          ? "Correct"
          : `Correct meaning: ${activity.pairs[index].meaning}`;
      });
    },
    total: (activity) => activity.pairs.length,
    correct(root) {
      let n = 0;
      root.querySelectorAll(".match-row").forEach((row) => {
        const select = row.querySelector("[data-match]");
        if (select.value !== "" && Number(select.value) === Number(row.dataset.question)) n += 1;
      });
      return n;
    }
  },

  /* ---------------------------------------------------------- error --- */
  error: {
    instructions:
      "Each sentence contains one mistake. Rewrite the whole sentence correctly in the box below it.",
    render(activity) {
      return activity.questions
        .map((question, index) => {
          const id = `${esc(activity.id)}-e${index}`;
          return `
            <div class="q" data-question="${index}">
              <p class="error-correct__sentence"><span class="q__num" aria-hidden="true">${index + 1}</span>${esc(
            question.sentence
          )}</p>
              <div class="field">
                <label for="${id}">Write the corrected sentence</label>
                <input type="text" id="${id}" data-answer autocomplete="off" spellcheck="false">
              </div>
              <p class="feedback" data-feedback hidden></p>
            </div>`;
        })
        .join("");
    },
    wire(root, activity) {
      root.querySelectorAll("[data-answer]").forEach((input) => {
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
          }
        });
        input.addEventListener("blur", () => {
          if (root.dataset.level === "challenge") return;
          if (input.value.trim()) {
            markError(input.closest(".q"), activity);
            updateScore(root, activity);
          }
        });
      });
    },
    check(root, activity) {
      root.querySelectorAll(".q").forEach((q) => markError(q, activity, true));
    },
    total: (activity) => activity.questions.length,
    correct(root, activity) {
      let n = 0;
      root.querySelectorAll(".q").forEach((q) => {
        const index = Number(q.dataset.question);
        const input = q.querySelector("[data-answer]");
        if (input && accepts(activity.questions[index].answer).includes(normalise(input.value))) n += 1;
      });
      return n;
    }
  }
};

/* -------------------------------------------------------- mark helpers */

function showFeedback(node, right, message) {
  const feedback = node.querySelector("[data-feedback]");
  if (!feedback) return;
  feedback.hidden = false;
  feedback.setAttribute("data-state", right ? "correct" : "wrong");
  feedback.innerHTML = `<span class="feedback__label">${right ? "Correct." : "Not yet."}</span>${
    message ? `<span class="feedback__explain">${esc(message)}</span>` : ""
  }`;
}

function mark(fieldset, activity, index, reveal) {
  const question = activity.questions[index];
  const chosen = fieldset.querySelector("input:checked");
  fieldset.querySelectorAll(".option").forEach((option) => option.removeAttribute("data-state"));
  fieldset.querySelectorAll(".option__flag").forEach((flag) => {
    flag.textContent = "";
  });

  if (!chosen) {
    if (reveal) {
      const answer = fieldset.querySelector(`.option[data-option="${question.answer}"]`);
      if (answer) {
        answer.setAttribute("data-state", "answer");
        answer.querySelector(".option__flag").textContent = "Correct answer";
      }
      showFeedback(fieldset, false, `You did not answer this question. ${question.explanation || ""}`.trim());
    }
    return;
  }

  const right = Number(chosen.value) === question.answer;
  const chosenOption = chosen.closest(".option");
  chosenOption.setAttribute("data-state", right ? "correct" : "wrong");
  chosenOption.querySelector(".option__flag").textContent = right ? "Correct" : "Not correct";

  if (!right) {
    const answer = fieldset.querySelector(`.option[data-option="${question.answer}"]`);
    if (answer) {
      answer.setAttribute("data-state", "answer");
      answer.querySelector(".option__flag").textContent = "Correct answer";
    }
  }
  showFeedback(fieldset, right, question.explanation || "");
}

function markGap(node, activity, reveal) {
  const index = Number(node.dataset.question);
  const question = activity.questions[index];
  const input = node.querySelector(".gap-input");
  if (!input) return;
  const value = input.value.trim();
  if (!value && !reveal) return;

  const right = accepts(question.answer).includes(normalise(value));
  input.setAttribute("data-state", right ? "correct" : "wrong");
  const answer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
  showFeedback(
    node,
    right,
    right
      ? question.explanation || ""
      : `The answer is “${answer}”. ${question.explanation || ""}`.trim()
  );
}

function markError(node, activity, reveal) {
  const index = Number(node.dataset.question);
  const question = activity.questions[index];
  const input = node.querySelector("[data-answer]");
  if (!input) return;
  const value = input.value.trim();
  if (!value && !reveal) return;

  const right = accepts(question.answer).includes(normalise(value));
  input.setAttribute("data-state", right ? "correct" : "wrong");
  const answer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
  showFeedback(
    node,
    right,
    right ? question.explanation || "" : `Correct sentence: “${answer}”. ${question.explanation || ""}`.trim()
  );
}

function refreshOrderButtons(list) {
  Array.prototype.forEach.call(list.children, (li, i) => {
    const up = li.querySelector('[data-move="up"]');
    const down = li.querySelector('[data-move="down"]');
    if (up) up.disabled = i === 0;
    if (down) down.disabled = i === list.children.length - 1;
  });
}

function updateScore(root, activity) {
  const type = TYPES[activity.type];
  const total = type.total(activity);
  const correct = type.correct(root, activity);
  const percent = total ? Math.round((correct / total) * 100) : 0;

  const score = root.querySelector(".score");
  if (!score) return;
  score.hidden = false;
  const value = score.querySelector(".score__value");
  value.textContent = `${correct} / ${total}`;
  value.setAttribute("data-band", band(percent));
  score.querySelector(".score__note").textContent = `${percent}% — ${scoreNote(percent)}`;
  announce(root.querySelector("[data-live]"), `Score: ${correct} out of ${total}.`);
}

/* ------------------------------------------------------------- mounting */

function mount(node, source, options) {
  const type = TYPES[source.type];
  if (!type) {
    node.innerHTML = `<div class="callout callout--warn"><p class="mb-0">This activity type (“${esc(
      source.type
    )}”) is not recognised.</p></div>`;
    return;
  }

  const opts = options || {};
  const state = { level: opts.level || currentLevel(), retry: opts.only ? opts.only.length : 0 };
  const activity = prepare(source, state.level, opts.only);

  node.innerHTML = shell(activity, type.render(activity), activity.instructions || type.instructions, state);
  const root = node.querySelector(".activity");
  type.wire(root, activity);
  if (state.level === "guided") addClues(root, activity);

  const focusHeading = () => {
    const heading = node.querySelector(".activity__head h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  };

  root.querySelectorAll(".activity__level-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.level === state.level) return;
      store.set(LEVEL_KEY, btn.dataset.level);
      mount(node, source, { level: btn.dataset.level });
      const again = node.querySelector(`.activity__level-btn[data-level="${btn.dataset.level}"]`);
      if (again) again.focus();
    });
  });

  root.querySelector("[data-check]").addEventListener("click", () => {
    type.check(root, activity);
    updateScore(root, activity);

    const total = type.total(activity);
    const correct = type.correct(root, activity);
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const note = root.querySelector(".score__note");
    if (!state.retry) {
      const result = recordResult(source, percent, state.level);
      const best = readProgress()[source.id];
      const stars = root.querySelector("[data-stars]");
      if (best && stars) stars.innerHTML = `<span aria-hidden="true">${starText(best.stars)}</span> <span>Best ${best.best}% (${esc(best.level)})</span>`;
      if (note) {
        const earned = result.stars
          ? ` You earned ${result.stars} ${result.stars === 1 ? "star" : "stars"}${result.improved && result.prev.best >= 0 ? ", a new best" : ""}.`
          : "";
        note.textContent += earned;
      }
    } else if (note) {
      note.textContent += " (Repeat of missed questions: stars are awarded for a full attempt.)";
    }

    const wrong = wrongOriginals(root, activity);
    const retryBtn = root.querySelector("[data-retry-wrong]");
    retryBtn.hidden = wrong.length === 0 || wrong.length === total || (source.type === "match" && wrong.length < 2);
    retryBtn.textContent = `Try the ${wrong.length === 1 ? "wrong one" : `${wrong.length} wrong ones`} again`;
    retryBtn.onclick = () => { mount(node, source, { level: state.level, only: wrong }); focusHeading(); };

    root.querySelector("[data-print-wrap]").hidden = false;
    root.querySelector("[data-print-result]").onclick = () => printResult(root, activity, state, correct, total);

    announce(root.querySelector("[data-live]"), `Score: ${correct} out of ${total}.`);
    const first = root.querySelector('[data-feedback]:not([hidden])');
    if (first) first.scrollIntoView({ block: "nearest" });
  });

  root.querySelector("[data-reset]").addEventListener("click", () => {
    mount(node, source, { level: state.level });
    focusHeading();
  });
}

/* A short line above the first activity on a page with several: the stars
   earned on this page, on this device. */
function pageProgress(mountsOnPage, activities) {
  if (mountsOnPage.length < 2) return;
  const ids = mountsOnPage.map((n) => n.getAttribute("data-activity")).filter((id) => activities.has(id));
  const bar = document.createElement("p");
  bar.className = "activity-progress";
  bar.setAttribute("role", "status");
  const paint = () => {
    const p = readProgress();
    const stars = ids.reduce((sum, id) => sum + ((p[id] && p[id].stars) || 0), 0);
    const done = ids.filter((id) => p[id]).length;
    bar.innerHTML = `<span aria-hidden="true">★</span> <strong>${stars} of ${ids.length * 3} stars</strong> on this page · ${done} of ${ids.length} activities tried <span class="text-muted">(saved on this device only)</span>`;
  };
  paint();
  mountsOnPage[0].before(bar);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-check]")) setTimeout(paint, 0); });
}

const mounts = Array.prototype.slice.call(document.querySelectorAll("[data-activity]"));
if (mounts.length) {
  loadData("quizzes").then((data) => {
    const activities = (data && (Array.isArray(data) ? data : data.activities)) || [];
    const byId = new Map(activities.map((a) => [a.id, a]));
    mounts.forEach((node) => {
      const activity = byId.get(node.getAttribute("data-activity"));
      if (activity) mount(node, activity);
      else {
        node.innerHTML = `<div class="callout callout--note"><p class="mb-0">This activity has not been added yet.</p></div>`;
      }
    });
    pageProgress(mounts.filter((n) => byId.has(n.getAttribute("data-activity"))), byId);
  });
}
