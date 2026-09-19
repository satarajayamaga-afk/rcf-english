// Checks that every official book and Teachers' Guide link in books.js still
// works. Usage: node tools/ppp/check-book-links.js
// Prints one line per link and exits with 1 if any link failed.
const http = require("http");
const https = require("https");
const BK = require("./books.js");

const both = (name, d) => (d ? [[`${name} (Drive view)`, d.view], [`${name} (Drive download)`, d.dl]] : []);
const links = [
  ...BK.BOOKS.flatMap(([g, t, p, d]) => [[`${g} ${t}`, BK.epdUrl(p)], ...both(`${g} ${t}`, d)]),
  ...BK.BY_UNIT.flatMap((b) => b.units.map(([t, p]) => [`${b.title} ${t}`, BK.epdUrl(p)])),
  ...BK.GUIDES.flatMap(([g, t, p, d]) => [[`${g} TG ${t}`, BK.nieUrl(p)], ...both(`${g} TG ${t}`, d)]),
  ["EPD book download page", BK.SEARCH],
  ["NIE Teachers' Guide page", BK.TG_SEARCH]
];

function check(url, depth = 0) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const isDrive = url.includes("google.com") || url.includes("googleusercontent.com");
    // A Drive file that is not shared with "anyone with the link" sends an
    // anonymous visitor to the Google sign-in page, so treat that as a failure
    // even though Google answers with a normal status code.
    const req = lib.get(url, { headers: isDrive ? { "User-Agent": "Mozilla/5.0" } : { Range: "bytes=0-99" } }, (res) => {
      const loc = res.headers.location || "";
      if (isDrive && /accounts\.google\.com/.test(loc)) {
        res.resume();
        return resolve({ status: "not shared", type: "" });
      }
      // A download link redirects to Google's file server; follow it.
      if (isDrive && loc && res.statusCode >= 300 && res.statusCode < 400 && depth < 3) {
        res.resume();
        return resolve(check(loc.startsWith("http") ? loc : "https://drive.google.com" + loc, depth + 1));
      }
      if (isDrive && res.statusCode === 404) { res.resume(); return resolve({ status: "not shared", type: "" }); }
      if (!isDrive) { res.resume(); return resolve({ status: res.statusCode, type: res.headers["content-type"] || "" }); }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { if (body.length < 40000) body += c; });
      res.on("end", () => {
        const denied = /ServiceLogin|Request access|You need access/i.test(body) && !body.startsWith("%PDF");
        resolve({ status: denied ? "not shared" : res.statusCode, type: res.headers["content-type"] || "" });
      });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: "timeout", type: "" }); });
    req.on("error", (e) => resolve({ status: "error: " + e.message, type: "" }));
  });
}

(async () => {
  let bad = 0;
  for (const [name, url] of links) {
    const { status, type } = await check(url);
    const ok = status === 200 || status === 206;
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "FAIL"} ${String(status).padEnd(6)} ${type.split(";")[0].padEnd(16)} ${name}`);
    if (!ok) console.log(`       ${url}`);
  }
  console.log(`\n${links.length - bad} of ${links.length} links are working.`);
  process.exit(bad ? 1 : 0);
})();
