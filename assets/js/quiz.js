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

/* --------------------------------------------------------------- shell */

function shell(activity, bodyHtml, instructions) {
  const id = esc(activity.id);
  return `
    <section class="activity" id="activity-${id}" data-activity-id="${id}">
      <header class="activity__head">
        <h3 id="activity-${id}-title">${esc(activity.title)}</h3>
        ${activity.description ? `<p>${esc(activity.description)}</p>` : ""}
        <p class="activity__instructions"><strong>What to do:</strong> ${esc(instructions)}</p>
      </header>
      <div class="activity__body">${bodyHtml}</div>
      <footer class="activity__foot">
        <p class="score" id="score-${id}" hidden>
          <span class="score__value" data-band="low">0%</span>
          <span class="score__note"></span>
        </p>
        <button type="button" class="btn btn--sm btn--accent" data-check>Check my answers</button>
        <button type="button" class="btn btn--sm btn--outline" data-reset>${RESET_LABEL}</button>
      </footer>
      <p class="visually-hidden" role="status" aria-live="polite" data-live></p>
    </section>`;
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

function mount(node, activity) {
  const type = TYPES[activity.type];
  if (!type) {
    node.innerHTML = `<div class="callout callout--warn"><p class="mb-0">This activity type (“${esc(
      activity.type
    )}”) is not recognised.</p></div>`;
    return;
  }

  node.innerHTML = shell(activity, type.render(activity), activity.instructions || type.instructions);
  const root = node.querySelector(".activity");
  type.wire(root, activity);

  root.querySelector("[data-check]").addEventListener("click", () => {
    type.check(root, activity);
    updateScore(root, activity);
    const first = root.querySelector('[data-feedback]:not([hidden])');
    if (first) first.scrollIntoView({ block: "nearest" });
  });

  root.querySelector("[data-reset]").addEventListener("click", () => {
    mount(node, activity);
    const heading = node.querySelector(".activity__head h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  });
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
  });
}
