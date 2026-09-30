# html-docs runtime

Vendored from the author's supplied `html-docs` skill, version 1.2.0, on
30 September 2026.
The runtime and canonical palette files are kept unchanged. See `LICENSE`
for the redistributed MIT notice.

The adjacent `package.json` establishes CommonJS for the skill's Node tools
inside this repository's ES-module package. It adds no dependency.

Synchronize marked source heads after updating the shared bootstrap or tokens:

```powershell
node docs\assets\html-docs\sync-head.js --check docs\index.html
```

Use `bundle.js` to export a source for single-file distribution. It embeds local
runtime assets and media, but not linked sibling guides, repositories or lab
files. Validate the exported file separately in an isolated folder.

The four accent families are blue, red (red-orange), green, and yellow.
Legacy `orange` preferences and URLs resolve to `red`. Each document keeps
reading and Slides in one HTML, with a PDF control that prints the current
view in the light palette. `export-pdf.js` provides automated export.

Repository-specific command-copy and legacy-anchor behavior lives outside this
vendored runtime in `docs/assets/materials.js`.

The workshop index uses a page-local landing layout and the canonical Slides
runtime, without accordion controls. `npm run validate:html` checks its actual
landing view, all ten slides, all palettes, mobile, no-JS, and both PDF views
through `tests/browser.mjs`; the other nine articles use canonical `validate.js`.
