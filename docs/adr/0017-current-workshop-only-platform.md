# 0017: Keep only the current workshop platform

- Status: Accepted
- Date: 2026-09-30
- Supersedes: historical-demo continuation in [ADR 0009](0009-loop-contract-and-bounded-recurrence.md), retention in [ADR 0012](0012-one-full-day-html-journey.md) and [ADR 0016](0016-retail-and-signed-test-prod-images.md), and generated-station tooling associated with [ADR 0013](0013-attendee-forks-and-codespaces.md)

## Context

The current five labs use an attendee fork of this repository and a retail
application. Platform tooling still shipped separate pharmacy demonstrations,
recorded evidence, duplicated services, repository generation, backlog seeding,
and tests for those retired paths. The current OCI helper also imported command
execution from a historical demonstration.

## Decision drivers

- Preserve the current application, five labs, Azure release and facilitator path.
- Remove historical implementations rather than maintaining them through tests.
- Keep forks as the single station creation path.
- Keep live checks separate from historical evidence and inferred success.

## Options considered

1. Delete all platform files, breaking the current Azure lab and preflight.
2. Keep every historical demo because its tests still reference it.
3. Retain only current Azure support, capability profiles and the operator guide.

## Decision

Choose option 3. Remove standalone trusted-delivery, security-remediation and
secret-protection demos, their fixtures, recordings, workflows and dedicated
tests. Remove station rendering/provisioning, backlog seeding and generated
station reset/cleanup. The intake packet remains the synthetic backlog source.

Keep the prepared Azure templates and OCI helper for Lab 4. Extract shell-free
command execution into a current platform helper. Retain a read-only preflight
with explicit host/repository targeting and capability profiles without
provisioning settings. Keep only the full-day operator guide under demos.

Tests copy only the service files they exercise, not a generated workshop
repository. Move the still-tested loop CLI next to its implementation in scripts.
Keep older ADRs as decision history, not as instructions to restore retired files.

## Consequences

There is no built-in historical security demo or recorded security evidence.
Any optional instructor security demonstration must be prepared and verified
separately, otherwise its capabilities are explained without a live claim.
GitHub forks and the existing Azure allocator own creation and retention.
The platform helper does not gain repository or resource-group deletion.

## Validation

Run service and materials tests, content validation, HTML/browser journeys,
source-bound screenshot regeneration, and current Agentic Workflow validation.
Check that current code does not import or invoke any retired path.
Local validation does not establish live Azure or agent inference availability.

## Assumptions

The five-lab fork-based journey is the only supported workshop.
The platform owner approved removal of historical paths and related CI updates.

## Revisit triggers

A new delivery needs centrally provisioned repositories or a required security
demonstration. Introduce a bounded current implementation rather than restoring
historical fixtures wholesale.
