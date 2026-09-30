TITLE
[Bug] Show partial availability after a rejected reservation

EVIDENCE
- `context/intake/partial-stock-ticket.md`: SUP-4113 reports that the kiosk
  hides the four available MED-002 items after a request for five.
- `context/intake/reservation-api.log`: REQ-S07-4113 proves the API returned
  HTTP 409 with `available: 4`, while the visible kiosk message omitted it.
- `context/intake/chat-thread.md`: QA classifies the missing visible value as a
  UI contract violation, and the pharmacist rejects automatic partial booking.
- `context/intake/meeting-notes.md`: the team confirms the visible-result
  contract, unchanged API, no stock mutation, and deterministic test boundary.
- `context/intake/stakeholder-email.md`: the product owner authorizes a
  separate bug report.

REPRODUCTION
1. Start with MED-002 at four.
2. Request five MED-002 items in the reservation desk.
3. Inspect the raw HTTP 409 response and observe `available: 4`.
4. Inspect the visible result and observe that it does not show four available.

EXPECTED BEHAVIOR
The visible HTTP 409 result shows the requested item's available quantity. It
does not create a partial reservation, alter stock, or change the API response.

RISK
Low - isolated user-interface behavior
