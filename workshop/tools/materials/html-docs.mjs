import { execFile } from "node:child_process";
import { isAbsolute, join, relative } from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { materialFiles, root } from "./validation.mjs";
import { runtime } from "./html-docs-runtime.mjs";
import { runBounded, validationJobs } from "./validation-jobs.mjs";
import { validationExecutable } from "./browser-executable.mjs";

const args = process.argv.slice(2);
const jobs = validationJobs(args);
const jobsFlag = args.indexOf("--jobs");
if (jobsFlag !== -1) args.splice(jobsFlag, 2);
const viewportFlag = args.indexOf("--viewport");
const viewport = viewportFlag === -1 ? "1440x900" : args[viewportFlag + 1];
if (!/^\d+x\d+$/.test(viewport ?? "")) throw new Error("Use --viewport WIDTHxHEIGHT.");
const selected = args.filter((arg, index) =>
  viewportFlag === -1 || (index !== viewportFlag && index !== viewportFlag + 1));
const files = selected.length ? selected.map((file) => join(root, file))
  : materialFiles();
// Reserve capacity for the other document validators sharing this pool.
const landingJobs = Math.max(1, jobs - Math.min(jobs - 1, files.length - 1));

const execute = promisify(execFile);
const executable = validationExecutable(chromium.executablePath(), process.env.PLAYWRIGHT_CHROMIUM);
async function run(script, arguments_) {
  const result = await execute(process.execPath, [isAbsolute(script) ? script : join(runtime, script), ...arguments_], {
    cwd: root, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || join(root, "node_modules", "playwright"),
      PLAYWRIGHT_CHROMIUM: executable }
  });
  return result.stdout.trim();
}

const started = performance.now();
console.log(`BROWSER ${executable}`);
await run("sync-head.js", ["--check", ...files]);
const results = await runBounded(files, jobs, async (file) => {
  console.log(`START ${relative(root, file)}`);
  // The hub is a landing page, not an accordion article. Validate its actual
  // agenda surface through the repository browser checks.
  const landing = relative(root, file).replaceAll("\\", "/") === "docs/index.html";
  const result = await run(landing ? join(root, "workshop", "tools", "materials", "browser.mjs") : "validate.js",
    landing ? ["--page", "docs\\index.html", "--viewport", viewport, "--jobs", String(landingJobs)] :
      [file, "--viewport", viewport]);
  return `VALIDATE ${relative(root, file)} ${viewport}\n${result.split(/\r?\n/).at(-1)}`;
});
console.log(results.join("\n"));
console.log(`PASS ${files.length} materials at ${viewport}: eight palettes, offline, navigation, print and no-JS reference. ${((performance.now() - started) / 1000).toFixed(2)}s; ${jobs} workers.`);
