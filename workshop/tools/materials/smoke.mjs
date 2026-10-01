import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { materialFiles, root, validateRepository } from "./validation.mjs";

// One browser evaluation per theme avoids hundreds of protocol round trips.
export async function inspectMaterial(page) {
  return page.evaluate(async () => {
    const failures = [];
    const check = (ok, message) => { if (!ok) failures.push(message); };
    const key = (value) => (document.querySelector(".slide[data-current], [data-slide-current]") || document.body).dispatchEvent(new KeyboardEvent("keydown",
      { key: value, bubbles: true, cancelable: true }));
    await Promise.all([...document.images].map(async (image) => {
      try { await image.decode(); }
      catch (error) { failures.push(`Image did not decode: ${image.alt}: ${error.message}`); }
    }));
    check(document.querySelectorAll("h1").length === 1, "Expected one h1");
    check(document.querySelectorAll("main").length === 1, "Expected one main");
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    check(new Set(ids).size === ids.length, "Duplicate DOM IDs");
    const toggle = document.querySelector('[data-action="toggle-theme"]');
    check(Boolean(toggle), "Theme control missing");
    const startTheme = document.documentElement.dataset.theme;
    const deck = Boolean(document.querySelector(".deck-stage"));
    const presentation = document.querySelector('[data-action="toggle-slides"]');
    const slides = deck ? [...document.querySelectorAll(".deck-stage > .slide")] :
      presentation ? [...document.querySelectorAll(".doc-header, main > .chapter, main > .chapter > .card, .takeaway")] : [];
    const checkSurface = (node) => {
      const box = node.getBoundingClientRect();
      check(box.width > 0 && box.height > 0, `${node.id}: invisible presentation`);
      check(node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1,
        `${node.id}: presentation overflow`);
      for (const child of node.querySelectorAll("h1, h2, p, li, blockquote, svg, img")) {
        if (!child.getClientRects().length || getComputedStyle(child).visibility === "hidden") continue;
        const bounds = child.getBoundingClientRect();
        check(bounds.left >= box.left - 1 && bounds.right <= box.right + 1 &&
          bounds.top >= box.top - 1 && bounds.bottom <= box.bottom + 1,
        `${node.id}: ${child.tagName} outside presentation`);
      }
      for (const svg of node.querySelectorAll("svg[viewBox]")) {
        const bounds = svg.getBBox();
        const canvas = svg.viewBox.baseVal;
        check(bounds.x >= canvas.x - 1 && bounds.y >= canvas.y - 1 &&
          bounds.x + bounds.width <= canvas.x + canvas.width + 1 &&
          bounds.y + bounds.height <= canvas.y + canvas.height + 1, `${node.id}: SVG cropping`);
      }
    };
    for (const theme of [startTheme, startTheme === "light" ? "dark" : "light"]) {
      if (document.documentElement.dataset.theme !== theme) toggle?.click();
      check(document.documentElement.dataset.theme === theme, "Theme toggle failed");
      if (slides.length) {
        if (!deck && document.documentElement.dataset.view !== "slides") presentation.click();
        key("Home");
        for (const slide of slides) {
          const current = document.querySelector(deck ? ".slide[data-current]" : "[data-slide-current]");
          check(current === slide, `${slide.id}: navigation failed`);
          const surface = deck ? slide : slide.querySelector(":scope > .slide-content, :scope > .chapter-label");
          check(Boolean(surface), `${slide.id}: presentation surface missing`);
          if (surface) checkSurface(surface);
          key("PageDown");
        }
        key("Home");
        check(document.querySelector(deck ? ".slide[data-current]" : "[data-slide-current]") === slides[0],
          "Home navigation failed");
        if (!deck) key("Escape");
      } else {
        check(document.documentElement.scrollWidth <= innerWidth + 1, "Reading overflow");
        check(document.querySelectorAll(".hub-agenda .agenda > li").length === 10, "Incomplete agenda");
      }
    }
    return { failures, slides: slides.length };
  });
}

export async function smoke(files) {
  const started = performance.now();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  try {
    const context = await browser.newContext({ offline: true, reducedMotion: "reduce", colorScheme: "dark",
      viewport: { width: 1280, height: 720 } });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const problems = [];
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("requestfailed", (request) => problems.push(`Failed request: ${request.url()}`));
      page.on("request", (request) => {
        if (/^https?:/.test(request.url())) problems.push(`Required network asset: ${request.url()}`);
      });
      for (const file of files) {
        await page.goto(`${pathToFileURL(file).href}?theme=light&accent=blue`, { waitUntil: "load", timeout: 5000 });
        const result = await inspectMaterial(page);
        assert.deepEqual([...result.failures, ...problems], [], `${file}: smoke defects`);
      }
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return (performance.now() - started) / 1000;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const selected = args[0] === "--page" ? args.slice(1) : args;
  assert.ok(selected.length, "Select changed HTML: npm run check:html -- docs\\loop-engineering.en.html");
  const files = selected.map((file) => resolve(root, file));
  const allowed = new Set(materialFiles());
  assert.ok(files.every((file) => allowed.has(file)), "Select only existing workshop HTML materials.");
  const staticResult = validateRepository();
  assert.deepEqual(staticResult.errors, [], "Static material defects");
  const seconds = await smoke(files);
  console.log(`PASS smoke ${files.length} materials: static references, offline runtime, all slides at 1280x720, light/dark blue. ${seconds.toFixed(2)}s. No PDF, screenshots, or release certification.`);
}
