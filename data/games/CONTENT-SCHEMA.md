# RCF Primary Game Zone — shared content schema, version 1

This folder holds the **educational content**, not the games. The content is
deliberately kept free of anything web-specific so that more than one front end
can read it:

```
RCF English website  →  Primary Game Zone (HTML/JS)  ─┐
                                                       ├→  the same JSON packs
RCF Learning app     →  Flutter game screens         ─┘
```

Neither front end owns the content. Adding a game means adding JSON here; both
apps pick it up. Rewriting a game screen in Flutter changes no content.

A **pack** is one grade file plus the illustrations its activities name. A pack
is self-contained: bundle it with the Android app, or download it once, and
every game in it plays with no connection.

---

## 1. Files

| File | What it is |
|---|---|
| `index.json` | the catalogue: which packs exist, where they are, the theme colours |
| `grade-1.json` … `grade-5.json` | the Pupil's Book packs |
| `global-beginner.json` … `global-pre-intermediate.json` | the Global English packs |
| `../../assets/img/games/*.svg` | the illustration set, about 0.6 KB each |

A front end should read `index.json` first and never hard-code grade numbers or
file names.

---

## 1a. Two collections

`index.json` holds **two separate lists**, and content never moves between them.

| | `packs` | `globalPacks` |
|---|---|---|
| Audience | Sri Lankan primary schools | anyone learning English |
| Hierarchy | Grade → Unit → Topic → Game | Level → Topic/Skill → Game |
| Source of truth | the official Pupil's Book or syllabus | written for the topic itself |
| Labels | "Grade 3, Unit 4" | "Elementary", never a grade number |
| English | as the Sri Lankan books teach it | International/British English |

A global pack is marked `"kind": "global"` and carries `level` (1–4), a
child-facing `title` (Beginner, Early Learner, Elementary, Pre-Intermediate)
and a `cefr` band (`Pre-A1`, `A1`, `A1-A2`, `A2`). **The CEFR band is for
adults**: show it to a teacher or parent choosing a level, never as the label a
child navigates by.

Global packs have **no `units`** — their `topics` array *is* the level's
contents, so a global pack is simply a pack whose games are not tied to any
book. Everything else is identical: the same six engines, the same
illustrations, the same scoring, the same progress store. Neither collection
needs code of its own.

Global content must be culturally inclusive: names, foods, homes and situations
should come from many parts of the world, and Sri Lanka-specific references
belong in the Pupil's Book packs, not here.

A topic that is listed but not yet written keeps an empty `activities` array.
The front end shows it in place with "Games for this topic are being written",
so the planned shape of a level is visible without pretending the games exist.

---

## 2. Pack shape

The permanent hierarchy is **Grade → Unit → Topic/Skill → Game**.

```jsonc
{
  "schemaVersion": 1,
  "grade": 1,
  "title": "Grade 1",
  "theme": "sunshine",          // key into index.json → themes
  "blurb": "One line for the grade card.",
  "icon": "sun.svg",

  // Which book the unit games are built from. null until one is supplied.
  "book": null,
  // awaiting-source | in-progress | complete
  "unitsStatus": "awaiting-source",

  // BOOK-ALIGNED GAMES. One entry per unit of the Pupil's Book, in book order.
  "units": [
    {
      "id": "unit-1",           // stable, used in the address bar
      "number": 1,
      "title": "My School",     // the unit's own title, from the book
      "icon": "icon-abc.svg",
      "outcomes": [             // optional, for the teacher: what the unit teaches
        "Classroom objects", "Is this a...? Yes it is."
      ],
      "topics": [ /* as below */ ]
    }
  ],

  // PRACTICE GAMES. Not tied to any unit. This is where the sample games that
  // were built to test the engine live, and where any general practice can go.
  "topics": [
    {
      "id": "animals",          // lowercase, no spaces, stable: used in addresses
      "title": "Animals",
      "icon": "icon-paw.svg",
      "activities": [ /* section 3 */ ]
    }
  ]
}
```

`schemaVersion` must be checked. A front end that meets a version it does not
know should skip the pack rather than guess.

**`units` and `topics` are both optional and both may be present.** A pack with
only `topics` is what every grade looks like today: practice games and no book
games yet. A pack with `units` filled in shows those first, because a teacher
looking for "Unit 4" wants Unit 4.

### Where unit content comes from

Unit games are built **only** from the actual Pupil's Book for that grade —
its vocabulary, grammar, language functions, reading and sentence work. Nothing
is written from memory or from a general idea of what a grade covers. Until the
book for a grade has been supplied and read, that grade keeps
`"unitsStatus": "awaiting-source"` and an empty `units` array, and the front end
says so rather than pretending.

A grade may be part-way through: `"unitsStatus": "in-progress"` means the book is
supplied and every unit is listed in book order, but only some of them have games
yet. A unit whose `topics` are still empty is shown in place, dimmed, marked
"Coming soon" and not openable, so the book order stays visible and nothing is
overstated.

Record the source in `book` once it is supplied:

```jsonc
"book": {
  "title": "Pupil's Book Grade 1",
  "publisher": "Educational Publications Department",
  "note": "Supplied 2026-09-02. Units 1-12."
}
```

---

## 3. Activity: the fields every type shares

```jsonc
{
  "id": "g1-animals-match",   // unique across ALL packs. Progress is stored against it,
                              // so it must never be reused for different content.
  "type": "match",            // match | memory | quiz | sort | order | missing
  "title": "Match the Animal",
  "instructions": "Tap a picture. Then tap its word.",
  "minutes": 3                // rough playing time, shown on the card
}
```

Text fields are **plain text**. No HTML, no markdown. A front end escapes them
as its own platform requires.

---

## 4. Pictures

A picture value is either

* a **bare file name** — `"cat.svg"` — meaning "the picture called cat in the
  illustration set". **Prefer this.** It is what makes a pack portable: the web
  resolves it against `imageBase` from `index.json`, and Flutter resolves it
  against its own bundled asset folder.
* a **path** containing `/` — `"assets/img/games/cat.svg"` — a web-only
  override, resolved from the site root.
* anything else — treated as a **character** and drawn as text. This is how the
  small topic icons work.

Replacing an illustration means replacing one file. No data and no code changes.

---

## 5. The six game types

Each section gives the data and the **rules**, which is what a second engine has
to reproduce to behave identically.

### 5.1 `match` — picture and word matching

```jsonc
"pairs": [ { "picture": "cat.svg", "word": "cat" } ]     // 4 to 6 pairs
```

* Pictures are shuffled into one column, words into another. The two shuffles
  are independent, so rows do not line up.
* The child taps one item, then another. Tapping a second item **on the same
  side** moves the selection there instead of counting as an attempt.
* Matching pair → both lock, are disabled, count **one correct**.
* Non-matching pair → **one wrong**, both shake, the selection clears, and both
  items stay in play.
* Complete when every pair is locked.

### 5.2 `memory` — memory pairs

```jsonc
"pairs": [ { "a": "🐰", "b": "rabbit" } ]                // 6 pairs = a 12-card board
```

* Each pair becomes two cards, `a` and `b`; all cards are shuffled together and
  laid face down. Board is 3 columns up to 12 cards, otherwise 4.
* Turning two cards with the same pair index → they stay face up, disabled,
  **one correct**.
* Otherwise → **one wrong**, and both turn back after about 0.9 s. Input is
  ignored during that pause.
* Complete when every pair is found.

### 5.3 `quiz` — multiple choice

```jsonc
"questions": [
  { "picture": "🐝",              // optional
    "passage": "…",               // optional, shown above the question
    "ask": "What is this?",
    "options": ["bee", "bird", "bat"],
    "answer": 0 }                 // index into options
],
"shuffleQuestions": false          // optional, default true
```

* One question at a time. Questions are shuffled unless `shuffleQuestions` is
  `false` — set it false when the questions share a passage and must stay in
  order. **Options are never shuffled**, so `answer` always stays valid.
* Right option → **one correct**, all options disable, next question after
  about 0.75 s.
* Wrong option → **one wrong**, that option disables and is marked; the question
  stays until it is answered correctly.
* Complete after the last question.

### 5.4 `sort` — sorting into baskets

```jsonc
"buckets": [ { "id": "farm", "title": "On the farm", "icon": "cow.svg" } ],
"items":   [ { "text": "cow", "picture": "cow.svg", "bucket": "farm" } ]
```

* Two ways to play, both always available: **tap** an item then tap a basket, or
  **drag** the item onto a basket. A drag that ends outside a basket returns the
  item to the pool and counts as nothing.
* Correct basket → the item moves into it, disables, **one correct**.
* Wrong basket → **one wrong**, the item shakes and stays in play.
* Complete when every item is placed.

*Note for a touch front end: tapping must be a first-class route, not a
fallback. Dragging small chips one-handed on a phone is unreliable for a young
child.*

### 5.5 `order` — word and sentence ordering

```jsonc
"sentences": [ { "words": ["I", "like", "red", "apples"], "hint": "Start with I." } ]
```

* The words are shuffled into a pool. Tapping a word moves it to the answer
  line; tapping it again in the line returns it to the pool, which is free and
  counts as nothing.
* The answer is checked **only when the line holds every word**.
* Exact match → **one correct**, next sentence after about 0.9 s.
* Otherwise → **one wrong**, the line flashes, nothing is cleared, and the child
  keeps rearranging.
* Complete after the last sentence.

### 5.6 `missing` — missing-word challenge

```jsonc
"items": [ { "picture": "cat.svg",                        // optional
             "sentence": "The cat ___ on the mat.",       // gap is 2+ underscores
             "options": ["sits", "sit", "sitting"],
             "answer": 0 } ],
"shuffleItems": false                                     // optional, default true
```

* The sentence is split at the run of underscores and shown with a visible gap.
* Right option → it drops into the gap so the whole sentence can be read back,
  **one correct**, next item after about 0.95 s.
* Wrong option → **one wrong**, that option disables; the item stays.
* Complete after the last item.

---

## 6. Scoring, stars and progress

Identical everywhere, so a child sees the same result on the phone and on the
website.

```
correct   = number of correct answers
wrong     = number of wrong answers
percent   = round(correct / (correct + wrong) × 100)      // 0 if no attempts

stars = 3 if percent >= 90
        2 if percent >= 70
        1 if percent >= 40
        0 otherwise
```

Nothing is ever failed and nothing is timed. A wrong answer costs a point of
accuracy and nothing else, and the child continues until the game is complete.

Progress is stored **on the device only**, keyed by activity `id`:

```jsonc
{ "g1-animals-match": { "stars": 3, "best": 100, "plays": 4 } }
```

`stars` and `best` keep the highest ever reached; `plays` counts attempts. The
website keeps this in `localStorage` under `rcf-gz-progress-v1`. An app should
use the same shape so the two could be reconciled later if wanted.

---

## 7. Sound

Sound is a bonus and never a requirement. The website generates short tones at
run time rather than shipping audio files, so a pack carries no audio weight.
Events: `correct`, `wrong`, `win`, `flip`. Every game must be fully playable
with sound off, and the mute setting is remembered per device.

---

## 8. Offline and packs

A pack is offline-ready by construction: JSON plus SVG, no fonts, no audio, no
network calls, no third-party services. Grade 1's pack is about 5 KB of JSON and
under 20 KB of illustrations.

For the Android app, bundle `index.json`, the grade files wanted, and the
illustrations those files name. Nothing else is required.

---

## 9. Changing the schema

Additive changes — a new optional field, a new game type — keep
`schemaVersion: 1`; older front ends ignore what they do not recognise. Anything
that changes the meaning of an existing field raises the version, and both front
ends must be updated before content using it ships.
