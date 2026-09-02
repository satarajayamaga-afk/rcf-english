# Adding a game to the Primary Game Zone

Nothing here is code. Every activity is a small block of JSON, and the game
engines read it. To add a game you write a block; you never touch the
JavaScript, and you never touch a page.

1. Open the grade file — `grade-1.json` … `grade-5.json`.
2. Find the topic you want, or add a new one.
3. Copy an existing activity of the type you want and change its content.
4. Give it an **`id` nobody else has**. Stars are saved against the id, so an id
   must never be reused for different content.
5. Run `build.cmd`. `check.cmd` will catch a typing mistake in the JSON before
   it reaches the site.

The six types are `match`, `memory`, `quiz`, `sort`, `order` and `missing`.
**`CONTENT-SCHEMA.md` in this folder gives the exact shape of each one**, along
with the rules each game follows and how stars are worked out.

## Pictures

Write a bare file name — `"picture": "cat.svg"` — and the picture is taken from
`assets/img/games/`. To use a better illustration later, replace that file. No
data and no code changes.

To add a new picture, put an SVG in `assets/img/games/` and name it in the data.
Keep it simple and bright: the whole set is under 20 KB, which is why the games
open instantly on a slow connection.

## A word about the app

These files are also the content source for the RCF Learning Android app, so
keep them plain: no HTML, no markdown, no site addresses inside the content.
`CONTENT-SCHEMA.md` explains why.
