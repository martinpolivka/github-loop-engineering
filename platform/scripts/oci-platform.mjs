import { createHash, X509Certificate } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { run, runJson, runJsonOrMissing } from "./command.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const phases = ["test", "prod"];

export function validateConfig(config, live = false) {
  if (config.host !== "github.com" && !/^[a-z0-9-]+\.ghe\.com$/.test(config.host)) throw new Error("Use a supported GitHub Cloud host.");
  const issuer = config.host === "github.com" ? "https://token.actions.githubusercontent.com" : `https://token.actions.${config.host}`;
  if (config.oidcIssuer !== issuer &&
      !(config.host.endsWith(".ghe.com") && config.oidcIssuer === `${issuer}/${config.host.split(".")[0]}`)) {
    throw new Error("OIDC issuer must match the selected host and its actual issuer setting.");
  }
  if (!/^[a-z0-9-]{2,31}$/.test(config.stationId) ||
      !/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(config.repository) ||
      !/^[A-Za-z0-9_-]+$/.test(config.reviewer) ||
      !/^[a-z]{3,6}$/.test(config.namePrefix)) throw new Error("Invalid station, repository, reviewer, or resource prefix.");
  if (!config.ownershipTag || typeof config.ownershipTag.name !== "string" || !config.ownershipTag.name ||
      typeof config.ownershipTag.value !== "string" || !config.ownershipTag.value ||
      !/^[A-Za-z0-9._()-]{1,90}$/.test(config.resourceGroup)) throw new Error("Supply the exact group and ownership tag from the trusted lab allocation.");
  if (live) {
    const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guid.test(config.subscriptionId) || !guid.test(config.provisionerObjectId) ||
        !["User", "ServicePrincipal"].includes(config.provisionerType)) throw new Error("Supply the real allocation and provisioner IDs.");
    if (!/^docker\.io\/library\/node:24-alpine@sha256:[0-9a-f]{64}$/.test(config.baseImage)) throw new Error("Supply an approved, digest-pinned Node.js 24 base image.");
    if ([config.resourceGroup, config.ownershipTag.name, config.ownershipTag.value].some((value) => value.startsWith("REPLACE_"))) {
      throw new Error("Lab allocation placeholders cannot authorize live work.");
    }
  }
  return config;
}

export function plan(config) {
  validateConfig(config);
  return {
    operation: "PLAN ONLY; no authentication or mutation",
    existingResourceGroup: config.resourceGroup,
    subscriptionId: config.subscriptionId,
    ownershipTag: config.ownershipTag,
    repository: `${config.host}/${config.repository}`,
    resources: phases.map((environment) => ({
      environment, resourceTags: { Environment: environment, WorkshopStation: config.stationId },
      resources: ["Basic ACR", "standard Key Vault", "one pipeline user-assigned managed identity"],
      githubEnvironment: `workshop-${environment}`,
      pipelineIdentityRole: "Owner on the ONE allocated resource group (workshop shortcut, not security isolation)",
      certificate: "non-exportable self-signed workshop certificate",
      optionalAca: config.deployAca === true ? "consumption environment and separate AcrPull-only runtime identity" : "disabled"
    })),
    deployment: "Prepared ARM template; incremental mode, never create, rename, or delete a resource group",
    nextStudentTask: "Bind test and prod federations to distinct GitHub Environments and inspect the workflow mapping; wire --apply changes Azure federation, certificates, GitHub Environments and variables.",
    cleanup: "No automatic deletion. Lab allocator owns cleanup of the existing group."
  };
}

export function environmentSubject(metadata, settings, phase) {
  if (!phases.includes(phase) || settings.use_default !== true || settings.use_immutable_subject !== true ||
      !Number.isSafeInteger(metadata.id) || !Number.isSafeInteger(metadata.owner?.id)) {
    throw new Error("An immutable default subject and exact repository IDs are required.");
  }
  const prefix = `repo:${metadata.owner.login}@${metadata.owner.id}/${metadata.name}@${metadata.id}`;
  if (settings.sub_claim_prefix && settings.sub_claim_prefix !== prefix) throw new Error("OIDC prefix differs from repository metadata.");
  return `${prefix}:environment:workshop-${phase}`;
}

export function assertEnvironment(environment, policies, phase, reviewerId) {
  if (environment.deployment_branch_policy?.protected_branches !== false ||
      environment.deployment_branch_policy?.custom_branch_policies !== true ||
      policies.branch_policies?.length !== 1 || policies.branch_policies[0].name !== "main" ||
      policies.branch_policies[0].type !== "branch") throw new Error("Select only main, never PR branches or tags.");
  if (phase === "prod") {
    const rule = environment.protection_rules?.find((item) => item.type === "required_reviewers");
    if (rule?.prevent_self_review !== true || environment.can_admins_bypass !== false ||
        !rule.reviewers?.some((item) => item.type === "User" && item.reviewer?.id === reviewerId)) {
      throw new Error("Prod needs the verified reviewer, no self-review, and no administrator bypass.");
    }
  }
}

function clients(config) {
  return {
    az: (args) => runJson("az", [...args, "--subscription", config.subscriptionId, "--only-show-errors", "-o", "json"]),
    gh: (args) => runJson("gh", ["api", "--hostname", config.host, ...args]),
    ghMissing: (args) => runJsonOrMissing("gh", ["api", "--hostname", config.host, ...args], /HTTP 404/)
  };
}

export function assertAllocation(group, config) {
  const expected = `/subscriptions/${config.subscriptionId}/resourceGroups/${config.resourceGroup}`;
  if (group.id?.toLowerCase() !== expected.toLowerCase() || group.tags?.[config.ownershipTag.name] !== config.ownershipTag.value) {
    throw new Error("Group ID or trusted allocation ownership tag mismatch; no deployment is authorized.");
  }
  return group;
}

function assignmentName(parts) {
  const bytes = createHash("sha256").update(JSON.stringify(parts)).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function resourceStem(config, groupId) {
  return config.namePrefix + createHash("sha256").update(JSON.stringify([
    groupId.toLowerCase(), config.stationId
  ])).digest("hex").slice(0, 8);
}

export function roleAssignmentPlan(config, roles, groupId, identities = []) {
  const stem = resourceStem(config, groupId);
  const assignments = [];
  const names = {};
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const add = (phase, kind, scope, roleKey, runtime = false, provisioner = false) => {
    if (!guid.test(roles[roleKey])) throw new Error(`Invalid ${roleKey} role definition ID.`);
    const identityName = `${stem}-${phase}${runtime ? "-runtime" : ""}`;
    const principalResourceId = `${groupId}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/${identityName}`;
    const identity = identities.find((item) => item.id?.toLowerCase() === principalResourceId.toLowerCase());
    if (identity && (identity.tags?.WorkshopStation !== config.stationId || identity.tags?.Environment !== phase ||
        identity.tags?.Purpose !== (runtime ? "runtime" : "pipeline") || !guid.test(identity.principalId))) {
      throw new Error("Role plan identity is foreign, incorrectly tagged, or missing its principal.");
    }
    const principalId = provisioner ? config.provisionerObjectId : identity?.principalId;
    if (provisioner && !guid.test(principalId)) throw new Error("Invalid provisioner principal ID.");
    const name = assignmentName([
      groupId.toLowerCase(), config.stationId, config.namePrefix, phase, kind,
      ...(provisioner ? [principalId.toLowerCase()] : [])
    ]);
    names[`${phase}_${kind}`] = name;
    const principalExpression = provisioner ? "[parameters('provisionerObjectId')]" : runtime
      ? "[reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', concat(variables('stem'), '-', variables('environments')[copyIndex()], '-runtime')), '2023-01-31').principalId]"
      : kind === "readTest"
        ? "[reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', concat(variables('stem'), '-prod')), '2023-01-31').principalId]"
        : "[reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', concat(variables('stem'), '-', variables('environments')[copyIndex()])), '2023-01-31').principalId]";
    assignments.push({
      resourceId: `${scope}/providers/Microsoft.Authorization/roleAssignments/${name}`,
      scope, roleDefinitionId: `/subscriptions/${config.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${roles[roleKey]}`,
      principalId, principalType: provisioner ? config.provisionerType : "ServicePrincipal",
      principalExpression,
      expandedPrincipalExpression: `[reference('${principalResourceId}', '2023-01-31').principalId]`
    });
  };
  for (const phase of phases) {
    const registry = `${groupId}/providers/Microsoft.ContainerRegistry/registries/${stem}${phase}`;
    const vault = `${groupId}/providers/Microsoft.KeyVault/vaults/${stem}-${phase}`;
    add(phase, "owner", groupId, "owner");
    add(phase, "push", registry, "acrPush");
    add(phase, "crypto", vault, "cryptoUser");
    add(phase, "readCertificate", vault, "certificateUser");
    add(phase, "createCertificate", vault, "certificateOfficer", false, true);
    if (config.deployAca === true) add(phase, "runtimePull", registry, "acrPull", true);
  }
  add("prod", "readTest", `${groupId}/providers/Microsoft.ContainerRegistry/registries/${stem}test`, "acrPull");
  return { assignments, names };
}

function assertRolePayload(payload, expected, existing) {
  const properties = payload?.properties;
  const sameId = (actual, wanted) => typeof actual === "string" && typeof wanted === "string" &&
    actual.toLowerCase() === wanted.toLowerCase();
  if (!properties || !sameId(properties.roleDefinitionId, expected.roleDefinitionId) ||
      properties.principalType !== expected.principalType ||
      (payload.id && !sameId(payload.id, expected.resourceId)) ||
      (properties.scope && !sameId(properties.scope, expected.scope))) {
    throw new Error("Role assignment ID, role definition, principal type, or scope differs from the exact template plan.");
  }
  if (sameId(properties.principalId, expected.principalId)) return;
  // ARM what-if cannot evaluate reference(). Only the pinned template's exact reference is allowed.
  if (!existing && [expected.principalExpression, expected.expandedPrincipalExpression].includes(properties.principalId)) return;
  throw new Error("Role assignment principal differs from the verified identity or exact template reference.");
}

export function assertChanges(result, config, groupId, assignments = []) {
  const changes = result.changes ?? result.properties?.changes;
  if (!Array.isArray(changes)) throw new Error("ARM what-if did not return a complete change list.");
  for (const change of changes) {
    if (!change.resourceId?.toLowerCase().startsWith(`${groupId}/providers/`.toLowerCase()) ||
        !["Create", "Modify", "Deploy", "NoChange"].includes(change.changeType)) {
      throw new Error("What-if includes an out-of-scope, destructive, or unsupported resource change.");
    }
    if (/\/providers\/Microsoft\.Authorization\/roleAssignments\/[^/]+$/i.test(change.resourceId)) {
      const expected = assignments.find((item) => item.resourceId.toLowerCase() === change.resourceId.toLowerCase());
      if (!expected) throw new Error("Role assignment ID is not in the exact template allowlist.");
      if (change.before) assertRolePayload(change.before, expected, true);
      if (!change.before && change.changeType !== "Create") throw new Error("Existing role assignment evidence is missing.");
      if (change.after) assertRolePayload(change.after, expected, false);
      else if (change.changeType !== "NoChange") throw new Error("Desired role assignment evidence is missing.");
      continue;
    }
    if (["Modify", "Deploy"].includes(change.changeType) && change.before &&
        (change.before.tags?.WorkshopStation !== config.stationId ||
        !phases.includes(change.before.tags?.Environment))) {
      throw new Error("What-if would modify a foreign or unlabelled existing resource.");
    }
  }
}

function parameters(config, roles, groupId) {
  return Object.fromEntries(Object.entries({
    namePrefix: config.namePrefix, stationId: config.stationId,
    provisionerObjectId: config.provisionerObjectId, provisionerType: config.provisionerType,
    roleIds: roles, deployAca: config.deployAca === true,
    resourceStem: resourceStem(config, groupId),
    assignmentNames: roleAssignmentPlan(config, roles, groupId).names
  }).map(([key, value]) => [key, { value }]));
}

function paths(config) {
  const work = join(root, ".workshop", "oci", config.stationId);
  mkdirSync(work, { recursive: true });
  return { work, receipt: join(work, "resources.json") };
}

async function deploy(config, command) {
  validateConfig(config, true);
  const t = clients(config);
  const group = assertAllocation(t.az(["group", "show", "--name", config.resourceGroup]), config);
  const roles = {};
  for (const [name, role] of Object.entries({
    owner: "Owner", acrPush: "AcrPush", acrPull: "AcrPull",
    cryptoUser: "Key Vault Crypto User", certificateUser: "Key Vault Certificates User",
    certificateOfficer: "Key Vault Certificates Officer"
  })) {
    const found = t.az(["role", "definition", "list", "--name", role]);
    if (found.length !== 1) throw new Error(`Cannot resolve ${role} uniquely.`);
    roles[name] = found[0].name;
  }
  const { work, receipt } = paths(config);
  const params = join(work, "parameters.json");
  writeFileSync(params, JSON.stringify({ parameters: parameters(config, roles, group.id) }));
  const checkedWhatIf = () => {
    const identities = t.az(["identity", "list", "--resource-group", config.resourceGroup]);
    const expected = roleAssignmentPlan(config, roles, group.id, identities).assignments;
    const result = t.az(["deployment", "group", "what-if", "--name", `retail-${config.stationId}`,
      "--resource-group", config.resourceGroup,
      "--template-file", join(root, "platform", "azure", "retail-environments.json"),
      "--parameters", `@${params}`, "--mode", "Incremental", "--result-format", "FullResourcePayloads"]);
    assertChanges(result, config, group.id, expected);
    return result;
  };
  const args = ["deployment", "group", command === "deploy" ? "create" : "what-if",
    "--name", `retail-${config.stationId}`, "--resource-group", config.resourceGroup,
    "--template-file", join(root, "platform", "azure", "retail-environments.json"),
    "--parameters", `@${params}`, "--mode", "Incremental"];
  if (command === "deploy") {
    if (config.allowPaidResources !== true || config.allowWorkshopOwnerRoles !== true) {
      throw new Error("Deployment requires explicit paid-resource AND workshop-Owner-role approval in the config.");
    }
    const reviewed = JSON.parse(readFileSync(join(work, "reviewed-plan.json"), "utf8"));
    const currentHash = createHash("sha256").update(readFileSync(params))
      .update(readFileSync(join(root, "platform", "azure", "retail-environments.json"))).digest("hex");
    if (reviewed.hash !== currentHash || reviewed.groupId !== group.id) throw new Error("Reviewed IaC plan is missing or stale; rerun what-if.");
    checkedWhatIf();
    const result = t.az(args);
    if (result.properties?.provisioningState !== "Succeeded") throw new Error("ARM deployment did not succeed.");
    writeFileSync(receipt, `${JSON.stringify({
      resourceGroupId: group.id, repository: config.repository,
      stationId: config.stationId, outputs: result.properties.outputs
    }, null, 2)}\n`);
    console.log("DEPLOYED test/prod resources in the allocated group. Federation is not wired yet.");
  } else {
    const result = checkedWhatIf();
    writeFileSync(join(work, "reviewed-plan.json"), JSON.stringify({
      groupId: group.id, hash: createHash("sha256").update(readFileSync(params))
        .update(readFileSync(join(root, "platform", "azure", "retail-environments.json"))).digest("hex")
    }));
    console.log(JSON.stringify(result, null, 2));
  }
}

function readReceipt(config) {
  const receipt = JSON.parse(readFileSync(paths(config).receipt, "utf8"));
  const expected = `/subscriptions/${config.subscriptionId}/resourceGroups/${config.resourceGroup}`;
  if (receipt.resourceGroupId.toLowerCase() !== expected.toLowerCase() ||
      receipt.repository !== config.repository || receipt.stationId !== config.stationId) throw new Error("Resource receipt belongs to another allocation.");
  return receipt.outputs;
}

async function wire(config, apply) {
  validateConfig(config, true);
  const t = clients(config);
  const group = assertAllocation(t.az(["group", "show", "--name", config.resourceGroup]), config);
  const resources = readReceipt(config);
  const meta = t.gh([`repos/${config.repository}`]);
  if (meta.full_name.toLowerCase() !== config.repository.toLowerCase() ||
      meta.default_branch !== "main" || !meta.fork || meta.permissions?.admin !== true) {
    throw new Error("Use the exact allocated fork with main and repository administration rights.");
  }
  const reviewer = t.gh([`users/${config.reviewer}`]);
  if (reviewer.type !== "User") throw new Error("Prod reviewer must resolve to a User.");
  let settings = t.gh([`repos/${config.repository}/actions/oidc/customization/sub`]);
  if (settings.use_default !== true) throw new Error("Custom OIDC subjects are never replaced.");
  if (apply && settings.use_immutable_subject !== true) {
    t.gh(["--method", "PUT", `repos/${config.repository}/actions/oidc/customization/sub`,
      "-F", "use_default=true", "-F", "use_immutable_subject=true"]);
    settings = t.gh([`repos/${config.repository}/actions/oidc/customization/sub`]);
  }
  const ownerRoles = t.az(["role", "assignment", "list", "--scope", group.id, "--all"]);
  const certificates = {};
  for (const phase of phases) {
    const environment = `workshop-${phase}`;
    const deployed = resources[phase].value;
    for (const [command, name] of [["acr", deployed.registryName], ["keyvault", deployed.vaultName], ["identity", deployed.identityName]]) {
      const resource = t.az([command, "show", "--name", name, "--resource-group", config.resourceGroup]);
      if (!resource.id.toLowerCase().startsWith(`${group.id}/providers/`.toLowerCase()) ||
          resource.tags?.Environment !== phase || resource.tags?.WorkshopStation !== config.stationId) {
        throw new Error("Resource tags or parent group differ from the allocated test/prod receipt.");
      }
    }
    const identity = t.az(["identity", "show", "--name", deployed.identityName, "--resource-group", config.resourceGroup]);
    if (!ownerRoles.some((role) => role.principalId === identity.principalId &&
        role.roleDefinitionName === "Owner" && role.scope.toLowerCase() === group.id.toLowerCase())) {
      throw new Error("Requested workshop Owner role is missing; do not broaden to subscription scope.");
    }
    const subject = environmentSubject(meta, settings, phase);
    const endpoint = `repos/${config.repository}/environments/${environment}`;
    let current = t.ghMissing([endpoint]);
    if (!current && apply) {
      const body = {
        deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
        ...(phase === "prod" ? {
          reviewers: [{ type: "User", id: reviewer.id }], prevent_self_review: true, can_admins_bypass: false
        } : {})
      };
      const bodyFile = join(paths(config).work, "environment.json");
      writeFileSync(bodyFile, JSON.stringify(body));
      t.gh(["--method", "PUT", endpoint, "--input", bodyFile]);
      t.gh(["--method", "POST", `${endpoint}/deployment-branch-policies`, "-f", "name=main", "-f", "type=branch"]);
      current = t.gh([endpoint]);
    }
    if (!current) throw new Error(`Missing ${environment}; run wire only after approving its exact plan.`);
    assertEnvironment(current, t.gh([`${endpoint}/deployment-branch-policies`]), phase, reviewer.id);
    const credentials = t.az(["identity", "federated-credential", "list",
      "--identity-name", deployed.identityName, "--resource-group", config.resourceGroup]);
    const existing = credentials.find((credential) => credential.name === "github");
    if (credentials.length && (!existing || credentials.length !== 1)) throw new Error("Unexpected federated trust on the station identity.");
    if (!existing && apply) {
      t.az(["identity", "federated-credential", "create", "--name", "github",
        "--identity-name", deployed.identityName, "--resource-group", config.resourceGroup,
        "--issuer", config.oidcIssuer, "--subject", subject, "--audiences", "api://AzureADTokenExchange"]);
    }
    const credential = t.az(["identity", "federated-credential", "show", "--name", "github",
      "--identity-name", deployed.identityName, "--resource-group", config.resourceGroup]);
    if (credential.issuer !== config.oidcIssuer || credential.subject !== subject ||
        JSON.stringify(credential.audiences) !== '["api://AzureADTokenExchange"]') throw new Error("Federation issuer, audience, or environment binding mismatch.");
    const name = `workshop-${config.stationId}-${phase}`;
    const all = t.az(["keyvault", "certificate", "list", "--vault-name", deployed.vaultName]);
    if (!all.some((item) => item.id.split("/").at(-1) === name)) {
      if (!apply) throw new Error("Workshop signing certificate missing.");
      const policy = {
        issuerParameters: { name: "Self" },
        keyProperties: { exportable: false, keySize: 2048, keyType: "RSA", reuseKey: true },
        secretProperties: { contentType: "application/x-pem-file" },
        x509CertificateProperties: {
          subject: `CN=${name}`, ekus: ["1.3.6.1.5.5.7.3.3"],
          keyUsage: ["digitalSignature"], validityInMonths: 1
        }
      };
      const file = join(paths(config).work, "certificate-policy.json");
      writeFileSync(file, JSON.stringify(policy));
      t.az(["keyvault", "certificate", "create", "--vault-name", deployed.vaultName, "--name", name, "--policy", `@${file}`]);
    }
    const certificate = t.az(["keyvault", "certificate", "show", "--vault-name", deployed.vaultName, "--name", name]);
    if (certificate.policy?.keyProperties?.exportable !== false || certificate.attributes?.enabled !== true) throw new Error("Certificate must be enabled and non-exportable.");
    const x509 = new X509Certificate(Buffer.from(certificate.cer, "base64"));
    if (x509.subject !== `CN=${name}`) throw new Error("Unexpected test/prod signer identity.");
    certificates[phase] = {
      base64: Buffer.from(x509.toString()).toString("base64"), sha256: x509.fingerprint256.replaceAll(":", "").toLowerCase()
    };
    const variables = {
      AZURE_CLIENT_ID: identity.clientId, AZURE_TENANT_ID: identity.tenantId,
      AZURE_SUBSCRIPTION_ID: config.subscriptionId, AZURE_RESOURCE_GROUP: config.resourceGroup,
      ACR_LOGIN_SERVER: deployed.loginServer, SIGNING_KEY_ID: certificate.kid,
      SIGNING_CERTIFICATE_BASE64: certificates[phase].base64,
      SIGNING_CERTIFICATE_SHA256: certificates[phase].sha256,
      ACA_ENABLED: String(config.deployAca === true), ACA_APP_NAME: deployed.appName,
      ACA_ENVIRONMENT_NAME: deployed.acaEnvironmentName,
      ACA_RUNTIME_IDENTITY_ID: deployed.runtimeIdentityId,
      ALLOCATION_TAG_NAME: config.ownershipTag.name, ALLOCATION_TAG_VALUE: config.ownershipTag.value,
      ...(phase === "prod" ? {
        TEST_ACR_LOGIN_SERVER: resources.test.value.loginServer,
        TEST_SIGNING_CERTIFICATE_BASE64: certificates.test.base64,
        TEST_SIGNING_CERTIFICATE_SHA256: certificates.test.sha256
      } : {})
    };
    for (const [key, value] of Object.entries(variables)) {
      if (!value && config.deployAca !== true && key.startsWith("ACA_")) continue;
      if (apply) run("gh", ["variable", "set", key, "--repo", `${config.host}/${config.repository}`, "--env", environment, "--body", value]);
      if (t.gh([`repositories/${meta.id}/environments/${environment}/variables/${key}`]).value !== value) throw new Error(`${environment}/${key} read-back mismatch.`);
    }
  }
  const variables = {
    TEST_ACR_LOGIN_SERVER: resources.test.value.loginServer,
    ACR_REPOSITORY: `stations/${config.stationId}/retail-reservation`, RETAIL_BASE_IMAGE: config.baseImage
  };
  for (const [key, value] of Object.entries(variables)) {
    if (apply) run("gh", ["variable", "set", key, "--repo", `${config.host}/${config.repository}`, "--body", value]);
    if (t.gh([`repos/${config.repository}/actions/variables/${key}`]).value !== value) throw new Error(`Repository variable ${key} mismatch.`);
  }
  console.log("WIRED two environment-bound managed identities; both are Owner on the allocated group, NOT production least privilege. Run the real OCI workflow to prove signing.");
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const index = args.indexOf("--config");
  if (index < 0 || !args[index + 1] ||
      args.some((arg, i) => arg !== "--config" && i !== index + 1 && arg !== "--apply")) throw new Error("Use plan|what-if|deploy|wire|preflight --config PATH [--apply].");
  const config = JSON.parse(readFileSync(resolve(args[index + 1]), "utf8"));
  const apply = args.includes("--apply");
  if (command === "plan" || (["deploy", "wire"].includes(command) && !apply)) {
    console.log(JSON.stringify(plan(config), null, 2));
  } else if (command === "what-if" || command === "deploy") {
    await deploy(config, command);
  } else if (command === "wire" || command === "preflight") {
    await wire(config, command === "wire" && apply);
  } else throw new Error("Unknown command; resource-group creation and cleanup are never supported.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
