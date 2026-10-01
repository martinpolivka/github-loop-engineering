import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { htmlMarkup, materialFiles, root, sourceElement, sourceText, validateRepository } from "../tools/materials/validation.mjs";

test("attendee content and internal links satisfy repository standards", () => {
  const result = validateRepository();
  assert.equal(result.errors.join("\n"), "");
  assert.ok(result.htmlCount >= 8, "Seven workshop materials and the demo storefront");
});

test("the workshop hub contains only the agenda and navigation", () => {
  const source = readFileSync(join(root, "docs", "index.html"), "utf8");
  const markup = htmlMarkup(source);
  assert.doesNotMatch(markup, /class="[^"]*\b(?:card|chapter|slide-content|deck-stage)\b/);
  const visibleCopy = markup.replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, "");
  assert.ok(sourceText(visibleCopy).split(/\s+/).length <= 650,
    "The hub must remain brief, including visible slide cues but not duplicate SVG accessibility descriptions");
  assert.match(markup, /href="loop-engineering\.en\.html"/);
  assert.doesNotMatch(source, /superdemo|card-demo-flow|card-fallback|ch-controls|ch-adoption|operator-guide/i);
  assert.doesNotMatch(markup, /card-head|card-toggle|card-body|data-action="(?:expand|collapse)-all"|toggle-slides/);
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

test("the separate English deck explains principles across the complete workshop", () => {
  const source = readFileSync(join(root, "docs", "loop-engineering.en.html"), "utf8");
  const markup = htmlMarkup(source);
  assert.match(markup, /<html lang="en"/);
  assert.match(markup, /class="deck-stage"/);
  const slides = [...markup.matchAll(/<section class="slide[^"]*" id="([^"]+)"/g)];
  assert.deepEqual(slides.map(([, id]) => id), [
    "s-title", "s-goal", "s-before-code", "s-after-code", "s-loops", "s-evidence",
    "s-goal-card", "s-measure", "s-end"
  ], "Supporting explanations are consolidated around the lifecycle pair and loops");
  assert.deepEqual(slides.slice(2, 5).map(([, id]) => id),
    ["s-before-code", "s-after-code", "s-loops"], "The lifecycle pair leads directly into the loop diagram");
  for (const [, id] of slides) {
    const slide = sourceElement(source, id).replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, "");
    const wordLimit = ["s-before-code", "s-after-code"].includes(id) ? 65 : 45;
    assert.ok(sourceText(slide).split(/\s+/).length <= wordLimit, `${id}: sparse speaking aid`);
    assert.doesNotMatch(slide, /<(?:a|button|details|input)\b/, `${id}: no interactive slide content`);
    assert.doesNotMatch(slide, /class="slide-note"/, `${id}: key ideas are not small footnotes`);
  }
  const opening = sourceElement(source, "s-title");
  assert.match(opening, /class="slide-eyebrow">Hands-on workshop/);
  assert.match(opening, /<h1>Loop Engineering<br>with <em>GitHub<\/em><\/h1>/);
  assert.match(opening, /class="slide-sub">Define the goal\. Let the loops do the work\./);
  assert.match(opening, /class="title-logos"/);
  assert.match(opening, /role="img" aria-label="Microsoft"/);
  assert.match(opening, /role="img" aria-label="GitHub"/);
  for (const [id, expected] of [
    ["s-before-code", ["Need", "Design", "Goal Card", "Stories", "Tests", "Code"]],
    ["s-after-code", ["Code", "Security", "Quality", "Delivery", "Operations", "Feedback"]]
  ]) {
    const slide = sourceElement(source, id);
    assert.match(slide, /class="sequence lifecycle"/);
    assert.deepEqual([...slide.matchAll(/class="seq-title">([^<]+)/g)].map(([, title]) => title), expected);
    assert.equal([...slide.matchAll(/class="code-step"/g)].length, 1, `${id}: only Code is emphasized`);
    assert.match(slide, /<li class="code-step"><span class="seq-title">Code<\/span>/);
    for (const [, description] of slide.matchAll(/class="seq-note">([^<]+)/g)) {
      assert.ok(description.split(/\s+/).length >= 4, `${id}: descriptive lifecycle cues`);
    }
  }
  const loops = sourceElement(source, "s-loops");
  assert.match(loops, /M176\.7 118\.8A110/);
  assert.match(loops, /Inner loop/);
  assert.match(loops, /Outer loop/);
  assert.match(loops, /Pull request/);
  assert.match(loops, /GitHub Platform/);
  assert.match(loops, /id="implementation-cycle"/);
  assert.match(loops, /marker-end="url\(#implementation-arrow\)"/);
  assert.match(sourceElement(source, "s-before-code"), /Goal Card/);
  assert.doesNotMatch(sourceElement(source, "s-before-code"), /Example: (?:PRD\.md|ADRs|goal-card\.md)/);
  const closing = sourceElement(source, "s-end");
  assert.match(closing, /Define the goal\.<br>Let the loops do the work\./);
  assert.match(closing, /<em>GitHub Copilot<\/em> for the inner loop\./);
  assert.match(closing, /<em>GitHub Platform<\/em> for the outer loop\./);
  assert.match(sourceElement(source, "s-after-code"), /Security/);
  assert.doesNotMatch(sourceElement(source, "s-after-code"), /SRE agent/);
  assert.match(sourceElement(source, "s-goal"), /People bring ideas, intent, and critical thinking/);
  assert.match(sourceElement(source, "s-goal-card"), /criteria changes need owner approval/);
  for (const id of ["s-goal", "s-evidence", "s-goal-card", "s-measure"]) {
    assert.match(sourceElement(source, id), /<blockquote class="key-thought">/, `${id}: prominent closing thought`);
  }
  assert.match(sourceElement(source, "s-evidence"), /A loop can efficiently optimize the wrong goal/);
  assert.match(sourceElement(source, "s-goal-card"), /define success checks and who approves/);
  const measurement = sourceElement(source, "s-measure");
  for (const dimension of ["Speed", "Ease", "Quality", "Thriving"]) assert.match(measurement, new RegExp(dimension));
  assert.match(measurement, /Measure better outcomes\. Not more activity\./);
  assert.match(measurement, /Microsoft Research: EngThrive \(2026\)/);
  assert.match(measurement, /data-source-url="https:\/\/www\.microsoft\.com\/en-us\/research\/publication\/engthrive-make-it-fast-and-easy-to-do-great-work\/"/);
});

test("labs present one progressive loop without promising unavailable controls", () => {
  const read = (...segments) => readFileSync(join(root, ...segments), "utf8");
  const lab1 = read("docs", "labs", "01-evidence-to-goal", "index.html");
  const lab2 = read("docs", "labs", "02-inner-loop", "index.html");
  const lab3 = read("docs", "labs", "03-governed-pr", "index.html");
  const lab4 = read("docs", "labs", "04-trusted-delivery", "index.html");
  const lab5 = read("docs", "labs", "05-agentic-outer-loop", "index.html");
  const stationCI = read(".github", "workflows", "ci.yml");

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
  assert.doesNotMatch(htmlMarkup(lab2), /\bcontract(?:s)?\b/i);
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

test("the agenda, labs, and goal artifact preserve the complete engineering loop", () => {
  const read = (...segments) => readFileSync(join(root, ...segments), "utf8");
  const sources = [
    read("AGENDA.md"),
    read("README.md"),
    sourceText(read("docs", "labs", "01-evidence-to-goal", "index.html")),
    sourceText(read("docs", "labs", "02-inner-loop", "index.html")),
    read("docs", "labs", "02-inner-loop", "artifacts", "stock-substitution.goal-card.md")
  ].join("\n");

  assert.doesNotMatch(sources, /ticket digest/i);
  assert.match(sources, /repository-qualified/);
  assert.match(sources, /failing acceptance test|red acceptance test|red test/i);
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

test("every standalone material keeps its identity and intended presentation surface", () => {
  const ids = new Set();
  const files = materialFiles();
  assert.equal(files.length, 7, "Agenda, principles deck, and five labs");
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
    for (const [tag, marker] of [["script", "data-doc-bootstrap"], ["style", "data-doc-tokens"]]) {
      const matches = [...source.matchAll(new RegExp(`<${tag}\\b[^>]*\\b${marker}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))];
      assert.equal(matches.length, 1, `${label}: exactly one ${marker}`);
      assert.ok(matches[0][1].trim().length > 100, `${label}: embedded ${marker}`);
    }
    assert.match(markup, /<meta\b[^>]*name="description"[^>]*content="[^"]+"/, label);
    assert.doesNotMatch(markup, /data-theme-toggle|data-slide-(?:prev|next|counter|fullscreen|progress)|class="deck"/, label);
    assert.doesNotMatch(markup, /(?:src|href)="[^"]*assets\/(?:workshop\.js|slides\.js)"/, label);
    assert.doesNotMatch(markup, /<script\b[^>]*src=|<link\b[^>]*rel="stylesheet"/, label);
    if (/<main\b[^>]*class="[^"]*\bdeck-stage\b/.test(markup)) {
      decks++;
      assert.match(source, /html-docs \/ deck runtime/, label);
      assert.match(source, /data-deck/, label);
    } else {
      const landing = label.replaceAll("\\", "/") === "docs/index.html";
      for (const action of [...(!landing ? ["expand-all", "collapse-all", "toggle-slides"] : []), "print", "toggle-theme", "toggle-accent"]) {
        assert.match(markup, new RegExp(`<button\\b[^>]*data-action="${action}"`), `${label}: ${action}`);
      }
      assert.match(markup, /<header\b[^>]*class="[^"]*\bdoc-header\b/, label);
      if (!landing) {
        assert.match(markup, /class="[^"]*\btakeaway\b/, label);
        assert.match(markup, /class="[^"]*\bchapter\b/, label);
        assert.match(source, /dataset\.copyCommand/, `${label}: embedded command helper`);
      }
    }
  }
  assert.equal(decks, 1, "Only the principles presentation is a separate deck");
});
