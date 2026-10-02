# Repository-pulse evidence record

Evidence mode: LIVE IN MY FORK | FACILITATOR LIVE | RECORDED SOURCE-BOUND | SOURCE ONLY
Repository:
Workflow source SHA and compiler version:
Application revision:
Synthetic input Issue A:
Optional synthetic input Issue B:
Owned pulse Issue URL, number, and author:
Owned Issue title prefix and repository-pulse label:
Owned runtime-generated metadata: gh-aw-agentic-workflow HTML comment with workflow_id: repository-pulse

## First publication

Run URL, ID, and attempt:
Run conclusion:
Agent decision and exact safe-output type:
Threat-detection result:
Published body and cited evidence:
Owned Issue state and updatedAt:
Number of bot-authored Issues with the marker, including closed Issues:
Observation: CREATED | BLOCKED | IN PROGRESS | FAILED CHECKPOINT

## Unchanged replay

Run URL, ID, and attempt:
Run conclusion:
Exact noop message and its evidence:
Input, application revision, and owned state unchanged before dispatch:
Same owned Issue number, state, complete body, and updatedAt after dispatch:
Number of bot-authored Issues with the marker after replay:
Observation: NOOP | BLOCKED | IN PROGRESS | FAILED CHECKPOINT

NOOP requires an unchanged-evidence explanation and no Issue write.
A green run containing a missing-access or missing-evidence noop is BLOCKED.
Per-run output limits are not a cross-run deduplication guarantee.

## Optional changed-evidence run

Run URL, ID, and attempt:
New evidence and separately approved input Issue:
Exact update_issue target, replace operation, title/label filters, and common runtime ownership metadata:
Same owned Issue number; changed body cites the new input:
Number of bot-authored Issues with the marker after reconciliation:
Observation: UPDATED | BLOCKED | IN PROGRESS | FAILED CHECKPOINT

## Remaining human decision

Owner:
Next action:
Unresolved blockers:
Live-path time cap reached:
Recorded fallback retains its original repository, source SHA, run URLs, and Issue:
Schedule left unchanged or disabled with explicit owner approval:

Two manual runs do not prove that the weekly schedule fired. Source-only review
does not prove execution. No-op does not guarantee zero inference or detector cost.
