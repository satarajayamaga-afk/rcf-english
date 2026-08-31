/* ==========================================================================
   RCF English - tuition and course promotions

   Two small jobs, both done without any outside service:

   1. EXPIRY. This website is plain files with no server, so nothing can run
      at midnight to retire an advertisement. The build already leaves out
      anything expired at the time it ran. This adds the second half: if a
      listing has run out since the last build, it is hidden here using the
      visitor's own clock. So an advertisement stops showing on the right
      day even if nobody has rebuilt the site.

   2. FILTERS. Simple dropdowns built from whatever listings are actually
      present. With no listings, or only one, no filters are shown at all.

   Nothing is sent anywhere and nothing is stored.
   ========================================================================== */

const list = document.querySelector("[data-ads]");
const emptyNote = document.querySelector("[data-ads-empty]");

/* --------------------------------------------------------------- expiry */

function expired(card) {
  // Advertisements and RCF offers use different attributes so that
  // the two kinds of listing stay clearly apart in the markup.
  const raw = card.getAttribute("data-ad-expiry") || card.getAttribute("data-offer-expiry");
  if (!raw) return false;
  const end = new Date(raw + "T23:59:59");
  if (Number.isNaN(end.getTime())) return false;
  return new Date() > end;
}

// RCF's own offer lists sit in their own sections and expire the same way.
function retireExpiredOffers() {
  document.querySelectorAll("[data-offers]").forEach((ul) => {
    ul.querySelectorAll(".ad").forEach((card) => {
      if (expired(card)) {
        card.hidden = true;
        card.setAttribute("data-expired", "true");
      }
    });
  });
}

function retireExpired() {
  if (!list) return 0;
  let live = 0;
  list.querySelectorAll(".ad").forEach((card) => {
    if (expired(card)) {
      card.hidden = true;
      card.setAttribute("data-expired", "true");
    } else {
      live += 1;
    }
  });
  return live;
}

/* -------------------------------------------------------------- filters */

const FILTERS = [
  { key: "mode", label: "Class type" },
  { key: "subject", label: "Subject" },
  { key: "audience", label: "For" },
  { key: "location", label: "Location" }
];

function valueOf(card, key) {
  // Read the fact rows the build wrote, so the filters need no extra data.
  const map = { mode: "Class", audience: "For", location: "Where" };
  if (key === "subject") {
    return (card.querySelector(".ad__title")?.textContent || "").trim();
  }
  const wanted = map[key];
  let found = "";
  card.querySelectorAll(".ad__row").forEach((row) => {
    if ((row.querySelector("dt")?.textContent || "").trim() === wanted) {
      found = (row.querySelector("dd")?.textContent || "").trim();
    }
  });
  return found;
}

function buildFilters() {
  if (!list) return;
  const cards = [...list.querySelectorAll(".ad")].filter((c) => !c.hidden);
  // Filters only earn their place once there is something to filter.
  if (cards.length < 3) return;

  const usable = FILTERS.map((f) => {
    const values = [...new Set(cards.map((c) => valueOf(c, f.key)).filter(Boolean))].sort();
    return { ...f, values };
  }).filter((f) => f.values.length > 1);

  if (!usable.length) return;

  const bar = document.createElement("div");
  bar.className = "ads-filters";
  bar.innerHTML =
    usable
      .map(
        (f) => `
      <label class="ads-filters__field">
        <span>${f.label}</span>
        <select data-filter="${f.key}">
          <option value="">All</option>
          ${f.values.map((v) => `<option value="${v.replace(/"/g, "&quot;")}">${v}</option>`).join("")}
        </select>
      </label>`
      )
      .join("") +
    `<button type="button" class="btn btn--sm btn--outline" data-filter-reset>Show all</button>
     <p class="ads-filters__count" role="status" aria-live="polite" data-filter-count></p>`;
  list.parentNode.insertBefore(bar, list);

  const count = bar.querySelector("[data-filter-count]");

  function apply() {
    const chosen = {};
    bar.querySelectorAll("select[data-filter]").forEach((s) => {
      if (s.value) chosen[s.getAttribute("data-filter")] = s.value;
    });
    let shown = 0;
    cards.forEach((card) => {
      const ok = Object.keys(chosen).every((k) => valueOf(card, k) === chosen[k]);
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    count.textContent =
      shown === cards.length ? "" : `${shown} of ${cards.length} listings shown.`;
  }

  bar.addEventListener("change", apply);
  bar.querySelector("[data-filter-reset]").addEventListener("click", () => {
    bar.querySelectorAll("select[data-filter]").forEach((s) => { s.value = ""; });
    apply();
  });
}

/* ----------------------------------------------------------------- start */

if (list) {
  const live = retireExpired();
  if (live === 0 && emptyNote) {
    list.hidden = true;
    emptyNote.hidden = false;
  } else {
    buildFilters();
  }
}

// Offer sections are independent of the advertisement directory above, so
// this runs whether or not this page carries any advertisements at all.
retireExpiredOffers();
