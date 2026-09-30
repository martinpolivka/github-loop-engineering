# 0013: Attendee forks and Codespaces for Lab 2

- Status: Superseded by [ADR 0015](0015-progressive-inner-and-outer-loops.md)
- Date: 2026-09-29
- Generated-station tooling retired by [ADR 0017](0017-current-workshop-only-platform.md); attendee forks remain the creation path.

## Context

Lab 2 assumed a facilitator-provisioned station repository per attendee, seeded
with backlog issues, and a laptop with Copilot already installed and the station
cloned. Provisioning one repository per attendee is slow, and laptop setup was
the most common reason attendees lost time. The lab also used a Project board
step that added clicks without adding learning.

## Decision drivers

- Attendees start in minutes from a browser, with no local installation.
- Each attendee owns an isolated repository for their pull requests.
- The facilitator keeps one read-only source repository, with no copy to publish.
- The same flow works in the sandbox profile and a dedicated organization.
- Delegation to Copilot starts from the evidence-backed Issue.

## Options considered

1. Facilitator provisions and seeds one station per attendee (previous model).
2. Attendees create their own repository from a template repository.
3. Attendees fork one source repository into the workshop organization and open
   the fork in a GitHub Codespace.
4. As option 3, but the source repository is rendered from a template kept inside
   the workshop materials.

## Decision

Use option 3 with this repository as the source. The station lives at the
repository root: `src/`, `test/`, `public/`, `context/intake/`, `.agents/skills/`,
`.devcontainer/` and the service workflows. Workshop materials stay in `docs/`,
`platform/`, `tests/` and `templates/`. The organization copy of this repository is
the fork source, and attendees fork it as `github-loop-engineering-NN`. Every
path in the labs is therefore identical in this repository, the organization
copy and each fork. `npm test` runs the service tests and
`npm run test:materials` runs the materials suite. The devcontainer installs
Node.js, Copilot CLI and Copilot Chat and runs `npm test` on creation. A local
clone remains the documented alternative.

Option 4 was implemented first and rejected: the rendered copy and the materials
repository drifted, and paths differed between them.

A template repository was considered first. Forks were chosen so that attendees
start from one visible upstream that the facilitator controls. The lab handles
the fork caveats explicitly:

- Forks start with Actions and Issues disabled, so Step 1 enables both.
- Pull requests default to the upstream repository, so the Codespace runs
  `gh repo set-default "$GITHUB_REPOSITORY"` and browser flows select the fork as
  the base repository.
- Forks do not copy issues, so the planned backlog lives in
  `context/intake/backlog.md`, which the intake agent can read.

At the time of this decision, Lab 2 delegated implementation by assigning the
approved Issue to Copilot. ADR 0015 later moved the fork to Lab 1 and made the
interactive inner loop the required implementation path.

## Consequences

- Organization and enterprise settings must allow members to fork private
  repositories into the workshop organization, and to use Codespaces and
  Copilot cloud agent there. Forks in a managed user's personal namespace may
  lack both, so policy should keep private forks inside organizations. These are
  pre-event checks, not lab steps.
- Forks also carry the workshop materials. They are small and read-only for
  attendees, and `.github/instructions/workshop-materials.instructions.md`
  scopes the materials rules to their paths so they do not steer station work.
- The organization copy must be refreshed from this repository before each
  delivery.
- The attendee administers their fork, so branch protection is not
  facilitator-controlled there. Later labs that depend on enforced protection
  keep their existing capability checks.
- Facilitator provisioning and issue seeding remain available for stations
  that need them, such as the instructor station; `workshop.mjs render` copies
  only the station paths from the repository root.
- The then-current Lab 1 still described a prepared station and required a
  later curriculum redesign.

## Validation

- `tests/platform.test.mjs` covers the station layout at the root, the
  devcontainer, and the backlog file matching the seeded backlog.
- The Lab 2 artifacts are exercised by the solution integration tests.
- A rehearsal fork with an attendee-like account is required before delivery.

## Assumptions

- Copilot cloud agent creates a pull request when assigned an Issue in a
  repository where it is enabled (validated against GitHub documentation on
  2026-09-29).
- Workflow runs triggered by Copilot commits may need **Approve and run
  workflows**.

## Revisit triggers

- Forks cannot be created inside the workshop organization.
- Codespaces or Copilot cloud agent is unavailable on attendee forks.
- Attendees need facilitator-enforced protection from the first lab.

Related: [ADR 0014](0014-evidence-to-approved-issue.md).