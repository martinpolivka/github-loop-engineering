import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { root } from "../tools/materials/validation.mjs";

const moduleUrl = pathToFileURL(join(root, "workshop", "tools", "materials", "html-docs-runtime.mjs")).href;
const vendoredRoot = join(root, ".agents", "skills", "html-docs");

function loadRuntime(override, cwd = root) {
  const env = { ...process.env };
  delete env.HTML_DOCS_SKILL;
  if (override !== undefined) env.HTML_DOCS_SKILL = override;
  return spawnSync(process.execPath, [
    "--input-type=module", "-e",
    `const { skillRoot, runtime } = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify({ skillRoot, runtime }));`
  ], { cwd, env, encoding: "utf8" });
}

test("html-docs defaults to the complete vendored skill outside the repository cwd", () => {
  const result = loadRuntime(undefined, tmpdir());
  assert.equal(result.status, 0, result.stderr);
  const paths = JSON.parse(result.stdout);
  // fileURLToPath preserves the trailing directory separator.
  assert.equal(join(paths.skillRoot, "assets"), join(vendoredRoot, "assets"));
  assert.equal(paths.runtime, join(vendoredRoot, "assets"));
  assert.match(readFileSync(join(vendoredRoot, "SKILL.md"), "utf8"), /name: html-docs/);
  assert.match(readFileSync(join(vendoredRoot, "LICENSE"), "utf8"), /MIT License/);
  for (const file of ["article.template.html", "deck.template.html", "sheet.template.html",
    "references/validation.md", "assets/bundle.js", "assets/validate.js", "assets/export-pdf.js"]) {
    assert.ok(existsSync(join(vendoredRoot, ...file.split("/"))), file);
  }
});

test("html-docs honors an explicit relative installation override", () => {
  const result = loadRuntime(join(".agents", "skills", "html-docs"));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).skillRoot, vendoredRoot);
});

test("vendored CommonJS tools run inside the ES-module station repository", () => {
  const result = spawnSync(process.execPath, [
    join(vendoredRoot, "assets", "sync-head.js"),
    "--check", join(root, "docs", "index.html")
  ], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("html-docs reports a missing override validator without falling back", () => {
  const result = loadRuntime(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /The html-docs validator is missing/);
  assert.match(result.stderr, /Restore \.agents\/skills\/html-docs or set HTML_DOCS_SKILL/);
});
