# Goal Card: partial-stock visibility

## OBJECTIVE

Card: PARTIAL-STOCK-VISIBILITY | Version: 1 | Readiness: Ready
Mode: repair loop | Decision owner: product owner

When a synthetic reservation is rejected because requested quantity exceeds
available stock, keep the returned available quantity visible to the
pharmacist. Never create an automatic partial reservation.

In scope: the reservation desk's HTTP 409 presentation and focused evidence.
Not in scope: API changes, automatic partial fulfilment, workflows, or
dependencies.

## OUTPUT

| Result | Destination | Write rule |
| --- | --- | --- |
| Visible bug fix | `public/app.js` | Preserve existing suggestion and error behavior |
| Acceptance evidence | focused test or browser evidence and pull request checks | Add evidence; do not weaken existing tests |
| Durable contract | `specs/partial-stock-visibility.goal-card.md` | Copy this approved card without weakening it |

## DONE WHEN

1. **C01 - Available quantity stays visible**
   Pass: requesting five `MED-002` items when four are available produces a
   visible HTTP 409 result that states four are available.
   Verify: run the service, submit the request in the reservation desk, and
   inspect the visible result and raw response.
   Evidence: focused automated evidence where practical, the observed result,
   and the pull request revision.
   If it fails: repair only the HTTP 409 presentation.
   Recheck: C01 and C03.

2. **C02 - No partial reservation**
   Pass: the rejected request creates no reservation and leaves `MED-002` at
   four.
   Verify: compare `GET /stock` before and after the rejected request.
   Evidence: existing service test output and revision-bound pull request check.
   If it fails: stop; the proposed UI repair crossed the service boundary.
   Recheck: C01-C03.

3. **C03 - Existing presentation remains valid**
   Pass: suggestion rendering, generic failures, accessible status updates, and
   the complete service suite remain valid.
   Verify: inspect the bounded diff and run `npm test`.
   Evidence: local exit result and GitHub Actions `Test service` check.
   If it fails: repair only the allowed presentation change or stop BLOCKED.
   Recheck: C01-C03.

## QUALITY

Use plain, nonclinical language. Keep the quantity visible without implying
that a partial reservation occurred. Preserve keyboard and screen-reader
behavior.

## CONTEXT

| Source or prerequisite | Requirement | Exact location and state |
| --- | --- | --- |
| Confirmed bug Issue | Required | Attendee fork; approved Goal Card comment exists before assignment |
| Bug evidence | Required | `context/intake/partial-stock-ticket.md`, `reservation-api.log`, and `meeting-notes.md` |
| Current behavior | Required | `public/app.js` and existing tests on the assigned base revision |

Unresolved: none.

## CONSTRAINTS

Read: the confirmed Issue, existing comments at assignment time, listed
evidence, UI source, service source, and tests.
Write: `specs/partial-stock-visibility.goal-card.md`, `public/app.js`, and the
smallest focused test or evidence artifact required by repository conventions.
Never: change the API contract, reserve partial stock, edit workflows,
dependencies, ownership, or this approved finish line.
Approval: a human reviews and merges the pull request after checks and review.

## STAGES

1. Reproduce the missing visible quantity and preserve the observation.
2. Implement the smallest presentation repair.
3. Run focused and full checks, inspect the diff, and reconcile C01-C03.

## STOP-CAPS

Maximum cycles: 3. Maximum elapsed time: 25 minutes.
Expensive actions: none. Stop after two consecutive cycles without closing a
failed check, or immediately when product intent, browser evidence, or authority
is missing.

DONE requires C01-C03 on the final revision. BLOCKED, CAPPED, and CANCELLED keep
the branch unmerged and identify the next safe action.
