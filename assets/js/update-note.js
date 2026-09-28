// THE UPDATE NOTICE
//
// Shows the newest site update once, in a corner card, and then never shows
// that same update to that visitor again.
//
// Why it is a corner card and not a modal over the page: Google treats a
// content-blocking interstitial shortly after a visitor arrives from search
// as a mobile usability fault and ranks the page lower for it, and an
// advertisement inside such a thing would breach AdSense policy outright.
// This covers nothing, blocks no scrolling, traps no focus, and is removed
// from the page entirely once dismissed.
//
// The markup is rendered by the build and ships hidden, so a visitor with no
// JavaScript is never shown a card they cannot dismiss.

const KEY = "rcf-update-seen";
const DELAY = 1400; // long enough that the page has settled and the reader has started

const note = document.getElementById("update-note");
if (note) {
  const id = note.dataset.updateId || "";
  const closeBtn = note.querySelector(".unote__close");
  const kicker = note.querySelector(".unote__kicker");

  // What has this visitor already seen? A list, not a single value, so that
  // dismissing today's does not bring back last week's.
  const seen = () => {
    try {
      const v = localStorage.getItem(KEY);
      return v ? JSON.parse(v) : [];
    } catch (e) {
      // Private windows and blocked site data both throw. A visitor there
      // simply sees the notice each visit, which is the harmless failure.
      return [];
    }
  };
  const remember = (value) => {
    try {
      // Keep the last twenty only; the file never needs to grow.
      const list = seen().filter((x) => x !== value).concat(value).slice(-20);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) { /* nothing to do, and nothing worth telling the reader */ }
  };

  const dismiss = () => {
    if (id) remember(id);
    note.hidden = true;
    note.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") dismiss(); };

  if (id && !seen().includes(id)) {
    // "Today's update" only when it genuinely is today. The build cannot know
    // this - a page built last week is still being read now - so the date is
    // compared in the visitor's own timezone at the moment they read it.
    if (kicker) {
      const d = note.dataset.updateDate || "";
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const iso = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
      if (d === iso) kicker.textContent = "Today's update";
      else {
        const then = new Date(d + "T00:00:00");
        const days = Math.round((today - then) / 86400000);
        kicker.textContent = days >= 1 && days <= 7 ? "This week's update" : "Latest update";
      }
    }

    if (closeBtn) closeBtn.addEventListener("click", dismiss);
    // Following the link counts as having seen it.
    const go = note.querySelector(".unote__go");
    if (go) go.addEventListener("click", () => { if (id) remember(id); });
    document.addEventListener("keydown", onKey);

    window.setTimeout(() => {
      note.hidden = false;
      // Reveal on the next frame so the transition actually runs.
      window.requestAnimationFrame(() => note.classList.add("is-in"));
    }, DELAY);
  } else {
    // Seen already: take it out of the document rather than leave it hidden.
    note.remove();
  }
}
