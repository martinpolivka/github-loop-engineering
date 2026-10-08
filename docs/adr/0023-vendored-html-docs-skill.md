# 0023: Vendored html-docs skill

- Status: Accepted
- Date: 2026-10-08
- Supersedes the global skill installation requirement of
  [ADR 0018](0018-standalone-principles-and-agenda.md).

## Context

Agents working on a fork sometimes cannot find the globally installed
html-docs skill. The repository owner requested vendoring it from tomas-skills.

## Decision drivers

Make the complete authoring skill discoverable in the station repository,
keep validation reproducible, and preserve self-contained published HTML.

## Options considered

1. Require every operator and agent host to install the skill globally.
2. Vendor the complete skill at a pinned upstream revision.

## Decision

Choose option 2. Copy upstream `skills/html-docs/` unchanged into
`.agents/skills/html-docs/`, including its MIT license, templates, references,
and tools. Record the source revision and update procedure in `VENDORED.md`.
Add a dependency-free CommonJS package boundary for the upstream Node.js tools;
the station's root package remains an ES module.
Workshop validation resolves that directory relative to its own module, not
the caller's working directory. Keep `HTML_DOCS_SKILL` as an explicit override.

## Consequences

Forks carry their authoring tools without a global skill installation.
Published HTML remains self-contained; no runtime asset directory is added to
`docs/`. Playwright and a browser remain prerequisites for browser checks and
PDF export. Upstream updates require deliberate review and validation.

## Validation

Verify copied bytes against upstream Git blob hashes. Cover repository-local
resolution, explicit overrides, and missing-validator failures with node:test.
Run application, materials, canonical HTML, and workshop browser checks.

## Assumptions

Agent Skill discovery is host-specific. An existing session may need a reload
or restart; copying files does not register them automatically in every host.

## Revisit triggers

An upstream skill update or a change to supported hosts' discovery conventions.
