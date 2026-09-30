# Support case SUP-4102 (synthetic)

**Channel:** customer support queue export<br>
**Reporter:** Store associate, Store S-12<br>
**Service:** storefront<br>
**Priority:** normal<br>
**Status:** open

## Report

At 08:12 a customer requested one `SKU-003` (Synthetic Insulated Bottle). The storefront
showed **insufficient stock** and offered no next step. `SKU-004` (Synthetic
Travel Bottle) was available on the shelf, but the store associate noticed it
only after the customer had left.

The store associate does not want the storefront to reserve another item automatically.
They want one relevant in-stock option to evaluate with the customer. The
store associate remains responsible for deciding whether that item is appropriate.

## Reproduction

1. Start with `SKU-003` at zero and `SKU-004` at six.
2. Request one `SKU-003` through `POST /reservations`.
3. Observe HTTP `409` with `error` and `available`, but no available option.

Request ID: `REQ-S12-4102`. See `reservation-api.log`.

All stores, people, products, and identifiers in this case are synthetic.
