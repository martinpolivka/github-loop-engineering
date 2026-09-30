import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { root } from "./validation.mjs";

const workflow = readFileSync(join(root, ".github", "workflows", "release-rehearsal.yml"), "utf8");

test("release rehearsal binds the package to an exact current main revision", () => {
  assert.match(workflow, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /GITHUB_API_URL.*commits\/main/);
  assert.match(workflow, /Authorization: Bearer \$GITHUB_TOKEN/);
  assert.match(workflow, /\[\[ "\$main_sha" == "\$CANDIDATE_SHA" \]\]/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /release\/release\.json/);
  assert.match(workflow, /candidateSha: process\.env\.CANDIDATE_SHA/);
});

test("release rehearsal proves the package before an environment-gated promotion", () => {
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /\/health/);
  assert.match(workflow, /sha256sum pharmacy-reservation\.tgz/);
  assert.match(workflow, /sha256sum --check pharmacy-reservation\.tgz\.sha256/);
  assert.match(workflow, /environment:\s*\n\s*name: workshop-preview/);
  assert.match(workflow, /External production deployment: not performed/);
});

test("release rehearsal keeps permissions read-only and actions immutable", () => {
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow, /id-token:\s*write|contents:\s*write/);
  for (const use of workflow.matchAll(/uses:\s*([^\s]+)/g)) {
    assert.match(use[1], /@[0-9a-f]{40}$/, `${use[1]} must use an immutable commit SHA`);
  }
});
