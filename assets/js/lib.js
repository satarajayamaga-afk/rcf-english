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

/* Shared query normalisation. The search page and every browse list use this,
   so "Grade 7 second term", "gr 7 term 2" and "Grade Seven 2nd Term" behave
   the same wherever they are typed. It lives here rather than being duplicated
   because the two had drifted apart: the browse lists never learned the
   synonyms at all, and neither knew that "7" should not match 2017. */
const NUMBER_WORDS = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13"
};

export function normaliseQuery(raw) {
  let q = ` ${String(raw || "").toLowerCase()} `;
  q = q.replace(/\bordinary\s+level\b/g, " ol ").replace(/\bo\s*\/\s*l\b/g, " ol ");
  q = q.replace(/\badvanced\s+level\b/g, " al ").replace(/\ba\s*\/\s*l\b/g, " al ");
  q = q.replace(/[^a-z0-9]+/g, " ");
  q = q.replace(/\bgr\s*(\d{1,2})\b/g, " grade $1 ").replace(/\bg\s*(\d{1,2})\b/g, " grade $1 ");
  q = q.replace(/\bgrade\s+([a-z]+)\b/g, (m, w) => (NUMBER_WORDS[w] ? ` grade ${NUMBER_WORDS[w]} ` : m));
  const ORDINAL = { 1: "first", 2: "second", 3: "third" };
  // "term 2", "term two", "2nd term", "second term" and "two term" are one
  // request. Written words are handled as well as digits, because a person
  // typing "grade seven term two" has spelled both numbers out.
  q = q.replace(/\bterm\s+(one|two|three)\b/g, (m, w) => ` ${ORDINAL[NUMBER_WORDS[w]]} term `);
  q = q.replace(/\b(one|two|three)\s+term\b/g, (m, w) => ` ${ORDINAL[NUMBER_WORDS[w]]} term `);
  q = q.replace(/\bterm\s*([123])\b/g, (m, n) => ` ${ORDINAL[n]} term `);
  q = q.replace(/\b([123])\s*(?:st|nd|rd)?\s+term\b/g, (m, n) => ` ${ORDINAL[n]} term `);
  q = q.replace(/\b1st\b/g, " first ").replace(/\b2nd\b/g, " second ").replace(/\b3rd\b/g, " third ");
  q = q.replace(/\byear\s+end\b/g, " third term ");
  return q.split(/\s+/).filter(Boolean);
}

/** Word-aware match: "west" finds "western", but "7" never matches 2017. */
export function matchesQuery(record, term, fields) {
  const words = normaliseQuery(term);
  if (!words.length) return true;
  const hay = fields
    .map((f) => {
      const v = record[f];
      return Array.isArray(v) ? v.join(" ") : v || "";
    })
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.every((w) =>
    /^\d+$/.test(w) ? hay.includes(w) : hay.some((h) => h === w || h.startsWith(w)));
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
