# Adding a batch of grammar lesson plans

The CEFR grammar plans are written in Google Docs, one document per plan, named
`NN-LL Grammar Point` - the unit number, the CEFR level, then the grammar point.
That name is the only thing the toolchain needs from the file name: `NN-LL`
becomes the plan's key everywhere (`plans/NN-LL.md`, the `extras.js` override
key, the `drive.js` document id).

Nothing here is edited by hand except `extras.js` and `drive.js`.

## 1. Get the documents onto the disk

Reading sixty documents through the Drive connector is slow and expensive, so
download them instead. In Drive, right-click the folder and choose **Download**.
Google sends a `.zip` of `.docx` files.

Do not unzip it with `Expand-Archive`: the document names are long, and the
combined path goes past the 260-character limit Windows still enforces, so the
extraction fails part way through. Read the XML straight out of the nested
zips instead - a `.docx` is itself a zip:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = "$env:USERPROFILE\Desktop\<the downloaded>.zip"
$out = "$env:TEMP\gplans"
Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $out | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead($src)
$manifest = @(); $i = 0
foreach ($e in $zip.Entries) {
  if ($e.Name -notlike '*.docx') { continue }
  $i++; $id = '{0:d3}' -f $i
  $ms = New-Object System.IO.MemoryStream
  $s = $e.Open(); $s.CopyTo($ms); $s.Close(); $ms.Position = 0
  $inner = New-Object System.IO.Compression.ZipArchive($ms)
  foreach ($part in @(@('word/document.xml', "$id.xml"), @('word/numbering.xml', "$id.num.xml"))) {
    $entry = $inner.GetEntry($part[0])
    if ($entry) {
      $fs = [System.IO.File]::Create((Join-Path $out $part[1]))
      $ds = $entry.Open(); $ds.CopyTo($fs); $ds.Close(); $fs.Close()
    }
  }
  $manifest += "$id`t$($e.Name)"
  $inner.Dispose(); $ms.Dispose()
}
$zip.Dispose()
[System.IO.File]::WriteAllLines((Join-Path $out 'manifest.tsv'), $manifest)
"$i documents"
```

`numbering.xml` matters: without it the converter cannot tell a numbered list
from a bulleted one, and the answer keys refer to question numbers.

## 2. Convert to Markdown

```bash
node tools/esl/grammar/docx-to-md.js "$TEMP/gplans" "$TEMP/gplans/manifest.tsv"
```

This writes `plans/NN-LL.md`, one per document, and reports anything it
skipped. It is safe to re-run: it overwrites.

## 3. Generate, check, build

```bash
node tools/esl/gen.js --audit
```

`--audit` lists every title and description that falls outside the limits
instead of stopping at the first. Fix those, then run it without `--audit`,
which writes `_src/pages/global-english-esl.json`, and build as usual.

## What the documents must contain

The parser reads the document, not a convention, so the shape matters:

- a first line `GRAMMAR TOPIC: <UNIT> · <level> · <minutes> minutes`
- the grammar point as the only Heading 1 before the handouts
- `Lesson theme: ...` in italics
- a `Lesson overview` table whose left column holds **Grammar topic**,
  **Grammar point**, **Level**, **Duration**, **Class profile**, **Main aim**,
  **Subsidiary aims**, **Learning outcome** and **Materials**
- `Language analysis`, `Anticipated problems and solutions`, `Board plan`
- `Procedure`, with each stage as a Heading 3 reading
  `Stage N: Name (M minutes)`, and under it a bold
  `Stage aim: ... Interaction: ...` line. Stage times must add up to the
  duration, or the generator refuses the plan.
- a last stage `Stage N: Homework`, with no time, which becomes the homework
- `Differentiation`, with bold **Support** and **Stretch** labels
- `Assessment and success criteria`, `Teacher's reflection`
- then each handout as a Heading 1, and the answer key last

Two things the documents do not carry, and STANDARD.md asks for: the four
adaptations (large class, no photocopier, online, different age group) and the
45-minute short route. Those are composed in `index.js` from the plan's own
handouts and stage names, so they always describe the real lesson. If a batch
starts carrying them, read them from the document and delete the composers.

## Overrides

- `extras.js` - a short public name for a plan whose grammar point is too long
  for a title and a URL, and any other field worth overriding.
- `drive.js` - the Google Doc id per plan, and the `shared` switch. Links stay
  off until the documents are shared as **Anyone with the link - Viewer**.
  Never Editor: an Editor link lets any visitor rewrite the plan.
