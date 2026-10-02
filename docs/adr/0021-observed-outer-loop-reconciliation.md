# 0021: Observed outer-loop reconciliation

- Status: Accepted
- Date: 2026-10-02
- Supersedes the Lab 5 source-only core and dual-authoring scope in
  [ADR 0015](0015-progressive-inner-and-outer-loops.md); signed release evidence
  from [ADR 0016](0016-retail-and-signed-test-prod-images.md) remains unchanged.

## Context

The five-lab workshop completed successfully with different attendee speeds.
The author requested actual publication and unchanged-state replay in Lab 5,
rather than only reading a recurring workflow contract. A disposable private
GitHub station is used to rehearse the live path without Azure resources.

Live diagnosis found two material prerequisites. The original default GitHub
toolset omitted Actions tools even though `actions: read` was declared, so an
agent correctly returned a blocked no-op. After exposing the read tools, it
published an Issue but omitted the model-authored workshop ownership comment.
The author separately approved the read-tool fix and migration to the ownership
marker that the safe-output runtime itself adds. A third run found that the
default update target, the triggering Issue, is unavailable for manual and
scheduled dispatch. The author approved explicit target selection with required
title/label filters and body-only updates.

## Decision drivers

- Teach prior-state consumption and a justified no-op, not a scheduled prompt.
- Keep the 40-minute core and mixed-experience attendee path.
- Preserve reviewed workflow authority and explicit human publication approvals.
- Distinguish runtime-owned state from text that a model is asked to reproduce.
- Never count a green blocked run, source inspection, or queueing as recurrence.

## Options considered

1. Keep two authored sources and source-only recurrence inspection.
2. Add three serial agent runs without removing authoring work.
3. Author one source, overlap the prepared first run with local authoring,
   observe publication and unchanged replay, and move other depth to extensions.

## Decision

Choose option 3. The core authors Issue triage and leaves its PR draft. The
prepared `repository-pulse` runs twice manually from reviewed default-branch
source and lock. Defer publishing the authored PR until after replay, so remote
backlog changes cannot invalidate the comparison. A third changed-evidence run
and deployment-readiness authoring are explicit optional extensions.

Expose `repos`, `issues`, `pull_requests`, and `actions` GitHub toolsets with
unchanged read permissions, safe-output caps, inference budgets, and detector
controls. Create reports with the `Repository pulse: ` prefix and
`repository-pulse` label. Allow explicit update targets within the repository,
enforce both filters in the safe-output handler, and enable only body updates.
Use replacement rather than appending another report. Identify the owned Issue
using bot authorship and the runtime-added `gh-aw-agentic-workflow` HTML metadata
whose `workflow_id` equals `repository-pulse`. The creation-only
`gh-aw-workflow-id` comment is not retained by body replacement, so it cannot
identify owned state across updates. Exclude the pulse's own
successful runs, report metadata, and owned Issue from new domain evidence.
Do not add a local runner or claim deterministic cross-run deduplication. The
handler enforces filters and output count, not bot authorship or unique ownership;
those remain instruction-level checks and are stated as such.

Record run/attempt, source revision, input Issues, output decision, detection
result, owned Issue body/state/timestamp, and duplicate count. Unchanged replay
requires an unchanged-evidence no-op and no Issue mutation. A missing-access
no-op is blocked even when Actions reports success.

## Consequences

The 40-minute core allocates 15 minutes to observing and replaying. A 20-minute
total live-path cap starts at first dispatch. The facilitator prepares an
original-repository evidence pair; slow or unavailable inference uses that
explicitly recorded fallback. Manual runs do not prove the weekly schedule
fired, and no-op does not mean inference or threat detection was free.

Input cases are fictional and separately approved. Their later cleanup is not
application repair. The new lesson adds no Azure access, merge authority, release
authority, dependency, or inference credential.

## Validation

Rehearse first publication, unchanged replay, and changed-evidence update against
the final source and lock in a fresh private station. Verify the publisher marker
and bot author, exact owned Issue number, unchanged body/state/timestamp on replay,
one owned Issue after update, and actual safe-output decisions. Keep failed
diagnostic runs distinct from final successful evidence.

Run application and workshop integrity tests, validate the workflow with the
pinned compiler, and validate changed HTML in a real browser. Retain source-bound
rehearsal observations in session artifacts rather than embedding private station
identifiers in customer-neutral workshop materials.

## Assumptions

The prepared station has Actions and approved inference access, and the compiler
and runtime retain the generated ownership marker. No live execution is promised
for a station missing those capabilities.

## Revisit triggers

The runtime changes ownership metadata, repeated unchanged input produces writes,
the live path regularly exceeds its allowance, or preview authentication/toolsets
change. Rehearse again before treating older evidence as current.
