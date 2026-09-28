# How to update RCF English

Written for someone who is **not** a programmer. Every task below is: open a file in
Notepad, change some words, save, double-click `build.cmd`.

---

## The three rules

1. **Edit the files in `_src/` and `data/`.** Never edit the finished `.html` files —
   they are rewritten every time you build, and your change would be lost.
2. **Always run `build.cmd` afterwards.** Nothing appears on the site until you do.
3. **Use Notepad or VS Code, never Word.** Word silently replaces straight quotes `"`
   with curly ones `"` and that breaks the file. If it happens, `check.cmd` tells you.

---

## The routine

Every change, without exception, follows these four steps:

1. Edit the file.
2. Double-click **`check.cmd`** — confirms there are no typing mistakes.
3. Double-click **`build.cmd`** — rebuilds the site and checks every link.
4. Double-click **`preview.cmd`** — look at the result before publishing.

Then publish (see the end of this document).

---

## About JSON, in one minute

The files you edit are written in a format called JSON. There are only four rules.

**1. Text goes in straight double quotes.**
```json
"title": "O/L English"
```

**2. Items in a list are separated by commas — but there is no comma after the last one.**
```json
"bullets": [
  "First point",
  "Second point",
  "Last point"          ← no comma here
]
```

**3. Every `{` needs a `}` and every `[` needs a `]`.**

**4. If your text contains a double quote, put a backslash before it.**
```json
"text": "She said, \"Good morning.\""
```

If you break one of these, `check.cmd` tells you the file, the line, and what is
likely wrong. Nothing is damaged — just fix it and check again.

### Writing inside the text

In any piece of text you can use:

| You type | You get |
|---|---|
| `**important**` | **important** |
| `*emphasis*` | *emphasis* |
| `` `code` `` | `code` |
| `[the words](ol-english/grammar/)` | a link to that page |

Links are written as the folder path from the top of the site, with a slash at the
end: `ol-english/grammar/`, `past-papers/`, `about/founder/`.

---

## Task 1 — Where RCF Publications lives

RCF Publications is a **section of this website**, not a separate site. Its address
is stored in one place only.

1. Open **`_src/config.json`**.
2. You will find:
   ```json
   "PUBLICATIONS_WEBSITE_URL": "rcf-publications/",
   ```
3. Leave it alone unless the bookshop ever moves to a website of its own.

Every publications link on the site — the menu, the home page, the footer, the
"Find related books" panels — follows that one line. There are over 500 of them.

### If it ever becomes a separate website

Put a full address in instead:

```json
"PUBLICATIONS_WEBSITE_URL": "https://example.org/bookshop/",
```

Because the value now begins with `https://`, the site changes its own behaviour
on the next `build.cmd`: every publications link becomes an external link, opens
in a new tab, gains the external-link marker, and the wording that calls it "a
section of this website" changes to "a separate website". **You never edit a page
to make this happen.**

Setting it back to `rcf-publications/` reverses all of it.

### Other settings in the same file

| Setting | What it does |
|---|---|
| `siteUrl` | Where the site is published. Used for canonical tags, the sharing preview and `sitemap.xml`. |
| `whatsappDisplay` | The number as visitors see it: `070 439 5240` |
| `whatsappInternational` | The number WhatsApp needs: `94704395240` (no `+`, no spaces) |
| `email` | The address the contact forms open |
| `tagline` | Learn clearly. Practise confidently. Progress steadily. |

---

## Task 2 — Update RCF Online Academy

> ### Before editing anything about the two elocution diplomas
>
> The **Primary Elocution Teachers' Diploma** and the **Associate Diploma** are
> set, examined and awarded by **CALSDA** (the Colombo Association of Language
> Skills and Dramatic Art). RCF Online Academy runs six-month **preparatory
> courses** for those examinations.
>
> Never write anything saying or suggesting that the Academy awards a diploma,
> or that it is an official representative, agent or branch of CALSDA.
>
> Never state CALSDA entry requirements, syllabus content, examination dates or
> CALSDA's own fees on this website. They belong to CALSDA, they change, and
> candidates must confirm them with CALSDA directly.

Open **`data/classes.json`**. It contains two lists.

### The six courses

The `courses` list controls which courses exist. There are six:

| `id` | Course |
|---|---|
| `primary-elocution` | Primary Elocution Teachers' Diploma (CALSDA preparatory) |
| `associate-diploma` | Associate Diploma, the Higher Elocution Diploma (CALSDA preparatory) |
| `grade-9-literature` | Grade 9 Literature |
| `grade-10-literature` | Grade 10 Literature |
| `ol-literature` | O/L Literature |
| `al-literature` | A/L Literature |

### Hiding a course you are not currently teaching

Set `"published": false` on it:

```json
{
  "id": "grade-9-literature",
  "title": "Grade 9 Literature",
  "published": false
}
```

A hidden course disappears from the menu, from the site and from search. This is why
there is never an empty page for a course that is not being taught.

If you hide a course, remove it from the registration form as well. That list lives in
**`_src/pages/rcf-classes.json`**, on the `registration` page, in the `Course` field:

```json
{
  "name": "Course",
  "type": "select",
  "required": true,
  "options": [
    "Primary Elocution Teachers' Diploma (CALSDA preparatory)",
    "Associate Diploma, Higher Elocution Diploma (CALSDA preparatory)",
    "Grade 9 Literature",
    "Grade 10 Literature",
    "O/L Literature",
    "A/L Literature",
    "Not sure, please advise"
  ]
}
```

Keep *Not sure, please advise* as the last option so that nobody is forced to guess.

### Adding or editing a class

Each course has an entry in the `classes` list. This is where the real details go:

```json
{
  "id": "ol-literature-online",
  "course": "ol-literature",
  "title": "O/L Literature",
  "subject": "English Literature",
  "level": "Grades 10 and 11",
  "teacher": "R. C. Fernando",
  "description": ["One or two sentences about the class."],
  "audience": "Who it is for",
  "delivery": "online",
  "groupFormat": "group",
  "day": "Saturday",
  "time": "9.00 a.m. to 11.00 a.m.",
  "duration": "2 hours",
  "startDate": "5 January 2027",
  "fee": "Fees available on request",
  "registration": "open",
  "places": "6 places remaining",
  "language": "English",
  "materials": "A notebook and a device with an internet connection",
  "featured": true,
  "published": true
}
```

Leave out any line you do not have. Only `id`, `course` and `title` are essential.

| Field | Allowed values |
|---|---|
| `course` | must match an `id` in the `courses` list |
| `delivery` | `online`, `physical` or `hybrid` |
| `groupFormat` | `individual` or `group` |
| `registration` | `open`, `soon`, `waitlist` or `closed` |
| `featured` | `true` shows it on the home page |

### ⚠ Never invent a schedule, a fee or a place

If a detail has not been decided, **leave the line out** or use one of these:

- `"Schedule to be announced"`
- `"Fees available on request"`
- `"Registration opening soon"`

A wrong timetable on a website is worse than no timetable. Visitors are told to ask
on WhatsApp, and they get the truth.

### ⚠ Never put private information in this file

No meeting links. No passwords. No student names, telephone numbers or results.
Everything in this file is published on the internet.

### Class notices

Open **`data/notices.json`**:

```json
{
  "notices": [
    {
      "id": "revision-2027",
      "date": "12 October 2026",
      "title": "Revision classes begin in November",
      "text": ["Details will be sent to enrolled students."],
      "published": true
    }
  ]
}
```

Delete a notice when it is no longer relevant.

---

## Task 3 — Add a past paper or a worksheet

> **Read [RESOURCE-PUBLISHING-POLICY.md](RESOURCE-PUBLISHING-POLICY.md) first.**
> A file existing in Google Drive is **not** permission to publish it.

### If the file is yours to publish

1. Put the PDF in the **`downloads/`** folder, with a simple name and no spaces:
   `ol-english-model-paper-1.pdf`
2. Open **`data/papers.json`** (for papers) or **`data/resources.json`** (for
   worksheets and other files).
3. Add an entry inside the square brackets:

```json
{
  "id": "ol-english-model-1",
  "title": "O/L English Model Paper 1",
  "description": "A full model paper in the style of the examination.",
  "subject": "ol-english",
  "examination": "model",
  "level": "Grade 11",
  "year": "2026",
  "paper": "I",
  "type": "model-paper",
  "medium": "english",
  "source": "RCF English",
  "url": "downloads/ol-english-model-paper-1.pdf",
  "fileSize": "480 KB",
  "copyright": "Created by RCF English",
  "published": true
}
```

4. Save, then `check.cmd`, then `build.cmd`.

The paper now appears in the Past Papers centre, on the right subject page, and in
site search, with all the filters working.

### If you may only link to it

Do not copy the file. Put the official address in `url` instead:

```json
"url": "https://the-official-site.example/paper.pdf",
"copyright": "Linked from the official source"
```

The site marks it as an external link and opens it in a new tab.

### The `type` values

`past-paper`, `model-paper`, `marking-scheme`, `model-answer`, `revision-paper`,
`question-bank`, `worksheet`, `lesson-plan`, `teaching-guide`, `article`

### Hiding something without deleting it

Set `"published": false`. It disappears from the site but stays in the file.

---

## Task 4 — Change the menus

Open **`_src/nav.json`**.

### Renaming a menu item

Change its `label`:

```json
{ "label": "O/L English", "url": "ol-english/" }
```

Change **only** the label. If you change the `url`, the build will stop and tell you
the link is broken — which is the safety net working correctly.

### Adding an item to a mega menu

Find the section, find the group, and add a line to its `links` list:

```json
{ "title": "Writing", "links": [
  { "label": "Guided Writing", "url": "ol-english/guided-writing/" },
  { "label": "Emails", "url": "ol-english/emails/" },
  { "label": "My New Page", "url": "ol-english/my-new-page/" }
]}
```

The page must exist first (see Task 5), otherwise the build stops with **BROKEN
LINK** — deliberately, so the published site can never contain a dead menu item.

### Removing an item

Delete its line. Remember the comma rule: no comma after the last item.

### The footer

The `footer` section at the bottom of the same file works the same way.

---

## Task 5 — Add a new page

1. Open the file in `_src/pages/` for the section you are adding to — for example
   `_src/pages/ol-english-core.json` for an O/L English page.
2. Inside the `"pages": [ ... ]` list, add a new page. Copy an existing one and
   change it; that is much easier than starting from nothing.

A minimal page:

```json
{
  "slug": "ol-english/my-new-page",
  "title": "My New Page",
  "description": "One or two sentences for search engines. About 150 characters.",
  "keywords": "words someone might search for",
  "kicker": "O/L English",
  "kind": "lesson",
  "breadcrumbs": [{ "label": "O/L English", "url": "ol-english/" }],
  "backTo": { "label": "O/L English", "url": "ol-english/" },
  "hero": { "text": "One sentence introducing the page." },
  "blocks": [
    {
      "type": "prose",
      "heading": "A heading",
      "text": ["A paragraph.", "Another paragraph."],
      "bullets": ["A point", "Another point"]
    }
  ]
}
```

3. Add it to the menu (Task 4).
4. `check.cmd`, then `build.cmd`.

### The building blocks you can use

Each entry in `blocks` has a `type`. These are all available:

| `type` | What it produces |
|---|---|
| `prose` | Headings, paragraphs, bullet points and numbered lists |
| `lead` | One large introductory sentence |
| `cards` | A grid of cards, optionally linked |
| `steps` | A numbered sequence, like the six writing steps |
| `callout` | A coloured box. `"style"`: `tip`, `note`, `warn` or `legal` |
| `checklist` | A tick-box list |
| `dodont` | Two columns: do this / avoid this |
| `model` | A model answer with notes explaining why it works |
| `terms` | A list of terms and their meanings |
| `accordion` | Expandable questions. Add `"faq": true` for FAQ search data |
| `table` | A table that becomes cards on a telephone |
| `quote` | A pull quote |
| `activities` | Interactive activities: `"ids": ["grammar-tenses-1"]` |
| `browse` | A filterable list from `papers.json` or `resources.json` |
| `classes` | Class cards from `classes.json` |
| `timetable` | The class timetable |
| `notices` | Class notices |
| `whatsapp` | WhatsApp buttons with ready-written messages |
| `publications` | The RCF Publications promotion panel |
| `relatedBooks` | A small "Find related books" panel |
| `related` | Links to related pages |
| `contactForm` | A form that writes a WhatsApp or email message |
| `search` | The site search box |
| `literature` | A list of literary texts |

Add `"variant": "tint"` to give a block a soft grey background, or `"variant":
"navy"` for a dark one. Alternating them keeps a long page readable.

### If a page needs JavaScript

Add the `scripts` line:

```json
"scripts": ["quiz"]
```

Use `quiz` for interactive activities, `browse` for filterable lists, `search` for
the search page, `forms` for contact forms.

---

## Task 6 — Add a literary text

Every text on the site is set out in the same **fifteen sections**, so students
always know where to look.

1. Copy **`_src/pages/_template-literature-text.json`** to a new file, for example
   `_src/pages/ol-literature/texts/twilight-of-a-crane.json`.
   *(Create the folders if they do not exist. Do not start the file name with `_`.)*
2. Change the `slug` to the address you want.
3. Fill in the fifteen sections. Delete any you cannot complete yet — an empty
   section is better than an invented one.
4. Add a short entry to **`data/literature.json`** so the text appears in the genre
   listings and in search. The `slug` must match:

```json
{
  "slug": "ol-literature/texts/twilight-of-a-crane",
  "title": "Twilight of a Crane",
  "author": "…",
  "genre": "drama",
  "level": "O/L",
  "summary": ["One or two short sentences."],
  "published": true
}
```

5. `check.cmd`, then `build.cmd`.

### ⚠ Copyright, every single time

- **Do not** reproduce a complete copyrighted poem, story, play or novel.
- Quotations must be **short**, **exact**, and used for study and criticism, with the
  author named. Copy them from the book, never from memory.
- **Never invent** a quotation, a plot detail, a date or a fact about an author.
- Summaries, analysis, themes, questions and model answers you write yourself are
  your own work and may be published freely.

---

## Task 7 — Add or change an interactive activity

Open **`data/quizzes.json`**. There are seven kinds of activity.

| `type` | What the student does |
|---|---|
| `mcq` | Chooses one answer from several |
| `reading` | Reads a passage, then answers questions |
| `gap` | Types the missing word |
| `order` | Puts the parts of a sentence in order |
| `match` | Matches a word to its meaning |
| `error` | Rewrites a sentence, correcting one mistake |

A multiple-choice activity:

```json
{
  "id": "my-grammar-quiz",
  "type": "mcq",
  "title": "My Grammar Quiz",
  "description": "What this activity practises.",
  "page": "ol-english/grammar/",
  "questions": [
    {
      "prompt": "Nimal ____ to school every day.",
      "options": ["go", "goes", "going", "is go"],
      "answer": 1,
      "explanation": "The simple present is used for a habit."
    }
  ]
}
```

**`answer` is the position of the correct option, counting from 0.** So `0` is the
first option, `1` the second, `2` the third.

A gap-fill activity uses `____` (four underscores) for the space, and can accept
several correct spellings:

```json
{
  "sentence": "My father is ____ engineer.",
  "answer": "an",
  "hint": "The next word begins with a vowel sound.",
  "explanation": "Use an before a vowel sound."
}
```

Then put the activity on a page:

```json
{ "type": "activities", "heading": "Now practise", "ids": ["my-grammar-quiz"] }
```

Every activity automatically gets instructions, immediate feedback, an explanation,
a score and a **Start again** button. Nothing a student types is stored or sent
anywhere.

---

## Task 8 — Special Offers and advertisements

The **Special Offers** page at `promotions/` holds four separate sections. All of
them read from **`data/promotions.json`**, and all of them show a professional
"nothing at the moment" panel while they are empty. **Never type an offer or an
advertisement straight into a page.**

| Section on the page | Comes from | What belongs there |
|---|---|---|
| Tuition & Course Promotions | `ads` | Paid advertisements from other teachers and institutes |
| RCF Publications Offers | `offers`, category `publications` | Our own offers on books and ebooks |
| Premium Resource Offers | `offers`, category `premium` | Our own offers on resource collections |
| RCF Online Academy Offers | `offers`, category `academy` | Our own offers on courses |

The difference matters. An entry in `ads` is somebody else's paid advertisement and
is automatically labelled **Sponsored**. An entry in `offers` is our own promotion
and is labelled **RCF offer**. The two must never be mixed up.

### Adding one of our own offers

Add an entry to the `offers` list:

```json
{
  "id": "grammar-book-launch",
  "category": "publications",
  "status": "active",
  "title": "",
  "description": "",
  "terms": "",
  "startDate": "2026-09-01",
  "expiryDate": "2026-09-30",
  "featured": false,
  "url": "rcf-publications/",
  "linkLabel": "Browse the catalogue"
}
```

- `category` must be exactly `publications`, `premium` or `academy`. Anything else
  and the offer appears nowhere at all.
- It shows only when `status` is `active` **and** today falls inside the dates.
- Both dates may be left empty. An empty `startDate` means "from now"; an empty
  `expiryDate` means "until you remove it".
- `featured: true` sorts it to the top of its own section.

### How an offer ends by itself

Two things retire an offer, and you need neither of them to remember a date:

1. **At the next build**, an offer past its `expiryDate` is left out of the page.
2. **In the visitor's browser**, an offer that ran out since the last build is
   hidden using their own clock.

That second step matters because this is a static website with no server. Nothing
can run at midnight to retire a listing, so the page retires it on arrival instead.

### Ending one early

Change `"status": "active"` to `"status": "draft"` and build. Do not delete the
entry — keeping it means you can run the same offer again later.

---

## Task 8a — Add a presentation pack

Presentation packs are made in Canva, kept in Google Drive, and listed on
**Premium Resources → Classroom Presentations**. The slides never go into this
website: the page is the shop window, and the Drive link is sent to the buyer
after payment.

### Making the deck

1. Build it in Canva. One deck for one lesson or one unit.
2. Export it **twice**: once as **PDF** (so it opens on any classroom
   computer, with no font surprises) and once as **PowerPoint (.pptx)** if you
   want teachers to be able to edit it.
3. Put both files in a folder in your Drive, one folder per pack.
4. **Check the sharing before you sell it.** Right-click the folder →
   Share → *Anyone with the link* → **Viewer**, never Editor. A pack shared
   as Editor can be altered or deleted by any buyer.

### Listing it on the site

Add an entry to **`data/premium-products.json`**, inside `products`:

```json
{
  "id": "grade-6-present-continuous-slides",
  "code": "TCH-P01",
  "category": "teacher",
  "resourceType": "Presentations",
  "title": "Grade 6: Present Continuous, presentation pack",
  "grade": "Grades 6-9",
  "skill": "Grammar",
  "purpose": "Teaching",
  "quantity": "24 slides",
  "audience": "Grade 6 English teachers",
  "description": "Two or three plain sentences about what the deck covers.",
  "format": "PDF and PowerPoint",
  "price": "Contact us for the current price",
  "source": "RCF English",
  "published": true
}
```

`resourceType` must read exactly **`Presentations`** — that is what puts it on
the presentations page rather than only in the general teacher list.

Then `check.cmd`, then `build.cmd`. Leave `price` as it stands until you have
decided a figure: nothing on this site invents a price.

### ⚠ Two things to check before selling a Canva deck

- **Canva's licence.** Canva's Content Licence Agreement limits reselling
  designs whose value lies mainly in Canva's own stock photographs, icons or
  templates. Slides you have written the content for are normally fine;
  a lightly edited template is not. Read the licence yourself before pricing
  anything - this is a commercial risk, not a technical one.
- **Nothing copied.** A deck that reproduces pages from a Pupil's Book, a past
  paper or a published coursebook cannot be sold, or given away, whatever the
  licence says about Canva's own elements.

---

## Task 8b — Google advertisements (AdSense)

This is different from Task 8. Task 8 is our own page of offers and paid
listings, typed in by us. This is Google's advertising network, which chooses
the advertisements itself and pays per view and per click.

### ⚠ The four rules, and why each one matters

1. **Never click an advertisement on your own site. Ever.** Not to see where it
   goes, not to check it works, not by accident on your phone. Google detects
   clicks from the publisher's own devices and this is the commonest reason an
   AdSense account is closed. It is not reversible, and the site cannot carry
   advertising again afterwards.
2. **Never ask anyone else to click.** Not family, not students, not a WhatsApp
   group, not "please support the site". Those clicks are counted against us
   exactly as our own are, and asking is itself a breach.
3. **Never mention advertisements anywhere on the site.** Not "please support
   us", and **not "please do not click" either.** Any mention draws attention
   to the advertisements, and somebody always clicks out of curiosity. A
   curiosity click is invalid traffic and it lands on our account. The only
   place advertising is described is the privacy policy, which explains what
   Google does with cookies. That text is generated and needs no editing.
4. **Never switch on Auto Ads in the AdSense account.** Auto Ads place
   advertisements wherever Google likes: inside a worksheet, in the middle of
   a lesson, and on the Primary Game Zone pages made for small children. The
   spaces in `_src/config.json` are the only places advertising is allowed.

### ⚠ Block the categories that do not belong beside schoolwork

Do this in the AdSense account once, before advertising goes live:
**Brand safety → Blocking controls → Sensitive categories.** Block at least
gambling and betting, dating, "get rich quick", sensationalist news, cosmetic
procedures and weight loss.

Google chooses which advertisements appear; we choose which kinds may not.
The readers here are schoolchildren and their teachers, so this matters more
than it would on most sites, and nobody will complain to Google about it -
they will complain to us.

### Browsing your own site safely

Add `?noads=1` to any address on the site once — for example
`https://rcfenglish.com/?noads=1` — and that browser will never show an
advertisement again. Do this on your telephone and on your computer. You can
then read every page as often as you like with no risk of a click, and your
own visits will not be counted as views.

To undo it on a device, visit any page with `?noads=0`.

### Switching advertising on and off

Everything lives in the `ads` block of **`_src/config.json`**:

```json
"ads": {
  "provider": "adsense",
  "client": "ca-pub-5600707937611761",
  "slots": {}
}
```

- **To stop all advertising:** empty the `client` value and build. The script
  disappears from every page, `ads.txt` is deleted, the reserved spaces vanish,
  and the privacy policy goes back to saying the site carries no advertising.
- **To show advertisements:** create a display ad unit in AdSense, copy the
  `data-ad-slot` number, and put it in `slots` against the placement it is for:

```json
"slots": { "between": "1234567890" }
```

Until a number is there the spaces draw **nothing at all**. That is deliberate:
an empty box labelled "Advertisement" helps nobody and looks broken.

### If advertisements never appear on the live site

The first thing to check is the Content-Security-Policy, which the build
writes into every page. It lists the exact addresses a browser is allowed to
load scripts from. A missing address means the browser refuses Google's
script **silently** — no error a visitor would see, and AdSense simply reports
no advertisements. The addresses are set in `tools/build-site.ps1`, in the
section that begins "Advertising needs more of the policy opened".

---

## Task 9 — Change how the site looks

Open **`assets/css/styles.css`**. The colours are all at the very top:

```css
--navy-800: #0f2647;    /* the main dark blue */
--teal-700: #0b6b58;    /* the green used for links and accents */
--gold-400: #e0a83c;    /* the gold used sparingly */
```

Change a value there and it changes everywhere.

> If you change a colour, check that text is still readable against it. The site
> currently meets the WCAG AA contrast standard throughout, and a casual colour
> change can break that.

### Replacing the logo

The temporary text logo is `assets/img/logo/rcf-english-logo.svg`. Replace that file
with your own artwork, keeping the same file name.

The small monogram in the header is drawn with text in the page itself. To use a
picture instead, tell the build script — see the `BrandMarkup` section of
`tools/build-site.ps1`.

---

## Task 10 — Change the PPP lesson plans, templates, SBA tasks or proposals

These pages, and their Word and PDF downloads, are made by two small scripts.
Do not edit `_src/pages/teacher-resources-ppp.json` by hand: it is rewritten.

1. Edit the plans in `tools/ppp/g3-g6.js`, `g7-g8.js`, `g9-g11.js` or `al.js`,
   or the templates, SBA tasks and proposals in `tools/ppp/gen.js`.
2. In a terminal in the `RCF-English` folder, run:
   `node tools/ppp/gen.js` (rewrites the page file), then
   `node tools/ppp/downloads.js` (remakes the files in `assets/downloads/teacher/`;
   the PDFs need Microsoft Edge).
3. `check.cmd`, then `build.cmd`.

---

## Publishing your changes

1. `check.cmd`
2. `build.cmd`
3. `preview.cmd` — look at what you changed
4. Open **Git Bash** in this folder and type:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

The website updates itself within a minute or two.

---

## When something goes wrong

| Message | What it means | What to do |
|---|---|---|
| `check.cmd` says **PROBLEM** | A typing mistake in a data file | It names the file and the line. Look for a missing comma, a comma after the last item, or a missing `}` |
| Build says **BUILD FAILED — BROKEN LINK** | A link points at a page that does not exist | The message gives the address and the page it is on. Fix the address or add the page |
| Build says **Activity … is not in quizzes.json** | A page asks for an activity that does not exist | Check the `id` matches exactly |
| Build says **Unknown block type** | A `type` is misspelt | Check it against the list in Task 5 |
| Curly quotes | The file was edited in Word | Retype the quotes. Use Notepad or VS Code |
| A change does not appear | You edited a finished `.html` file | Edit the `_src/` file instead and run `build.cmd` |
| The preview shows an old version | Your browser cached it | Press **Ctrl+F5** |

**Nothing you can do here is dangerous.** If a file is broken, the build refuses to
finish and tells you why. The published site is never left in a broken state.

---

## A safety habit worth having

Before a big change, make a copy of the whole `RCF-English` folder and put the date
in its name. If anything goes badly wrong you can go back to it.

If you are using Git, `git status` shows what you have changed, and
`git checkout -- .` undoes everything since your last commit.

---

## Task 9: The update notice (the pop-up)

Every page shows a small card in the bottom corner announcing the newest
update, once per visitor per update. It is driven entirely by
`data/updates.json` - the entry with the most recent date that is
`"published": true` and not in the future.

**To announce something new**, add an entry to the top of `data/updates.json`:

```json
{
  "id": "something-short-and-unique",
  "date": "2026-10-05",
  "title": "What it is, in a few words",
  "description": "One or two sentences. Only the first four lines are shown.",
  "url": "where-it-lives/",
  "linkLabel": "Open it",
  "published": true
}
```

Then rebuild. That is all - no code change is needed.

Four things worth knowing.

**It is not a modal, on purpose.** A pop-up that covers the page shortly after
somebody arrives from a Google result is what Google calls an intrusive
interstitial, and it costs mobile rankings. An advertisement inside one would
breach AdSense policy outright. So this card covers nothing, blocks no
scrolling, and never carries an advertisement. Do not change it into a
centre-screen box.

**Each visitor sees each update once.** The dismissal is stored in the
browser under `rcf-update-seen`, by id. A *new* id produces a new card, so
every update gets its moment. Changing an existing entry's text without
changing its id will not show it again.

**If two entries share the same date**, the one nearer the top of the file
wins. That is how to choose which of several same-day updates is announced.

**A future date is ignored.** An entry dated next week will not appear until
that day, so updates can be written in advance.

To test it yourself, open the site, and in the browser console run
`localStorage.removeItem('rcf-update-seen')` and reload.

---

## Task 10: Ask RCF English (the site guide)

The page at `/ask/` lets a visitor type a question in plain English and get
the right page. **It is not an artificial intelligence, and the page says so
plainly.** It is a keyword matcher over written answers plus the site's own
search index, and it runs entirely in the visitor's browser - nothing typed
into it is sent anywhere.

### Why it is not an AI

A real AI assistant needs an API key. A static site has nowhere to hide one:
anything in the page can be read by anybody who opens the developer tools,
and a leaked key gets scraped and billed to you within days. Until there is
somewhere server-side to hold a key, an honest search beats a chatbot that
guesses. Do not "improve" this by putting a key in the JavaScript.

### To add or change an answer

Edit `data/assistant.json`. Each answer looks like this:

```json
{
  "id": "study-packs",
  "must": ["study pack", "pack", "packs"],
  "any": ["study", "self", "grade"],
  "answer": "One or two sentences. Keep it short.",
  "links": [{ "title": "Study Packs", "url": "teacher-resources/study-packs/" }]
}
```

- `must` - at least one of these has to appear in the question, or the answer
  never fires. A phrase with a space is matched as a phrase.
- `any` - each one that matches raises the score. Use these to beat a
  competing answer that also matches.
- Keep `answer` under 400 characters. The links do the work.

**Then run the checker:**

```bash
node tools/check-assistant.js
```

This matters more than it looks. These links are written into the page by
JavaScript at run time, so the build's own link checker cannot see them - a
wrong slug here produces a 404 that nothing would ever report. The checker
tests every link against the built search index and fails if a page does not
exist. Run it after editing the answers, and after anything that renames or
moves a page.

Because it checks against the **built** index, build first and then run it.

### The starter suggestions

The chips under the box come from `"suggestions"` at the foot of the same
file. Keep three to six, and make them real questions somebody would type.

### What it deliberately cannot do

Mark work, write an essay, or answer anything not on this site. If you want
those, that needs the real thing - see Task 8b on advertising for why cost
matters here, and note that a genuine assistant would need an Anthropic
account and a server-side proxy before a single line of it could be written.

---

## Task 11: Partner links and click tracking

Sponsored links live at `/go/<partner>/`. The page says "Sponsored link",
records the click, and sends the reader to the advertiser with your referral
code on the address.

**Setting it up once:** `tools/partners/SETUP.md`. Fifteen minutes.

### Adding a partner

One entry in `data/partners.json`:

```json
{
  "id": "example-college",
  "name": "Example College",
  "url": "https://example.com/apply",
  "refCode": "RCF2026",
  "disclosure": "RCF English is paid a commission if you enrol through this link. It costs you nothing extra.",
  "active": true
}
```

Then `node tools/partners/gen.js` and rebuild. The link is
`https://rcfenglish.com/go/example-college/`.

Set `"active": false` to park one without deleting the record.

### Rules the generator enforces

It refuses to build if a partner has no `refCode` (the advertiser could not
credit you), no `disclosure` (a paid link must say so), a non-https `url`, or
a field named `password`, `apiKey`, `token`, `fee`, `rate` or `commission` —
**`data/partners.json` is published with the site and anyone can read it.**

### Why disclosure is not optional

Google's link spam policy treats undisclosed paid links as manipulation, and
the penalty applies to the whole domain — including the AdSense income the
partnership was meant to add to. Every partner link carries
`rel="sponsored"`, every `/go/` page is `noindex`, and `/go/` is disallowed
in robots.txt, because indexed redirect pages are doorway pages.

### Where the numbers are

In the Google Sheet, not on the website. There is no admin page and there
should not be: a static site has no login, so any dashboard at a web address
would be readable by anyone who found it — including each advertiser seeing
their rivals' figures. The Sheet is private to your Google account.

### What to tell an advertiser, in writing, at the start

1. These are **clicks, not enrolments**. Commission is paid on enrolments
   they confirm against the referral code.
2. The endpoint is **public**, as every browser endpoint is, so counts could
   in principle be inflated.
3. Some clicks are **missed** (script blockers), so the true figure is at or
   above the recorded one, never below.
4. The country is **approximate** — from the browser's timezone, not an IP
   lookup. No IP address, cookie or personal identifier is ever recorded.

### Before the first real partner goes live

Add a line to the privacy policy saying that clicks on sponsored links are
counted, what is recorded (partner, time, approximate country from timezone,
referring page) and what is not (no IP, no cookie, nothing identifying).

### A trap worth knowing

Do not set `"kind": "redirect"` on these pages. That is an existing feature
meaning "this page has moved", and it silently replaces the whole page with
a stub pointing at the homepage — a clean build, no warning, and every
partner link quietly broken. These pages use `"kind": "sponsored-link"`.
