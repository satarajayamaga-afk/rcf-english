/* ---------------------------------------------------------------------------
   Spoken English dialogues.

   The markup arrives complete and readable: every line of every conversation
   is in the page as an ordinary list. With JavaScript off that is exactly what
   a visitor gets, which is the right fallback for a reading page.

   When this script runs it takes over: it hides the lines, adds a small set of
   controls, and plays the conversation back one turn at a time, so a learner
   hears and sees the exchange unfold at the speed people actually talk. Where
   the device has more than one English voice, each speaker gets their own.

   Nothing here is required to understand the material. It is a way of hearing
   the rhythm of a conversation, which is the thing a printed dialogue cannot
   show.
--------------------------------------------------------------------------- */

import { REDUCED, Speech, speak, wait } from "./speech.js";

/* ------------------------------------------------------------------ setup */

function setUp(root) {
  const list = root.querySelector("[data-dialogue-lines]");
  if (!list) return;
  const lines = Array.from(list.querySelectorAll(".dlg__line"));
  if (!lines.length) return;

  const speakers = [];
  lines.forEach((li) => {
    const who = li.dataset.speaker || "";
    if (who && !speakers.includes(who)) speakers.push(who);
  });

  /* Controls are built here rather than in the HTML so that a visitor without
     JavaScript is never shown a Play button that cannot work. */
  const bar = document.createElement("div");
  bar.className = "dlg__controls";
  bar.innerHTML = `
    <button type="button" class="btn btn--sm btn--accent" data-play>Play conversation</button>
    <button type="button" class="btn btn--sm btn--outline" data-stop hidden>Stop</button>
    <button type="button" class="btn btn--sm btn--outline" data-all>Show all lines</button>
    <label class="dlg__speed">Speed
      <select data-speed>
        <option value="0.8">Slower</option>
        <option value="1" selected>Normal</option>
        <option value="1.2">Faster</option>
      </select>
    </label>
    <p class="dlg__status" role="status" aria-live="polite"></p>`;
  list.before(bar);

  const playBtn = bar.querySelector("[data-play]");
  const stopBtn = bar.querySelector("[data-stop]");
  const allBtn = bar.querySelector("[data-all]");
  const speedSel = bar.querySelector("[data-speed]");
  const status = bar.querySelector(".dlg__status");

  const typing = document.createElement("li");
  typing.className = "dlg__typing";
  typing.setAttribute("aria-hidden", "true");
  typing.innerHTML = "<span></span><span></span><span></span>";

  let playing = false;
  let token = 0;

  function hideAll() {
    lines.forEach((li) => li.classList.remove("is-shown", "is-active"));
    root.classList.add("is-armed");
  }

  function showAll() {
    typing.remove();
    lines.forEach((li) => { li.classList.add("is-shown"); li.classList.remove("is-active"); });
    root.classList.remove("is-armed");
  }

  function stop() {
    token += 1;
    playing = false;
    Speech.cancel();
    typing.remove();
    lines.forEach((li) => li.classList.remove("is-active"));
    playBtn.textContent = "Play conversation";
    stopBtn.hidden = true;
    status.textContent = "";
  }

  async function play() {
    const mine = ++token;
    playing = true;
    stopBtn.hidden = false;
    playBtn.textContent = "Restart";
    Speech.cancel();
    hideAll();

    const rate = Number(speedSel.value) || 1;
    const voices = Speech.assign(speakers);
    status.textContent = Speech.supported
      ? "Playing the conversation."
      : "Playing. This device has no speech voice, so the lines appear in time instead.";

    for (const li of lines) {
      if (mine !== token) return;

      /* The pause before a turn is what makes it read as conversation rather
         than as a list appearing. Skipped entirely for reduced motion. */
      if (!REDUCED) {
        li.before(typing);
        typing.className = "dlg__typing dlg__typing--" +
          (li.classList.contains("dlg__line--b") ? "b" : "a");
        await wait(420 / rate);
        if (mine !== token) { typing.remove(); return; }
      }
      typing.remove();

      li.classList.add("is-shown", "is-active");
      li.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });

      const text = (li.querySelector(".dlg__bubble")?.textContent || "").trim();
      await speak(text, voices.get(li.dataset.speaker), rate);
      if (mine !== token) return;
      li.classList.remove("is-active");
      await wait((REDUCED ? 120 : 260) / rate);
    }

    if (mine !== token) return;
    playing = false;
    stopBtn.hidden = true;
    playBtn.textContent = "Play again";
    status.textContent = "Finished.";
    root.classList.remove("is-armed");
  }

  playBtn.addEventListener("click", () => { stop(); play(); });
  stopBtn.addEventListener("click", () => { stop(); showAll(); });
  allBtn.addEventListener("click", () => {
    stop();
    const shown = root.classList.contains("is-armed");
    if (shown) { showAll(); allBtn.textContent = "Hide lines"; }
    else { hideAll(); allBtn.textContent = "Show all lines"; }
  });
  speedSel.addEventListener("change", () => { if (playing) { stop(); play(); } });

  /* Stop talking if the reader navigates away or hides the tab. */
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

  hideAll();
}

document.querySelectorAll("[data-dialogue]").forEach(setUp);
