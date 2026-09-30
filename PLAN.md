# Loop Engineering with GitHub - Delivery Roadmap

## 1. Purpose

This repository authors one customer-neutral full-day workshop around a synthetic pharmacy stock and reservation service. It is also the source repository attendees fork, so the opening demo, agent configuration, service baseline, checks, labs, recovery artifacts, and platform contracts must be complete before delivery.

The central proposition is:

> Use an inner loop to reduce implementation uncertainty, an outer loop to coordinate evidence and authority, and bounded Agentic Workflows only where repeated repository operation is valuable.

## 2. Learning architecture

### Inner loop

```text
goal -> assess -> act -> check -> inspect -> adjust or stop
```

The Goal Card fixes the finish line immediately before implementation. Failed checks select the next action. Repair caps and explicit terminal states prevent endless prompting or silent scope growth.

### Outer loop

```text
Issue -> goal -> branch -> PR -> checks and reviews -> merge decision
      -> artifact and environment evidence -> observation -> next decision
```

GitHub persists the shared artifacts. Deterministic controls execute known invariants; reasoning reviews interpret context; policy and humans authorize protected transitions.

### Agentic recurrence

A recurring workflow reads prior state, reconciles stable work identity, gathers bounded evidence, and uses declared safe outputs. It may recommend a next decision. It does not gain code, merge, deployment, or assignment authority merely because it runs repeatedly.

## 3. One progressive participant story

The workshop deliberately keeps the required chain small:

1. Two synthetic tickets, a request log, Teams-style conversation and meeting, Outlook-style approval, and backlog evidence become one cited brief with a feature and a bug kept separate.
2. Separate confirmation and repository-qualified approvals authorize one feature Issue and one bug Issue in the participant's fork.
3. The `goal-card` project skill turns each confirmed Issue into an approved Goal Card published before implementation.
4. A visible local agent follows the feature Goal Card through assess-act-check-adjust and opens a PR. Copilot cloud agent receives the complete bug Goal Card at assignment time and opens a second PR.
5. Lab 3 compares both handoffs. Deterministic CI and Code Quality run separately from native Copilot code review and PR-triggered Goal Card and documentation reviews before human merge decisions.
6. Lab 4 packages the exact merged feature revision, runs tests and smoke checks, records an artifact digest, waits at a GitHub Environment, and produces a reversible READY or BLOCKED decision without claiming production deployment.
7. The opening shows a bounded recurring repository pulse. In Lab 5, attendees author Issue-triage and deployment-readiness workflows, then inspect the pulse as a scheduled reconciliation pattern.

Do not create parallel required PRDs, requirements documents, user-story documents, and goal files for this single feature. Larger requirement decomposition and spec-driven development are extensions after participants understand the core chain.

## 4. Schedule and chapter outcomes

| Time | Duration | Outcome |
| --- | ---: | --- |
| 09:00-09:45 | 45 min | Opening walkthrough shows the finished system and explains inner loop, outer loop, recurrence, controls, profiles, and the day's artifact chain. |
| 09:45-10:30 | 45 min | Lab 1 creates the fork and two approved evidence-backed Issues. |
| 10:30-10:45 | 15 min | Break and recovery. |
| 10:45-11:45 | 60 min | Lab 2 creates two Goal Cards, completes one local loop, starts one cloud loop, and produces two PRs. |
| 11:45-12:35 | 50 min | Lab 3 compares and governs both PRs with deterministic and reasoning evidence. |
| 12:35-13:20 | 45 min | Lunch. |
| 13:20-14:10 | 50 min | Lab 4 binds the merged revision to tested bytes, environment authority, and rollback evidence. |
| 14:10-14:20 | 10 min | Break. |
| 14:20-15:00 | 40 min | Lab 5 authors triage and deployment-readiness workflows and inspects scheduled reconciliation. |
| 15:00-15:30 | 30 min | Adoption discussion and Azure DevOps migration; extended deliveries add one hour. |

Every chapter follows **see it - work with it - connect it**. The opening walkthrough carries the strongest platform message before the first break. Required hands-on work is guided and bounded; optional depth stays in extensions.

## 5. Prepared source-repository baseline

The repository must contain before attendees fork it:

- the dependency-free Node.js service and deterministic tests;
- the complete synthetic intake packet and planned backlog;
- feature and bug Issue forms;
- the open-standard `requirement-refiner`, `goal-card`, `documentation-review`, and `goal-review` project skills;
- the PR template;
- deterministic CI, hardened title handling, release rehearsal, automatic PR review Agentic Workflows, and recurring-workflow source and lock files;
- reference Issue, goal, test, implementation, workflow, security, and release artifacts;
- presenter preflight, reset, cleanup, prepared states, and capability-specific fallbacks.

The source repository supports the opening walkthrough. There is no separate hidden implementation whose concepts differ from the attendee fork. `docs/index.html` is only the short introduction, agenda, and lab directory, with presentation mode in the same file. Detailed procedures stay in the labs and internal operator material.

## 6. Trust architecture

Keep these categories separate in both code and teaching:

| Category | Examples | Claim |
| --- | --- | --- |
| Deterministic quality | Unit and integration tests, syntax, workflow validation, linting | A declared invariant passed on a named revision. |
| Security and delivery | CodeQL, Code Quality, push protection, immutable action pins, artifact identity, environments, OIDC | A specific control observed or constrained a specific transition. |
| Reasoning | Intake refinement, native Copilot code review, goal review, documentation impact, triage | An advisory interpretation that requires evidence and can be wrong. |
| Authority | Repository rules, required review, environment approval, owner decision | An authorized actor may advance protected state. |

Agent output is untrusted until these controls apply. Issue, PR, review, and repository text are also untrusted inputs to workflows.

## 7. Platform profiles

One implementation supports:

- **Sandbox:** no dedicated organization or enterprise license assumption. Use public repositories where necessary for native security capability. Label missing enforcement and use source-bound or instructor evidence.
- **Station:** one isolated repository per station or team inside a dedicated enterprise organization, with centrally enabled Code Quality, identity, policy, security, Actions, and cleanup.

Organization, tenant, subscription, repository prefix, team, environment, and identity values come from configuration. No attendee-facing material hard-codes them.

## 8. Reliability and recovery

| Failure | Primary path | Honest fallback |
| --- | --- | --- |
| Copilot unavailable | Live plan and edit | Continue from reference test or implementation; inspect and verify the diff. |
| Codespace unavailable | Browser Codespace | Use an approved local clone with Node.js 22+. |
| Agentic Workflow compiler unavailable | Compile source and lock in one PR | Keep source PR draft and review the proposed contract without claiming execution. |
| Preview engine unavailable | Manual live run | Use the pre-captured run and label it recorded evidence. |
| Actions delayed | Current PR checks | Use a completed prepared run tied to its original SHA; do not transfer the result to the current PR. |
| Code Quality unavailable | Native PR quality findings | Use deterministic CI and label Code Quality unavailable; do not substitute a reasoning review. |
| Advanced security unavailable | Facilitator public-repository demo | Use only its recorded or source-bound evidence and never transfer the result to the attendee PR. |
| Enterprise enforcement unavailable | Station ruleset | Inspect configuration or instructor demo and record the sandbox gap. |
| Deployment unavailable | Governed environment | Analyze release evidence and design the boundary without claiming deployment. |

Recovery never weakens the control being taught and never prints a synthetic pass result.

## 9. Delivery readiness

Before each workshop:

1. Run local material, HTML, workflow, and browser validation.
2. Run presenter preflight against the selected profile.
3. Confirm forking, Codespaces or local clone, local and cloud Copilot, Actions, review agents, Code Quality, the preview environment, and Agentic Workflow capability.
4. Rehearse all five labs from a clean fork on the target GitHub host.
5. Capture the exact revision, account, repository, capability outcome, and fallback used.
6. Run educator, student-path, teacher-path, technical, and security reviews against real artifacts.
7. Keep cleanup dry-run first and scope deletion only to workshop-owned resources.

## 10. Adoption and Azure DevOps migration

The migration discussion runs from 15:00 to 15:30 so the five-lab 09:00-15:00 core remains complete and the full workshop has a deliberate adoption close. Start migration planning from loops and control boundaries:

- inventory repositories, pipelines, boards, packages, identities, approvals, secrets, environments, evidence, and owners;
- classify deterministic gates separately from reasoning automation;
- establish repository and team boundaries before introducing coding agents;
- convert service connections to short-lived identity where supported;
- migrate product slices with reversible coexistence, measured exit criteria, and named stop authority;
- add AI pilots only where goals are observable, checks are fast, consequences are bounded, and human attention is available.

Extended deliveries add one hour for migration inventory, Actions Importer output, coexistence design, and wave planning.
