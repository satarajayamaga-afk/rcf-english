/* RCF English service worker.

   Pages: network first, so a visitor online always gets the current page; a
   copy is kept, and used when the connection is lost. A page never opened
   before falls back to the offline page.

   Styles, scripts, data and images: served from the cache when present and
   refreshed in the background, so repeat visits are fast.

   VERSION changes with each deploy (the build writes it), which clears old
   caches and lets the page offer "Show the new version". */

const VERSION = "rcf-afb4365afc02";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const CORE = [
  "./",
  "offline/",
  "assets/css/styles.css",
  "assets/js/nav.js",
  "assets/js/personal.js",
  "assets/js/site-config.js",
  "assets/img/icons/favicon.svg",
  "manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ASSETS).then((c) => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("offline/", { ignoreSearch: true })))
    );
    return;
  }

  // Large downloads (PDFs and similar) are not cached: they would fill a phone.
  if (/\.(pdf|zip|docx?|pptx?|mp3|mp4)$/i.test(url.pathname)) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
