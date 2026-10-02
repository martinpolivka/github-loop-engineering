# 0022: Reading-only lab guides

- Status: Accepted
- Date: 2026-10-02
- Supersedes combined lab reading/presentation modes in
  [ADR 0018](0018-standalone-principles-and-agenda.md).

## Context

The author explicitly requested that labs have no slides. The separate English
and Czech opening presentations are outside this change.

## Decision drivers

- Keep lab instructions focused on reading and hands-on execution.
- Preserve procedures, commands, recovery paths, stable anchors, and PDF printing.
- Prevent future authoring or validation from reintroducing lab slides.

## Options considered

1. Hide the Slides control but retain authored presentation summaries.
2. Remove the Slides control and all authored slide summaries from all five labs.

## Decision

Choose option 2. Labs remain standalone reading-only HTML guides. Keep the
canonical shared runtime unchanged; without a Slides control it stays in reading
mode and makes old `?view=slides` links fall back to the guide.

Update content rules, documentation, and validation to enforce no slide surfaces
or controls in labs, with a single reading PDF. Do not change either opening deck.

## Consequences

Collapsible steps, command copying, themes, accessibility, links, and no-JavaScript
reading remain available. Lab speaking cues are removed, not moved into the
opening presentation or duplicated in another deck.

## Validation

Check every lab's reading controls, old slide-link fallback, reading-only print
plan, responsive layouts, and no-JavaScript reference. Run application tests,
material integrity checks, and real-browser validation for the five changed labs.

## Assumptions

The canonical article runtime continues to handle reading-only documents and
unsupported slide links without document-specific runtime edits.

## Revisit triggers

An explicit request for a separate facilitator presentation or a canonical
runtime update changes the supported reading-only behavior.
