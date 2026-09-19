// Checks that every official book and Teachers' Guide link in books.js still
// works. Usage: node tools/ppp/check-book-links.js
// Prints one line per link and exits with 1 if any link failed.
const http = require("http");
const https = require("https");
const BK = require("./books.js");

const links = [
  ...BK.BOOKS.map(([g, t, p]) => [`${g} ${t}`, BK.epdUrl(p)]),
  ...BK.BY_UNIT.flatMap((b) => b.units.map(([t, p]) => [`${b.title} ${t}`, BK.epdUrl(p)])),
  ...BK.GUIDES.map(([g, t, p]) => [`${g} TG ${t}`, BK.nieUrl(p)]),
  ["EPD book download page", BK.SEARCH],
  ["NIE Teachers' Guide page", BK.TG_SEARCH]
];

function check(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { Range: "bytes=0-99" } }, (res) => {
      res.resume();
      resolve({ status: res.statusCode, type: res.headers["content-type"] || "" });
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
