/* Memory pairs.
   A board of face-down cards. Turn two over: a picture and its word.
   Data: pairs: [{ a, b }]   - a is usually a picture, b is usually a word.  */

import { esc } from "../../lib.js";

export default {
  id: "memory",
  build(activity, api) {
    const pairs = activity.pairs || [];
    const cards = api.shuffle(
      pairs.flatMap((pair, i) => [
        { key: i, face: pair.a, side: "a" },
        { key: i, face: pair.b, side: "b" }
      ])
    );

    let first = null;
    let busy = false;
    let found = 0;

    const el = document.createElement("div");
    el.className = "gz-memory";
    el.style.setProperty("--gz-cols", cards.length > 12 ? 4 : 3);
    el.innerHTML = cards.map((card, index) => `
      <button type="button" class="gz-card" data-key="${card.key}" data-index="${index}" aria-label="Card ${index + 1}, face down">
        <span class="gz-card__back" aria-hidden="true">?</span>
        <span class="gz-card__front">${api.picture(card.face, "") || esc(card.face)}</span>
      </button>`).join("");

    function faceText(button) {
      const front = button.querySelector(".gz-card__front");
      const img = front.querySelector("img");
      return img ? img.getAttribute("alt") || "picture" : front.textContent.trim();
    }

    el.addEventListener("click", (event) => {
      const card = event.target.closest(".gz-card");
      if (!card || busy || card.classList.contains("is-open") || card.classList.contains("is-found")) return;

      card.classList.add("is-open");
      card.setAttribute("aria-label", `Card showing ${faceText(card)}`);
      api.flip();

      if (!first) { first = card; return; }

      if (first.dataset.key === card.dataset.key) {
        [first, card].forEach((n) => { n.classList.add("is-found"); n.disabled = true; });
        first = null;
        found += 1;
        api.correct("Pair found!");
        api.progress(found, pairs.length);
        if (found === pairs.length) setTimeout(() => api.finish(), 700);
      } else {
        busy = true;
        api.wrong("Not a pair");
        const a = first;
        first = null;
        setTimeout(() => {
          [a, card].forEach((n) => {
            n.classList.remove("is-open");
            n.setAttribute("aria-label", "Card, face down");
          });
          busy = false;
        }, 900);
      }
    });

    api.progress(0, pairs.length);
    return { el };
  }
};
