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

The Codespaces devcontainer includes Azure CLI for Lab 4, with Bicep installation
disabled because the lab uses prepared ARM templates. Container creation runs
`az version && npm test`; neither check requires an Azure login.
If `az` is missing in an existing Codespace, first update the fork and pull the
current `.devcontainer/devcontainer.json`, then run **Codespaces: Rebuild
Container** from the VS Code Command Palette. Verify `az version` in the
Codespace terminal before starting Lab 4.

To view the materials locally, use Node.js 22 or newer:

```powershell
npm ci
npm run serve
```

Open `http://localhost:4173/docs/` and follow the agenda into each lab. The hub
contains only the agenda and navigation, with a downloadable
[agenda PDF](docs/LoopEngineeringWithGitHub.pdf). The opening principles presentation is separate,
available in [English](docs/loop-engineering.en.html) and
[Czech](docs/loop-engineering.cs.html); hands-on demonstrations follow in the labs.
Each HTML embeds its styles and scripts and works without an assets directory
or server. Links between the agenda, labs, and artifacts still need those sibling
files. Labs are reading-only guides with collapsible steps, copyable commands,
and **PDF** printing. Slide mode belongs only to the separate opening presentations.

Material authoring and `npm run validate:html` use the vendored
`html-docs` skill in `.agents/skills/html-docs`; no global skill installation
is required. Set `HTML_DOCS_SKILL` to explicitly use another complete skill
directory. See [the vendoring record](.agents/skills/html-docs/VENDORED.md)
for the upstream revision and update procedure. Skill discovery is host-specific;
restart or reload an existing agent session if it has not discovered the skill.

Regenerate `docs/LoopEngineeringWithGitHub.pdf` from the self-contained agenda HTML after agenda
changes using the vendored skill:

```powershell
node .agents\skills\html-docs\assets\export-pdf.js docs\index.html --only read
if ($LASTEXITCODE -eq 0) { Move-Item docs\index.pdf docs\LoopEngineeringWithGitHub.pdf -Force }
```

During editing, export the changed HTML and run a targeted smoke check:

```powershell
npm run check:html -- docs\loop-engineering.en.html
```

This checks static references, offline runtime, every slide at 1280x720, and
light/dark blue. It writes no screenshots, manifest, or PDF. It is intentionally
not the full accessibility, appearance, interaction, and print certification.
Run `npm run test:html-smoke` when changing the smoke checker; it verifies that
intentional overflow, broken images, and broken navigation are rejected.

At review completion, before publication, or after shared runtime or validation
changes, run `npm run validate:html` and `npm run test:browser`. Both preserve
the full matrix and run independent jobs concurrently, capped at eight workers
by default. Canonical validation uses the headless browser from the pinned
Playwright revision when installed, otherwise that revision's full Chromium;
`PLAYWRIGHT_CHROMIUM` remains an explicit override. Use `-- --jobs 1` for serial diagnosis or a smaller `--jobs` value
on a constrained machine. For selected full HTML checks, pass document paths
after `--`.

Run `npm run capture` only when refreshing milestone screenshot evidence.
It already runs the full browser checks, so do not run `test:browser` again
for the same revision. It writes source-bound screenshots and a manifest to
ignored `.workshop/screenshots/`. The manifest binds screenshots to exact
sources; it is not an HTML quality check and is not required for edit-time smoke.
Each canonical document job has a 120-second timeout and reports failures rather
than treating partial output as a pass.
