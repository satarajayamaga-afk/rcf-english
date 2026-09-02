/* Drag-and-drop sorting.
   Items are sorted into two or three labelled baskets.

   Two ways to do it, because dragging is awkward on a small phone held in
   one hand: DRAG an item into a basket, or TAP the item and then TAP the
   basket. Both are always available, and the tap route is what the
   instructions describe.

   Data: buckets: [{ id, title, icon? }]
         items:   [{ text, picture?, bucket }]                             */

import { esc } from "../../lib.js";

export default {
  id: "sort",
  build(activity, api) {
    const buckets = activity.buckets || [];
    const items = api.shuffle(activity.items || []);
    let placed = 0;
    let held = null;          // the item picked up by tapping
    let dragging = null;      // the item being dragged by pointer
    let offset = { x: 0, y: 0 };

    const el = document.createElement("div");
    el.className = "gz-sort";
    el.innerHTML = `
      <div class="gz-sort__items" data-sort="pool">
        ${items.map((item, i) => `
          <button type="button" class="gz-chip" data-i="${i}" data-bucket="${esc(item.bucket)}">
            ${item.picture ? api.picture(item.picture, item.text) : ""}
            <span class="gz-chip__text">${esc(item.text)}</span>
          </button>`).join("")}
      </div>
      <div class="gz-sort__buckets">
        ${buckets.map((b) => `
          <div class="gz-bucket" data-bucket="${esc(b.id)}">
            <div class="gz-bucket__head">
              ${b.icon ? api.picture(b.icon, "") : ""}
              <span class="gz-bucket__title">${esc(b.title)}</span>
            </div>
            <div class="gz-bucket__drop"></div>
          </div>`).join("")}
      </div>`;

    const pool = el.querySelector('[data-sort="pool"]');

    function drop(chip, bucketEl) {
      const wanted = chip.dataset.bucket;
      if (bucketEl.dataset.bucket === wanted) {
        bucketEl.querySelector(".gz-bucket__drop").appendChild(chip);
        chip.classList.remove("is-held");
        chip.classList.add("is-placed");
        chip.disabled = true;
        placed += 1;
        api.correct("In the right basket!");
        api.progress(placed, items.length);
        if (placed === items.length) setTimeout(() => api.finish(), 600);
      } else {
        chip.classList.add("is-wrong");
        api.wrong("Not that basket");
        setTimeout(() => chip.classList.remove("is-wrong"), 500);
      }
      held = null;
      el.querySelectorAll(".gz-bucket").forEach((b) => b.classList.remove("is-target"));
    }

    /* --- tap to pick up, tap to drop ---------------------------------- */
    el.addEventListener("click", (event) => {
      if (dragging) return;
      const chip = event.target.closest(".gz-chip");
      const bucketEl = event.target.closest(".gz-bucket");

      if (chip && !chip.classList.contains("is-placed")) {
        if (held === chip) { chip.classList.remove("is-held"); held = null; return; }
        if (held) held.classList.remove("is-held");
        held = chip;
        chip.classList.add("is-held");
        api.flip();
        api.say(`${chip.textContent.trim()} picked up. Now tap a basket.`);
        el.querySelectorAll(".gz-bucket").forEach((b) => b.classList.add("is-target"));
        return;
      }
      if (bucketEl && held) drop(held, bucketEl);
    });

    /* --- or drag it ---------------------------------------------------- */
    el.addEventListener("pointerdown", (event) => {
      const chip = event.target.closest(".gz-chip");
      if (!chip || chip.classList.contains("is-placed")) return;
      const rect = chip.getBoundingClientRect();
      offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      dragging = chip;
      chip.setPointerCapture(event.pointerId);
    });

    el.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const rect = dragging.getBoundingClientRect();
      if (!dragging.classList.contains("is-dragging")) {
        if (Math.abs(event.clientX - rect.left - offset.x) < 6 && Math.abs(event.clientY - rect.top - offset.y) < 6) return;
        dragging.classList.add("is-dragging");
      }
      dragging.style.transform = `translate(${event.clientX - rect.left - offset.x}px, ${event.clientY - rect.top - offset.y}px)`;
      const over = document.elementFromPoint(event.clientX, event.clientY);
      const bucketEl = over && over.closest(".gz-bucket");
      el.querySelectorAll(".gz-bucket").forEach((b) => b.classList.toggle("is-over", b === bucketEl));
    });

    function endDrag(event) {
      if (!dragging) return;
      const chip = dragging;
      const wasDragging = chip.classList.contains("is-dragging");
      dragging = null;
      chip.classList.remove("is-dragging");
      chip.style.transform = "";
      el.querySelectorAll(".gz-bucket").forEach((b) => b.classList.remove("is-over"));
      if (!wasDragging) return;                       // it was a tap, let click handle it
      const over = document.elementFromPoint(event.clientX, event.clientY);
      const bucketEl = over && over.closest(".gz-bucket");
      if (bucketEl) drop(chip, bucketEl);
      else pool.appendChild(chip);
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    api.progress(0, items.length);
    return { el };
  }
};
