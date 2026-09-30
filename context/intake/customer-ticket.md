# Support case SUP-4102 (synthetic)

**Channel:** customer support queue export  
**Reporter:** Pharmacist, Store S-12  
**Service:** reservation kiosk  
**Priority:** normal  
**Status:** open

## Report

At 08:12 a customer requested one `MED-003` (Synthetic Inhaler). The kiosk
showed **insufficient stock** and offered no next step. `MED-004` (Synthetic
Alternative Inhaler) was available on the shelf, but the pharmacist noticed it
only after the customer had left.

The pharmacist does not want the kiosk to reserve another item automatically.
They want one relevant in-stock option to evaluate with the customer. The
pharmacist remains responsible for deciding whether that item is appropriate.

## Reproduction

1. Start with `MED-003` at zero and `MED-004` at six.
2. Request one `MED-003` through `POST /reservations`.
3. Observe HTTP `409` with `error` and `available`, but no available option.

Request ID: `REQ-S12-4102`. See `reservation-api.log`.

All stores, people, products, and identifiers in this case are synthetic.
