/* Missing-word challenge.
   A sentence with a gap. Tap the word that fills it. The chosen word drops
   into the gap so the child reads the whole sentence back.

   Data: items: [{ sentence: "The cat ___ on the mat.", options: [], answer: index }] */

import { esc } from "../../lib.js";

export default {
  id: "missing",
  build(activity, api) {
    const items = activity.shuffleItems === false
      ? (activity.items || [])
      : api.shuffle(activity.items || []);
    let index = 0;
    let answered = false;

    const el = document.createElement("div");
    el.className = "gz-missing";

    function render() {
      const item = items[index];
      answered = false;
      const [before, after] = String(item.sentence).split(/_{2,}/);
      el.innerHTML = `
        <p class="gz-missing__count">Sentence ${index + 1} of ${items.length}</p>
        ${item.picture ? `<div class="gz-missing__pic">${api.picture(item.picture, "")}</div>` : ""}
        <p class="gz-missing__sentence">
          <span>${esc(before || "")}</span>
          <span class="gz-gap" data-missing="gap">?</span>
          <span>${esc(after || "")}</span>
        </p>
        <div class="gz-missing__options">
          ${item.options.map((option, i) =>
            `<button type="button" class="gz-opt" data-i="${i}">${esc(option)}</button>`).join("")}
        </div>`;
      api.progress(index, items.length);
      api.say(item.sentence.replace(/_{2,}/, "blank"));
    }

    el.addEventListener("click", (event) => {
      const button = event.target.closest(".gz-opt");
      if (!button || answered) return;
      const item = items[index];
      const chosen = Number(button.dataset.i);
      const gap = el.querySelector('[data-missing="gap"]');

      if (chosen === item.answer) {
        answered = true;
        gap.textContent = item.options[chosen];
        gap.classList.add("is-filled");
        button.classList.add("is-right");
        el.querySelectorAll(".gz-opt").forEach((b) => { b.disabled = true; });
        api.correct("That fits!");
        setTimeout(() => {
          index += 1;
          if (index >= items.length) api.finish();
          else render();
        }, 950);
      } else {
        button.classList.add("is-wrong");
        button.disabled = true;
        api.wrong("That word does not fit");
      }
    });

    render();
    return { el };
  }
};
