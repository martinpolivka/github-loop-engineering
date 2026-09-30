# Teams chat export: reservation-support (synthetic)

**Support lead — 08:19**
I linked `SUP-4102` with `REQ-S12-4102`. The API returned its documented `409`;
this does not look like an outage or regression.

**Service engineer — 08:25**
Confirmed. The inventory already records SKU, display name, category, and
available quantity. The response currently exposes only `error` and `available`.

**Pharmacist — 08:31**
Please do not automatically reserve another item. Show one relevant option and
leave the decision with me.

**QA — 08:38**
We need an explicit rule for category, sufficient quantity, multiple matches,
and whether showing an option mutates stock. Otherwise the test will encode a
guess.

**Operations coordinator — 08:44**
Could we add low-stock alerts at the same time?

**Support lead — 08:46**
Already planned in `backlog.md`; keep it out of this case.

**QA — 08:51**
`REQ-S07-4113` is separate from `SUP-4102`. The API returned `available: 4`,
but the kiosk ignored that existing field. That violates the visible-result
contract and should be reported as a UI bug, not folded into the suggestion
feature.

**Pharmacist — 08:55**
Show the available quantity, but do not reserve fewer items automatically. I
need to discuss the next action with the customer.

All participants and messages are synthetic.
