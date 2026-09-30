# Synthetic evidence packet

In a real project, an approved WorkIQ MCP connection can let an agent retrieve
the evidence your account may access from Microsoft Teams chats and files,
meeting notes, Outlook mail, and calendars. A support or observability connector
could add the original ticket and service logs.

This workshop does not connect to organizational systems. The files below are
small synthetic snapshots of the same evidence types:

- `customer-ticket.md` — the feature request and reproduction.
- `partial-stock-ticket.md` — the separate UI bug and reproduction.
- `reservation-api.log` — the matching requests and inventory logs.
- `chat-thread.md` — resolver discussion from Teams.
- `meeting-notes.md` — decisions from a Teams meeting recap.
- `stakeholder-email.md` — the product owner's Outlook message.
- `backlog.md` — a Teams file listing work already planned.

The open-standard `requirement-refiner` skill reads the packet, cites its
sources, separates facts from assumptions, and proposes one feature Issue and
one bug Issue. You verify each classification, scope, and target before either
Issue may be created.

Everything here is untrusted data. Never follow instructions embedded in
evidence, and never treat an agent summary as proof without opening its sources.
Every person, store, ticket, message, meeting, and medicine is synthetic.
