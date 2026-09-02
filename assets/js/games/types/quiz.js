/* Multiple-choice challenge.
   One question at a time, with an optional picture or short passage.
   Data: questions: [{ picture?, passage?, ask, options: [], answer: index }] */

import { esc } from "../../lib.js";

export default {
  id: "quiz",
  build(activity, api) {
    const questions = activity.shuffleQuestions === false
      ? (activity.questions || [])
      : api.shuffle(activity.questions || []);
    let index = 0;
    let answered = false;

    const el = document.createElement("div");
    el.className = "gz-quiz";

    function render() {
      const q = questions[index];
      answered = false;
      el.innerHTML = `
        <p class="gz-quiz__count">Question ${index + 1} of ${questions.length}</p>
        ${q.picture ? `<div class="gz-quiz__pic">${api.picture(q.picture, "")}</div>` : ""}
        ${q.passage ? `<p class="gz-quiz__passage">${esc(q.passage)}</p>` : ""}
        <h3 class="gz-quiz__ask">${esc(q.ask)}</h3>
        <div class="gz-quiz__options">
          ${q.options.map((option, i) =>
            `<button type="button" class="gz-opt" data-i="${i}">${esc(option)}</button>`).join("")}
        </div>`;
      api.progress(index, questions.length);
      api.say(q.ask);
    }

    el.addEventListener("click", (event) => {
      const button = event.target.closest(".gz-opt");
      if (!button || answered) return;
      const q = questions[index];
      const chosen = Number(button.dataset.i);

      if (chosen === q.answer) {
        answered = true;
        button.classList.add("is-right");
        api.correct("Correct!");
        el.querySelectorAll(".gz-opt").forEach((b) => { b.disabled = true; });
        setTimeout(() => {
          index += 1;
          if (index >= questions.length) api.finish();
          else render();
        }, 750);
      } else {
        button.classList.add("is-wrong");
        button.disabled = true;
        api.wrong("Try another one");
      }
    });

    render();
    return { el };
  }
};
