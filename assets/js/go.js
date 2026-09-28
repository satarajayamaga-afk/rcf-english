// PARTNER LINK - record the click, then send the visitor on.
//
// Order matters here. The beacon is queued first and the redirect follows
// immediately; navigator.sendBeacon exists precisely so that a request
// survives the page being navigated away from. The visitor never waits for
// the log to be written, and a log that fails never stops the redirect.
//
// WHAT IS SENT: the partner, the page the visitor came from, the browser's
// timezone and its language.
//
// WHAT IS NOT SENT: no IP address, no identifier, no cookie, nothing that
// could single out a person. The country is derived from the timezone the
// browser already reports - "Asia/Colombo" means Sri Lanka - rather than
// from an IP lookup, so nobody's address is sent to any third party.

const el = document.getElementById("partner-go");
if (el) {
  const url = el.dataset.url || "";
  const endpoint = el.dataset.endpoint || "";
  const partner = el.dataset.partner || "";

  const go = () => {
    // replace(), not assign(): the redirect page must not sit in the back
    // history, or Back from the advertiser's site lands here and bounces
    // the visitor straight out again.
    if (url) window.location.replace(url);
  };

  if (endpoint && partner) {
    try {
      const payload = {
        partner: partner,
        // document.referrer is the page on this site that they clicked from.
        // It is a page address, never a person.
        from: document.referrer || "",
        tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
        lang: navigator.language || ""
      };
      const body = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=UTF-8" });
      // text/plain avoids a CORS preflight, which a beacon cannot wait for.
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);
      else {
        // Older browsers: fire and forget, and do not wait for it.
        fetch(endpoint, { method: "POST", body: body, mode: "no-cors", keepalive: true }).catch(() => {});
      }
    } catch (e) {
      // A failed count is a small problem. A visitor stuck on a blank
      // redirect page is a large one, so nothing here may throw.
    }
  }

  // A short pause so the disclosure is readable, then on. Anyone who wants
  // to go immediately has the link in front of them.
  window.setTimeout(go, 900);
}
