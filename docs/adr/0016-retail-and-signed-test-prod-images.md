# 0016: Retail station and signed test/prod OCI promotion

- Status: Accepted
- Date: 2026-09-30
- Supersedes: [ADR 0015](0015-progressive-inner-and-outer-loops.md), for domain and delivery implementation
- Historical-demo retention superseded by [ADR 0017](0017-current-workshop-only-platform.md).

## Context

The requested generic e-shop migration had not been implemented: the application,
intake, Goal Cards, labs and release archive still consistently used pharmacy.
The delivery lab built a local archive and exercised an approval, but did not
publish a secured OCI image to Azure. The existing lab allocator provides only
one resource group per participant; changing its allocation model is out of scope.

## Decision drivers

- Keep the dual Issue/local-cloud loop and avoid pre-solving either exercise.
- Replace clinical connotations with simple retail inventory/reservations.
- Secure exact OCI bytes, not just a mutable version tag.
- Teach two federated identities and a real test-to-prod approval transition.
- Let students agent-deploy prepared IaC without installation or handwritten cloud plumbing.
- Respect the one-group allocator and label the requested broad Owner roles honestly.
- Prioritize image security over running a cloud application; no database.

## Options considered

1. Keep the pharmacy archive rehearsal.
2. Build a distributed e-shop and require ACA deployment for every learner.
3. Use one modular retail application, prepared group-scoped ARM templates,
   separate tagged test/prod registries/vaults/identities, and signed same-digest
   OCI promotion. Make ACA optional.

## Decision

Use option 3. Catalog, inventory, reservation rules, HTTP API and same-origin
frontend remain one dependency-free Node.js deployment. Both original learning
tasks remain: a missing available-product suggestion and hidden partial-stock
quantity in the storefront. A baseline OpenAPI describes current responses.

Lab 4 uses `azure-release` to read the trusted allocation, review an ARM what-if,
approve costs and Owner-role effects, and deploy incrementally in that existing
group. The student confirms two immutable environment subjects and variable
scopes, then approves their wiring. Test and prod use different registries,
vaults, signing certificates, and managed identities, with `Environment` tags.
Both pipeline identities intentionally receive Owner on the same group at the
workshop owner's request. This is not least privilege or authorization isolation;
production requires narrower roles and stronger trust boundaries.

The release workflow builds once without Azure credentials, runs deterministic
tests and container smoke, publishes/signs/verifies by digest in test, waits at
the protected prod Environment, re-verifies the test publisher, copies the exact
manifest with ORAS, and signs/verifies with the prod publisher. OIDC replaces
client secrets. Notation implements Notary Project; deprecated Notary v1/Docker
Content Trust is not used. Self-signed non-exportable workshop certificates are
explicit pinned trust roots, not production PKI.

Optional ACA runs the same image by digest, with a separate AcrPull-only runtime
identity, consumption resources and at most one ephemeral replica. The API and
frontend are same-origin; optional explicit CORS never uses credentialed wildcards.
Stock resets on restart. Azure SRE is only an optional mention, with no setup guide.

## Consequences

- Azure CLI, provider registration, quota, allocation tags and access must be
  prepared before Lab 4. Agent-led deployment has a 15-minute cap, wiring eight.
- The default lab requires real image security, not cloud runtime availability.
- Lab 5 reasons over run/attempt, test/prod digests, signers and prod approval,
  without signing, deploying, querying Azure or granting release authority.
- No group creation/deletion is added to the OCI helper or existing allocator.
- Historical pharmacy demos and recorded evidence remain byte/source-bound and
  explicitly separate from the current retail workshop. Older ADRs stay history.
- No signing claim is inferred from a digest, green unrelated run, certificate,
  source file or local preflight.

## Validation

Service tests protect domain mapping, unchanged JSON shapes/statuses, seed
isolation, missing feature, and CORS behavior. Materials tests cover the
reference implementation, trusted evidence guards, strict pinned trust roots,
allocation/what-if boundaries, federated subjects, approval configuration,
template shape, runtime identity, workflow pins and no rebuild during promotion.
Browser captures bind the retail UI and new lab content to current sources.
Full readiness additionally requires one live allocated-group deployment and
OCI signing/promotion run; local tests do not establish Azure availability.

## Assumptions

The platform operator can grant group-scoped roles and deploy the prepared
resources. GitHub Environments support the required approval protections.
The allocator supplies a trusted group ID and ownership tag. Docker is available
on GitHub's Linux runner. No real production/customer data is used.

## Revisit triggers

- Provisioning or role propagation repeatedly exceeds the recovery cap.
- The allocator changes its ownership contract.
- The signing tool, OCI copy path or host issuer changes.
- Production rollout replaces the deliberate group-Owner shortcut.
- Persistent inventory or multiple replicas become a real product requirement.
