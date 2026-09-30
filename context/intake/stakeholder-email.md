# Outlook email export (synthetic)

**From:** Regional product owner, pharmacy services

**To:** Reservation service team
**Subject:** Decision for SUP-4102

Use the attached Teams meeting decisions to prepare two independently
reviewable Issues:

1. A feature request for `SUP-4102`, preventing an out-of-stock request from
   becoming a dead end when a relevant option is available.
2. A bug report for `SUP-4113`, because the kiosk hides the `available` value
   already returned by the service.

Preserve the current `409` contract so the kiosk continues to work without a
coordinated release. The pharmacist must remain in control: inventory
information is not medical advice, and no option may be reserved automatically.

Keep automatic partial fulfilment and every item already listed in `backlog.md`
out of scope. Each Issue must cite its support case, matching request log,
Teams chat, and meeting decision. Keep the two scopes independent and small
enough to prove with deterministic tests this week.

Regards,
Regional product owner

This is synthetic workshop evidence, not a real email.
