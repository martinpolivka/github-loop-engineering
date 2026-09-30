# Teams meeting notes (synthetic)

**Meeting:** Reservation support triage<br>
**Participants:** product owner, store associate, support lead, service engineer, QA<br>
**Related cases:** `SUP-4102`, `SUP-4113`

## Confirmed feature decision for SUP-4102

- Treat `SUP-4102` as a feature request. The service currently behaves according
  to its existing contract; the missing capability is new.
- When requested stock is insufficient, return at most one available item from
  the same category whose stock covers the requested quantity.
- If more than one item qualifies, choose the first by SKU so the result is
  deterministic.
- Keep HTTP `409` and the existing `error` and `available` fields.
- Add the option under a `suggestion` field containing only inventory
  information (`sku`, `name`, and `available`). Omit `suggestion` when no item
  qualifies. This is product discovery, and the customer decides what to do.
- Do not reserve the returned option or change any stock.
- Add deterministic tests for the new response and all unchanged boundaries.

## Confirmed bug contract for SUP-4113

- The API already returns the requested item's `available` quantity with a
  rejected reservation.
- The storefront must display that quantity in the visible `409` result.
- Keep the existing status code and API response unchanged.
- Do not create a partial reservation or change stock.
- Add a deterministic test for the visible result and preserve accessibility.

## Shared out of scope

- Automatic replacement or reservation.
- Automatic partial fulfilment.
- Low-stock alerts, reservation expiry, dashboard changes, and audit export.

These notes simulate a meeting recap retrieved from Microsoft Teams. They are
workshop evidence, not a recording of a real meeting.
