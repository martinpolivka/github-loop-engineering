import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { inspectMaterial } from "../tools/materials/smoke.mjs";
import { root } from "../tools/materials/validation.mjs";

test("edit-time smoke detects layout, image and navigation failures", async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  try {
    const context = await browser.newContext({ offline: true, reducedMotion: "reduce",
      viewport: { width: 1280, height: 720 } });
    try {
      const page = await context.newPage();
      const source = readFileSync(join(root, "docs", "loop-engineering.en.html"), "utf8");
      await page.setContent(source, { waitUntil: "load" });
      assert.deepEqual((await inspectMaterial(page)).failures, []);
      await page.addStyleTag({ content: "#s-end > p { min-width: 2000px; }" });
      assert.match((await inspectMaterial(page)).failures.join("\n"), /s-end: .*overflow|s-end: P outside/);
      await page.setContent(source, { waitUntil: "load" });
      await page.evaluate(() => document.querySelector("#s-title img").src = "data:image/png;base64,invalid");
      assert.match((await inspectMaterial(page)).failures.join("\n"), /Image did not decode/);
      await page.setContent(source, { waitUntil: "load" });
      await page.evaluate(() => document.addEventListener("keydown", (event) => event.stopImmediatePropagation(), true));
      assert.match((await inspectMaterial(page)).failures.join("\n"), /navigation failed/);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
