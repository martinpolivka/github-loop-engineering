# 0018: Standalone principles presentation and agenda

- Status: Accepted
- Date: 2026-10-01
- Operator-guide retention superseded by
  [ADR 0019](0019-separate-demo-application-and-workshop-tooling.md).
- Combined lab presentation modes superseded by
  [ADR 0022](0022-reading-only-lab-guides.md); standalone opening decks are unchanged.
- Supersedes the embedded opening presentation and vendored asset distribution
  aspects of [ADR 0012](0012-one-full-day-html-journey.md) and
  [ADR 0010](0010-canonical-html-docs-materials.md).

## Context

The author requested a separate English principles presentation, an agenda-only
`docs/index.html`, and removal of the entire `docs/assets/` directory. A Czech
presentation will follow after the English narrative is reviewed.

## Decision drivers

- Share or open each HTML without a runtime asset directory.
- Keep the agenda as the sole attendee entry point.
- Explain principles in the opening; demonstrate products in the labs.
- Preserve lab procedures, presentation modes, command copying, and licensing.

## Options considered

1. Keep the opening inside the hub: conflicts with the requested separation.
2. Extract a linked-assets deck: still requires an asset directory.
3. Embed runtime assets in every HTML and keep one separate principles deck.

## Decision

Choose option 3. `docs/index.html` contains the agenda and navigation only.
`docs/loop-engineering.en.html` is the single-file English principles deck.
The five labs and operator guide retain their combined reading/presentation
experience, with styles and scripts embedded. Adapt the supplied loop SVG to
English, conceptual labels, and the shared single-accent palette.

Use the globally installed html-docs skill for authoring and browser validation,
with `HTML_DOCS_SKILL` as an explicit installation-path override. Do not vendor
its tools or runtime directory. The embedded runtime retains its MIT notice.
HTML content tests enforce self-containment without requiring that skill.
Capture output is generated under ignored `.workshop/screenshots/`, not shipped
as a public asset directory. Each capture binds the complete standalone HTML.

## Consequences

HTML files are larger but recipients need only a browser. Lab links still point
to separate sibling files; standalone runtime does not embed a whole workshop.
Authoring and canonical browser validation require an installed html-docs skill.
Do not change embedded shared runtime code for document-specific fixes.
Historical ADRs and their former path descriptions remain historical records.

## Validation

Check every material for unresolved runtime/media references and unique IDs.
Check the agenda links and presentation separation. Exercise eight palettes,
navigation, print, responsive reading, offline isolated copies, and no-JavaScript
content. Regenerate source-bound captures outside public materials.

## Assumptions

The author has the html-docs skill installed globally. Product walkthroughs and
lab-specific speaking aids remain in the labs and operator guide.

## Revisit triggers

The English deck is approved for translation, or a canonical runtime update
requires regenerating the embedded assets.
