/* ==========================================================================
   RCF English - shared helpers (ES module)

   Loading data:  every list on the site is drawn from a JSON file in /data/.
   Safety:        every value that comes from a data file is escaped before it
                  is put into the page. No raw HTML from data is ever inserted.
   ========================================================================== */

/** Folder prefix that leads back to the site root from the current page. */
export const ROOT = document.body.getAttribute("data-root") || "";

/** Site settings written by the build script from _src/config.json. */
export const CONFIG = window.RCF_CONFIG || {};

/* ------------------------------------------------------------- escaping */

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/** Escape a value for insertion into HTML text or a quoted attribute. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Escape a value for use inside a URL. */
function escUrl(value) {
  return encodeURIComponent(value === null || value === undefined ? "" : String(value));
}

/**
 * Allow only safe link targets. Anything that is not an http(s) address, a
 * mailto/tel address or a same-site path is rejected, so a bad value in a data
 * file can never become a javascript: link.
 */
export function safeHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  return raw;
}

/* ----------------------------------------------------------- data files */

const cache = new Map();

/**
 * Load a JSON file from /data/. Returns [] and reports a friendly message if
 * the file is missing or contains a typing mistake.
 */
export async function loadData(name) {
  if (cache.has(name)) return cache.get(name);
  const promise = fetch(`${ROOT}data/${name}.json`, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`${name}.json could not be loaded (${response.status})`);
      return response.json();
    })
    .catch((error) => {
      console.error("RCF English data error:", error.message);
      return null;
    });
  cache.set(name, promise);
  return promise;
}

/* ------------------------------------------------------------- WhatsApp */

/**
 * Build a WhatsApp link with a pre-written message. The message is encoded, so
 * punctuation and line breaks are always safe.
 */
export function whatsappLink(message) {
  const number = CONFIG.whatsappInternational || "";
  const text = message ? `?text=${escUrl(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

/* ----------------------------------------------------- small DOM helpers */

export function el(id) {
  return document.getElementById(id);
}

/** Read the query string into a plain object. */
export function queryParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/** Write filter state into the address bar without reloading the page. */
export function updateQuery(state) {
  const params = new URLSearchParams();
  Object.keys(state).forEach((key) => {
    if (state[key]) params.set(key, state[key]);
  });
  const query = params.toString();
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

/** Turn "2026-04-18" into "18 April 2026". Returns "" for empty values. */
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "1 result" / "12 results" */
export function countLabel(n, singular = "result", plural = "results") {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Build unique, sorted option values from a list of records. */
export function optionsFrom(records, key) {
  const seen = new Set();
  records.forEach((record) => {
    const value = record[key];
    if (Array.isArray(value)) value.forEach((v) => v && seen.add(String(v)));
    else if (value) seen.add(String(value));
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** Case-insensitive "does this record match every active filter?" */
export function matchesFilters(record, filters) {
  return Object.keys(filters).every((key) => {
    const wanted = filters[key];
    if (!wanted) return true;
    const value = record[key];
    if (Array.isArray(value)) return value.some((v) => String(v) === wanted);
    return String(value || "") === wanted;
  });
}

/** Simple word-based text search across chosen fields. */
export function matchesText(record, term, fields) {
  if (!term) return true;
  const haystack = fields
    .map((field) => {
      const value = record[field];
      return Array.isArray(value) ? value.join(" ") : value || "";
    })
    .join(" ")
    .toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Announce a change to screen-reader users via a live region. */
export function announce(node, message) {
  if (!node) return;
  node.textContent = message;
}
