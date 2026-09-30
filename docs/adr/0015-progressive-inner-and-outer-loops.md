# 0015: Progressive inner and outer loops

- Status: Superseded for domain and delivery by [ADR 0016](0016-retail-and-signed-test-prod-images.md); progression retained
- Date: 2026-10-01
- Supersedes: [ADR 0013](0013-attendee-forks-and-codespaces.md) and [ADR 0014](0014-evidence-to-approved-issue.md)

## Context

The previous workshop order began with Agentic Workflows and delayed repository
creation until Lab 2. Participants encountered permissions, budgets, safe
outputs, and governance before they had produced work that those controls could
govern. The evidence-to-Issue lab then jumped directly to Copilot cloud-agent
assignment, so the workshop did not teach the interactive coding loop in which
an engineer defines an outcome, observes a failed check, inspects a proposed
change, and decides whether to repair or stop.

The workshop needs to preserve its evidence-intake core, show a credible complete
platform result before the first break, fit the five-lab core journey between
09:00 and 15:00, and close adoption and migration by 15:30.

## Decision drivers

- Begin with a concrete engineering need rather than abstract platform policy.
- Teach the Copilot inner loop before the GitHub outer loop that governs it.
- Preserve one progressive synthetic pharmacy artifact chain across the day.
- Keep deterministic checks, reasoning reviews, and authority controls distinct.
- Use prepared platform controls so hands-on time goes to meaningful decisions.
- Support both Sandbox and Station profiles without duplicating learner content.
- Keep Agentic Workflows as the destination demo and final hands-on recurrence,
  not the first required lab.

## Options considered

1. Keep Agentic Workflows first and add a short coding exercise later.
2. Start with repository setup and direct cloud-agent assignment, then cover
   governance and delivery.
3. Show the complete loop in a 45-minute opening, then build it progressively:
   evidence and goal, interactive inner loop, governed PR, trusted delivery,
   and bounded Agentic Workflow recurrence.

## Decision

Use option 3.

The opening source repository contains the complete opening walkthrough and all prepared
controls. Attendees fork it in Lab 1 and keep one repository and story for the
day.

1. **Lab 1 - Evidence to engineering intent:** fork, Codespace or approved local
   clone, one cited brief, separate feature and bug classifications, and one
   explicit approval for each Issue write.
2. **Lab 2 - Goal Cards and two agent loops:** publish an approved Goal Card on
   each Issue before delegation. A local agent implements the feature through a
   visible assess-act-check-adjust loop; Copilot cloud agent receives the
   smaller bug at assignment time. Each path opens its own PR.
3. **Lab 3 - Governed pull requests:** compare the two handoffs, deterministic
   CI, centrally enabled Code Quality, native Copilot code review, independent
   Goal Card and documentation reviews, bounded repair, governance inspection,
   and human merge decisions.
4. **Lab 4 - Trusted delivery and operational readiness:** package the exact
   merged feature revision, run deterministic and smoke checks, record the
   artifact digest, wait at a GitHub Environment, and state READY or BLOCKED
   with rollback and ownership. Advanced security is a facilitator
   demonstration rather than an attendee license dependency.
5. **Lab 5 - Author agentic outer loops:** author bounded Issue-triage and
   deployment-readiness sources, review their generated authority, and inspect
   repository pulse as a scheduled reconciliation pattern. Deployment approval
   remains human.

The repository project skill is named `goal-card`. The name describes its
portable artifact rather than a runtime command. It designs the definition of
done immediately before the inner loop but does not start implementation.

The required chain contains two Issues, two Goal Cards, one visible local loop,
one asynchronous cloud loop, two PRs, deterministic and reasoning evidence, one
release rehearsal, two attendee-authored workflow sources, and one reviewed
recurring artifact. Parallel PRDs, requirements documents, and story
decompositions are optional extensions.

## Consequences

- Governance is experienced against participant-created work rather than taught
  as an isolated opening topic.
- Agentic Workflows remain visible in the opening payoff while their hands-on
  lab moves to the end, after participants understand the artifacts they read.
- The source repository must ship contextual review workflows, project skills,
  CI, Code Quality preflight, CodeQL, title hardening, release rehearsal,
  workflow source and lock, and complete recovery artifacts.
- The opening grows to 45 minutes; the 09:00-15:00 core still includes five
  labs and two breaks plus lunch, followed by a 30-minute adoption close.
- Adoption discussion and Azure DevOps migration run from 15:00 to 15:30.
  Extended deliveries may add one hour for migration depth.
- Prior ADR history remains intact, but Lab numbers and cloud-assignment
  assumptions in ADRs 0013 and 0014 are historical rather than current.

## Validation

- Content tests verify the five directory names, progressive dual-Issue artifact
  chain, Lab 1 fork, Lab 2 local and cloud loops, and both Lab 5 authored sources.
- Platform tests verify the intake packet, project skill, review agents, PR
  template, deterministic workflows, and station contents.
- Solution integration runs the Lab 2 reference test against the reference
  implementation.
- The facilitator rehearses all five labs and the timed opening from a clean fork
  on the target GitHub host.
- Educator, student-path, presenter, platform, and security reviews inspect the
  rendered materials and real validation evidence.

## Assumptions

- Supported Copilot surfaces continue to load open-standard project skills from
  `.agents/skills/`.
- Codespaces or an approved local clone is available for the interactive inner
  loop.
- Agentic Workflow compilation and execution may be unavailable; source-only
  review and recorded execution remain explicitly labeled fallbacks.

## Revisit triggers

- The interactive coding path cannot be completed reliably in 60 minutes.
- Fork or Codespace policy prevents participants from creating isolated stations.
- Project skills change location or supported surfaces.
- Agentic Workflows become generally available with a materially different
  source, lock, permissions, or safe-output model.
- Educator review shows that the opening demo overwhelms rather than clarifies
  the progressive lab journey.
