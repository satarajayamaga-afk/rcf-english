/* Picture and word matching.
   Tap a picture, then tap its word. Matched pairs lock in and light up.
   Data: pairs: [{ picture, word }]                                        */

import { esc } from "../../lib.js";

export default {
  id: "match",
  build(activity, api) {
    const pairs = activity.pairs || [];
    const pictures = api.shuffle(pairs.map((p, i) => ({ ...p, key: i })));
    const words = api.shuffle(pairs.map((p, i) => ({ ...p, key: i })));
    let picked = null;
    let done = 0;

    const el = document.createElement("div");
    el.className = "gz-match";
    el.innerHTML = `
      <div class="gz-match__col gz-match__col--pics">
        ${pictures.map((p) => `
          <button type="button" class="gz-tile gz-tile--pic" data-key="${p.key}">
            ${api.picture(p.picture, p.word)}
          </button>`).join("")}
      </div>
      <div class="gz-match__col gz-match__col--words">
        ${words.map((p) => `
          <button type="button" class="gz-tile gz-tile--word" data-key="${p.key}">${esc(p.word)}</button>`).join("")}
      </div>`;

    function clearPick() {
      el.querySelectorAll(".is-picked").forEach((n) => n.classList.remove("is-picked"));
      picked = null;
    }

    el.addEventListener("click", (event) => {
      const tile = event.target.closest(".gz-tile");
      if (!tile || tile.classList.contains("is-done")) return;
      const isPicture = tile.classList.contains("gz-tile--pic");

      if (!picked) {
        picked = tile;
        tile.classList.add("is-picked");
        api.flip();
        api.say(isPicture ? "Now tap the word" : "Now tap the picture");
        return;
      }

      if (picked === tile) { clearPick(); return; }

      const sameSide = picked.classList.contains("gz-tile--pic") === isPicture;
      if (sameSide) { clearPick(); picked = tile; tile.classList.add("is-picked"); return; }

      if (picked.dataset.key === tile.dataset.key) {
        [picked, tile].forEach((n) => { n.classList.remove("is-picked"); n.classList.add("is-done"); n.disabled = true; });
        picked = null;
        done += 1;
        api.correct("Match!");
        api.progress(done, pairs.length);
        if (done === pairs.length) setTimeout(() => api.finish(), 600);
      } else {
        const missed = picked;
        [missed, tile].forEach((n) => n.classList.add("is-wrong"));
        api.wrong("Not a pair");
        setTimeout(() => {
          [missed, tile].forEach((n) => n.classList.remove("is-wrong", "is-picked"));
        }, 500);
        picked = null;
      }
    });

    api.progress(0, pairs.length);
    return { el };
  }
};
