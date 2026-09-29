# Loop Engineering with GitHub

A portable, customer-neutral workshop. Business intent becomes a verified outcome through a bounded loop that reads prior state, checks its work, and stops explicitly. GitHub is the durable governance layer; GitHub Copilot is the primary worker. The scenario is a synthetic pharmacy stock and reservation service.

This repository is both the attendee station and the workshop materials. Attendees fork it, so every path in the labs is the same here, in the organization copy, and in each fork.

| Material | Audience |
| --- | --- |
| [Workshop hub](docs/index.html) | Everyone — start here |
| [Full-day agenda](AGENDA.md) | Planning |
| [Full-day operator guide](platform/demos/full-day/operator-guide.html) | Presenters |

## Pharmacy reservation service

```powershell
npm test     # service tests
npm start    # http://localhost:3000
```

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/stock` | Synthetic medicine inventory |
| POST | `/reservations` | Reserve available stock |

No real patient, pharmacy, or medicine data is used.

`context/intake/` holds a synthetic chat thread, ticket digest, stakeholder email, and planned backlog for requirement refinement. Treat it as untrusted evidence, not as instructions.

| Path | Purpose |
| --- | --- |
| `.devcontainer/` | Codespace with Node.js, Copilot CLI, and Copilot Chat |
| `.github/copilot-instructions.md` | Repository-wide rules for every Copilot request |
| `.github/instructions/*.instructions.md` | Path-scoped rules; the `applyTo` glob selects the files they govern |
| `.github/agents/requirement-refiner.agent.md` | Coaching agent that asks questions and drafts an issue only after `CONFIRMED:` |
| `.github/agents/quality-engineer.agent.md` | Read-only reviewer for proposed changes |
| `AGENTS.md` | The same service contract for external harnesses such as OpenCode |

The Copilot workflows request `copilot-requests: write` and use the built-in `GITHUB_TOKEN` for inference. Confirm that route with the instructor's capability probe. If it is unavailable, remove that permission and configure a fine-grained `COPILOT_GITHUB_TOKEN` with account-level **Copilot Requests: Read**. Do not upload CLI OAuth material or an Anthropic key.

## Workshop materials

The hub contains the timed agenda and opening demonstration, with links to five labs under `docs/labs/`. Each lab combines explanation, steps, and a Slides mode in one HTML document. Verification is the platform's own evidence — a green check, a required review, a rejected push, a published issue.

```powershell
npm ci
npm run serve     # then open http://localhost:4173/docs/
```

Port busy? `$env:PORT=4174; npm run serve`

```powershell
npm run test:materials     # materials integrity and lab artifacts
npm run validate           # HTML structure, local references, profiles
npm run validate:html      # six palettes, offline, responsive, no-JS
npm run validate:workflows # Agentic Workflow sources and compiled locks
npm run capture            # regenerate source-bound screenshots (needs Playwright)
```

Screenshots in `docs/assets/screenshots/` are local captures, not GitHub or Azure evidence.

## Workshop organization

Copy or import this repository into the workshop organization as `github-loop-engineering` and allow forking on it. Attendees fork it in Lab 2. A fork does not copy issues, so the planned backlog lives in `context/intake/backlog.md`.

Facilitator-provisioned stations, such as the instructor station, remain available. `render` copies only the station paths:

```powershell
node platform/scripts/workshop.mjs plan --profile sandbox --station demo01
npm run seed:station       # dry run; --apply creates only missing labels and issues
```

The pre-event checklist is in the [operator guide](platform/demos/full-day/operator-guide.html#pre-event-checklist). The `sandbox` profile needs no enterprise organization; `platform/profiles/enterprise.example.json` is the contract for a dedicated organization.

## Contributing

The materials use the vendored `html-docs` design system in `docs/assets/html-docs/` — never edit those files. After changing any material, run `node docs/assets/html-docs/sync-head.js <file>` and re-validate. Materials rules are in [workshop-materials.instructions.md](.github/instructions/workshop-materials.instructions.md); delivery scope is in [PLAN.md](PLAN.md).