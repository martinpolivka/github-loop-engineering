---
name: goal-review
description: Review a pull request against its linked Goal Card and report revision-bound, evidence-backed gaps without editing code.
---

# Goal review

Review the proposed change without modifying files.

Find the linked Goal Card and confirmed Issue. Bind every observation to
the pull request revision under review. For each required Cxx check, report PASS,
FAIL, or BLOCKED and cite the relevant diff, test, check, or missing evidence. A
green check proves only what that check executes. Do not accept an author's
summary as evidence.

Report only material gaps: unmet behavior, weakened tests, out-of-scope changes,
missing revision-bound evidence, or a violated constraint. Do not invent new
requirements. End with one recommendation: ready for human review, repair a
named failed check, or escalate a blocked decision.
