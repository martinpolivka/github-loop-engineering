import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertCompilerStamp, compilerProbeVersion, expectedCompilerVersion } from "./workflow-version.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const live = args.includes("--live");

function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`--${name} needs a value.`);
  return args[index + 1];
}

function run(tool, toolArgs, required = true) {
  try {
    return execFileSync(tool, toolArgs, {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], cwd: root, timeout: 30_000
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    if (required) throw new Error(`${tool} ${toolArgs.join(" ")} failed: ${detail}`);
    console.log(`UNKNOWN ${tool} ${toolArgs.join(" ")}: ${detail}`);
    return null;
  }
}

try {
  const profileId = option("profile", "sandbox");
  if (!["sandbox", "enterprise"].includes(profileId)) throw new Error("Use --profile sandbox or enterprise.");
  const file = profileId === "enterprise" ? "enterprise.example.json" : "sandbox.json";
  const profile = JSON.parse(readFileSync(join(root, "platform", "profiles", file), "utf8"));
  const host = option("host", process.env.GH_HOST ?? profile.githubHost);
  if (!/^[a-z0-9.-]+$/i.test(host)) throw new Error("Invalid GitHub host.");
  const repository = option("repository", null);
  if (repository !== null && !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]+$/.test(repository)) {
    throw new Error("Repository must use OWNER/REPO syntax.");
  }
  if (live && !repository) throw new Error("--live requires the exact --repository OWNER/REPO.");
  if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Node.js 22 or newer is required.");
  for (const name of ["documentation-review", "goal-review", "repository-pulse", "showcase-signal"]) {
    assertCompilerStamp(readFileSync(join(root, ".github", "workflows", `${name}.lock.yml`), "utf8"), name);
  }
  console.log(`PASS node ${process.versions.node}`);
  console.log(`PASS ${run("git", ["--version"])}`);
  const ghVersion = run("gh", ["--version"], live);
  console.log(ghVersion ? `PASS ${ghVersion.split("\n")[0]}` : "SKIP GitHub CLI (required for live operations)");
  console.log(`PASS station workflows compiled with ${expectedCompilerVersion}`);
  const extensions = run("gh", ["extension", "list"], false);
  const compiler = extensions?.includes("gh aw")
    ? compilerProbeVersion(spawnSync("gh", ["aw", "version"], { encoding: "utf8", shell: false, timeout: 30_000 }))
    : "unavailable";
  console.log(compiler === expectedCompilerVersion ? `PASS gh-aw compiler ${compiler}`
    : `WARN gh-aw compiler ${compiler}; keep verified locks or use ${expectedCompilerVersion} to recompile`);
  for (const tool of ["copilot", "opencode"]) {
    const version = run(tool, ["--version"], false);
    console.log(version ? `PASS ${tool} ${version.split("\n")[0]}` : `SKIP ${tool} (use an available harness or reference recovery)`);
  }
  console.log(`PASS profile ${profile.id}: ${profile.label}`);
  console.log("CHECK CLI availability does not prove inference access. Verify Copilot CLI and organization-billed CLI policies, then prove access with a bounded smoke run. Prefer the built-in workflow token; never export the gh CLI OAuth credential.");
  console.log("CHECK Agentic Workflow sources use the rehearsal-verified model gpt-5.3-codex; confirm it on the delivery host.");

  if (live) {
    run("gh", ["auth", "status", "--hostname", host]);
    const api = (path, extra = []) => run("gh", ["api", "--hostname", host, path, ...extra], false);
    const repositoryState = run("gh", ["repo", "view", `https://${host}/${repository}`,
      "--json", "nameWithOwner,isPrivate,viewerPermission"], false);
    console.log(repositoryState ? `PASS repository access ${repositoryState}` : `FAIL repository access ${repository}`);
    const repositoryOwner = repository.split("/")[0];
    const billing = api(`orgs/${repositoryOwner}/copilot/billing`);
    if (billing !== null) {
      const seats = Number(JSON.parse(billing).seat_breakdown?.total ?? 0);
      console.log(seats > 0 ? `PASS Copilot organization entitlement (${seats} assigned seats)`
        : "CHECK Copilot organization entitlement has zero assigned seats");
    }
    const actions = api(`repos/${repository}/actions/permissions`, ["--jq", ".enabled"]);
    console.log(actions === "true" ? "PASS GitHub Actions enabled" : "UNKNOWN GitHub Actions capability");
    const environments = api(`repos/${repository}/environments`, ["--jq", ".total_count"]);
    console.log(environments !== null ? `PASS environments API visible (${environments})` : "UNKNOWN environments capability");
    const security = api(`repos/${repository}`, ["--jq", ".security_and_analysis // {}"]);
    console.log(security && security !== "{}" ? `PASS security capability metadata ${security}`
      : "UNKNOWN security products (check license and repository settings)");
    const quality = api(`repos/${repository}/code-quality/setup`, ["-H", "X-GitHub-Api-Version: 2026-03-10"]);
    if (quality !== null) {
      const setup = JSON.parse(quality);
      const state = String(setup.state ?? setup.status ?? "visible");
      console.log(/configured|enabled/i.test(state) ? `PASS Code Quality ${state}`
        : `CHECK Code Quality API visible but repository state is ${state}`);
    }
    const missing = [];
    for (const artifact of [
      ".github/workflows/repository-pulse.md", ".github/workflows/documentation-review.md",
      ".github/workflows/goal-review.md", ".github/workflows/release-rehearsal.yml",
      ".github/workflows/showcase-signal.md", "data/reservation-telemetry.json", "package.json"
    ]) {
      const found = api(`repos/${repository}/contents/${artifact}`, ["--jq", ".path"]);
      console.log(found ? `PASS prepared artifact ${found}` : `FAIL prepared artifact ${artifact}`);
      if (!found) missing.push(artifact);
    }
    if (!repositoryState || missing.length) throw new Error(`Station repository preflight failed for ${repository}.`);
    console.log("CHECK cloud and partner agent policies in the GitHub agent picker; metadata is not proof of a successful agent run.");
  }
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
}
