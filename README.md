# RCF English

English lessons, revision materials, past papers and teaching resources for Sri Lankan
learners and teachers.

**Learn clearly. Practise confidently. Progress steadily.**

RCF English is an umbrella educational platform bringing together English-language
learning, literature education, examination support, teacher resources, interactive
practice, online classes and links to educational publications in one place.

It is a **plain static website**: ordinary HTML, CSS and JavaScript files. There is
no server, no database, no login and no monthly cost.

---

## What is on the site

| Section | What it holds |
|---|---|
| **O/L English** | Syllabus, Paper I and II, grammar, vocabulary, reading, and every writing task taught in six guided steps |
| **O/L Literature** | Poetry, short stories, drama, novels, context and essay answers, themes, characters, techniques, quotations |
| **General English** | Practical grammar, everyday and workplace English, the four skills, conversations, self-assessment |
| **A/L Literature** | Close reading, critical appreciation, literary theory, answer development, examination guidance |
| **Past Papers** | A filterable centre for past papers, model papers, marking schemes, revision papers and question banks |
| **Teacher Resources** | Lesson plans, worksheets, teaching guides, remedial and mixed-ability support, marking and assessment |
| **Interactive Learning** | Ten self-marking activities across seven activity types |
| **RCF Online Academy** | Two CALSDA preparatory elocution diplomas, four Literature courses, registration, staff and WhatsApp enquiry |
| **About Us** | The platform, the founder, qualifications, mission, teaching approach, online communities |
| **Policies** | Copyright, corrections and takedown, privacy, terms, accessibility |

**162 pages.** Every internal link is checked automatically each time the site is built.

**RCF Publications is a section of this website**, kept apart from the free
material so that paid and free resources are never confused. See *Where RCF
Publications lives* below.

---

## The three buttons you need

Everything is done by double-clicking a file in this folder.

| File | What it does |
|---|---|
| **`preview.cmd`** | Shows the website on your own computer. Your browser opens automatically. |
| **`build.cmd`** | Rebuilds every page after you have changed something. Run this before publishing. |
| **`check.cmd`** | Checks your data files for typing mistakes. Run this if `build.cmd` complains. |

Close the black window when you have finished with the preview.

> **You do not need Node.js, npm or Python.** This site is built with Windows
> PowerShell, which is already on your computer. Nothing needs to be installed.

---

## How the folders are arranged

```
RCF-English/
│
├─ preview.cmd            ← double-click to look at the site
├─ build.cmd              ← double-click to rebuild it
├─ check.cmd              ← double-click to check your files
│
├─ _src/                  ← THE PARTS YOU EDIT
│   ├─ config.json            site-wide settings (bookshop address, WhatsApp number…)
│   ├─ nav.json               the menus
│   └─ pages/                 one file per group of pages
│
├─ data/                  ← THE LISTS YOU EDIT
│   ├─ classes.json           RCF Online Academy
│   ├─ papers.json            past papers and model papers
│   ├─ resources.json         worksheets and downloads
│   ├─ quizzes.json           the interactive activities
│   ├─ literature.json        literary texts
│   └─ notices.json           class notices
│
├─ assets/                ← design and behaviour
│   ├─ css/styles.css
│   ├─ js/                    navigation, search, filters, activities, forms
│   └─ img/                   logo, icons, thumbnails
│
├─ downloads/             ← put approved PDFs and worksheets here
├─ tools/                 ← the build and preview scripts
│
└─ index.html, about/, ol-english/ …   ← THE FINISHED PAGES (do not edit by hand)
```

**Important:** the finished `.html` files are written by `build.cmd`. If you edit one
by hand, your change is lost the next time you build. Edit the files in `_src/` and
`data/` instead.

Full instructions are in **[HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)**.

---

## Where RCF Publications lives

RCF Publications is a **section of this website**, not a separate site. Its address
is stored in **one place**: `_src/config.json`.

```json
"PUBLICATIONS_WEBSITE_URL": "rcf-publications/",
```

Leave it as it is. Every publications link across the site — the menu, the home
page, the footer, the "Find related books" panels and the teacher pages — follows
that one line. There are over 550 of them.

> **If the bookshop ever moves to a website of its own,** put the full address in
> instead (`https://…`). Because the value then begins with `https://`, the next
> `build.cmd` turns every publications link into an external link that opens in a
> new tab with the external-link marker, and changes the wording that calls it "a
> section of this website" to "a separate website". Setting it back to
> `rcf-publications/` reverses all of it. You never edit a page to make this happen.

### Other settings in the same file

| Setting | What it does |
|---|---|
| `siteUrl` | Where the site is published. Already set to `https://satarajayamaga-afk.github.io/rcf-english`. Used for canonical tags, the sharing preview and `sitemap.xml`. |
| `whatsappDisplay` | The number as visitors see it: `070 439 5240` |
| `whatsappInternational` | The number WhatsApp needs: `94704395240` (no `+`, no spaces) |
| `email` | The address the contact forms open |
| `tagline` | Learn clearly. Practise confidently. Progress steadily. |

---

## Publishing it on the internet

This repository is **`satarajayamaga-afk/rcf-english`**.

### One-time setup

> ⚠ **GitHub Pages will not publish a private repository on a free GitHub plan.**
> While this repository stays private, the steps below will not produce a working
> address. Either make the repository public (**Settings → General → Danger Zone →
> Change repository visibility → Make public**) or upgrade the plan. Nothing in this
> repository is secret — there are no passwords, keys or personal files in it — so
> making it public is safe.

1. In the repository on GitHub, click **Settings**.
2. In the left menu, click **Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.

The included workflow (`.github/workflows/deploy.yml`) then publishes the site
automatically. It checks your data files and confirms the site has been built before
it publishes anything.

Your address will be:

```
https://satarajayamaga-afk.github.io/rcf-english/
```

### Publishing a change afterwards

Every time you change something:

1. Double-click `check.cmd`
2. Double-click `build.cmd`
3. Look at the result with `preview.cmd`
4. Open **Git Bash** in this folder (right-click → *Open Git Bash here*) and type:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

The site updates itself within a minute or two.

---

## Using your own domain name later

If you buy a domain such as `rcfenglish.lk`:

1. At your domain provider, create these DNS records:

   | Type | Name | Value |
   |---|---|---|
   | A | @ | `185.199.108.153` |
   | A | @ | `185.199.109.153` |
   | A | @ | `185.199.110.153` |
   | A | @ | `185.199.111.153` |
   | CNAME | www | `satarajayamaga-afk.github.io` |

2. In the repository: **Settings → Pages → Custom domain**, type your domain and
   click **Save**. GitHub creates a `CNAME` file for you.
3. Tick **Enforce HTTPS** once it becomes available (it can take a few hours).
4. Open `_src/config.json`, change `siteUrl` to `https://rcfenglish.lk`, then run
   `build.cmd`, commit and push.

Because every link between pages is relative, nothing else has to change.

---

## What this site deliberately does not do

- **It does not collect anything about visitors.** No accounts, no tracking scripts,
  no advertising, no cookies of its own. The interactive activities run entirely in
  the visitor's browser and nothing is sent anywhere.
- **It does not take payments** and has no shop. Books are sold on the separate
  RCF Publications website.
- **It does not claim official approval.** RCF English is independent and is not
  endorsed by or affiliated with any government department or examination authority.
- **It does not promise examination results.**
- **It does not publish copyrighted material without permission.** See
  **[RESOURCE-PUBLISHING-POLICY.md](RESOURCE-PUBLISHING-POLICY.md)** — read it before
  adding any past paper.

---

## Accessibility and performance

- Built against **WCAG 2.2 AA** as a standard of good practice.
- Works with a keyboard alone; menus close with Escape and return focus properly.
- Colour contrast checked across every component; nothing relies on colour alone.
- Readable from **320 pixels** upwards with no sideways scrolling.
- Respects the "reduce motion" setting.
- No web fonts, no frameworks, no tracking — the pages are small and load on a weak
  connection.
- Lessons print cleanly: menus, buttons and the footer are removed automatically.

---

## Other documents

| File | What it is for |
|---|---|
| **[HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)** | Step-by-step instructions for every routine change |
| **[RESOURCE-PUBLISHING-POLICY.md](RESOURCE-PUBLISHING-POLICY.md)** | What may and may not be published, and the Google Drive procedure |
| **[FINAL-CHECKLIST.md](FINAL-CHECKLIST.md)** | What has been tested, and what to check before publishing |

---

## If something goes wrong

| Problem | What to do |
|---|---|
| `build.cmd` says a file could not be read | Double-click `check.cmd`. It tells you the file and the line. |
| The build says **BROKEN LINK** | A menu item or link points at a page that does not exist. The message names the address and the page it is on. Correct the address, or add the missing page. |
| The preview window closes at once | Right-click `preview.cmd` → *Run as administrator* once, or check that another preview is not already running. |
| A page looks unchanged after editing | You edited the finished `.html` file instead of the file in `_src/`. Edit the `_src/` file and run `build.cmd`. |
| Curly quotes broke a file | Edit `.json` files in **Notepad** or **VS Code**, never in Word. |

---

*RCF English was founded by R. C. Fernando, a graduate in English of the University
of Peradeniya, holder of a Master of Arts in Linguistics from the University of
Kelaniya and a TESOL qualification from the University of Peradeniya, and an
Associate Member of the Colombo Association of Language Skills and Dramatic Art
(CALSDA).*
