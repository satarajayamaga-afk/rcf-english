# Final checklist

Two parts:

- **Part 1** records what was actually tested when the site was built, and how.
- **Part 2** is the routine check to run yourself before publishing a change.

Nothing in Part 1 is marked as passed unless the test was genuinely carried out.
Where something was **not** tested, it says so.

---

# Part 1 — What was tested when the site was built

*Tested on Windows 10, Windows PowerShell 5.1, in a Chromium-based browser.*

## Build

| Check | Result |
|---|---|
| Dependencies installed | **Not applicable.** There are none. The site is built by Windows PowerShell, which is already on the machine. No Node.js, npm, Python or package manager is used or required. |
| Development server runs | ✅ `preview.cmd` starts a local server and serves the site. Falls back to the next free port if one is busy. |
| Production build runs | ✅ `build.cmd` completes: **133 pages** written, search index of **148 entries**, `sitemap.xml` (132 URLs), `robots.txt`, `.nojekyll` and `assets/js/site-config.js` generated. |
| Build errors and warnings | ✅ Build finishes with **no errors and no warnings**. |
| Data files valid | ✅ `check.cmd` reports all **26** JSON files readable. |

## Links and structure — all 133 pages, not a sample

| Check | Result |
|---|---|
| Broken internal links | ✅ **43,467 internal links checked, none broken.** This runs automatically on every build and the build fails if any link is wrong. |
| Unique page titles | ✅ 133 pages, **133 unique titles**. (Duplicates were found and fixed by folding the section name into the title.) |
| Meta description on every page | ✅ 133 / 133 |
| Canonical URL on every page | ✅ 133 / 133 |
| Exactly one `<h1>` per page | ✅ 133 / 133 |
| `lang="en"` on every page | ✅ 133 / 133 |
| Skip-to-content link and `<main>` landmark | ✅ 133 / 133 |
| No empty or placeholder `href` | ✅ 133 / 133 |
| Every image has `alt` | ✅ 133 / 133 |
| External links open safely (`target="_blank"` + `rel="noopener"`) | ✅ 133 / 133 |
| Every form control has a label | ✅ 133 / 133 |
| Structured data (JSON-LD) parses | ✅ Valid on all pages. `EducationalOrganization`, `LearningResource`, `Course`, `Article`, `WebPage`, `BreadcrumbList` and `FAQPage` as appropriate. |
| Heading order (no skipped levels) | ✅ Checked; no jumps found. |

## Navigation

| Check | Result |
|---|---|
| All 11 main sections present | ✅ 8 mega menus + 3 direct links |
| Mega menu opens by mouse click | ✅ |
| Mega menu opens by keyboard (Enter / Space) | ✅ |
| Arrow Down moves focus into the panel | ✅ Focus lands on the first link |
| Left / Right arrows move between menus | ✅ |
| **Escape** closes the menu | ✅ Focus returns to the button that opened it |
| Clicking outside closes the menu | ✅ |
| Hover is a convenience only, never the only way in | ✅ Every menu is operable by click and by keyboard |
| Current section marked in the bar | ✅ |
| Current page marked with `aria-current="page"` | ✅ |
| Menu fits on one row without overflow | ✅ Fixed during testing — see *Problems found and fixed* |
| Mobile drawer opens and closes | ✅ Button, Escape and backdrop all close it |
| Drawer traps focus while open, restores it on close | ✅ Fixed during testing |
| Drawer locks background scrolling | ✅ |
| Drawer accordions expand and collapse | ✅ Current section auto-expands |
| Drawer has search and a WhatsApp button | ✅ |
| No broken or empty menu links | ✅ Guaranteed by the build |

## Search and filters

| Check | Result |
|---|---|
| Site search returns results | ✅ e.g. "guided writing" → 13 results |
| Every result says what kind of thing it is | ✅ Lesson, Teacher resource, Past paper, RCF class, Interactive activity, Policy… |
| Filter by kind of result | ✅ 80 → 8 when filtered to RCF classes |
| "No results found" message | ✅ With guidance on what to try next |
| Result count shown | ✅ |
| Reset button | ✅ Clears the box, the filter, the results and the address bar |
| Screen-reader announcement of result counts | ✅ Live region present and updated |
| Resource filters build themselves from the data | ✅ 8 filters generated (subject, examination, level, year, paper, type, medium, source) |
| Filtering, keyword search and combinations | ✅ Tested with a temporary fixture, then removed. Verified no fixture data remains. |
| `"published": false` records stay hidden | ✅ |
| Filter state kept in the address bar | ✅ `?year=2024` — links can be shared |
| Subject pages apply their fixed filter | ✅ `/past-papers/ol-literature/` shows only Literature papers |
| Lists are written into the page by the build | ✅ So they are visible to search engines and without JavaScript |
| Honest empty state when nothing is published | ✅ |

## Interactive activities

All ten activities across all seven types were opened and worked through.

| Check | Result |
|---|---|
| All activities mount | ✅ 10 of 10 |
| Multiple choice | ✅ Immediate feedback; reveals the correct answer when wrong; explanation shown |
| Reading comprehension | ✅ Passage (4 paragraphs) + 6 questions |
| Fill in the blank | ✅ Case-insensitive; accepts alternative spellings; shows the answer when wrong |
| Sentence ordering | ✅ Up/down buttons; correctly disabled at the ends; keyboard operable |
| Vocabulary matching | ✅ Marks each row; names the correct meaning when wrong |
| Literature quiz | ✅ |
| Error correction | ✅ Tolerates capitalisation and trailing punctuation |
| Instructions on every activity | ✅ 10 / 10 |
| Score shown and updated | ✅ With a band and a plain-language note |
| Explanations | ✅ On every question |
| Reset ("Start again") | ✅ 10 / 10 — clears answers, feedback and score |
| Screen-reader live region | ✅ 10 / 10 |
| Works without login | ✅ No account, nothing stored, nothing transmitted |
| `<noscript>` message where JavaScript is needed | ✅ |

## WhatsApp, forms and the bookshop link

| Check | Result |
|---|---|
| WhatsApp number correct | ✅ Displays `070 439 5240`, links to `wa.me/94704395240` |
| Pre-written messages are URL-encoded | ✅ Punctuation and spaces safe |
| Class-specific messages | ✅ "Ask About This Class", "Check Availability", "Request the Timetable", "Enrol via WhatsApp" |
| WhatsApp links open in a new tab | ✅ Fixed during testing |
| Contact forms validate before doing anything | ✅ Errors shown beside each field, with `aria-invalid` and `aria-describedby` |
| Error wording is plain | ✅ "Please fill in your name." / "Please choose type of report." (fixed during testing) |
| Forms compose the message correctly | ✅ Subject line, then each field on its own line |
| Forms are honest about having no server | ✅ Each says the message opens in WhatsApp or your email program, where **you** press send |
| **Bookshop link driven by one config value** | ✅ Changing `PUBLICATIONS_WEBSITE_URL` in `_src/config.json` updated **all 558 references** across the site plus `site-config.js`. Tested, then restored to the placeholder. |
| RCF Publications marked as an external bookshop | ✅ External icon, "(external bookshop, opens in a new tab)" for screen readers, `rel="noopener"` — once the bookshop has an address |
| **No placeholder is ever left as a link** | ✅ While `PUBLICATIONS_WEBSITE_URL` holds no real address, the token appears **0 times** in the built pages. Every bookshop link becomes "Coming soon" and points at the page explaining the bookshop. Verified across all 133 pages. |
| The "Coming soon" state reverses automatically | ✅ Setting a real address and rebuilding produced **558 external links and 0 "Coming soon" markers**, and removed the explanatory notices. Setting the placeholder back restored the "Coming soon" state exactly. No page was edited either way. |
| "Visit the bookshop" buttons while unpublished | ✅ Rendered as plain markers that are not links, so nothing invites a click that would fail. On the page that explains the bookshop they do not link to that same page. |

## RCF Online Academy

| Check | Result |
|---|---|
| Class cards render from `data/classes.json` | ✅ |
| Unavailable courses are hidden, not shown empty | ✅ Setting `"published": false` on a course removes it from the menu, the site and the sitemap, so there is never an empty page for a course that is not being taught |
| Honest placeholders | ✅ "Schedule to be announced", "Fees available on request", "Registration opening soon" — no invented day, time, fee, location or number of places anywhere |
| Timetable — desktop | ✅ Tested with temporary schedule data: proper table, `<caption>`, `scope="col"` and `scope="row"` |
| Timetable — mobile | ✅ Becomes **cards** below 720px; no sideways scrolling |
| Timetable — nothing scheduled | ✅ Falls back to an honest "Schedule to be announced" panel with a WhatsApp button |
| Temporary test data removed | ✅ Verified: no test schedule remains |
| Five-step registration shown | ✅ And it states plainly that nothing on the website registers anybody; a place is confirmed by the teacher |
| No private information published | ✅ No meeting links, passwords, student names or results anywhere |

## Responsive layout

Measured at each width by inspecting real element geometry.

| Width | Result |
|---|---|
| **320 px** | ✅ No sideways scrolling; nothing overflows. *(Fixed during testing.)* |
| **375 px** | ✅ |
| **768 px** | ✅ |
| **1024 px** | ✅ |
| **1240 px** | ✅ Desktop bar on one row; below this the mobile menu takes over |
| **1280 px** | ✅ |
| **1363 px** | ✅ The width at which "Contact" used to wrap. One row, 149px to spare |
| **1366 px** | ✅ |
| **1400 px** | ✅ |
| **1600 px** | ✅ |
| **1920 px** | ✅ |

**Menu headroom.** The bar needs **1023px** of the **1172px** available — 149px, or
13%, in hand. It previously needed 1144px, leaving only 28px, which is why it
wrapped on some machines and not others: any slightly wider font rendering tipped it
over. The margin is now large enough that font substitution cannot cause a wrap.

Also checked: no text under 14px in body copy; every button and menu link at least
40px high; tables become cards on narrow screens.

## Accessibility

| Check | Result |
|---|---|
| Colour contrast (WCAG AA) | ✅ **0 failures** across 11 pages covering every component, checking foreground against the real composited background, including gradients and semi-transparent panels. *(2 genuine failures were found and fixed.)* |
| Keyboard operation | ✅ Menus, drawer, search, filters, forms and all ten activities |
| Visible focus indicator | ✅ 3px gold outline, never removed |
| Skip-to-content link | ✅ On every page |
| Form labels and error messages | ✅ Every control labelled; errors in words beside the field |
| Information not carried by colour alone | ✅ Right/wrong shown by a word as well as a colour |
| Reduced-motion support | ✅ `prefers-reduced-motion` rule present |
| Landmarks and semantic HTML | ✅ `<header>`, `<nav>`, `<main>`, `<footer>`, real headings, lists and tables |
| Screen-reader announcements | ✅ Live regions on search, filters and activities |
| **Not tested** | Actual screen-reader software (NVDA, JAWS, VoiceOver) was **not** used. The markup follows the relevant patterns, but no real screen-reader session was carried out. This is stated openly on the Accessibility Statement page. |
| **Not tested** | Real touch devices. Touch behaviour was verified by emulation only. |

## Performance and privacy

| Check | Result |
|---|---|
| No external requests | ✅ No CDN, no web fonts, no analytics, no trackers, no advertising |
| No cookies set by the site | ✅ |
| Nothing collected from visitors | ✅ No accounts, no login, no database, no server |
| Asset weight | ✅ CSS 56 KB, all JavaScript 73 KB combined, typical page ~60 KB |
| JavaScript loaded only where needed | ✅ `browse` on 19 pages, `quiz` on 13, `forms` on 3, `search` on 1 |
| Site works without JavaScript | ✅ Every page reads fully; lists are written in by the build; menus fall back to plain links; `<noscript>` notes where interaction is unavailable |
| Print styles | ✅ Menus, buttons and footer removed when printing |

## Publishing paths

| Check | Result |
|---|---|
| No root-absolute paths | ✅ 0 occurrences of `href="/…"` or `src="/…"` |
| Relative depth prefixes correct | ✅ 0 mismatches across 133 pages |
| **Served under a sub-path** | ✅ Served at `http://localhost:8130/rcf-english/`, exactly as a GitHub Pages project site. CSS, JavaScript, icons, navigation, search, activities and filters all worked. No console errors. |
| 404 page | ✅ Uses absolute links deliberately, so it works at any address |
| `sitemap.xml` | ✅ 132 URLs. Correctly excludes the 404 page and any course hidden with `"published": false` |
| `robots.txt` | ✅ Disallows `/_src/` and `/tools/`, points at the sitemap |
| GitHub Actions workflow | ✅ Present. Validates the data files and confirms the site is built before publishing. **Not yet run** — it can only run once the repository exists on GitHub. |

## Security and privacy of files

| Check | Result |
|---|---|
| No API keys, tokens or private keys | ✅ None found |
| No `.env`, `.pem`, `.key` or credential files | ✅ None |
| No PDFs, eBooks or documents committed | ✅ `downloads/` is empty — nothing is published until it has been approved |
| No paid material | ✅ |
| No meeting links or passwords | ✅ |
| No personal data | ✅ Only the intended public WhatsApp number and email address |
| Data is escaped before display | ✅ All values from data files are escaped; link targets are restricted to `http`, `https`, `mailto`, `tel` and same-site paths, so a bad value cannot become a `javascript:` link |
| WhatsApp and form values encoded | ✅ |

## Code cleanliness

| Check | Result |
|---|---|
| Unused JavaScript removed | ✅ Two dead exports removed; one made module-private |
| Unused CSS removed | ✅ 15 dead rule blocks removed (1.8 KB). The only rules now unused in the current output are those that appear once class schedules or notices are added |
| Stylesheet valid | ✅ Braces balanced |

---

## Problems found and fixed during testing

These were real faults, found by testing and corrected:

1. **The main menu overflowed the page at 1280px.** Eleven top-level sections did not
   fit. Fixed by raising the desktop breakpoint to 1240px, tightening the bar, and
   allowing the list to wrap as a guarantee that the page can never scroll sideways.
2. **The header overflowed at 320px.** Fixed by reducing the brand at very narrow
   widths and hiding the "Menu" label visually while keeping it for screen readers.
3. **The home link on the home page had an empty `href`.** Now `./`.
4. **WhatsApp links did not open in a new tab**, unlike every other external link.
5. **Focus was lost when the mobile drawer was closed** in some circumstances. It now
   always returns to the menu button.
6. **Two colour-contrast failures** in the RCF Publications promotion panel: a teal
   eyebrow and a navy heading on a dark background. Both now use light colours.
7. **Fifteen pages shared a title with another page** (four pages called "Model
   Answers", three "Common Student Mistakes", and so on). The section name is now
   folded into the title, giving 133 unique titles.
8. **Form error messages read awkwardly** — "Please fill in your name (required)."
   The "(required)" note is now stripped, and select fields say "choose" rather than
   "fill in".

Found later, while making the bookshop link safe:

9. **A hero button was silently dropped whenever a page had exactly one of them.**
   Eleven pages were affected, including both bookshop pages and every RCF Online Academy
   course page. The cause was in the build script: PowerShell unrolls a one-item
   list on the way out of a function, so the count came back empty and the button
   block was skipped. Fixed at the source, so every hero button now appears.
10. **The main menu wrapped onto two rows on wide screens.** Above 1400px the bar
    switched to roomier spacing, but the page container is capped at 1220px, so the
    extra window width gave it no extra room. It wrapped silently rather than
    overflowing, because the bar is allowed to wrap as a safety net. The roomier
    variant has been removed; the eleven sections now sit on one row at every
    desktop width from 1240px to 1920px.
11. **Two "Coming soon" markers were unreadable on dark backgrounds** — 2.4:1 and
    3.89:1 against the navy hero and the teal button. Both now use light text and
    clear AA.

---

# Part 2 — Before you publish a change

Run through this each time. It takes about five minutes.

## Every time

- [ ] **`check.cmd`** — all data files readable
- [ ] **`build.cmd`** — finishes with no errors and no broken links
- [ ] **`preview.cmd`** — look at the pages you changed
- [ ] Make the browser window narrow and check the same pages on a small screen
- [ ] Click the links you added
- [ ] Press **Tab** a few times — can you see where the focus is?
- [ ] `git add .` → `git commit -m "…"` → `git push`

## When you add a resource or a past paper

- [ ] Am I entitled to publish this? (One of the four tests in
      [RESOURCE-PUBLISHING-POLICY.md](RESOURCE-PUBLISHING-POLICY.md))
- [ ] Is the `copyright` field filled in honestly?
- [ ] Does the file open when clicked?
- [ ] Should this be **linked** rather than copied?
- [ ] Is it a duplicate of something already there?

## When you update classes

- [ ] Is every day, time, fee and place **actually decided**? If not, leave it out or
      use one of the honest phrases.
- [ ] No meeting links, passwords, student names or telephone numbers?
- [ ] Are class types you do not teach set to `"published": false`?
- [ ] Does the WhatsApp button open with the right message?

## When you add a literary text

- [ ] Is any copyrighted text reproduced in full? *(It must not be.)*
- [ ] Have I checked every quotation against the book?
- [ ] Is every fact about the author verifiable?
- [ ] Are all fifteen sections either completed or left out — none invented?
- [ ] Is the entry in `data/literature.json` added, with a matching `slug`?

## Once, before the site first goes live

- [ ] `PUBLICATIONS_WEBSITE_URL` set to the real bookshop address in `_src/config.json`
- [ ] `siteUrl` set to the real published address
- [ ] `build.cmd` run again after both changes
- [ ] GitHub repository created, **Settings → Pages → Source: GitHub Actions**
- [ ] First deployment succeeded and the site opens
- [ ] Home page, one lesson, search, one activity and the Contact page all checked on
      a real telephone
- [ ] WhatsApp buttons tested from a real telephone
- [ ] The RCF Publications link goes to the real bookshop
- [ ] `sitemap.xml` and `robots.txt` open in a browser
- [ ] Sharing preview looks right when the address is pasted into WhatsApp

## Things that must always remain true

- [ ] No claim of government approval, endorsement or official status
- [ ] No promise of examination results
- [ ] No invented qualifications, awards, statistics, student numbers or testimonials
- [ ] No fake reviews or testimonials
- [ ] No copyrighted material published without permission
- [ ] No private or paid files exposed
- [ ] RCF Publications clearly presented as a **separate** website
