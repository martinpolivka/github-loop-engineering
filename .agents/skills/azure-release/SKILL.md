---
name: azure-release
description: Guide one retail workshop station from its trusted Azure resource-group allocation through reviewed IaC, test/prod federation, and a signed OCI image promotion. Do not create resource groups or bypass approvals.
---

# Azure release station

Prepare and verify one student's Azure station; do not invent authorization.
The lab allocator has already assigned ONE resource group. Test and prod use
different tagged resources and managed identities INSIDE that group.

## Intake and ownership

1. Read the participant's trusted allocation output and resolve the current
   fork's exact GitHub host, nameWithOwner, repository ID, and owner ID.
2. Obtain the exact subscription ID, resource group, and allocation ownership
   tag name/value from the allocator output or the facilitator. Do not infer a
   group from a subscription listing, the student's name, Issue text, or a tag
   that you added yourself.
3. Read `workshop/azure/oci.example.json` and `workshop/azure/retail-environments.json`.
   Ask focused questions for resource prefix, the correct prod reviewer, and
   optional ACA. Copy a concrete config to ignored `.workshop/azure-release.json`.
   Leave ACA off unless explicitly chosen.
4. Show the exact existing group and all proposed resources and costs. Explain
   that BOTH pipeline identities receive Owner on this group, as a deliberately
   broad workshop shortcut. Tags and different identities are NOT Azure
   authorization isolation. Production would use scoped data-plane roles,
   separate trust boundaries, and tighter approval controls.

## Review before resource creation

- Use `node workshop/tools/azure/oci-platform.mjs plan --config .workshop/azure-release.json`.
  Plan is offline and makes no changes.
- Check Azure and GitHub login identities without printing tokens. The operator
  needs resource creation and role assignment rights on the allocated group.
- Confirm Key Vault network access with the facilitator. GitHub-hosted runners
  need an authenticated public endpoint unless a private-network runner is
  prepared. `allowPublicVaultAccess` defaults to false: enable it only after
  explicit owner approval for these synthetic workshop vaults. Preserve RBAC,
  non-exportable keys and platform network policies; never bypass an enforced
  private-network policy or silently open existing vaults.
- Use the facilitator-approved `docker.io/library/node:24-alpine@sha256:...`
  base reference. Never silently replace it with a tag.
- Request separate explicit permission for `what-if`, then run
  `node workshop/tools/azure/oci-platform.mjs what-if --config .workshop/azure-release.json`.
- Inspect the ARM what-if. Only incremental deployment inside the exact group
  is permitted. Stop on unrelated modifications/deletions, existing foreign
  resources, incompatible policies, unsupported providers, or excess scope.
- After the person approves both costs and the workshop Owner-role shortcut,
  set `allowPaidResources` and `allowWorkshopOwnerRoles` to true in the local
  config. Run `deploy ... --apply` only after a separate explicit write approval.
  Observe deployment state and actual errors; a submitted deployment is not
  success. Retain the exact outputs.

## Student-owned federation and workflow mapping

1. Show the two managed identities and two environment subjects:
   `...:environment:workshop-test` and `...:environment:workshop-prod`.
   Resolve immutable IDs; never fabricate a legacy name-only subject.
2. Verify the host's actual OIDC issuer, including GHE.com-specific issuer
   policy. Do not guess a GitHub.com issuer for a GHE.com station.
3. Explain GitHub `workshop-test` vs protected `workshop-prod`, different client
   IDs, registry hosts, vaults, certificates, and variable scopes. Ask the
   student to confirm this mapping; prod requires a different human reviewer.
4. Show the intended GitHub and Azure writes, request separate permission, and
   run `node workshop/tools/azure/oci-platform.mjs wire --config .workshop/azure-release.json --apply`.
   It preserves compatible protections and refuses incompatible settings.
5. Run `preflight` with the same config. Read back issuer, audience, subjects,
   environment branch/reviewer protections and variables. Preflight is setup
   evidence, not proof of an actual image signature or release.
6. Use the already prepared `.github/workflows/release-rehearsal.yml`. Do not
   generate a new release workflow, broaden permissions, or grant runtime code
   the Owner pipeline identity.

## Stop and recover

Never create/delete/rename the group, attach a client secret, export a private
key, enable ACR admin passwords, turn strict verification into audit, change
platform policies, or claim test/prod labels enforce Azure isolation.

On RBAC propagation, report the actual failure, wait once up to two minutes
with approval, and retry the same operation once. Do not loop indefinitely or
grant wider roles. Cap resource deployment at 15 minutes and federation wiring
at eight minutes; use the facilitator's
prepared station when the cap is reached and label whose evidence is used.
Cleanup belongs to the allocator; retain the release evidence first.

ACA is optional: same image, one API and same-origin frontend, one ephemeral
replica, no database. A separate runtime identity gets AcrPull, never Owner.
Azure SRE is an optional mention, not a task this skill starts or configures.
