# Synthetic input cases for repository pulse

These are fictional rehearsal inputs, not observations of your deployed service.
Create only Case A for the core lab. Case B belongs to the optional changed-evidence
extension. Use the matching Issue form in your exact attendee fork, review the
complete draft, and approve each publication separately. Do not assign a coding
agent, implement a repair, or claim a real incident.

## Case A: initial actionable evidence

Title: [Lab 5 synthetic] Reservation desk hides available quantity

Evidence: In fictional request PULSE-A-001, a request for five SKU-002 items
receives HTTP 409 with `available: 4`. The visible reservation desk message
omits the available quantity. This is a synthetic snapshot, not a fresh
reproduction against the workshop application.

Expected: Show four available without changing the API, creating a partial
reservation, or changing stock.

Owner role: storefront maintainer.

Next human decision: confirm the visible-result requirement and authorize a
separately scoped repair only if real evidence supports it.

Disposition: open synthetic input for the recurrence rehearsal. Leave unchanged
through the first publication and unchanged replay.

## Case B: distinct new evidence

Title: [Lab 5 synthetic] Eligible substitute selection depends on insertion order

Evidence: In fictional request PULSE-B-001, SKU-003 has zero stock. SKU-004
and SKU-000 both have sufficient stock in its category. The response suggests
SKU-004 because it was inserted first, although the confirmed selection rule
requires the first eligible SKU in sorted order. This is a second synthetic
snapshot, not a claim that the Lab 2 implementation is defective.

Expected: Return SKU-000 for that snapshot. Preserve HTTP 409, reservation
behavior, and stock; do not reserve the suggestion.

Owner role: reservation API maintainer.

Next human decision: confirm the selection evidence and decide whether a new
regression test and bounded repair are justified.

Disposition: open synthetic input. Publish only after the unchanged replay
checkpoint, with separate human approval.

## End of rehearsal

Do not edit the bot-owned pulse Issue to force a result. Keep both input Issues
open during comparison. Any later closure is cleanup of synthetic cases, not
evidence that application defects were fixed.
