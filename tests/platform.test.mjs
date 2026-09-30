import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { root } from "./validation.mjs";
import { assertCompilerStamp, compilerProbeVersion, expectedCompilerVersion } from "../platform/scripts/workflow-version.mjs";
import { issueBody, loadBacklog, missingLabels, planSeed } from "../platform/scripts/backlog.mjs";

test("sandbox profile renders and verifies a station", () => {
  const output = execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"),
    "verify",
    "--profile",
    "sandbox",
    "--station",
    "test01"
  ], { cwd: root, encoding: "utf8" });
  assert.match(output, /PASS rendered station workshop-lab-test01/);
});

test("enterprise example keeps organization-specific values configurable", () => {
  const profile = JSON.parse(readFileSync(join(root, "platform", "profiles", "enterprise.example.json"), "utf8"));
  assert.equal(profile.owner, "REPLACE_WITH_STUDENT_ORGANIZATION");
  assert.equal(profile.allowRemoteProvision, false);
  assert.equal(profile.allowRemoteSeed, true, "Enterprise stations are provisioned by owners but still need the synthetic backlog");
  assert.equal(profile.stationMode, "per-team");
  assert.equal(profile.capabilities.codeQuality, "organization-all-repositories");
});

test("live preflight checks organization Copilot entitlement without claiming inference", () => {
  const source = readFileSync(join(root, "platform", "scripts", "workshop.mjs"), "utf8");
  assert.match(source, /orgs\/\$\{repositoryOwner\}\/copilot\/billing/);
  assert.match(source, /Copilot organization entitlement has zero assigned seats/);
  assert.match(source, /does not prove inference access/);
  assert.match(source, /gpt-5\.3-codex/);
});

test("sandbox remote provision requires explicit apply", () => {
  const output = execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"),
    "provision",
    "--profile",
    "sandbox",
    "--station",
    "test01"
  ], { cwd: root, encoding: "utf8" });
  assert.match(output, /PLAN ONLY/);
});

test("profile owner and host can be supplied at runtime", () => {
  const output = execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"),
    "plan",
    "--profile",
    "sandbox",
    "--station",
    "test01",
    "--owner",
    "runtime-owner",
    "--host",
    "github.example"
  ], { cwd: root, encoding: "utf8" });
  const plan = JSON.parse(output);
  assert.equal(plan.target, "github.example/runtime-owner/workshop-lab-test01");
});

test("attendees fork this repository itself, so the station sits at its root", () => {
  for (const profileName of ["sandbox", "enterprise.example"]) {
    const profile = JSON.parse(readFileSync(join(root, "platform", "profiles", `${profileName}.json`), "utf8"));
    assert.equal(profile.sourceRepository, undefined, "No separate source repository is published");
  }
  for (const path of [".devcontainer/devcontainer.json", "context/intake/backlog.md", ".agents/skills/requirement-refiner/SKILL.md",
    ".agents/skills/goal-card/SKILL.md", ".github/PULL_REQUEST_TEMPLATE.md",
    "src/server.mjs", "test/inventory.test.mjs"]) {
    assert.ok(existsSync(join(root, ...path.split("/"))), `${path} is at the repository root`);
  }
  assert.equal(existsSync(join(root, "platform", "templates", "station-repository")), false);
});

test("repository opens in a Codespace with Copilot and runs the tests", () => {
  const template = root;
  const devcontainer = JSON.parse(readFileSync(join(template, ".devcontainer", "devcontainer.json"), "utf8"));
  assert.match(devcontainer.image, /javascript-node:24/);
  assert.ok(devcontainer.features["ghcr.io/devcontainers/features/github-cli:1"], "GitHub CLI is installed");
  assert.ok(devcontainer.features["ghcr.io/devcontainers/features/copilot-cli:1"], "Copilot CLI is installed");
  assert.ok(devcontainer.customizations.vscode.extensions.includes("GitHub.copilot-chat"));
  assert.equal(devcontainer.postCreateCommand, "npm test");
  assert.deepEqual(devcontainer.forwardPorts, [3000]);
});

test("attendee forks carry the planned backlog as a file the intake skill reads", () => {
  const template = root;
  const backlogFile = readFileSync(join(template, "context", "intake", "backlog.md"), "utf8");
  for (const item of loadBacklog(join(root, "platform", "templates", "station-backlog.json")).issues) {
    assert.ok(backlogFile.includes(item.title.replace(/^\[Backlog\]\s*/, "")), `backlog.md names ${item.id}`);
  }
  assert.doesNotMatch(backlogFile, /substitut|alternative|suggest/i);
  const skill = readFileSync(join(template, ".agents", "skills", "requirement-refiner", "SKILL.md"), "utf8");
  assert.match(skill, /context\/intake\/backlog\.md/);
});

test("profile traversal is rejected and concrete enterprise config is ignored", () => {
  assert.throws(() => execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"),
    "cleanup",
    "--profile",
    "..",
    "--station",
    "test01",
    "--apply"
  ], { cwd: root, stdio: "pipe" }));
  const ignore = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(ignore, /^platform\/profiles\/enterprise\.json$/m);
});

test("repository carries reproducible Agentic Workflow inputs", () => {
  const template = root;
  const attributes = readFileSync(join(template, ".gitattributes"), "utf8");
  const workflowConfig = JSON.parse(readFileSync(join(template, ".github", "workflows", "aw.json"), "utf8"));
  const actionsLock = JSON.parse(readFileSync(join(template, ".github", "aw", "actions-lock.json"), "utf8"));

  assert.match(attributes, /\.github\/workflows\/\*\.lock\.yml/);
  assert.equal(workflowConfig.maintenance, false);
  assert.equal(actionsLock.entries["github/gh-aw-actions/setup@v0.86.2"].sha, "6aab9e5b5c91c615506061f09bedd81a23babe3c");
  assert.doesNotThrow(() => readFileSync(join(template, ".github", "workflows", "showcase-signal.md")));
  assert.doesNotThrow(() => readFileSync(join(template, ".github", "workflows", "showcase-signal.lock.yml")));
  for (const name of ["documentation-review", "goal-review", "repository-pulse", "showcase-signal"]) {
    const source = readFileSync(join(template, ".github", "workflows", `${name}.md`), "utf8");
    assert.match(source, /^model: gpt-5\.3-codex$/m,
      `${name} must use the model verified in the target host's live Copilot catalog`);
    assert.equal(assertCompilerStamp(readFileSync(join(template, ".github", "workflows", `${name}.lock.yml`), "utf8"), name),
      expectedCompilerVersion);
  }
  for (const name of ["documentation-review", "goal-review", "repository-pulse"]) {
    assert.match(readFileSync(join(template, ".github", "workflows", `${name}.md`), "utf8"), /^checkout: false$/m,
      `${name} must inspect a fork through GitHub tools without checking out code`);
  }
  for (const name of [
    "issue-triage.starter",
    "issue-triage.reference",
    "deployment-readiness.starter",
    "deployment-readiness.reference"
  ]) {
    const source = readFileSync(join(template, "docs", "labs", "05-agentic-outer-loop", "artifacts", `${name}.md`), "utf8");
    assert.match(source, /^checkout: false$/m, `${name} must remain executable in an attendee fork`);
    assert.match(source, /^model: gpt-5\.3-codex$/m,
      `${name} must use the model verified in the target host's live Copilot catalog`);
  }
});

test("preflight refuses missing or drifted compiled workflow stamps", () => {
  assert.throws(() => assertCompilerStamp("name: Not generated", "test"), /missing/);
  assert.throws(() => assertCompilerStamp('# gh-aw-metadata: {"compiler_version":"v0.1.0"}', "test"),
    /expected v0\.86\.2/);
  assert.throws(() => assertCompilerStamp("# gh-aw-metadata: invalid JSON", "test"));
});

test("an unavailable optional compiler preserves the verified compiled fallback", () => {
  for (const code of ["ETIMEDOUT", "ENOENT"]) {
    assert.equal(compilerProbeVersion({ error: { code }, status: null }), `unavailable (${code})`);
  }
  assert.equal(compilerProbeVersion({ status: 1 }), "unavailable");
  assert.equal(compilerProbeVersion({ status: 0, stdout: "", stderr: "gh-aw v0.86.2" }), expectedCompilerVersion);
});

test("primary harnesses use Copilot without an Anthropic dependency", () => {
  const template = root;
  for (const directory of [template]) {
    for (const name of ["documentation-review", "goal-review", "repository-pulse", "showcase-signal"]) {
      const source = readFileSync(join(directory, ".github", "workflows", `${name}.md`), "utf8");
      assert.match(source, /^engine: copilot$/m);
      assert.doesNotMatch(source, /ANTHROPIC_API_KEY/);
      assert.match(source, /copilot-requests:\s*write/);
    }
  }
  const lab = readFileSync(join(root, "docs", "labs", "02-inner-loop", "index.html"), "utf8");
  assert.match(lab, /Copilot/);
  assert.match(readFileSync(join(template, "AGENTS.md"), "utf8"), /Copilot.*OpenCode/);
  assert.match(readFileSync(join(template, ".github", "CODEOWNERS"), "utf8"), /\/AGENTS\.md/);
});

test("verification preserves an existing station and cleanup rejects an unowned directory", () => {
  const station = `safety-${process.pid}`;
  const directory = join(root, ".workshop", `workshop-lab-${station}`);
  assert.equal(existsSync(directory), false);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "keep.txt"), "Unrelated learner work");
  const invoke = (command, extra = []) => execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"), command,
    "--profile", "sandbox", "--station", station, ...extra
  ], { cwd: root, encoding: "utf8", stdio: "pipe" });
  try {
    assert.match(invoke("verify"), /PASS rendered station/);
    assert.equal(readFileSync(join(directory, "keep.txt"), "utf8"), "Unrelated learner work");
    assert.throws(() => invoke("render"), /Station already exists/);
    assert.throws(() => invoke("cleanup", ["--apply"]), /ownership marker is missing/);
    assert.equal(readFileSync(join(directory, "keep.txt"), "utf8"), "Unrelated learner work");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("backlog seed plan is idempotent and never duplicates existing work", () => {
  const backlog = loadBacklog(join(root, "platform", "templates", "station-backlog.json"));
  const first = planSeed(backlog, []);
  assert.ok(first.every((item) => item.action === "create"));
  const created = backlog.issues.map((issue, index) => ({ number: index + 1, title: issue.title, body: issueBody(issue) }));
  assert.ok(planSeed(backlog, created).every((item) => item.action === "skip" && item.reason === "seed marker present"));
  const renamed = [{ number: 9, title: "Renamed by a facilitator", body: issueBody(backlog.issues[0]) }];
  assert.equal(planSeed(backlog, renamed)[0].action, "skip");
  const manual = [{ number: 10, title: backlog.issues[1].title, body: "Created by hand" }];
  assert.equal(planSeed(backlog, manual)[1].reason, "same title already exists");
  assert.ok(planSeed(backlog, null).every((item) => item.action === "unverified"));
  assert.deepEqual(missingLabels(backlog, ["backlog"]).map((label) => label.name), ["workshop-seed"]);
  assert.deepEqual(missingLabels(backlog, ["Backlog", "Workshop-Seed"]), [], "GitHub label names are case-insensitive");
  assert.doesNotMatch(JSON.stringify(backlog), /substitut|alternative|suggest/i,
    "The seeded backlog must not pre-plan the workshop feature");
});

test("backlog seed is dry-run by default and refuses unsafe apply targets", () => {
  const invoke = (extra) => execFileSync(process.execPath, [
    join(root, "platform", "scripts", "workshop.mjs"), "seed", "--profile", "sandbox", "--station", "test01", ...extra
  ], { cwd: root, encoding: "utf8", stdio: "pipe" });
  const output = invoke(["--offline"]);
  assert.match(output, /workshop-lab-test01/);
  assert.match(output, /UNVERIFIED \[Backlog\] Alert when stock falls below a threshold/);
  assert.match(output, /DRY RUN/);
  assert.throws(() => invoke(["--offline", "--apply"]), /cannot apply offline/);
  assert.throws(() => invoke(["--repository", "workshop-owner/github-loop-engineering", "--apply"]),
    /applies only to workshop-owner\/workshop-lab-test01/);
  assert.throws(() => invoke(["--repository", "workshop-owner/workshop-lab-other", "--apply"]),
    /applies only to workshop-owner\/workshop-lab-test01/, "A different station repository is refused");
});

test("station evidence, intake skill, and path-scoped instructions stay consistent", () => {
  const template = root;
  const read = (...parts) => readFileSync(join(template, ...parts), "utf8");
  const refiner = read(".agents", "skills", "requirement-refiner", "SKILL.md");
  const frontmatter = refiner.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  assert.match(frontmatter, /^name: requirement-refiner$/m);
  assert.match(frontmatter, /^description: .+/m);
  assert.match(refiner, /CONFIRMED:/);
  assert.match(refiner, /APPROVED FEATURE: Create one issue in TARGET-OWNER\/github-loop-engineering-NN/);
  assert.match(refiner, /APPROVED BUG: Create one issue in TARGET-OWNER\/github-loop-engineering-NN/);
  assert.match(refiner, /Approval for one draft never approves the other/i);
  assert.match(refiner, /Do not read workshop answers or reference implementations under `docs\/`/);
  assert.match(refiner, /exact `nameWithOwner`/);
  assert.match(refiner, /workshop organization in the Station profile/);
  assert.match(refiner, /attendee's account in Sandbox/);
  assert.match(refiner, /gh issue create --repo <verified-nameWithOwner>/);
  assert.match(refiner, /\.github\/ISSUE_TEMPLATE\/\*\.yml/);

  for (const [file, glob] of [
    ["inventory.instructions.md", "src/**/*.mjs"],
    ["tests.instructions.md", "test/**/*.mjs"],
    ["intake-context.instructions.md", "context/**"]
  ]) {
    assert.match(read(".github", "instructions", file), new RegExp(`^---\\r?\\napplyTo: "${glob.replaceAll("*", "\\*")}"\\r?\\n---`), file);
  }
  assert.match(read(".github", "CODEOWNERS"), /^\/context\/ /m);

  const evidenceFiles = [
    "customer-ticket.md",
    "partial-stock-ticket.md",
    "reservation-api.log",
    "chat-thread.md",
    "meeting-notes.md",
    "stakeholder-email.md",
    "backlog.md"
  ];
  const context = evidenceFiles.map((name) => read("context", "intake", name)).join("\n");
  assert.match(context, /SUP-4102/);
  assert.match(context, /SUP-4113/);
  assert.match(read("context", "intake", "customer-ticket.md"), /REQ-S12-4102/);
  assert.match(read("context", "intake", "reservation-api.log"), /request_id=REQ-S12-4102/);
  assert.match(read("context", "intake", "meeting-notes.md"), /Treat `SUP-4102` as a feature request/);
  assert.match(read("context", "intake", "meeting-notes.md"), /first by SKU/);
  assert.match(read("context", "intake", "meeting-notes.md"), /`suggestion` field/);
  assert.match(read("context", "intake", "meeting-notes.md"), /Omit `suggestion` when no item/);
  assert.match(read("context", "intake", "meeting-notes.md"), /Confirmed bug contract for SUP-4113/);
  assert.match(read("context", "intake", "partial-stock-ticket.md"), /REQ-S07-4113/);
  assert.match(read("context", "intake", "README.md"), /WorkIQ MCP/);
  assert.equal(existsSync(join(template, "context", "intake", "ticket-digest.md")), false);
  const backlog = loadBacklog(join(root, "platform", "templates", "station-backlog.json"));
  const ids = new Set(backlog.issues.map((issue) => issue.id));
  for (const id of ["low-stock-alert", "reservation-expiry", "dashboard-dark-mode", "audit-csv-export"]) {
    assert.ok(ids.has(id), `Backlog item '${id}' must be seeded`);
  }
  assert.equal(existsSync(join(template, "feature-request.md")), false);
  assert.equal(existsSync(join(template, ".github", "ISSUE_TEMPLATE", "reservation-feature.yml")), true);
  assert.equal(existsSync(join(template, ".github", "ISSUE_TEMPLATE", "reservation-bug.yml")), true);
  for (const file of [
    ".agents/skills/goal-card/SKILL.md",
    ".agents/skills/goal-card/assets/goal-card-template.md",
    ".agents/skills/goal-review/SKILL.md",
    ".agents/skills/documentation-review/SKILL.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    ".github/workflows/title-check.yml",
    ".github/workflows/release-rehearsal.yml"
  ]) {
    assert.equal(existsSync(join(template, file)), true, `${file} is prepared before the fork`);
  }
  assert.equal(existsSync(join(template, ".github", "workflows", "codeql.yml")), false,
    "attendee forks must not run a Code Security workflow; CodeQL remains in the facilitator security demo");
  assert.equal(existsSync(join(template, ".github", "skills", "goal-card")), false,
    "The open-standard skill must not be duplicated under the GitHub-specific path");
  assert.equal(existsSync(join(template, ".github", "agents")), false,
    "Workflow logic and manual fallbacks use open-standard skills, not proprietary agent wrappers");
  const skill = read(".agents", "skills", "goal-card", "SKILL.md");
  assert.match(skill, /does not start the task/i);
  assert.match(skill, /STOP-CAPS/);
  assert.match(skill, /assess-act-check-adjust/i);
  assert.equal(existsSync(join(template, ".agents", "skills", "quality-review")), false,
    "Native Copilot code review replaces the duplicate custom general quality reviewer");
  assert.equal(existsSync(join(template, ".github", "workflows", "quality-review.md")), false,
    "Native Copilot code review replaces the duplicate general PR workflow");
  for (const name of ["documentation-review", "goal-review"]) {
    const workflow = read(".github", "workflows", `${name}.md`);
    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /types: \[opened, synchronize, reopened\]/);
    assert.match(workflow, /pull-requests: read/);
    assert.doesNotMatch(workflow, /pull-requests: write/);
    assert.match(workflow, /add-comment:/);
    assert.match(workflow, /head SHA/i);
  }
  assert.match(read(".github", "workflows", "title-check.yml"), /PR_TITLE/);
  assert.doesNotMatch(read(".github", "workflows", "title-check.yml"), /run:.*github\.event\.pull_request\.title/);
  for (const file of ["AGENTS.md", "CLAUDE.md", join(".github", "copilot-instructions.md"),
    ...readdirSync(join(template, ".github", "instructions")).map((name) => join(".github", "instructions", name))]) {
    if (existsSync(join(template, file))) {
      assert.doesNotMatch(read(file), /substitut|same[- ]category|lowest SKU/i, `${file} must not settle the feature before intake`);
    }
  }
});
