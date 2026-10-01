# 0019: Separate the demo application from workshop tooling

- Status: Accepted
- Date: 2026-10-01
- Supersedes in part: [0012](0012-one-full-day-html-journey.md), [0017](0017-current-workshop-only-platform.md), and [0018](0018-standalone-principles-and-agenda.md), specifically the root service layout, retained local loop adapters, and separate operator guide.

## Context

The repository is both the attendee's forkable service and the workshop's source.
Root application directories mixed with platform scripts, material checks, and
optional local loop examples obscured the required five-lab path.

## Decision drivers

Keep the application dependency-free, retain trusted delivery and public API
behavior, make material authoring discoverable, and remove unused execution
models without losing historical decisions or active evidence.

## Options considered

Delete platform tooling; retain the mixed root layout; or separate the
application, workshop tooling, and published materials by responsibility.

## Decision

Use `demo-app/` for source, storefront, application tests, OpenAPI contract,
package manifest, and Docker context. Root `npm start` and `npm test` forward
to the application.

Use `workshop/` for Azure templates, profiles, synthetic telemetry fixtures,
Azure/preflight/materials tools, and integrity tests. Keep Node.js ES modules:
there is no additional Python toolchain or service dependency.

Use `docs/` for the agenda, standalone English presentation, labs, workshop
ADRs, and authoring templates. A Czech presentation can be added later.
Existing ADRs concern workshop architecture and governance, not application
implementation; preserve their historical paths rather than rewriting history.
OpenAPI belongs with the application. Keep synthetic intake under `context/`.

Remove the separate facilitator HTML and the optional local loop/state/intake/
issue adapters and their contract/test. GitHub Agentic Workflows remain the
recurring execution model. Retain active telemetry because showcase-signal uses
it. Do not introduce mandatory PRD or contract-authoring templates: the current
labs use approved Issues, Goal Cards, and the existing OpenAPI contract.

## Consequences

Participants still fork one repository. Root developer commands remain stable,
but direct file paths and Docker context change. Workflow sources and compiled
locks, instructions, ownership, skills, lab artifacts, and integrity checks must
move together. Release permissions and approval boundaries do not change.
Facilitator prerequisites, timing, and recovery remain in the labs and agenda.
The user also chose to retain the removal of the obsolete root `PLAN.md`; it is
not a required authoring or validation input.

## Validation

Application tests, layout and entrypoint checks, release-tooling tests, reference
solution checks, workflow compilation/validation, standalone HTML validation,
and refreshed source-bound browser captures cover the new structure.
Live Azure writes are outside this repository-layout change.

## Assumptions

The demo is one retail service with a storefront, not independent microservices.
The platform owner has approved the necessary configuration path updates.

## Revisit triggers

Introduce a service-specific ADR directory or PRD template only when new labs
or independently deployable services actually require them.
