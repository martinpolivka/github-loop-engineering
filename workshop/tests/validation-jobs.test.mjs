import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout } from "node:timers/promises";
import { runBounded, validationJobs } from "../tools/materials/validation-jobs.mjs";
import { dirname, join } from "node:path";
import { validationExecutable } from "../tools/materials/browser-executable.mjs";

test("canonical validation selects only the matching pinned headless revision", () => {
  const executable = join("cache", "chromium-1234", "chrome-platform", "chrome.exe");
  const headless = join("cache", "chromium_headless_shell-1234");
  const folder = join(headless, "headless-platform");
  const entries = (directory) => directory === headless
    ? [{ name: "headless-platform", isDirectory: () => true }]
    : [{ name: "chrome-headless-shell.exe", isFile: () => true }];
  assert.equal(validationExecutable(executable, undefined, (path) => path === headless, entries),
    join(folder, "chrome-headless-shell.exe"));
  assert.equal(validationExecutable(executable, undefined, () => false), executable);
  assert.equal(validationExecutable(executable, "approved-browser"), "approved-browser");
  assert.equal(validationExecutable(join(dirname(executable), "custom.exe"), undefined, () => false),
    join(dirname(executable), "custom.exe"));
});

test("validation worker arguments are bounded and invalid values fail", () => {
  assert.ok(validationJobs([]) >= 1 && validationJobs([]) <= 8);
  assert.equal(validationJobs(["--jobs", "1"]), 1);
  assert.equal(validationJobs(["--jobs", "16"]), 16);
  for (const value of [undefined, "0", "-1", "1.5", "17", "two"]) {
    assert.throws(() => validationJobs(["--jobs", value]), /integer from 1 to 16/);
  }
});

test("bounded validation preserves all jobs and input order", async () => {
  let active = 0;
  let maximum = 0;
  const seen = [];
  const results = await runBounded([30, 10, 1, 5], 2, async (delay, index) => {
    maximum = Math.max(maximum, ++active);
    await setTimeout(delay);
    seen.push(index);
    active--;
    return index;
  });
  assert.equal(maximum, 2);
  assert.deepEqual(results, [0, 1, 2, 3]);
  assert.deepEqual(seen.toSorted(), [0, 1, 2, 3]);
});

test("a failed validation stops new jobs but drains already running workers", async () => {
  const seen = [];
  let drained = false;
  await assert.rejects(runBounded([0, 1, 2, 3], 2, async (index) => {
    seen.push(index);
    if (index === 0) throw new Error("Deliberate failure");
    await setTimeout(20);
    drained = true;
  }), /Deliberate failure/);
  assert.deepEqual(seen, [0, 1]);
  assert.equal(drained, true);
  await assert.rejects(runBounded([1], 0, () => {}), /positive integer/);
});
