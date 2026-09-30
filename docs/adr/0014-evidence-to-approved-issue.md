# 0014: Evidence to approved Issue in Lab 2

- Status: Superseded by [ADR 0015](0015-progressive-inner-and-outer-loops.md)
- Date: 2026-09-29
- Supersedes: [ADR 0011](0011-coached-intake-from-synthetic-context.md)

## Context

The original Lab 2 asked an attendee to infer a requirement from noisy summaries
before they understood the source material. That made the custom agent's
questions feel arbitrary and hid the stronger enterprise story: engineering
intake begins with support cases, logs, conversations, meeting decisions, and
stakeholder authorization.

## Decision drivers

- Let the attendee verify claims against original evidence.
- Show how approved WorkIQ MCP access could retrieve Teams and Outlook context
  without requiring that enterprise-only integration in the sandbox profile.
- Keep all workshop content synthetic and label the substitute honestly.
- Preserve human approval before a durable GitHub artifact or implementation.
- End with an observable Issue-to-pull-request chain and deterministic checks.

## Options considered

1. Keep the question-first coaching flow and reveal the target contract later.
2. Use live Microsoft 365 and support-system connectors in every station.
3. Ship a synthetic evidence packet, have a bounded intake agent cite and
   classify it, approve one Issue, then assign that Issue to Copilot.

## Decision

Use option 3. `context/intake/` contains a synthetic customer case, matching
service log, Teams-style chat and meeting notes, an Outlook-style stakeholder
message, and the planned backlog. The guide explains that approved WorkIQ MCP
connections would normally retrieve Microsoft 365 context, while support and
observability connectors would supply the ticket and log.

The open-standard `requirement-refiner` Agent Skill acts as an intake analyst.
It must not inspect workshop answers under `docs/` or modify code. It first
returns a cited evidence brief. `CONFIRMED:` authorizes only a
complete Issue draft. `APPROVED: Create the issue` authorizes exactly one Issue
after the agent verifies the target is the attendee fork. If its surface lacks
an authenticated Issue tool, the attendee uses the same reviewed draft in the
manual form.

At the time of this decision, implementation started by assigning the approved
Issue to Copilot. ADR 0015 retained the evidence and approval model, moved it to
Lab 1, and replaced cloud assignment as the required path with an interactive
Goal-Card-driven inner loop.

## Consequences

- The exercise teaches evidence traceability, classification, approval, and
  delegation instead of guessing an undisclosed answer.
- The synthetic packet contains the confirmed product decisions, so tests must
  check consistency and exclusions rather than absence of solution terms.
- Skill discovery and write capability vary by Copilot surface; manual Issue creation is a
  supported fallback, not a simulated live integration.
- The root repository also contains workshop answers, so the agent prohibition
  is an instruction boundary rather than filesystem isolation.

## Validation

- `tests/platform.test.mjs` verifies the complete packet, matching request IDs,
  both approval gates, target-repository safety, and both Issue forms.
- The facilitator rehearses Issue creation only in a disposable fork and checks
  that assigning it to Copilot produces a pull request with deterministic CI.
- Lab HTML validation checks the attendee and recovery paths.

## Assumptions

- Supported Copilot surfaces continue to load repository Agent Skills from
  `.agents/skills/`.
- Assigning an Issue to Copilot creates a pull request where the feature and
  repository are enabled.
- WorkIQ and other internal connectors are illustrative unless the station has
  separately validated access and authorization.

## Revisit triggers

- GitHub changes Agent Skills discovery, approval behavior, or Issue assignment.
- A sandbox-safe connector can provide equivalent synthetic cross-system data.
- Rehearsal shows that Issue creation is unreliable across the selected surface.
