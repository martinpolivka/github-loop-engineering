import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { assertAllocation } from "../platform/scripts/oci-platform.mjs";
import { runJson } from "../platform/scripts/command.mjs";

export function acaParameters(env) {
  const phase = env.RELEASE_ENVIRONMENT;
  if (!["test", "prod"].includes(phase) || !/^[a-z0-9-]{2,32}$/.test(env.ACA_APP_NAME ?? "") ||
      !/^[a-z0-9-]{2,32}$/.test(env.ACA_ENVIRONMENT_NAME ?? "") ||
      !/^[A-Za-z0-9._()-]{1,90}$/.test(env.AZURE_RESOURCE_GROUP ?? "")) throw new Error("Invalid ACA target.");
  const image = /^([a-z0-9]{5,50}\.azurecr\.io)\/stations\/([a-z0-9-]{2,31})\/retail-reservation@sha256:[0-9a-f]{64}$/.exec(env.IMAGE_REFERENCE ?? "");
  if (!image) throw new Error("ACA requires a verified digest reference, never a tag.");
  const identityPattern = /^\/subscriptions\/[0-9a-f-]{36}\/resourceGroups\/([^/]+)\/providers\/Microsoft\.ManagedIdentity\/userAssignedIdentities\/([a-z0-9-]+-runtime)$/i;
  const identity = identityPattern.exec(env.ACA_RUNTIME_IDENTITY_ID ?? "");
  if (!identity || identity[1].toLowerCase() !== env.AZURE_RESOURCE_GROUP.toLowerCase() ||
      identity[2] !== `${env.ACA_APP_NAME}-runtime`) throw new Error("ACA must use the separate local runtime identity, never the RG Owner pipeline identity.");
  const subscription = /^\/subscriptions\/([^/]+)\//i.exec(env.ACA_RUNTIME_IDENTITY_ID)[1];
  if (env.AZURE_SUBSCRIPTION_ID !== subscription) throw new Error("ACA runtime identity must belong to the allocated subscription.");
  const allowedOrigin = env.ALLOWED_ORIGIN ?? "";
  if (allowedOrigin && !/^https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(allowedOrigin)) throw new Error("Invalid explicit CORS origin.");
  return Object.fromEntries(Object.entries({
    appName: env.ACA_APP_NAME, environmentName: env.ACA_ENVIRONMENT_NAME,
    runtimeIdentityId: env.ACA_RUNTIME_IDENTITY_ID, imageReference: env.IMAGE_REFERENCE,
    registry: image[1], stationId: image[2], phase, allowedOrigin
  }).map(([key, value]) => [key, { value }]));
}

export function assertAcaChanges(result, groupId, parameters) {
  const changes = result.changes ?? result.properties?.changes;
  if (!Array.isArray(changes)) throw new Error("ACA what-if did not return a complete change list.");
  const target = `${groupId}/providers/Microsoft.App/containerApps/${parameters.appName.value}`;
  if (!changes.length) throw new Error("ACA what-if is missing the target application.");
  for (const change of changes) {
    if (change.resourceId?.toLowerCase() !== target.toLowerCase() ||
        !["Create", "Modify", "Deploy", "NoChange"].includes(change.changeType)) {
      throw new Error("ACA what-if includes an unexpected, destructive, or unsupported resource change.");
    }
    const owned = (payload) => payload.tags?.Environment === parameters.phase.value &&
      payload.tags?.WorkshopStation === parameters.stationId.value;
    if ((change.before && !owned(change.before)) || (!change.before && change.changeType !== "Create")) {
      throw new Error("ACA what-if would change a foreign or unlabelled existing application.");
    }
    const after = change.after;
    if (!after || !owned(after)) throw new Error("ACA what-if is missing expected application tags.");
    const identities = Object.keys(after.identity?.userAssignedIdentities ?? {});
    if (after.identity?.type !== "UserAssigned" || identities.length !== 1 ||
        identities[0].toLowerCase() !== parameters.runtimeIdentityId.value.toLowerCase()) {
      throw new Error("ACA what-if must attach only the separate runtime identity.");
    }
    const containers = after.properties?.template?.containers;
    if (!Array.isArray(containers) || containers.length !== 1 ||
        containers[0].image !== parameters.imageReference.value ||
        after.properties.managedEnvironmentId?.toLowerCase() !==
          `${groupId}/providers/Microsoft.App/managedEnvironments/${parameters.environmentName.value}`.toLowerCase()) {
      throw new Error("ACA what-if image digest or managed environment differs from the reviewed target.");
    }
  }
}

const transientStatuses = new Set([408, 429, 502, 503, 504]);
const transientNetworkCodes = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "UND_ERR_SOCKET"]);

export async function waitForAcaHealth(url, {
  request = fetch, wait = delay, log = console.warn, maxAttempts = 6
} = {}) {
  if (!/^https:\/\/[a-z0-9.-]+\.azurecontainerapps\.io$/.test(url) ||
      !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 6) {
    throw new Error("Use an exact ACA HTTPS endpoint and one to six health attempts.");
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let reason;
    let cause;
    try {
      const response = await request(`${url}/health`, {
        signal: AbortSignal.timeout(30_000), redirect: "error"
      });
      if (response.status === 200) {
        const health = await response.json();
        if (health?.status !== "ready" || health.service !== "retail-reservation") {
          throw new Error("ACA health response does not confirm the ready retail service.");
        }
        return;
      }
      if (!transientStatuses.has(response.status)) {
        throw new Error(`ACA health verification failed: HTTP ${response.status}.`);
      }
      reason = `HTTP ${response.status}`;
      await response.body?.cancel();
    } catch (error) {
      if (error.name !== "TimeoutError" && !transientNetworkCodes.has(error.cause?.code ?? error.code)) throw error;
      cause = error;
      reason = error.name === "TimeoutError" ? "request timed out" : error.cause?.code ?? error.code;
    }
    if (attempt === maxAttempts) {
      throw new Error(`ACA health unavailable after ${maxAttempts} attempts: ${reason}.`, { cause });
    }
    log(`ACA health not ready (${reason}); attempt ${attempt}/${maxAttempts}, retrying in five seconds.`);
    await wait(5_000);
  }
}

async function main() {
  const env = process.env;
  const parameters = acaParameters(env);
  const az = (args) => runJson("az",
    [...args, "--subscription", env.AZURE_SUBSCRIPTION_ID, "--only-show-errors", "-o", "json"],
    { timeout: 900_000 });
  const group = az(["group", "show", "--name", env.AZURE_RESOURCE_GROUP]);
  if (!env.ALLOCATION_TAG_NAME || !env.ALLOCATION_TAG_VALUE ||
      group.tags?.[env.ALLOCATION_TAG_NAME] !== env.ALLOCATION_TAG_VALUE) throw new Error("ACA allocation ownership mismatch.");
  assertAllocation(group, {
    subscriptionId: env.AZURE_SUBSCRIPTION_ID, resourceGroup: env.AZURE_RESOURCE_GROUP,
    ownershipTag: { name: env.ALLOCATION_TAG_NAME, value: env.ALLOCATION_TAG_VALUE }
  });
  const apps = az(["resource", "list", "--resource-group", env.AZURE_RESOURCE_GROUP,
    "--resource-type", "Microsoft.App/containerApps"]);
  const existing = apps.find((app) => app.name === env.ACA_APP_NAME);
  if (existing && (existing.tags?.Environment !== parameters.phase.value ||
      existing.tags?.WorkshopStation !== parameters.stationId.value)) {
    throw new Error("Refusing to modify a foreign or unlabelled ACA app.");
  }
  mkdirSync("release", { recursive: true });
  writeFileSync("release/aca-parameters.json", JSON.stringify({ parameters }));
  const deploymentArgs = ["--name", `aca-${parameters.phase.value}`,
    "--resource-group", env.AZURE_RESOURCE_GROUP, "--mode", "Incremental",
    "--template-file", "platform/azure/aca.json", "--parameters", "@release/aca-parameters.json"];
  const preview = az(["deployment", "group", "what-if", ...deploymentArgs, "--result-format", "FullResourcePayloads", "--no-pretty-print"]);
  assertAcaChanges(preview, group.id, parameters);
  const result = az(["deployment", "group", "create", ...deploymentArgs]);
  if (result.properties?.provisioningState !== "Succeeded") throw new Error("ACA deployment failed.");
  const url = result.properties.outputs.url.value;
  if (!/^https:\/\/[a-z0-9.-]+\.azurecontainerapps\.io$/.test(url)) throw new Error("Unexpected ACA endpoint.");
  await waitForAcaHealth(url);
  appendFileSync(env.GITHUB_STEP_SUMMARY, `\n## Optional lab ACA\n\n- URL: ${url}\n- Image: \`${env.IMAGE_REFERENCE}\`\n- One ephemeral replica; no database; stock resets on restart.\n- Lab environment only, not production infrastructure.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
