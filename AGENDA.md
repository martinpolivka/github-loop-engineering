# Loop Engineering with GitHub

## From evidence to trusted outcomes and bounded recurrence

**Format:** Full-day technical workshop
**Time:** 09:00-16:00, including breaks and lunch
**Audience:** Engineering leaders, architects, developers, platform engineers, DevOps, and application security teams
**Scenario:** A synthetic retail stock and reservation service
**Learning rhythm:** See it, work with it, connect it

## Outcome

Participants apply the principles to one progressive engineering path:

```text
synthetic evidence
  -> confirmed feature and bug Issues
  -> two approved Goal Cards
  -> local and cloud-agent implementation loops
  -> two pull requests with handoff evidence; deep review of the feature PR
  -> deterministic and reasoning evidence
  -> signed test/prod OCI promotion and trusted delivery decision
  -> bounded Agentic Workflow next decision: triage source, pulse publication, unchanged replay
```

GitHub is the durable coordination and governance layer. GitHub Copilot is the primary coding harness. Agent output remains a proposal until deterministic checks and required human controls pass.

This is a principles presentation followed by five hands-on labs, not an
opening live end-to-end demo. Live outcomes depend on the station's access,
available product capabilities, and execution time. The lab guides provide
reference artifacts and explicitly labeled fallback paths; unavailable or
pending work must not be reported as completed.

All five labs are reading-only HTML guides with PDF printing. They have no
embedded slide mode; the English and Czech opening presentations remain separate.

## Current materials and scope

- **Presentation:** [English](docs/loop-engineering.en.html) and
  [Czech](docs/loop-engineering.cs.html), each with nine slides. The current
  narrative covers goal-driven engineering, the lifecycle before and after
  code, connected inner/outer loops, evidence before solutions, Goal Cards,
  and speed/ease/quality as outcome measures. It establishes principles;
  product walkthroughs belong in the labs.
- **Lab 1:** [From evidence to approved engineering intent](docs/labs/01-evidence-to-goal/index.html).
  Fork the repository, use a Codespace or local workspace, and approve the
  feature and bug Issues separately. The intake is a synthetic repository
  packet, not a live business-connector exercise.
- **Lab 2:** [Goal Cards and two coding loops](docs/labs/02-inner-loop/index.html).
  Approve and publish two complete Goal Cards, implement the feature locally,
  and delegate the UI bug to Copilot cloud agent. The cloud PR may still be
  in progress when the next lab starts.
- **Lab 3:** [Governed pull request](docs/labs/03-governed-pr/index.html).
  Compare both handoffs and deeply review the feature PR using CI, available
  Code Quality, native Copilot review, and prepared Goal/Documentation review
  workflows. Repair only evidenced findings and make a human merge decision.
  Review and merge the bug independently when it is ready.
- **Lab 4:** [Trusted delivery and operational readiness](docs/labs/04-trusted-delivery/index.html).
  Deploy prepared ARM resources into one trusted allocation, wire distinct
  test/prod federations, build once, sign and verify in test, and approve
  same-digest promotion with a different prod signature. Record READY or
  BLOCKED using actual evidence; application deployment to ACA is optional.
- **Lab 5:** [Agentic outer loop](docs/labs/05-agentic-outer-loop/index.html).
  Author one Issue-triage source in a draft PR and compile when the approved
  preview tooling is available. Manually run the prepared repository pulse,
  inspect its bot-owned publication, and replay unchanged evidence without
  another Issue write. Deployment-readiness authoring and changed-evidence
  reconciliation are optional extensions. Newly authored workflows stay
  unmerged and unexecuted; manual dispatch is not proof of the weekly schedule.

The [HTML agenda](docs/index.html) and its [one-page PDF](docs/LoopEngineeringWithGitHub.pdf) are
the attendee/customer schedule. This document records the current detailed
scope and limitations; it is not a list of future lab promises.

## Core schedule

| Time | Session | Participant outcome |
| --- | --- | --- |
| 09:00-09:45 | **Presentation: Loop Engineering with GitHub — principles and the complete loop** | Understand Goal Cards, inner and outer loops, evidence, measurement, and human authority. Establish the principles and trust model before applying them in the five hands-on labs. |
| 09:45-10:30 | **Lab 1: Evidence to engineering intent** | Fork the source repository, open a Codespace or local workspace, correlate the synthetic intake packet, and approve one feature Issue and one bug Issue without starting implementation. |
| 10:30-10:45 | **Break** | Recovery margin. |
| 10:45-11:45 | **Lab 2: Goal Cards and two agent loops** | Publish an approved Goal Card on each Issue, run the feature through a visible local assess-act-check-adjust loop, and assign the smaller bug to Copilot cloud agent. Inspect both PRs if ready; otherwise record the cloud session as IN PROGRESS. |
| 11:45-12:35 | **Lab 3: Governed pull requests** | Compare the available handoffs, deeply review the feature PR with deterministic CI, available Code Quality, and native/contextual reviews, respond to evidenced findings, and make human merge decisions. |
| 12:35-13:20 | **Lunch** | Pause; use linked reference artifacts if recovery is needed. |
| 13:20-14:10 | **Lab 4: Trusted delivery and operational readiness** | Agent-deploy reviewed test/prod resources in the allocated group, wire distinct federations, build/sign in test, approve same-digest prod promotion, and record readiness. ACA is optional. |
| 14:10-14:20 | **Break** | Reset for the final outer loop. |
| 14:20-15:00 | **Lab 5: Author and observe agentic outer loops** | Author bounded Issue triage, review its generated authority, and observe prepared pulse publication followed by unchanged-evidence no-op. Use original-repository recorded evidence when the live-path cap or access blocks execution. |
| 15:00-16:00 | **Bring the loop into your practice: tailored discussion** | Choose migration from existing tools, adoption and rollout, governance and operating model, or a focused combination according to the team's priorities. |

## Core artifacts and evidence

The supported live path targets the following artifacts. Record actual state
and use the guide's labeled recovery path when a capability or time limit
prevents completion:

- one fork that remains their station for the day;
- one evidence-backed feature Issue and one evidence-backed bug Issue;
- two Goal Cards with stable checks and stop conditions;
- one visible local-agent implementation loop and one asynchronous cloud-agent assignment with its actual session state;
- one feature PR and, when ready, one bug PR with independent handoff evidence;
- revision-bound deterministic CI and available Code Quality evidence;
- native Copilot code review plus independent documentation and Goal Card reviews, or the guide's explicitly labeled manual/source-bound alternatives;
- one OCI digest with test/prod ACR references, distinct verified Key Vault signatures, a prod approval record, and a READY or BLOCKED release decision;
- one attendee-authored Agentic Workflow source in a draft PR and its compiled lock when tooling is available;
- a prepared pulse publication and unchanged replay, each bound to its original repository, source SHA, run/attempt, and runtime-owned Issue; unavailable or pending execution is recorded explicitly, and source-only inspection never proves recurrence.

Lab 5 starts the first pulse run before local authoring and defers publication
of the authored PR until after replay, so backlog changes do not contaminate the
comparison. The core remains 40 minutes, with 15 minutes for observing/replaying
and a 20-minute total live-path cap from first dispatch. Queueing and inference
are not guaranteed to fit; the facilitator prepares a source-bound evidence
pair for recovery. Output caps are per run, not cross-run deduplication, and a
no-op still consumes inference and detector resources.

Tools, group allocation, access, approved base-image digest, IaC and release
workflow templates are prepared before the workshop. In Lab 4 participants
agent-deploy that template and confirm the test/prod identity mapping. Both
identities are Owner on the one group as a workshop shortcut, not production
least privilege. Required image signing takes priority over optional ACA or SRE.
READY requires a previously signed and verified rollback candidate and a named
operational owner. A newly created station without rollback evidence remains
BLOCKED even if the current image was signed successfully. A signed release
candidate is not proof of application deployment to production. SRE is an
optional discussion only, not an additional implemented lab.

## Concepts introduced in order

1. **Evidence before intent:** retrieved context is untrusted evidence, not instruction.
2. **Outcome before implementation:** the goal fixes observable checks, boundaries, caps, and terminal states.
3. **Inner loop before governance:** the participant first experiences agent-assisted engineering against a concrete goal.
4. **Outer loop before recurrence:** GitHub persists shared evidence, independent challenge, and authority around a revision.
5. **Trusted delivery before autonomy:** security and release controls remain deterministic or human-authorized.
6. **Recurrence last:** Agentic Workflows repeat a bounded evidence-and-recommendation function; they do not inherit merge or release authority.

## Platform profiles

The same learner concepts work in two profiles:

- **Sandbox:** public GitHub without a dedicated enterprise organization. Unsupported controls use a clearly labeled source review, recording, or instructor demonstration.
- **Station:** a dedicated enterprise organization with isolated repositories and centrally configured policy.

Profile differences are configuration, not duplicated course content. Preview, enterprise-only, unavailable, recorded, and simulated experiences are labeled where they appear.

## Tailored discussion: 15:00-16:00

Reserve the final hour for the audience's priorities rather than a mandatory
migration lecture or a sixth lab. Choose the emphasis before the workshop or
from questions raised during the day:

- **Migration from an existing solution:** map repositories, work tracking,
  pipelines, identities, and release evidence to a reversible migration or
  coexistence plan. Azure DevOps is one possible starting point, not a
  prerequisite or the only supported discussion.
- **Adoption and rollout:** choose a useful pilot, define accepted outcomes,
  reduce developer friction, and agree on measures of speed, ease, and quality.
- **Governance and operating model:** identify platform and engineering
  owners, agent permissions, review/approval boundaries, identity controls,
  budgets, and audit evidence.

Cover one emphasis deeply or combine selected questions. The intended output
is an agreed next step, named owner, and decision/evidence needed to proceed,
not a promise to execute a migration or deploy a production platform that day.
