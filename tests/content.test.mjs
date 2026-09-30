import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { htmlMarkup, materialFiles, root, sourceElement, sourceText, validateRepository } from "./validation.mjs";

test("attendee content and internal links satisfy repository standards", () => {
  const result = validateRepository();
  assert.equal(result.errors.join("\n"), "");
  assert.ok(result.htmlCount >= 8);
});

test("the workshop hub stays a short introduction and lab directory", () => {
  const source = readFileSync(join(root, "docs", "index.html"), "utf8");
  const markup = htmlMarkup(source);
  assert.equal([...markup.matchAll(/<article\b[^>]*class="[^"]*\bcard\b/g)].length, 6);
  assert.equal([...markup.matchAll(/<section\b[^>]*class="chapter"/g)].length, 2);
  const visibleCopy = markup.replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, "");
  assert.ok(sourceText(visibleCopy).split(/\s+/).length <= 650,
    "The hub must remain brief, including visible slide cues but not duplicate SVG accessibility descriptions");
  assert.match(source, /Stop managing prompts/);
  assert.match(source, /inner loop/);
  assert.match(source, /outer loop/);
  assert.match(source, /before the first line of code/);
  assert.doesNotMatch(source, /superdemo|card-demo-flow|card-fallback|ch-controls|ch-adoption|operator-guide/i);
  assert.doesNotMatch(markup, /card-head|card-toggle|card-body|data-action="(?:expand|collapse)-all"/);
  const agenda = sourceElement(source, "agenda");
  const slots = [...agenda.matchAll(/<time datetime="(\d\d:\d\d)">[^<]+<\/time>-<time datetime="(\d\d:\d\d)">/g)];
  assert.equal(slots.length, 10, "Opening, five labs, two breaks, lunch, and discussion");
  assert.equal(slots[0][1], "09:00");
  assert.equal(slots.at(-1)[2], "15:30");
  for (let index = 1; index < slots.length; index++) {
    assert.equal(slots[index][1], slots[index - 1][2], "The agenda must be continuous");
  }
  for (const lab of ["01-evidence-to-goal", "02-inner-loop", "03-governed-pr",
    "04-trusted-delivery", "05-agentic-outer-loop"]) {
    assert.equal([...agenda.matchAll(new RegExp(`href="labs/${lab}/index.html"`, "g"))].length, 1);
  }
  assert.match(agenda, /opening walkthrough/i);
});

test("opening slides explain the work before and after code without expanding the landing page", () => {
  const source = readFileSync(join(root, "docs", "index.html"), "utf8");
  const before = sourceElement(source, "card-lifecycle");
  const after = sourceElement(source, "card-after-code");
  const steps = (surface) => [...surface.matchAll(/data-lifecycle-step="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(steps(before), ["prd", "architecture", "goal", "stories", "tests", "code"]);
  assert.deepEqual(steps(after), ["code", "security", "quality", "deployment", "sre", "feedback"]);
  for (const term of ["PRD", "Architecture", "ADRs", "Goal Card", "User stories", "Tests"]) {
    assert.ok(before.includes(term), `Before code: ${term}`);
  }
  for (const term of ["Security", "Quality", "Deployment", "SRE agent", "feedback"]) {
    assert.ok(after.includes(term), `After code: ${term}`);
  }
  assert.match(before, /Existing code can also supply evidence/);
  assert.match(after, /Agents advise; humans authorize/);
  assert.match(after, /Feedback shapes the next goal/);
  const codeBox = after.match(/<g data-lifecycle-step="code"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  const feedbackBox = after.match(/<g data-lifecycle-step="feedback"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  assert.match(codeBox, /fill="var\(--accent-soft\)" stroke="var\(--accent\)"/);
  assert.match(feedbackBox, /fill="var\(--surface-2\)" stroke="var\(--border\)"/);
  assert.doesNotMatch(feedbackBox, /var\(--accent/);
  assert.ok(source.indexOf('id="card-lifecycle"') < source.indexOf('id="card-after-code"'));
  assert.ok(source.indexOf('id="card-after-code"') < source.indexOf('id="ch-agenda"'));
  const agenda = sourceElement(source, "agenda");
  assert.doesNotMatch(agenda, /data-lifecycle-step|before-code-title|after-code-title/);
});

test("agenda slides give every reading-agenda slot its own bullet row", () => {
  const source = readFileSync(join(root, "docs", "index.html"), "utf8");
  const reading = sourceElement(source, "agenda");
  const expected = [...reading.matchAll(/<time datetime="(\d\d:\d\d)">[^<]+<\/time>-<time datetime="(\d\d:\d\d)">/g)]
    .map((match) => `${match[1]}-${match[2]}`);
  const slides = ["card-agenda", "card-agenda-afternoon"].map((id) => sourceElement(source, id));
  const actual = slides.flatMap((slide) => {
    const rows = [...slide.matchAll(/<g data-agenda-slot="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)];
    assert.equal(rows.length, 5);
    const description = slide.match(/<desc\b[^>]*>([\s\S]*?)<\/desc>/)?.[1];
    for (const [, interval, row] of rows) {
      assert.equal([...row.matchAll(/<circle\b/g)].length, 1, `${interval}: one bullet`);
      assert.equal([...row.matchAll(/<text\b/g)].length, 2, `${interval}: one time and one activity`);
      assert.ok(row.includes(`>${interval}</text>`));
      assert.equal([...row.matchAll(/\d\d:\d\d-\d\d:\d\d/g)].length, 1, "Never group time slots");
      assert.ok(description?.includes(interval), `${interval}: accessible diagram includes the time slot`);
    }
    return rows.map((match) => match[1]);
  });
  assert.deepEqual(actual, expected);
});

test("labs present one progressive loop without promising unavailable controls", () => {
  const read = (...segments) => readFileSync(join(root, ...segments), "utf8");
  const lab1 = read("docs", "labs", "01-evidence-to-goal", "index.html");
  const lab2 = read("docs", "labs", "02-inner-loop", "index.html");
  const lab3 = read("docs", "labs", "03-governed-pr", "index.html");
  const lab4 = read("docs", "labs", "04-trusted-delivery", "index.html");
  const lab5 = read("docs", "labs", "05-agentic-outer-loop", "index.html");
  const operator = read("platform", "demos", "full-day", "operator-guide.html");
  const stationCI = read(".github", "workflows", "ci.yml");

  assert.match(operator, /source repository is.*prepared product/is);
  assert.match(operator, /Automate what the APIs can prove/);
  assert.match(operator, /Complete the enterprise controls manually/);
  assert.match(operator, /grey control that is OFF is an enterprise denial/i);
  assert.match(operator, /Do not treat an HTTP <code>201<\/code>.*as proof/i);
  assert.match(operator, /gpt-5\.3-codex/);
  assert.match(stationCI, /run: npm test/);
  assert.doesNotMatch(stationCI, /gh aw|repository-pulse\.md/);
  assert.match(lab1, /Fork and open the workspace/);
  assert.doesNotMatch(lab1, /goal-card|outcome-contract/);
  assert.match(lab1, /TARGET-OWNER\/github-loop-engineering-NN/);
  assert.match(lab1, /no dedicated organization is required/i);
  assert.match(lab1, /Codespace/);
  assert.match(lab1, /Your laptop/);
  assert.match(lab1, /https:\/\/YOUR-GITHUB-HOST\/copilot/);
  assert.match(lab1, /https:\/\/cli\.github\.com\//);
  assert.match(lab1, /https:\/\/docs\.github\.com\/en\/codespaces\/about-codespaces\/what-are-codespaces/);
  assert.match(lab1, /\/skills list/);
  assert.match(lab1, /\/requirement-refiner/);
  assert.doesNotMatch(lab1, /OWNER\/REPOSITORY/);
  assert.doesNotMatch(lab1, /gh repo view --json nameWithOwner|Recovery and extension|If the surface cannot write Issues|callout-label">Boundary/);
  assert.match(lab1, /\.github\/ISSUE_TEMPLATE\//);
  assert.match(lab1, /reservation-feature\.yml/);
  assert.match(lab1, /reservation-bug\.yml/);
  assert.match(lab2, /initial failing evidence|red-then-green/i);
  assert.match(lab2, /\/goal-card Turn Issue #FEATURE_NUMBER/);
  assert.match(lab2, /\/goal-card Turn Issue #BUG_NUMBER/);
  assert.match(lab2, /specs\/stock-substitution\.goal-card\.md/);
  assert.match(lab2, /specs\/partial-stock-visibility\.goal-card\.md/);
  assert.match(lab2, /focused questions/);
  assert.match(lab2, /APPROVED GOAL CARD/);
  assert.match(lab2, /use GitHub MCP to publish/i);
  assert.match(lab2, /repository-qualified Issue target/i);
  assert.match(lab2, /separate approval before each GitHub write/i);
  assert.match(lab2, /read the comment back/i);
  assert.doesNotMatch(lab2, /gh issue comment/);
  assert.doesNotMatch(lab2, /\bcontract(?:s)?\b/i);
  assert.match(lab2, /Assign the bug to Copilot/);
  assert.match(lab2, /commit, push, and open a PR/);
  assert.match(lab2, /no direct commit to <code>main<\/code>/);
  assert.match(lab2, /npm test/);
  assert.match(lab3, /Copilot code review/);
  assert.match(lab3, /two prepared Agentic Workflow comments/i);
  assert.match(lab3, /goal-review/);
  assert.match(lab3, /documentation-review/);
  assert.match(lab3, /deterministic CI/);
  assert.match(lab3, /GitHub Code Quality/);
  assert.match(lab3, /enables Code Quality for all current and future Station repositories/i);
  assert.match(lab3, /two prepared Agentic Workflow comments/i);
  assert.doesNotMatch(lab3, /billing|capability board|organization access|reports <code>configured<\/code>/i);
  assert.match(lab3, /two agent handoffs/i);
  assert.doesNotMatch(lab3, /quality-review/);
  assert.match(lab4, /release-rehearsal\.yml/);
  assert.match(lab4, /workshop-test/);
  assert.match(lab4, /workshop-prod/);
  assert.match(lab4, /\/azure-release/);
  assert.match(lab4, /one allocated resource group/i);
  assert.match(lab4, /not Azure authorization isolation/i);
  assert.match(lab4, /same manifest digest|digest is exactly the test digest/i);
  assert.match(lab4, /Azure SRE/);
  assert.doesNotMatch(lab4, /workshop-signing|workshop-preview|retail-reservation\.tgz/);
  assert.match(lab4, /SHA-256/);
  assert.match(lab4, /no external production deployment is performed|not proof of a production deployment/i);
  assert.match(lab5, /issue-triage\.reference\.md/);
  assert.match(lab5, /deployment-readiness\.starter\.md/);
  assert.match(lab5, /repository-pulse\.md/);
  assert.match(lab5, /SRE agent/);
  assert.match(lab5, /source changes are proposals until an approved compiler regenerates the lock/i);
});

test("authoritative documents describe evidence, inner loop, outer loop, and recurrence in order", () => {
  const read = (...segments) => readFileSync(join(root, ...segments), "utf8");
  const sources = [
    read("AGENDA.md"),
    read("PLAN.md"),
    read("README.md"),
    read("platform", "demos", "full-day", "operator-guide.html")
  ].join("\n");

  assert.doesNotMatch(sources, /ticket digest/i);
  assert.match(sources, /repository-qualified/);
  assert.match(sources, /red acceptance test|red test/i);
  assert.match(sources, /two pull requests|two PRs/i);
  assert.match(sources, /cloud[- ]agent/i);
  assert.match(sources, /OCI digest|manifest digest/i);
  assert.match(sources, /Agentic Workflow next decision/i);
  assert.doesNotMatch(sources, /assign(?:ing)? (?:that |the approved )?Issue to Copilot creates the implementation pull request/i);
});

test("raw script strings and comments do not invent DOM links or duplicate IDs", () => {
  const source = '<!-- <a id="old" href="gone.html"> --><style>.x::after{content:\'id="cue"\';}</style>' +
    '<script data-doc-bootstrap>const example = \'<a id="cue" href="#absent">\';</script>' +
    '<script src="runtime.js"></script><article class="card" id="card-one"><span id="cue"></span>' +
    '<div><p>Keep the exact reading text.</p></div></article>';
  const markup = htmlMarkup(source);
  assert.deepEqual([...markup.matchAll(/\bid="([^"]*)"/g)].map((match) => match[1]), ["card-one", "cue"]);
  assert.doesNotMatch(markup, /gone\.html|#absent/);
  assert.match(markup, /src="runtime\.js"/);
  assert.match(sourceElement(source, "cue", "card"), /Keep the exact reading text/);
  assert.equal(sourceElement(source, "old"), null);
  assert.equal(sourceText("<code>2d84da4ce6cb30f84603<wbr>2e3d497c36b477eaf6c2</code>"),
    "2d84da4ce6cb30f846032e3d497c36b477eaf6c2", "Optional line breaks do not change readable identities");
});

test("the vendored html-docs kit remains canonical, including its validation and export tools", () => {
  // Canonical html-docs 1.2.0, supplied 30 September 2026. Per-document fixes belong in the content.
  const hashes = {
    "appearance.js": "cfee7b0ac77997cc5760918b8cd67f468ef726cb2d2e9aa1b127b8539ce7c3eb",
    "article.css": "43a9c56db47a46fcafdc33e45c1dc548234c0a75456bf885f09ea5bd1e6223f0",
    "article.js": "1c4e314ea2f14d7ed0117bb3397cb8a77819ffb95b2c1cf384013fef87489421",
    "bundle.js": "e3cdbe7ca1d8da92988f350bb5a1bdb9ac1f09de815c67783a3f89f081d2f575",
    "deck.css": "0fd80481261cebddb3eab3fae2a09de5502cd045157f9ccfb142f6ccc3d30709",
    "deck.js": "e2216fda492c7bd8a3592ee03af5262b7f8b74550b3416e7ea9766d4d8805b79",
    "export-pdf.js": "f634d33491d37ceb9ffccd27844677305e278284b87d6b7eb1ef26bde48dc24e",
    LICENSE: "bc8297b874fd3b3a571ee1d3fa6cddb453210145034ea7685a3122871c7b586b",
    "sample-diagram.svg": "b23569ce1db32e8d805c396e375c0a7f585077f6fbaab494340fc65f80c9e897",
    "sheet.css": "0491508c2e1c60cedc90d6f1e7eef340d72785a3a7a09008673e00043b65a0b7",
    "sheet.js": "3338e20c41e37bce5560c26be608ac7f3709cedc009fcc9a9fe2e4e00c1e4a4f",
    "slides.css": "c9ad4ec4979cfc2bc3d1acb004c39a06b3c8ce572456f600f153d9309242ef86",
    "slides.js": "fff4196838835ccad060ea7f6c8429d4efe9a7e5b1a6662a78ad6ac4301a8436",
    "sync-head.js": "ab3d908db5a01ca53ea0a6c0b64ed90640c0f2ea7c62edf21edf89ad0b5241af",
    "tokens.css": "346a239a627dc09886256d1c4b76592836c9e809cc11407e6ecd89d554acdcf2",
    "validate.js": "12bdb13e79d7edf6cc280caadffb92f9082c521097df8a61afdfdb941ac6d347"
  };
  for (const [name, expected] of Object.entries(hashes)) {
    const source = readFileSync(join(root, "docs", "assets", "html-docs", name), "utf8").replaceAll("\r\n", "\n");
    assert.equal(createHash("sha256").update(source).digest("hex"), expected, `Canonical asset changed: ${name}`);
  }
});

test("every material uses canonical first-paint tokens, identity and presentation runtimes", () => {
  const ids = new Set();
  const canonical = (name) => readFileSync(join(root, "docs", "assets", "html-docs", name), "utf8")
    .replaceAll("\r\n", "\n").trim();
  const files = materialFiles();
  assert.equal(files.length, 7, "The workshop hub, five labs and current operator runbook must be covered");
  let decks = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
    const markup = htmlMarkup(source);
    const label = relative(root, file);
    const id = markup.match(/<meta\b[^>]*name="doc-id"[^>]*content="([^"]+)"/)?.[1];
    assert.ok(id && !ids.has(id), `${label}: stable unique doc-id required`);
    ids.add(id);
    assert.match(markup, /<html\b[^>]*data-default-accent="blue"/, label);
    assert.doesNotMatch(markup, /data-default-theme=/, `${label}: default theme must follow the OS`);
    for (const [tag, marker, asset] of [["script", "data-doc-bootstrap", "appearance.js"], ["style", "data-doc-tokens", "tokens.css"]]) {
      const matches = [...source.matchAll(new RegExp(`<${tag}\\b[^>]*\\b${marker}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))];
      assert.equal(matches.length, 1, `${label}: exactly one ${marker}`);
      assert.equal(matches[0][1].trim(), canonical(asset), `${label}: stale ${marker}; run sync-head`);
    }
    assert.match(markup, /<meta\b[^>]*name="description"[^>]*content="[^"]+"/, label);
    assert.doesNotMatch(markup, /data-theme-toggle|data-slide-(?:prev|next|counter|fullscreen|progress)|class="deck"/, label);
    assert.doesNotMatch(markup, /(?:src|href)="[^"]*assets\/(?:workshop\.js|slides\.js)"/, label);
    assert.match(markup, /<script\b[^>]*src="[^"]*assets\/materials\.js"/, label);
    const scripts = [...markup.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1]);
    const position = (asset) => scripts.findIndex((script) => script.endsWith(`/${asset}`));
    if (/<main\b[^>]*class="[^"]*\bdeck-stage\b/.test(markup)) {
      decks++;
      for (const asset of ["deck.css", "deck.js"]) assert.ok(markup.includes(`html-docs/${asset}`), `${label}: ${asset}`);
      assert.ok(position("materials.js") < position("deck.js"), `${label}: resolve legacy deck hashes before runtime startup`);
    } else {
      const landing = label.replaceAll("\\", "/") === "docs/index.html";
      for (const asset of ["article.css", ...(!landing ? ["article.js"] : []), "slides.css", "slides.js"]) {
        assert.ok(markup.includes(`html-docs/${asset}`), `${label}: ${asset}`);
      }
      for (const action of [...(!landing ? ["expand-all", "collapse-all"] : []), "toggle-slides", "print", "toggle-theme", "toggle-accent"]) {
        assert.match(markup, new RegExp(`<button\\b[^>]*data-action="${action}"`), `${label}: ${action}`);
      }
      assert.match(markup, /<header\b[^>]*class="[^"]*\bdoc-header\b/, label);
      assert.match(markup, /class="[^"]*\btakeaway\b/, label);
      assert.match(markup, /class="[^"]*\bchapter\b/, label);
      assert.ok((landing || position("article.js") < position("slides.js")) && position("slides.js") < position("materials.js"),
        `${label}: initialize canonical reading and presentation before command/recovery helpers`);
    }
  }
  assert.equal(decks, 0, "The workshop and labs use their own article presentation mode");
});
