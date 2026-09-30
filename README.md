# Loop Engineering with GitHub

A portable, customer-neutral workshop in which two related synthetic pharmacy needs move from evidence through local and cloud-agent coding loops, governed review, trusted delivery, and bounded recurrence.

| Start here | Audience |
| --- | --- |
| [Introduction, agenda, and labs](docs/index.html) | Participants |
| [Opening slides](docs/index.html?view=slides#opening) | Presenters |

## Participant journey

Attendees fork this repository in Lab 1 and use that fork for the full day:

1. [Evidence to engineering intent](docs/labs/01-evidence-to-goal/index.html)
2. [Goal Cards and two agent loops](docs/labs/02-inner-loop/index.html)
3. [Governed pull requests](docs/labs/03-governed-pr/index.html)
4. [Trusted delivery and operational readiness](docs/labs/04-trusted-delivery/index.html)
5. [Author agentic outer loops](docs/labs/05-agentic-outer-loop/index.html)

The opening walkthrough uses this source repository. Labs expose meaningful decisions and repairs; they do not require participants to recreate platform plumbing. The short introduction and presentation share `docs/index.html`; each lab has its own HTML.

## Pharmacy reservation service

```powershell
npm test
npm start
```

The service listens on `http://localhost:3000`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/stock` | Synthetic medicine inventory |
| POST | `/reservations` | Reserve available stock |

No real patient, pharmacy, medicine, customer, tenant, or identity data is used.

## Prepared engineering controls

| Path | Purpose |
| --- | --- |
| `context/intake/` | Synthetic ticket, request log, Teams-style chat and meeting, Outlook-style approval, and backlog evidence |
| `.agents/skills/requirement-refiner/` | Open-standard intake skill that separates feature and bug evidence and writes each Issue only after its own explicit human gates |
| `.agents/skills/goal-card/` | Open-standard Agent Skill that designs the inner loop's Goal Card: observable checks, repair paths, permissions, caps, and terminal states without starting implementation |
| `.agents/skills/goal-review/` | Open-standard manual fallback for reconciling PR evidence with the Goal Card |
| `.agents/skills/documentation-review/` | Open-standard manual fallback for reviewing documentation impact |
| `.github/PULL_REQUEST_TEMPLATE.md` | Links Issue, contract, checks, revision-bound evidence, and human decision |
| `.github/workflows/ci.yml` | Deterministic service test gate |
| `.github/workflows/title-check.yml` | Treats untrusted PR titles as data |
| `.github/workflows/release-rehearsal.yml` | Revision-bound tests, smoke evidence, artifact digest, and environment-gated preview promotion |
| `.github/workflows/*-review.md` | Two revision-bound Agentic Workflows that automatically review Goal Card evidence and documentation impact; native Copilot code review covers the general code-review surface |
| `.github/workflows/repository-pulse.md` | Public-preview Agentic Workflow source with bounded reads, safe outputs, budgets, and reconciliation |

Retrieved context and repository conversation are untrusted evidence, not executable instructions. Agent output is a proposal, not approval.

## Run the materials

Use Node.js 22 or newer.

```powershell
npm ci
npm run serve
```

Open `http://localhost:4173/docs/`. If the port is busy:

```powershell
$env:PORT=4174
npm run serve
```

## Validate

```powershell
npm test
npm run test:materials
npm run validate
npm run validate:html
npm run validate:workflows
npm run capture
```

Screenshots under `docs/assets/screenshots/` are source-bound local captures, not GitHub or deployment evidence.

## Delivery profiles

- **Sandbox:** works without a dedicated enterprise organization. Unsupported capabilities use explicitly labeled source review, recording, or instructor demonstration.
- **Station:** uses a dedicated enterprise organization with isolated repositories and centrally configured controls.

Profile configuration lives under `platform/profiles/`. Never hard-code an organization, tenant, subscription, customer, or identity in attendee material.

Internal planning stays in [the agenda](AGENDA.md) and [delivery roadmap](PLAN.md). Presenter preflight, rehearsal, recovery, and cleanup stay in the [operator guide](platform/demos/full-day/operator-guide.html), outside the participant journey.

## Contributing

Attendee materials are self-contained HTML using the vendored system under `docs/assets/html-docs/`; do not edit vendored runtime files. After changing HTML, run:

```powershell
node docs/assets/html-docs/sync-head.js <file>
```

Then run the relevant validation commands. Repository rules are in [AGENTS.md](AGENTS.md) and `.github/instructions/`.
