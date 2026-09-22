/* RCF English service worker.

   Pages: network first, so a visitor online always gets the current page; a
   copy is kept, and used when the connection is lost. A page never opened
   before falls back to the offline page.

   Versioned styles and scripts (?v=<hash>): cache first, because a new
   version always has a new address.
   Unversioned scripts and data: network first, cache only when offline, so
   an update is never hidden behind an old copy.
   Images: served from the cache and refreshed in the background.

   Nothing personal is ever cached: the site has no logins or private pages,
   and a visitor's own settings live in localStorage, not in these caches.

   VERSION changes with each deploy (the build writes it), which clears old
   caches and lets the page offer "Show the new version". */

const VERSION = "rcf-f08958742e86";
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

  const save = (res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(ASSETS).then((c) => c.put(req, copy));
    }
    return res;
  };
  const offlineCopy = () => caches.match(req, { ignoreSearch: true });

  // Versioned styles and scripts (?v=<content hash>): the address changes
  // whenever the file does, so a cached copy is always the right one.
  if (url.searchParams.has("v")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save).catch(offlineCopy)));
    return;
  }

  // Unversioned code and data (modules imported by other scripts, and the
  // data files): network first, so an update is never hidden behind a stale
  // copy; the cached copy is used only when offline.
  if (/\.(js|mjs|css|json|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(fetch(req).then(save).catch(offlineCopy));
    return;
  }

  // Images and icons: served from the cache and refreshed in the background.
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
