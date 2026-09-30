# Support case SUP-4113 (synthetic)

**Channel:** customer support queue export<br>
**Reporter:** Store associate, Store S-07<br>
**Service:** storefront<br>
**Priority:** normal<br>
**Status:** open

## Report

At 09:40 a customer requested five `SKU-002` items. Four were available. The
service response contained `available: 4`, but the storefront displayed only
**Requested stock unavailable**. The store associate had to inspect the raw API
response to learn that four items remained.

The existing storefront contract says that the available quantity returned by the
service must remain visible after an unsuccessful request. The storefront must not
create a partial reservation automatically.

## Reproduction

1. Start with `SKU-002` at four.
2. Request five `SKU-002` items in the reservation desk.
3. Observe HTTP `409` in the raw response with `available: 4`.
4. Observe that the visible result does not show the four available items.

Request ID: `REQ-S07-4113`. See `reservation-api.log`.

All stores, people, products, and identifiers in this case are synthetic.
