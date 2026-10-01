TITLE
[Reservation] Suggest an available substitute when stock is zero

EVIDENCE
- `context/intake/customer-ticket.md`: SUP-4102 reports a dead end after one
  SKU-003 request while SKU-004 was available.
- `context/intake/reservation-api.log`: REQ-S12-4102 returned the documented
  409 body and recorded SKU-003 at 0 and SKU-004 at 6.
- `context/intake/chat-thread.md`: the team confirmed this is not an outage and
  that the store associate must remain in control.
- `context/intake/meeting-notes.md`: the product owner, retail, engineering,
  and QA roles confirmed the selection and compatibility rules.
- `context/intake/stakeholder-email.md`: the product owner authorized one small
  feature request and required deterministic tests.

OUTCOME
A store associate handling a synthetic reservation can immediately see one available
item in the same category when the requested item is out of stock. This is a
product suggestion for a customer or store associate to evaluate.

ACCEPTANCE CRITERIA
- Given SKU-003 has zero stock and SKU-004 is available in the same category,
  when POST /reservations requests one SKU-003, then the service returns 409
  with error, available, and a suggestion containing sku, name, and available.
- A candidate is eligible only when its stock can satisfy the requested quantity;
  if several qualify, return the first by SKU order. If none qualifies, omit
  suggestion.
- Given an unknown SKU, the service still returns 404 without a suggestion.
- Given an in-stock SKU, reservation behavior and remaining stock are unchanged.
- A suggestion never creates a reservation or changes stock.
- The implementation is deterministic and covered by node:test.

CONSTRAINTS
- Keep the service dependency-free.
- Use synthetic data only.
- Do not change workflow permissions or ownership.
- Prefer the smallest reviewable change.
- Authorized proposal files: demo-app/src/reservations.mjs and optional new
  demo-app/test/suggestion.test.mjs. Keep the server, workflows, dependencies and all
  existing required tests unchanged. Acceptance evidence is the green
  GitHub Actions check on the pull request, not a summary printed by the worker.

OUT OF SCOPE
- Automatic replacement or reservation.
- Partial fulfilment when some requested stock is available.
- Low-stock alerts, reservation expiry, dashboard changes, and audit export.

RISK
Medium - API response behavior
