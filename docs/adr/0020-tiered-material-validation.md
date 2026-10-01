# 0020: Tiered material validation

- Status: Accepted
- Date: 2026-10-01
- Supersedes the per-edit full-validation and capture cadence of
  [ADR 0018](0018-standalone-principles-and-agenda.md).

## Context

Small presentation edits triggered repeated full workshop validation, PDF
generation, and source-bound captures. The author requested a fast edit cycle
and faster full checks, rather than deleting meaningful HTML quality checks.

## Decision drivers

- Provide immediate feedback on the document being edited.
- Preserve the complete release validation matrix.
- Generate screenshot evidence only when it will be reviewed or published.
- Bound concurrency and keep deterministic output and explicit failures.

## Options considered

1. Delete browser checks and screenshot provenance.
2. Run the complete serial matrix after every edit.
3. Separate targeted smoke from milestone checks and parallelize independent jobs.

## Decision

Choose option 3. Use `check:html` for selected exported documents during editing.
Check static references, offline execution, light/dark blue, and all presentation
surfaces at 1280x720. Do not generate PDFs, screenshots, or manifests in this mode.

Use full `validate:html` and `test:browser` at review completion, before
publication, and after shared runtime or validator changes. Use `capture`
instead of `test:browser` when refreshing milestone screenshot evidence.
Parallelize independent documents and palettes without removing assertions.
Cap workers at eight by default and support explicit serial diagnosis.
Select the installed headless executable matching the pinned Playwright
revision when available, not an independently discovered browser revision.
Keep an explicit browser-path override and log the executable in full runs.

## Consequences

Smoke does not certify other accents, print, no-JavaScript fallback, the complete
interaction matrix, or the retail journey. Milestone checks remain mandatory.
Screenshot manifests are optional review evidence, not an edit-time gate.
Higher concurrency uses more memory; constrained hosts can select fewer workers.

## Validation

Test worker limits, stable result ordering, error propagation and worker draining.
Exercise smoke against valid materials and deliberate layout and runtime defects.
Run the complete matrix and compare serial and parallel timings for unchanged
inputs and coverage. Report measured speedups rather than promised targets.

Measured on the existing Windows station with Node 24 and Playwright 1.62.1:

| Check | Before | After | Interpretation |
| --- | --- | --- | --- |
| Full deck browser checks, unchanged coverage | 81.12 s | 12.68 s | 6.4x in the measured run |
| Seven-document canonical checks, same assertions | 199.82 s, one worker | 32.54 s, eight workers | 6.1x in the paired benchmark |
| Selected deck smoke | Full deck: 81.12 s | 1.47-2.17 s | 37-55x feedback; intentionally narrower coverage |
| Seven-document smoke | Not benchmarked | 2.79 s | No screenshots or PDF |
| Complete browser matrix and capture | Not benchmarked | 73.59 s | All seven materials and 18 source-bound screenshots |

These are measurements, not performance guarantees. A later full canonical run
took 81.85 seconds under different load, including a serial agenda job. Agenda
validation now uses available worker capacity without exceeding the shared
document pool. The 100x selected-deck feedback target remains unmet; browser
startup and shutdown impose a cold-run cost. Do not hide that cost by caching
successful results or removing failure checks.

## Assumptions

Published HTML embeds its runtime. Node.js and the existing Playwright
installation are available; no additional package or runtime asset is needed.

## Revisit triggers

Smoke misses a consequential edit regression, full checks become flaky under
concurrency, or validation latency again prevents interactive review.
