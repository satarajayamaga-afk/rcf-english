/* ==========================================================================
   RCF English - pre-launch countdown

   Counts down to the launch date written into the markup by the build,
   using the visitor's own clock. There is no server behind this website,
   so nothing is fetched and nothing is sent anywhere.

   Three things worth knowing:

   1. The target carries a time zone (+05:30), so the countdown reaches
      zero at the same moment for a reader in Colombo and a reader abroad.
      It does not drift with the visitor's own time zone.

   2. setInterval slips a little on a busy or sleeping device, so each tick
      is worked out from the real clock rather than by subtracting one from
      the last figure. The interval is only a heartbeat.

   3. The digits change every second. A screen reader reading that aloud
      would talk over itself, so the clock is hidden from assistive
      technology in the markup and a quieter status line, updated once a
      minute, carries the same information in words.
   ========================================================================== */

const clock = document.querySelector("[data-countdown]");

if (clock) {
  const status = document.querySelector("[data-cd-status]");
  const fields = {
    days: clock.querySelector('[data-cd="days"]'),
    hours: clock.querySelector('[data-cd="hours"]'),
    minutes: clock.querySelector('[data-cd="minutes"]'),
    seconds: clock.querySelector('[data-cd="seconds"]')
  };

  const target = new Date(clock.getAttribute("data-countdown"));
  const usable = !Number.isNaN(target.getTime()) && fields.days && fields.seconds;

  const pad = (n) => String(n).padStart(2, "0");
  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  /* The words under the clock, rebuilt only when the minute changes. */
  let lastMinuteReported = null;

  function describe(parts) {
    const said = [];
    if (parts.days) said.push(plural(parts.days, "day"));
    if (parts.days || parts.hours) said.push(plural(parts.hours, "hour"));
    said.push(plural(parts.minutes, "minute"));
    return said.join(", ") + " until RCF English launches.";
  }

  /* When the date arrives the clock is replaced rather than left at zero,
     so a stale page does not sit there showing four columns of noughts. */
  function announceLaunch() {
    const live = document.createElement("p");
    live.className = "countdown__live";
    live.textContent = "RCF English is live.";
    clock.replaceWith(live);
    if (status) status.textContent = "RCF English is live.";
  }

  function tick() {
    const remaining = target.getTime() - Date.now();

    if (remaining <= 0) {
      announceLaunch();
      return false;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const parts = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };

    fields.days.textContent = pad(parts.days);
    fields.hours.textContent = pad(parts.hours);
    fields.minutes.textContent = pad(parts.minutes);
    fields.seconds.textContent = pad(parts.seconds);

    if (status && parts.minutes !== lastMinuteReported) {
      lastMinuteReported = parts.minutes;
      status.textContent = describe(parts);
    }

    return true;
  }

  if (usable && tick()) {
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);
  }
}
