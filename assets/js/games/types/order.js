/* Word and sentence ordering.
   The words of a sentence are shuffled. Tap them in the right order to
   build the sentence. Tapping a word in the answer line takes it back.

   Tapping rather than dragging is deliberate: on a phone, dragging small
   word tiles into a line is fiddly for a young child, and a mis-drag loses
   the word. Tapping cannot go wrong and can always be undone.

   Data: sentences: [{ words: [], hint? }]                                  */

import { esc } from "../../lib.js";

export default {
  id: "order",
  build(activity, api) {
    const sentences = activity.sentences || [];
    let index = 0;
    let correct = [];

    const el = document.createElement("div");
    el.className = "gz-order";

    function render() {
      const sentence = sentences[index];
      correct = sentence.words;
      const pool = api.shuffle(correct.map((word, i) => ({ word, i })));

      el.innerHTML = `
        <p class="gz-order__count">Sentence ${index + 1} of ${sentences.length}</p>
        ${sentence.hint ? `<p class="gz-order__hint">${esc(sentence.hint)}</p>` : ""}
        <div class="gz-order__line" data-order="line" aria-label="Your sentence"></div>
        <div class="gz-order__pool" data-order="pool">
          ${pool.map((w) => `<button type="button" class="gz-word" data-i="${w.i}">${esc(w.word)}</button>`).join("")}
        </div>
        <div class="gz-order__tools">
          <button type="button" class="gz-btn gz-btn--ghost" data-order="clear">Start this one again</button>
        </div>`;

      api.progress(index, sentences.length);
      api.say(sentence.hint || "Tap the words in order");
    }

    function check() {
      const line = el.querySelector('[data-order="line"]');
      const built = [...line.querySelectorAll(".gz-word")].map((b) => b.textContent);
      if (built.length !== correct.length) return;

      if (built.join(" ") === correct.join(" ")) {
        line.classList.add("is-right");
        api.correct("That is the sentence!");
        setTimeout(() => {
          index += 1;
          api.progress(index, sentences.length);
          if (index >= sentences.length) api.finish();
          else render();
        }, 900);
      } else {
        line.classList.add("is-wrong");
        api.wrong("Not quite - tap a word to take it back");
        setTimeout(() => line.classList.remove("is-wrong"), 600);
      }
    }

    /* One listener for the whole game, whatever is on screen. */
    el.addEventListener("click", (event) => {
      if (event.target.closest('[data-order="clear"]')) { render(); return; }
      const word = event.target.closest(".gz-word");
      if (!word) return;
      const line = el.querySelector('[data-order="line"]');
      const pool = el.querySelector('[data-order="pool"]');
      if (word.parentElement === pool) {
        line.appendChild(word);
        api.flip();
        check();
      } else {
        pool.appendChild(word);
        line.classList.remove("is-right", "is-wrong");
      }
    });

    render();
    return { el };
  }
};
