import assert from "node:assert/strict";
import { win32 } from "node:path";
import test from "node:test";
import { azureMsiInvocation, run, runJson, runJsonOrMissing } from "../platform/scripts/command.mjs";

test("Azure MSI uses Python directly and preserves argument boundaries", () => {
  const args = ["deployment", "group", "what-if", "--parameters", "@D:\\path with spaces\\params.json"];
  const result = azureMsiInvocation("C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd", args);
  assert.equal(result.file, win32.resolve("C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2", "python.exe"));
  assert.deepEqual(result.args, ["-IBm", "azure.cli", ...args]);
});

test("command runner preserves arguments and reports process failures", () => {
  const value = "spaces & shell | syntax";
  const result = run(process.execPath, ["-e", "console.log(process.argv[1])", value]);
  assert.equal(result.stdout, value);
  assert.equal(result.ok, true);
  assert.throws(() => run(process.execPath, ["-e", "console.error('explicit failure'); process.exit(2)"]),
    /failed \(2\)[\s\S]*explicit failure/);
});

test("JSON helpers distinguish missing resources, invalid JSON, and other failures", () => {
  assert.deepEqual(runJson(process.execPath, ["-e", "console.log(JSON.stringify({ ready: true }))"]), { ready: true });
  assert.throws(() => runJson(process.execPath, ["-e", "console.log('invalid')"]), SyntaxError);
  const fail = (message) => ["-e", `console.error(${JSON.stringify(message)}); process.exit(1)`];
  assert.equal(runJsonOrMissing(process.execPath, fail("HTTP 404"), /HTTP 404/), null);
  assert.throws(() => runJsonOrMissing(process.execPath, fail("HTTP 403"), /HTTP 404/), /HTTP 403/);
});
