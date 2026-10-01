# Loop Engineering with GitHub

This workshop follows a synthetic retail reservation service from evidence and agent-assisted coding through governed review, trusted delivery, and bounded automation.
Start with the [HTML workshop guide](docs/index.html), which contains the agenda and links to all five labs.

The repository separates three responsibilities:

| Directory | Purpose |
| --- | --- |
| `demo-app/` | Dependency-free retail service, storefront, application tests, OpenAPI contract, and Docker build context. |
| `docs/` | Agenda, standalone presentations, five labs, workshop architecture decisions, and authoring templates. |
| `workshop/` | Azure templates, capability profiles, synthetic telemetry fixtures, tooling, and workshop integrity tests. |

Run `npm start` and `npm test` from the root for the demo application, or run
its commands directly in `demo-app/`. Root development dependencies are for
workshop validation only; the application needs no package installation.
Use `npm run test:materials` for workshop and release-tooling checks.
`context/intake/` remains the synthetic evidence packet for Lab 1.

To view the materials locally, use Node.js 22 or newer:

```powershell
npm ci
npm run serve
```

Open `http://localhost:4173/docs/` and follow the agenda into each lab. The hub
contains only the agenda and navigation; the
[English principles presentation](docs/loop-engineering.en.html) is separate.
Each HTML embeds its styles and scripts and works without an assets directory
or server. Links between the agenda, labs, and artifacts still need those sibling
files. In each lab, **Slides** switches between reading and presentation views.

Material authoring and `npm run validate:html` use the globally installed
`html-docs` skill, not a vendored copy. Set `HTML_DOCS_SKILL` to its directory
if it is not under `~/.copilot/skills/html-docs`. `npm run capture` writes
source-bound review screenshots to ignored `.workshop/screenshots/`.
