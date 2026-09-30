import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { root } from "./validation.mjs";
import { assertEvidence, promoteEvidence, releaseConfig, smokeChecks, trustPolicy } from "../scripts/release-evidence.mjs";
import { acaParameters, assertAcaChanges, waitForAcaHealth } from "../scripts/deploy-aca.mjs";
import { assertAllocation, assertChanges, assertEnvironment, environmentSubject, plan, resourceStem, roleAssignmentPlan, validateConfig } from "../platform/scripts/oci-platform.mjs";
import { buildServer } from "../src/server.mjs";

const workflow = readFileSync(join(root, ".github", "workflows", "release-rehearsal.yml"), "utf8");
const env = {
  CANDIDATE_SHA: "a".repeat(40), GITHUB_REPOSITORY: "workshop-owner/station",
  GITHUB_RUN_ID: "100", GITHUB_RUN_ATTEMPT: "1", ACR_LOGIN_SERVER: "retailtest.azurecr.io",
  ACR_REPOSITORY: "stations/station01/retail-reservation",
  RETAIL_BASE_IMAGE: `docker.io/library/node:24-alpine@sha256:${"b".repeat(64)}`
};
const config = releaseConfig(env);
const evidence = {
  schema: "retail-oci-release/v1", workflow: "Trusted OCI release", ...config,
  imageId: `sha256:${"c".repeat(64)}`, imageDigest: `sha256:${"d".repeat(64)}`,
  imageReference: `${config.imageRepository}@sha256:${"d".repeat(64)}`,
  deterministicTests: "passed", smokeChecks
};
const platformConfig = {
  ...JSON.parse(readFileSync(join(root, "platform", "azure", "oci.example.json"), "utf8")),
  subscriptionId: "00000000-0000-0000-0000-000000000001",
  provisionerObjectId: "00000000-0000-0000-0000-000000000002",
  resourceGroup: "lab-station01", ownershipTag: { name: "LabOwner", value: "station01" },
  baseImage: env.RETAIL_BASE_IMAGE
};
const groupId = `/subscriptions/${platformConfig.subscriptionId}/resourceGroups/${platformConfig.resourceGroup}`;
const roles = Object.fromEntries(["owner", "acrPush", "acrPull", "cryptoUser", "certificateUser", "certificateOfficer"]
  .map((role, index) => [role, `00000000-0000-0000-0000-${String(index + 10).padStart(12, "0")}`]));
const stem = resourceStem(platformConfig, groupId);
const identities = ["test", "prod"].flatMap((phase, index) => [false, true].map((runtime) => ({
  id: `${groupId}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/${stem}-${phase}${runtime ? "-runtime" : ""}`,
  principalId: `00000000-0000-0000-0000-${String(100 + index * 2 + Number(runtime)).padStart(12, "0")}`,
  tags: { Environment: phase, WorkshopStation: platformConfig.stationId, Purpose: runtime ? "runtime" : "pipeline" }
})));
const acaInput = {
  RELEASE_ENVIRONMENT: "prod", ACA_APP_NAME: "retail123-prod", ACA_ENVIRONMENT_NAME: "retail123-prod",
  AZURE_SUBSCRIPTION_ID: platformConfig.subscriptionId, AZURE_RESOURCE_GROUP: "lab-station01",
  IMAGE_REFERENCE: evidence.imageReference,
  ACA_RUNTIME_IDENTITY_ID: `${groupId}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/retail123-prod-runtime`
};

test("release rejects short SHAs, tags, another run/attempt/repository, or unproved checks", () => {
  assert.doesNotThrow(() => assertEvidence(evidence, config, { published: true }));
  for (const key of ["candidateSha", "repository", "runId", "runAttempt", "imageRepository", "baseImage"]) {
    assert.throws(() => assertEvidence({ ...evidence, [key]: "wrong" }, config), /mismatch/);
  }
  for (const extra of [
    { schema: "wrong" }, { deterministicTests: "failed" }, { smokeChecks: ["health"] },
    { imageDigest: "latest" }, { imageReference: `${config.imageRepository}:latest` }
  ]) assert.throws(() => assertEvidence({ ...evidence, ...extra }, config, { published: true }));
  assert.throws(() => releaseConfig({ ...env, CANDIDATE_SHA: "abc" }));
  assert.throws(() => releaseConfig({ ...env, RETAIL_BASE_IMAGE: "node:latest" }));
});

test("Notation trust binds the certificate, identity and exact repository with strict verification", () => {
  const pem = readFileSync(join(root, "tests", "fixtures", "workshop-signing.pem"), "utf8");
  const certificate = new X509Certificate(pem);
  const fingerprint = certificate.fingerprint256.replaceAll(":", "").toLowerCase();
  const withinValidity = Date.parse(certificate.validFrom) + 1_000;
  const policy = trustPolicy(config.imageRepository, pem, fingerprint, withinValidity);
  assert.deepEqual(policy.trustPolicies[0].registryScopes, [config.imageRepository]);
  assert.deepEqual(policy.trustPolicies[0].signatureVerification, { level: "strict" });
  assert.deepEqual(policy.trustPolicies[0].trustedIdentities, ["x509.subject: CN=workshop-synthetic-test"]);
  assert.throws(() => trustPolicy(config.imageRepository, pem, "0".repeat(64), withinValidity), /trust root/);
  assert.throws(() => trustPolicy("*", pem, fingerprint, withinValidity), /trust scope/);
  assert.throws(() => trustPolicy(config.imageRepository, pem, fingerprint, Date.parse(certificate.validTo) + 1), /valid/);
});

test("test/prod use different federations, with immutable owner/repository IDs", () => {
  const meta = { id: 2, name: "station", owner: { id: 1, login: "workshop-owner" } };
  const settings = { use_default: true, use_immutable_subject: true };
  assert.equal(environmentSubject(meta, settings, "test"), "repo:workshop-owner@1/station@2:environment:workshop-test");
  assert.equal(environmentSubject(meta, settings, "prod"), "repo:workshop-owner@1/station@2:environment:workshop-prod");
  assert.throws(() => environmentSubject(meta, { ...settings, use_default: false }, "test"));
  assert.throws(() => environmentSubject(meta, settings, "arbitrary"));
  assert.throws(() => environmentSubject(meta, { ...settings, sub_claim_prefix: "foreign" }, "test"));
});

test("promotion refuses changed bytes, unsigned/wrong-signer evidence and never inherits test verification as prod", () => {
  const pem = readFileSync(join(root, "tests", "fixtures", "workshop-signing.pem"), "utf8");
  const certificate = new X509Certificate(pem);
  const fingerprint = certificate.fingerprint256.replaceAll(":", "").toLowerCase();
  const policy = trustPolicy(config.imageRepository, pem, fingerprint, Date.parse(certificate.validFrom) + 1000);
  const testEvidence = {
    ...evidence, environment: "workshop-test", signatureVerification: "passed",
    trustPolicy: policy, certificateSha256: fingerprint
  };
  const prod = releaseConfig({ ...env, ACR_LOGIN_SERVER: "retailprod.azurecr.io" });
  const promoted = promoteEvidence(testEvidence, config, prod, policy, fingerprint, evidence.imageDigest);
  assert.equal(promoted.imageDigest, testEvidence.imageDigest);
  assert.equal(promoted.testImageReference, testEvidence.imageReference);
  assert.equal(promoted.imageReference, `${prod.imageRepository}@${testEvidence.imageDigest}`);
  assert.equal(promoted.signatureVerification, "pending");
  assert.equal(promoted.trustPolicy, undefined);
  assert.equal(promoted.certificateSha256, undefined);
  for (const extra of [
    { signatureVerification: "pending" }, { certificateSha256: "wrong" },
    { environment: "workshop-prod" }, { trustPolicy: { ...policy, trustPolicies: [] } },
    { runAttempt: "2" }
  ]) assert.throws(() => promoteEvidence({ ...testEvidence, ...extra }, config, prod, policy, fingerprint, evidence.imageDigest));
  assert.throws(() => promoteEvidence(testEvidence, config, prod, policy, fingerprint, `sha256:${"f".repeat(64)}`), /preserve/);
  assert.throws(() => promoteEvidence(testEvidence, config, config, policy, fingerprint, evidence.imageDigest), /different/);
});

test("prod requires main-only policy, the correct reviewer, no self-review or administrator bypass", () => {
  const environment = {
    can_admins_bypass: false, deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
    protection_rules: [{ type: "required_reviewers", prevent_self_review: true,
      reviewers: [{ type: "User", reviewer: { id: 42 } }] }]
  };
  const policies = { branch_policies: [{ name: "main", type: "branch" }] };
  assert.doesNotThrow(() => assertEnvironment(environment, policies, "prod", 42));
  assert.throws(() => assertEnvironment(environment, { branch_policies: [{ name: "main", type: "tag" }] }, "prod", 42));
  assert.throws(() => assertEnvironment(environment, policies, "prod", 99));
  assert.throws(() => assertEnvironment({ ...environment, can_admins_bypass: true }, policies, "prod", 42));
  assert.throws(() => assertEnvironment({ ...environment, protection_rules: [] }, policies, "prod", 42));
});

test("IaC plan targets only one preallocated group, explicitly labels Owner risk, and makes no cloud calls", () => {
  assert.doesNotThrow(() => validateConfig(platformConfig, true));
  const result = plan(platformConfig);
  assert.equal(result.existingResourceGroup, "lab-station01");
  assert.deepEqual(result.resources.map((item) => item.environment), ["test", "prod"]);
  assert.match(result.resources[0].pipelineIdentityRole, /not security isolation/);
  assert.match(result.operation, /no authentication or mutation/);
  const group = {
    id: `/subscriptions/${platformConfig.subscriptionId}/resourceGroups/lab-station01`,
    tags: { LabOwner: "station01" }
  };
  assert.doesNotThrow(() => assertAllocation(group, platformConfig));
  assert.throws(() => assertAllocation({ ...group, tags: { LabOwner: "another" } }, platformConfig), /ownership/);
  assert.throws(() => assertAllocation({ ...group, id: "/another/group" }, platformConfig));
  assert.throws(() => validateConfig({ ...platformConfig, oidcIssuer: "https://example.invalid" }, true));
  const resourceId = `${group.id}/providers/Microsoft.ContainerRegistry/registries/retailtest`;
  assert.doesNotThrow(() => assertChanges({ changes: [{ resourceId, changeType: "Create" }] }, platformConfig, group.id));
  for (const change of [
    { resourceId, changeType: "Delete" },
    { resourceId, changeType: "Modify", before: { tags: { WorkshopStation: "other", Environment: "test" } } },
    { resourceId: "/another/group/providers/type/name", changeType: "Create" }
  ]) assert.throws(() => assertChanges({ changes: [change] }, platformConfig, group.id));
  assert.throws(() => assertChanges({}, platformConfig, group.id), /complete/);
});

function rolePayload(assignment, principalId = assignment.principalId) {
  return {
    id: assignment.resourceId,
    properties: {
      principalId, principalType: assignment.principalType,
      roleDefinitionId: assignment.roleDefinitionId, scope: assignment.scope
    }
  };
}

test("redeploy accepts only the exact owned role IDs, roles, principals and scopes, without role tags", () => {
  const configWithRuntime = { ...platformConfig, deployAca: true };
  const allowed = roleAssignmentPlan(configWithRuntime, roles, groupId, identities);
  assert.equal(allowed.assignments.length, 13);
  assert.equal(new Set(allowed.assignments.map((item) => item.resourceId)).size, 13);
  assert.deepEqual(allowed.names, roleAssignmentPlan(configWithRuntime, roles, groupId).names,
    "Assignment IDs must not depend on whether identities already exist");
  assert.deepEqual(allowed.names, roleAssignmentPlan({ ...configWithRuntime }, roles, groupId, identities).names);
  const changes = allowed.assignments.map((assignment) => ({
    resourceId: assignment.resourceId, changeType: "Modify",
    before: rolePayload(assignment),
    after: rolePayload(assignment, assignment.principalExpression)
  }));
  assert.ok(changes.every((change) => change.before.tags === undefined));
  assert.doesNotThrow(() => assertChanges({ changes }, configWithRuntime, groupId, allowed.assignments));
  assert.doesNotThrow(() => assertChanges({
    changes: changes.map((change) => ({ ...change, changeType: "Deploy" }))
  }, configWithRuntime, groupId, allowed.assignments));
  assert.doesNotThrow(() => assertChanges({
    changes: changes.map((change) => ({ ...change, changeType: "NoChange", after: undefined }))
  }, configWithRuntime, groupId, allowed.assignments));
  const first = changes[0];
  const assignment = allowed.assignments[0];
  assert.doesNotThrow(() => assertChanges({
    changes: [{ ...first, after: rolePayload(assignment, assignment.expandedPrincipalExpression) }]
  }, configWithRuntime, groupId, allowed.assignments));

  const unknownId = first.resourceId.replace(/[^/]+$/, "00000000-0000-0000-0000-999999999999");
  for (const change of [
    { ...first, resourceId: unknownId },
    { ...first, resourceId: first.resourceId.replace(platformConfig.resourceGroup, "foreign-group") },
    { ...first, resourceId: first.resourceId.replace(/\/resourceGroups\/[^/]+/, "") },
    { ...first, before: rolePayload({ ...assignment, roleDefinitionId: assignment.roleDefinitionId.replace(roles.owner, roles.acrPull) }) },
    { ...first, before: rolePayload(assignment, platformConfig.provisionerObjectId) },
    { ...first, after: rolePayload(assignment, platformConfig.provisionerObjectId) },
    { ...first, after: rolePayload({ ...assignment, scope: `${groupId}/foreign` }) },
    { ...first, after: rolePayload({ ...assignment, principalType: "User" }) },
    { ...first, before: undefined },
    { ...first, after: undefined },
    { ...first, changeType: "Delete" },
    { ...first, after: rolePayload(assignment, "[reference('/foreign/identity', '2023-01-31').principalId]") }
  ]) assert.throws(() => assertChanges({ changes: [change] }, configWithRuntime, groupId, allowed.assignments));
  assert.throws(() => assertChanges({ changes: [first] }, configWithRuntime, groupId), /allowlist/);
});

test("first deployment and optional ACA additions allow only planned role creation and verified identity references", () => {
  const initial = roleAssignmentPlan(platformConfig, roles, groupId);
  assert.equal(initial.assignments.length, 11);
  assert.doesNotThrow(() => assertChanges({
    changes: initial.assignments.map((assignment) => ({
      resourceId: assignment.resourceId, changeType: "Create",
      after: rolePayload(assignment, assignment.principalId ?? assignment.principalExpression)
    }))
  }, platformConfig, groupId, initial.assignments));
  const withRuntime = { ...platformConfig, deployAca: true };
  const expected = roleAssignmentPlan(withRuntime, roles, groupId, identities.filter((identity) => identity.tags.Purpose === "pipeline"));
  assert.deepEqual(initial.names.test_owner, expected.names.test_owner);
  assert.deepEqual(initial.names.prod_readTest, expected.names.prod_readTest);
  const additions = expected.assignments.filter((item) => !initial.assignments.some((old) => old.resourceId === item.resourceId));
  assert.equal(additions.length, 2);
  assert.ok(additions.every((item) => item.roleDefinitionId.endsWith(roles.acrPull)));
  assert.doesNotThrow(() => assertChanges({
    changes: additions.map((assignment) => ({
      resourceId: assignment.resourceId, changeType: "Create", after: rolePayload(assignment, assignment.principalExpression)
    }))
  }, withRuntime, groupId, expected.assignments));
  assert.throws(() => roleAssignmentPlan(platformConfig, roles, groupId,
    [{ ...identities[0], tags: { ...identities[0].tags, WorkshopStation: "other" } }]), /foreign/);
  assert.throws(() => roleAssignmentPlan(platformConfig, { ...roles, owner: "not-a-guid" }, groupId), /role definition/);
});

test("ARM templates use two environment tags, one group, and never attach Owner to ACA runtime", () => {
  const template = JSON.parse(readFileSync(join(root, "platform", "azure", "retail-environments.json"), "utf8"));
  assert.deepEqual(template.variables.environments, ["test", "prod"]);
  assert.ok(template.resources.every((resource) => resource.type !== "Microsoft.Resources/resourceGroups"));
  const runtime = template.resources.find((resource) => resource.copy?.name === "runtimeIdentities");
  assert.equal(runtime.tags.Purpose, "runtime");
  const runtimeRoles = template.resources.filter((resource) => resource.copy?.name === "runtimePullRoles");
  assert.equal(runtimeRoles.length, 1);
  assert.match(runtimeRoles[0].properties.roleDefinitionId, /acrPull/);
  assert.doesNotMatch(JSON.stringify(runtimeRoles), /\.owner/);
  const aca = JSON.parse(readFileSync(join(root, "platform", "azure", "aca.json"), "utf8"));
  const app = aca.resources[0];
  assert.equal(app.properties.template.scale.maxReplicas, 1);
  assert.equal(app.properties.template.scale.minReplicas, 0);
  assert.equal(app.properties.configuration.ingress.allowInsecure, false);
});

test("ACA refuses tags or Owner pipeline identities; accepts a separate in-group runtime identity", () => {
  const input = acaInput;
  assert.equal(acaParameters(input).imageReference.value, evidence.imageReference);
  assert.throws(() => acaParameters({ ...input, IMAGE_REFERENCE: "retailtest.azurecr.io/retail:latest" }), /digest/);
  assert.throws(() => acaParameters({ ...input, ACA_RUNTIME_IDENTITY_ID: input.ACA_RUNTIME_IDENTITY_ID.replace("-runtime", "") }), /runtime identity/);
  assert.throws(() => acaParameters({ ...input, ACA_RUNTIME_IDENTITY_ID: input.ACA_RUNTIME_IDENTITY_ID.replace("lab-station01", "foreign-group") }), /runtime identity/);
  assert.throws(() => acaParameters({ ...input, AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-999999999999" }), /subscription/);
});

test("ACA what-if admits only the exact tagged app, verified digest, environment and runtime identity", () => {
  const parameters = acaParameters(acaInput);
  const target = `${groupId}/providers/Microsoft.App/containerApps/${acaInput.ACA_APP_NAME}`;
  const payload = {
    tags: { Environment: "prod", WorkshopStation: platformConfig.stationId },
    identity: { type: "UserAssigned", userAssignedIdentities: { [acaInput.ACA_RUNTIME_IDENTITY_ID]: {} } },
    properties: {
      managedEnvironmentId: `${groupId}/providers/Microsoft.App/managedEnvironments/${acaInput.ACA_ENVIRONMENT_NAME}`,
      template: { containers: [{ image: evidence.imageReference }] }
    }
  };
  const change = { resourceId: target, changeType: "Create", after: payload };
  assert.doesNotThrow(() => assertAcaChanges({ changes: [change] }, groupId, parameters));
  assert.doesNotThrow(() => assertAcaChanges({
    changes: [{ ...change, changeType: "Modify", before: payload }]
  }, groupId, parameters));
  for (const altered of [
    { ...change, resourceId: `${target}-foreign` },
    { ...change, changeType: "Delete" },
    { ...change, changeType: "Ignore" },
    { ...change, changeType: "Modify" },
    { ...change, changeType: "Modify", before: { tags: { Environment: "test", WorkshopStation: "other" } } },
    { ...change, after: { ...payload, tags: { Environment: "test", WorkshopStation: platformConfig.stationId } } },
    { ...change, after: { ...payload, identity: { type: "UserAssigned", userAssignedIdentities: {
      [acaInput.ACA_RUNTIME_IDENTITY_ID.replace("-runtime", "")]: {}
    } } } },
    { ...change, after: { ...payload, properties: { ...payload.properties,
      template: { containers: [{ image: "retailtest.azurecr.io/retail:latest" }] }
    } } }
  ]) assert.throws(() => assertAcaChanges({ changes: [altered] }, groupId, parameters));
  assert.throws(() => assertAcaChanges({}, groupId, parameters), /complete/);
  assert.throws(() => assertAcaChanges({ changes: [] }, groupId, parameters), /missing/);
});

const acaUrl = "https://retail-lab.azurecontainerapps.io";
const readyResponse = () => ({ status: 200, json: async () => ({ status: "ready", service: "retail-reservation" }) });

test("ACA cold start retries only transient statuses and succeeds within the bounded budget", async () => {
  const statuses = [503, 502, 429, 504, 408, 200];
  const delays = [];
  const logs = [];
  let attempts = 0;
  await waitForAcaHealth(acaUrl, {
    request: async (url, options) => {
      assert.equal(url, `${acaUrl}/health`);
      assert.equal(options.redirect, "error");
      assert.ok(options.signal instanceof AbortSignal);
      attempts += 1;
      const status = statuses.shift();
      return status === 200 ? readyResponse() : { status };
    },
    wait: async (ms) => delays.push(ms), log: (message) => logs.push(message)
  });
  assert.equal(attempts, 6);
  assert.deepEqual(delays, [5000, 5000, 5000, 5000, 5000]);
  assert.equal(logs.length, 5);
  assert.match(logs[0], /HTTP 503.*1\/6/);
});

test("ACA health retries timeouts and temporary connection errors, but stops at six attempts", async () => {
  let attempts = 0;
  const waits = [];
  await assert.rejects(waitForAcaHealth(acaUrl, {
    request: async () => {
      attempts += 1;
      if (attempts === 1) throw new DOMException("Timed out", "TimeoutError");
      throw new TypeError("fetch failed", { cause: { code: "ECONNRESET" } });
    },
    wait: async (ms) => waits.push(ms), log: () => {}
  }), /after 6 attempts: ECONNRESET/);
  assert.equal(attempts, 6);
  assert.deepEqual(waits, [5000, 5000, 5000, 5000, 5000]);
  let statusAttempts = 0;
  await assert.rejects(waitForAcaHealth(acaUrl, {
    request: async () => { statusAttempts += 1; return { status: 503 }; },
    wait: async () => {}, log: () => {}
  }), /after 6 attempts: HTTP 503/);
  assert.equal(statusAttempts, 6);
});

test("ACA authorization, wrong routes, bad health JSON and TLS failures never receive cold-start retries", async () => {
  for (const response of [
    { status: 401 }, { status: 403 }, { status: 404 }, { status: 500 },
    { status: 200, json: async () => ({ status: "ready", service: "wrong-service" }) },
    { status: 200, json: async () => { throw new SyntaxError("Malformed JSON"); } }
  ]) {
    let calls = 0;
    await assert.rejects(waitForAcaHealth(acaUrl, {
      request: async () => { calls += 1; return response; },
      wait: async () => assert.fail("Permanent health failures cannot retry"), log: () => assert.fail("Cannot log a retry")
    }));
    assert.equal(calls, 1);
  }
  const error = new TypeError("TLS failure", { cause: { code: "CERT_HAS_EXPIRED" } });
  await assert.rejects(waitForAcaHealth(acaUrl, {
    request: async () => { throw error; }, wait: async () => assert.fail("TLS failure cannot retry")
  }), (actual) => actual === error);
  for (const maxAttempts of [0, 7, 1.5]) {
    await assert.rejects(waitForAcaHealth(acaUrl, { maxAttempts }), /one to six/);
  }
});

test("workflow builds once without Azure access, preserves digest across registries, signs and strictly verifies", () => {
  const build = workflow.slice(workflow.indexOf("  build:"), workflow.indexOf("  test_release:"));
  assert.match(build, /run: npm test/);
  assert.doesNotMatch(build, /id-token: write|Azure\/login|notation sign/);
  assert.match(workflow, /environment: workshop-test/);
  assert.match(workflow, /environment: workshop-prod/);
  assert.match(workflow, /oras copy "\$test_ref" "\$target"/);
  assert.equal([...workflow.matchAll(/docker build --/g)].length, 1);
  assert.equal([...workflow.matchAll(/notation verify "\$IMAGE_REFERENCE"/g)].length, 2);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /AZURE_CREDENTIALS|client-secret:|pull_request_target/);
  for (const use of workflow.matchAll(/uses:\s*([^\s]+)/g)) assert.match(use[1], /@[0-9a-f]{40}$/);
  assert.match(workflow, /vars\.ACA_ENABLED == 'true'/);
});

test("the smoke executable measures real health, stock read and reservation semantics", async () => {
  const server = buildServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const result = await promisify(execFile)(process.execPath, [
      join(root, "scripts", "container-smoke.mjs"), `http://127.0.0.1:${server.address().port}`
    ], { encoding: "utf8" });
    assert.match(result.stdout, /health, stock-read, synthetic-reservation/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
