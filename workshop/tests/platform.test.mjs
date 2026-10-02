import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { root } from "../tools/materials/validation.mjs";
import { assertCompilerStamp, compilerProbeVersion, expectedCompilerVersion } from "../tools/preflight/workflow-version.mjs";

test("delivery profiles describe capabilities without repository provisioning or seeding", () => {
  for (const id of ["sandbox", "enterprise"]) {
    const file = id === "enterprise" ? "enterprise.example.json" : "sandbox.json";
    const profile = JSON.parse(readFileSync(join(root, "workshop", "profiles", file), "utf8"));
    assert.equal(profile.id, id);
    assert.ok(profile.capabilities.azureOci);
    assert.ok(profile.capabilities.codeQuality);
    for (const retired of ["owner", "repositoryPrefix", "allowRemoteProvision", "allowRemoteSeed", "teams"]) {
      assert.equal(profile[retired], undefined);
    }
  }
});

test("preflight rejects invalid profiles, hosts, and live targets before any external calls", () => {
  for (const args of [
    ["--profile", ".."], ["--profile"], ["--host", "host/other"], ["--live"],
    ["--live", "--repository", "not-a-repository"]
  ]) {
    assert.throws(() => execFileSync(process.execPath,
      [join(root, "workshop", "tools", "preflight", "preflight.mjs"), ...args],
      { cwd: root, stdio: "pipe", timeout: 5000 }), /FAIL/);
  }
});

test("live preflight keeps capability checks host-bound and does not claim inference", () => {
  const source = readFileSync(join(root, "workshop", "tools", "preflight", "preflight.mjs"), "utf8");
  assert.match(source, /orgs\/\$\{repositoryOwner\}\/copilot\/billing/);
  assert.match(source, /Copilot organization entitlement has zero assigned seats/);
  assert.match(source, /does not prove inference access/);
  assert.match(source, /"--hostname", host/);
  assert.match(source, /code-quality\/setup/);
  assert.match(source, /gpt-5\.3-codex/);
  assert.doesNotMatch(source, /"repo", "create"|git.*push|--apply/);
});






test("attendees fork one repository with an isolated demo application and workshop tooling", () => {
  for (const profileName of ["sandbox", "enterprise.example"]) {
    const profile = JSON.parse(readFileSync(join(root, "workshop", "profiles", `${profileName}.json`), "utf8"));
    assert.equal(profile.sourceRepository, undefined, "No separate source repository is published");
  }
  for (const path of [".devcontainer/devcontainer.json", "context/intake/backlog.md", ".agents/skills/requirement-refiner/SKILL.md",
    ".agents/skills/goal-card/SKILL.md", ".agents/skills/azure-release/SKILL.md", ".github/PULL_REQUEST_TEMPLATE.md",
    "demo-app/Dockerfile", "demo-app/package.json", "demo-app/contracts/retail.openapi.json",
    "workshop/azure/retail-environments.json", "docs/templates/adr-template.md",
    "demo-app/src/server.mjs", "demo-app/test/inventory.test.mjs"]) {
    assert.ok(existsSync(join(root, ...path.split("/"))), `${path} is in the fork`);
  }
  for (const retired of ["platform", "scripts", "tests", "templates", "src", "public", "test", "contracts", "data"]) {
    assert.equal(existsSync(join(root, retired)), false, `${retired} must not remain at the root`);
  }
});

test("root commands forward to a dependency-free application and relocated workshop entrypoints", () => {
  const app = JSON.parse(readFileSync(join(root, "demo-app", "package.json"), "utf8"));
  const facade = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(app.engines.node, ">=22");
  assert.equal(app.scripts.start, "node src/server.mjs");
  assert.equal(app.scripts.test, 'node --test "test/**/*.test.mjs"');
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    assert.deepEqual(app[field] ?? {}, {}, `${field} must not introduce app dependencies`);
  }
  assert.equal(facade.scripts.start, "npm --prefix demo-app start");
  assert.equal(facade.scripts.test, "npm --prefix demo-app test");
  for (const command of ["validate", "test:browser", "validate:html", "capture", "serve", "preflight"]) {
    const entrypoint = facade.scripts[command].match(/^node ([^ ]+)/)?.[1];
    assert.ok(entrypoint?.startsWith("workshop/tools/"), `${command} uses workshop tooling`);
    assert.ok(existsSync(join(root, entrypoint)), `${command} entrypoint exists`);
  }
  const release = readFileSync(join(root, ".github", "workflows", "release-rehearsal.yml"), "utf8");
  assert.match(release, /--tag retail-candidate:tested \.\/demo-app/);
  assert.match(readFileSync(join(root, "demo-app", "Dockerfile"), "utf8"), /COPY --chown=node:node src \.\/src/);
});

test("active workflows and preflight share retained synthetic telemetry, not local loop adapters", () => {
  const fixture = "workshop/fixtures/reservation-telemetry.json";
  const telemetry = JSON.parse(readFileSync(join(root, fixture), "utf8"));
  assert.equal(telemetry.synthetic, true);
  const preflight = readFileSync(join(root, "workshop", "tools", "preflight", "preflight.mjs"), "utf8");
  assert.ok(preflight.includes(fixture));
  for (const name of ["showcase-signal", "repository-pulse"]) {
    for (const extension of ["md", "lock.yml"]) {
      const source = readFileSync(join(root, ".github", "workflows", `${name}.${extension}`), "utf8");
      if (name === "showcase-signal" && extension === "md") assert.ok(source.includes(fixture));
      assert.doesNotMatch(source, /scripts\/loop(?:-state|-intake|-issue-adapter)?\.mjs/);
      assert.doesNotMatch(source, /data\/reservation-telemetry\.json/);
    }
  }
});

test("repository opens in a Codespace with Copilot, verifies Azure CLI, and runs the tests", () => {
  const template = root;
  const devcontainer = JSON.parse(readFileSync(join(template, ".devcontainer", "devcontainer.json"), "utf8"));
  assert.match(devcontainer.image, /javascript-node:24/);
  assert.ok(devcontainer.features["ghcr.io/devcontainers/features/github-cli:1"], "GitHub CLI is installed");
  assert.ok(devcontainer.features["ghcr.io/devcontainers/features/copilot-cli:1"], "Copilot CLI is installed");
  assert.equal(devcontainer.features["ghcr.io/devcontainers/features/azure-cli:1"].installBicep, false,
    "Azure CLI is ready for the prepared ARM deployment without adding a second IaC tool");
  assert.equal(devcontainer.features["ghcr.io/devcontainers/features/docker-outside-of-docker:1"].dockerDashComposeVersion, "none",
    "Codespaces can run the optional local image check without installing unused Compose");
  assert.equal(devcontainer.features["ghcr.io/devcontainers/features/docker-outside-of-docker:1"].installDockerBuildx, true);
  assert.equal(devcontainer.name, "Retail reservation station");
  assert.equal(devcontainer.portsAttributes["3000"].label, "Retail service");
  assert.ok(devcontainer.customizations.vscode.extensions.includes("GitHub.copilot-chat"));
  assert.equal(devcontainer.postCreateCommand, "az version && npm test",
    "Creation must fail if Azure CLI is unavailable before running application tests");
  assert.deepEqual(devcontainer.forwardPorts, [3000]);
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

test("repository pulse exposes the read tools required by its evidence contract", () => {
  const source = readFileSync(join(root, ".github", "workflows", "repository-pulse.md"), "utf8").replaceAll("\r\n", "\n");
  assert.match(source, /toolsets: \[repos, issues, pull_requests, actions\]/);
  assert.match(source, /^  actions: read$/m);
  assert.doesNotMatch(source, /^  (?:contents|issues|pull-requests|actions): write$/m);
  assert.match(source, /`gh-aw-agentic-workflow` HTML comment whose `workflow_id` field equals\r?\n`repository-pulse`/);
  assert.match(source, /both creation and body replacement/);
  assert.doesNotMatch(source, /workshop-pulse:v1/);
  assert.match(source, /Exclude the owned pulse Issue from domain backlog comparisons/);
  assert.match(source, /create-issue:\n    title-prefix: "Repository pulse: "\n    labels: \[repository-pulse\]/);
  assert.match(source, /update-issue:\n    target: "\*"\n    body:\n    required-title-prefix: "Repository pulse: "\n    required-labels: \[repository-pulse\]\n    max: 1/);
  assert.doesNotMatch(source, /^    (?:status|title):/m);
  assert.match(source, /use operation `replace`, never append a second report/);
  const lock = readFileSync(join(root, ".github", "workflows", "repository-pulse.lock.yml"), "utf8");
  assert.match(lock, /"GITHUB_TOOLSETS": "repos,issues,pull_requests,actions"/);
  const configLine = lock.split("\n").find((line) => line.trim().startsWith('{"create_issue":'));
  assert.ok(configLine, "Compiled safe-output configuration exists");
  const config = JSON.parse(configLine);
  assert.deepEqual(config.create_issue, {
    labels: ["repository-pulse"], max: 1, title_prefix: "Repository pulse: "
  });
  assert.deepEqual(config.update_issue, {
    allow_body: true, max: 1, required_labels: ["repository-pulse"],
    required_title_prefix: "Repository pulse: ", target: "*"
  });
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
    ["inventory.instructions.md", "demo-app/src/**/*.mjs"],
    ["tests.instructions.md", "demo-app/test/**/*.mjs"],
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
  const backlog = read("context", "intake", "backlog.md");
  for (const title of ["Alert when stock falls below a threshold", "Expire unconfirmed reservations", "dark mode", "CSV"]) {
    assert.ok(backlog.toLowerCase().includes(title.toLowerCase()), `Synthetic backlog retains ${title}`);
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
    "attendee forks must not run a separate Code Security demo workflow");
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
  for (const file of ["AGENTS.md", join(".github", "copilot-instructions.md"),
    ...readdirSync(join(template, ".github", "instructions")).map((name) => join(".github", "instructions", name))]) {
    if (existsSync(join(template, file))) {
      assert.doesNotMatch(read(file), /substitut|same[- ]category|lowest SKU/i, `${file} must not settle the feature before intake`);
    }
  }
});
