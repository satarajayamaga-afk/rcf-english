# Partner click tracking: setting it up

Fifteen minutes, once. After this, adding a partner is one entry in a JSON
file and a rebuild.

## What you are building

```
  A reader clicks a partner link on rcfenglish.com
            |
            v
  rcfenglish.com/go/<partner>/     a page that says "Sponsored link"
            |
            |  records the click (a beacon, does not delay anyone)
            v
  Google Apps Script web app  ->  writes a row in your Google Sheet
            |
            v
  The reader arrives at the advertiser, with ?ref=YOURCODE on the address
```

The Sheet is the dashboard. There is **no admin page on the website**, and
that is deliberate — see "Why there is no dashboard page" at the end.

## 1. Make the Sheet

1. Go to <https://sheets.new> and name it something like
   **RCF English — Partner Clicks**.
2. **Extensions → Apps Script.**
3. Delete whatever is in the editor.
4. Paste the whole of `Code.gs` from this folder.
5. Save (the disk icon).

## 2. Deploy it as a web app

1. **Deploy → New deployment.**
2. Click the gear beside "Select type" and choose **Web app**.
3. Set:
   - **Description:** `Partner click tracking`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. **Deploy**, and authorise it when Google asks. It will warn you that the
   script is not verified — that is normal for your own script. Choose
   **Advanced → Go to (project name)** and allow it.
5. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy.../exec`

**"Who has access: Anyone" is required and is safe here.** The browser of
every reader has to be able to reach it, so it must be public — as every
endpoint a browser can reach is. It accepts a partner name and a timezone and
writes a row. It hands nothing back: opening the address in a browser shows
one line of text and no data. Your Sheet stays private to you.

## 3. Tell the site where it is

Open `_src/config.json` and put the URL in:

```json
"partners": { "endpoint": "https://script.google.com/macros/s/AKfy.../exec" }
```

Rebuild. That is the whole connection.

If you leave it empty, the `/go/` links still work perfectly and simply
count nothing.

## 4. Turn on the nightly dashboard

Back in the Apps Script editor, choose `createDailyTrigger` from the function
list and press **Run**, once. The Dashboard sheet then rebuilds every night.

You can rebuild it at any moment from the Sheet: **RCF Partners → Rebuild
dashboard now**. (Reload the Sheet once after deploying for that menu to
appear.)

## 5. Add a partner

In `data/partners.json`:

```json
{
  "id": "example-college",
  "name": "Example College",
  "url": "https://example.com/apply",
  "refCode": "RCF2026",
  "disclosure": "RCF English is paid a commission if you enrol through this link. It costs you nothing extra, and we only list places we would tell a relative about.",
  "active": true
}
```

Then:

```bash
node tools/partners/gen.js
```

and rebuild. The link is `https://rcfenglish.com/go/example-college/`.

`active: false` parks a partner without deleting the record.

## What gets recorded

| Column | Example | Note |
|---|---|---|
| When | 2026-10-04 14:22 | |
| Partner | example-college | |
| Country | Sri Lanka | From the browser's timezone, approximate |
| Timezone | Asia/Colombo | |
| Language | si-LK | |
| Came from | /practical-english/english-for-university/ | Which page sent them |

**No IP address, no cookie, no identifier for the person.** Apps Script is
not given the visitor's IP, and the country is worked out from the timezone
the browser already reports rather than from any lookup service. That is less
precise than IP geolocation and it is the right trade: nobody's address is
sent anywhere, and "which countries did the clicks come from" is answered
well enough for any advertiser.

## Telling an advertiser the truth about the numbers

Put all four of these in writing at the start. A partner told them up front
trusts the figures; one who works them out later does not.

1. **These are clicks, not enrolments.** Commission is paid on enrolments
   *they* confirm against the referral code. Our figures are a cross-check.
2. **The endpoint is public**, as every browser endpoint is. Counts could in
   principle be inflated by someone determined to do it. Watch for a partner
   whose clicks jump while the pages feeding them stay quiet.
3. **Some clicks are missed.** A reader blocking scripts may not be counted,
   so the real figure is at or above what is recorded, never below.
4. **The country is approximate**, derived from the timezone.

## Watching for trouble

- **Clicks with no enrolments at all, over months.** Either the link is on
  the wrong page, or the advertiser's own tracking is not recording the
  referral code. Ask before assuming.
- **A sudden jump on one partner** with no matching rise in traffic to the
  pages that link to them. Check the "Came from" column: real clicks come
  from a spread of pages.
- **Many clicks from a country you have no audience in.** Worth a look.

## Why there is no dashboard page on the website

Because it could not be made private. The site is static — there is no login,
no server, and nothing to check who is asking. Any "admin dashboard" at a web
address would be readable by anyone who found the address, and it would be
found: search engines, curious readers, and competitors all look. Publishing
how many clicks each advertiser gets is commercially yours, not theirs.

The Sheet already is a dashboard, it is private to your Google account, it
can be shared with a named person if you want a colleague to see it, and it
does arithmetic better than any page I could write.

If you ever do want it on the web, it needs a real server with a real login —
which means a backend, which is a different decision about the whole site.
