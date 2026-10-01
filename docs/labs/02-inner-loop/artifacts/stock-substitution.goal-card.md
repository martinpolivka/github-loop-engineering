# Goal Card: stock substitution suggestion

## OBJECTIVE

Card: STOCK-SUGGESTION | Version: 1 | Readiness: Ready
Mode: repair loop | Decision owner: product owner

When a synthetic reservation cannot be fulfilled, return one deterministic
same-category stock suggestion that a store associate may evaluate. Never reserve
the suggestion or add it to the customer's basket automatically.

In scope: `demo-app/src/reservations.mjs` and one focused test file. Not in scope: automatic
replacement, partial fulfilment, unrelated backlog work, workflows, or dependencies.

## OUTPUT

| Result | Destination | Write rule |
| --- | --- | --- |
| Product change | `demo-app/src/reservations.mjs` | Preserve existing response fields and successful reservations |
| Acceptance evidence | `demo-app/test/suggestion.test.mjs` and pull request checks | Add tests; do not weaken existing tests |

## DONE WHEN

1. **C01 - Eligible suggestion**
   Pass: an out-of-stock request returns 409 with the existing `error` and
   `available` fields plus the first eligible same-category item by SKU, including
   `sku`, `name`, and `available`.
   Verify: run `node --test demo-app/test/suggestion.test.mjs`.
   Evidence: test output and pull request check for the reviewed revision.
   If it fails: repair selection or response construction in `demo-app/src/reservations.mjs`.
   Recheck: C01, C02, C03.

2. **C02 - No side effect**
   Pass: suggesting an item creates no reservation and changes no stock.
   Verify: compare `/stock` before and after the rejected request in the focused test.
   Evidence: focused test and reviewed diff.
   If it fails: remove the mutation; do not compensate in the test.
   Recheck: C01, C02, C03.

3. **C03 - Existing behavior remains valid**
   Pass: unknown SKUs remain 404, valid reservations remain 201, no eligible
   suggestion omits the field, and the complete existing suite passes.
   Verify: run `npm test`.
   Evidence: local exit result and GitHub Actions `Test service` check on the PR revision.
   If it fails: repair only the allowed implementation; escalate a Goal Card conflict.
   Recheck: C01, C02, C03.

## QUALITY

Keep the algorithm deterministic, dependency-free, and easy to review. Use only
synthetic identifiers. Category matching is product discovery, not automatic checkout.

## CONTEXT

| Source or prerequisite | Requirement | Exact location and state |
| --- | --- | --- |
| Confirmed feature Issue | Required | Attendee fork; link before execution |
| Product evidence | Required | `context/intake/meeting-notes.md` and `stakeholder-email.md` |
| Current behavior | Required | `demo-app/src/reservations.mjs`, `demo-app/src/inventory.mjs`, and `demo-app/test/inventory.test.mjs` on the working branch |

Unresolved: none.

## CONSTRAINTS

Read: the confirmed Issue, listed evidence, service source, and tests.
Write: `demo-app/specs/stock-substitution.goal-card.md`, `demo-app/src/reservations.mjs`, and optional
`demo-app/test/suggestion.test.mjs`.
Never: edit this Goal Card, workflows, ownership, dependencies, or expected
results merely to obtain a pass.
Approval: a human approves the pull request after checks and review.

## STAGES

1. Run the existing suite and add the focused failing acceptance test.
2. Implement the smallest change that closes C01 and C02.
3. Run focused and full checks, inspect the diff, and record the revision.

## STOP-CAPS

Maximum cycles: 3. Maximum elapsed time: 30 minutes.
Expensive actions: none. Stop after two consecutive cycles without closing a
failed check, or immediately when product intent or authority is missing.

DONE requires C01-C03 on the final revision. BLOCKED, CAPPED, and CANCELLED keep
the branch unmerged and identify the next safe action.
