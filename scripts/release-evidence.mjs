import { X509Certificate } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const shaPattern = /^[0-9a-f]{40}$/;
const digestPattern = /^sha256:[0-9a-f]{64}$/;
export const smokeChecks = ["health", "stock-read", "synthetic-reservation"];

function requireValue(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
}

export function releaseConfig(env) {
  const registry = requireValue(env.ACR_LOGIN_SERVER, /^[a-z0-9]{5,50}\.azurecr\.io$/, "ACR login server");
  const repository = requireValue(env.ACR_REPOSITORY, /^stations\/[a-z0-9-]{2,31}\/retail-reservation$/, "station image repository");
  return {
    candidateSha: requireValue(env.CANDIDATE_SHA, shaPattern, "full candidate SHA"),
    repository: requireValue(env.GITHUB_REPOSITORY, /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/, "GitHub repository"),
    runId: requireValue(env.GITHUB_RUN_ID, /^[1-9][0-9]*$/, "workflow run ID"),
    runAttempt: requireValue(env.GITHUB_RUN_ATTEMPT, /^[1-9][0-9]*$/, "workflow run attempt"),
    imageRepository: `${registry}/${repository}`,
    baseImage: requireValue(env.RETAIL_BASE_IMAGE, /^docker\.io\/library\/node:24-alpine@sha256:[0-9a-f]{64}$/, "digest-pinned Node.js 24 base image")
  };
}

export function assertEvidence(evidence, config, { published = false } = {}) {
  if (evidence.schema !== "retail-oci-release/v1" || evidence.workflow !== "Trusted OCI release" ||
      evidence.deterministicTests !== "passed" ||
      JSON.stringify(evidence.smokeChecks) !== JSON.stringify(smokeChecks)) {
    throw new Error("Missing or incompatible deterministic release evidence.");
  }
  for (const key of ["candidateSha", "repository", "runId", "runAttempt", "imageRepository", "baseImage"]) {
    if (evidence[key] !== config[key]) throw new Error(`Release evidence ${key} mismatch.`);
  }
  requireValue(evidence.imageId, digestPattern, "local image ID");
  if (published) {
    requireValue(evidence.imageDigest, digestPattern, "OCI manifest digest");
    if (evidence.imageReference !== `${config.imageRepository}@${evidence.imageDigest}`) {
      throw new Error("Release image reference must use the exact repository and digest, never a tag.");
    }
  }
  return evidence;
}

export function trustPolicy(imageRepository, certificatePem, expectedFingerprint, now = Date.now()) {
  requireValue(imageRepository, /^[a-z0-9]{5,50}\.azurecr\.io\/stations\/[a-z0-9-]{2,31}\/retail-reservation$/, "trust scope");
  requireValue(expectedFingerprint, /^[0-9a-f]{64}$/, "trusted public certificate SHA-256");
  const certificate = new X509Certificate(certificatePem);
  if (certificate.fingerprint256.replaceAll(":", "").toLowerCase() !== expectedFingerprint) {
    throw new Error("Public certificate differs from the platform-approved trust root.");
  }
  // The workshop certificate deliberately has one DN component, avoiding ambiguous DN conversion.
  requireValue(certificate.subject, /^CN=workshop-[a-z0-9-]{3,50}$/, "workshop certificate subject");
  if (now < Date.parse(certificate.validFrom) || now >= Date.parse(certificate.validTo)) {
    throw new Error("Workshop signing certificate is not currently valid.");
  }
  return {
    version: "1.0",
    trustPolicies: [{
      name: "workshop-station",
      registryScopes: [imageRepository],
      signatureVerification: { level: "strict" },
      trustStores: ["ca:workshop"],
      trustedIdentities: [`x509.subject: ${certificate.subject}`]
    }]
  };
}

export function promoteEvidence(evidence, testConfig, prodConfig, expectedPolicy, testFingerprint, digest) {
  assertEvidence(evidence, testConfig, { published: true });
  if (testConfig.imageRepository === prodConfig.imageRepository) throw new Error("Test and prod must use different registries.");
  if (evidence.signatureVerification !== "passed" || evidence.environment !== "workshop-test" ||
      JSON.stringify(evidence.trustPolicy) !== JSON.stringify(expectedPolicy) ||
      evidence.certificateSha256 !== testFingerprint) {
    throw new Error("Promotion needs matching, strictly verified test-environment evidence.");
  }
  if (digest !== evidence.imageDigest) throw new Error("Promotion must preserve the test manifest digest; do not rebuild.");
  const result = {
    ...evidence, imageRepository: prodConfig.imageRepository,
    imageReference: `${prodConfig.imageRepository}@${evidence.imageDigest}`,
    testImageReference: evidence.imageReference, testCertificateSha256: evidence.certificateSha256,
    signatureVerification: "pending", environment: "workshop-prod"
  };
  delete result.trustPolicy;
  delete result.certificateSha256;
  assertEvidence(result, prodConfig, { published: true });
  return result;
}

async function currentMain(env, candidateSha) {
  const api = new URL(env.GITHUB_API_URL);
  if (api.protocol !== "https:" || !/^(api\.github\.com|api\.[a-z0-9-]+\.ghe\.com)$/.test(api.hostname)) {
    throw new Error("Unexpected GitHub API origin.");
  }
  if (env.GITHUB_REF !== "refs/heads/main" || env.GITHUB_EVENT_NAME !== "workflow_dispatch") {
    throw new Error("Release can run only from main through workflow_dispatch.");
  }
  const response = await fetch(`${api.href.replace(/\/$/, "")}/repos/${env.GITHUB_REPOSITORY}/commits/main`, {
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`Current-main lookup failed: HTTP ${response.status}.`);
  if ((await response.json()).sha !== candidateSha) throw new Error("Candidate is no longer current main.");
}

function output(name, value) {
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required for workflow evidence.");
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function main(command, directory) {
  const env = process.env;
  const config = releaseConfig(env);
  mkdirSync(directory, { recursive: true });
  const file = join(directory, "release.json");
  if (command === "candidate") {
    await currentMain(env, config.candidateSha);
  } else if (command === "build") {
    const evidence = {
      schema: "retail-oci-release/v1", workflow: "Trusted OCI release", ...config,
      imageId: env.IMAGE_ID, deterministicTests: "passed", smokeChecks,
      externalProductionDeployment: "not performed"
    };
    assertEvidence(evidence, config);
    writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`);
  } else if (command === "publish") {
    const evidence = assertEvidence(JSON.parse(readFileSync(file, "utf8")), config);
    if (env.IMAGE_ID !== evidence.imageId) throw new Error("Loaded image differs from tested local image.");
    const imageDigest = requireValue(env.IMAGE_DIGEST, digestPattern, "published digest");
    const published = { ...evidence, imageDigest, imageReference: `${config.imageRepository}@${imageDigest}` };
    assertEvidence(published, config, { published: true });
    writeFileSync(file, `${JSON.stringify(published, null, 2)}\n`);
  } else if (command === "promote") {
    const testConfig = releaseConfig({ ...env, ACR_LOGIN_SERVER: env.TEST_ACR_LOGIN_SERVER });
    const testEvidence = assertEvidence(JSON.parse(readFileSync(file, "utf8")), testConfig, { published: true });
    const expectedTestPolicy = trustPolicy(testConfig.imageRepository,
      Buffer.from(env.TEST_SIGNING_CERTIFICATE_BASE64 ?? "", "base64").toString("utf8"),
      env.TEST_SIGNING_CERTIFICATE_SHA256);
    const promoted = promoteEvidence(testEvidence, testConfig, config,
      expectedTestPolicy, env.TEST_SIGNING_CERTIFICATE_SHA256, env.IMAGE_DIGEST);
    writeFileSync(file, `${JSON.stringify(promoted, null, 2)}\n`);
  } else if (command === "read") {
    const evidence = assertEvidence(JSON.parse(readFileSync(file, "utf8")), config, { published: true });
    output("image_reference", evidence.imageReference);
  } else if (command === "trust") {
    const pem = Buffer.from(env.SIGNING_CERTIFICATE_BASE64 ?? "", "base64").toString("utf8");
    const policy = trustPolicy(config.imageRepository, pem, env.SIGNING_CERTIFICATE_SHA256);
    writeFileSync(join(directory, "certificate.pem"), pem);
    writeFileSync(join(directory, "trustpolicy.json"), `${JSON.stringify(policy, null, 2)}\n`);
  } else if (command === "verified") {
    const evidence = assertEvidence(JSON.parse(readFileSync(file, "utf8")), config, { published: true });
    const policy = trustPolicy(config.imageRepository,
      Buffer.from(env.SIGNING_CERTIFICATE_BASE64 ?? "", "base64").toString("utf8"), env.SIGNING_CERTIFICATE_SHA256);
    if (!["test", "prod"].includes(env.RELEASE_ENVIRONMENT)) throw new Error("Use the test or prod release environment.");
    const verified = {
      ...evidence, signatureVerification: "passed", trustPolicy: policy,
      environment: `workshop-${env.RELEASE_ENVIRONMENT}`, certificateSha256: env.SIGNING_CERTIFICATE_SHA256
    };
    writeFileSync(join(directory, "verified-release.json"), `${JSON.stringify(verified, null, 2)}\n`);
    appendFileSync(env.GITHUB_STEP_SUMMARY,
      `## Verified OCI release candidate\n\n` +
      `- Candidate SHA: \`${config.candidateSha}\`\n- Run: ${config.runId}, attempt ${config.runAttempt}\n` +
      `- Image: \`${verified.imageReference}\`\n- Notation policy: strict\n` +
      `- Signer: \`${policy.trustPolicies[0].trustedIdentities[0]}\`\n` +
      `- Certificate SHA-256: \`${verified.certificateSha256}\`\n` +
      `- Environment: ${verified.environment}; inspect its deployment record\n` +
      `- Azure authorization: both lab identities are Owner on one allocated group; not production isolation\n` +
      `- External production deployment: not performed\n`);
  } else {
    throw new Error(`Unknown release evidence command: ${command}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv[2], process.argv[3] ?? "release");
}
