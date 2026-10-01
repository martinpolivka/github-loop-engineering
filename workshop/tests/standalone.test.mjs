import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { htmlMarkup, materialFiles, root, screenshotInputs } from "../tools/materials/validation.mjs";

test("every workshop HTML carries its runtime and license without an assets directory", () => {
  assert.equal(existsSync(join(root, "docs", "assets")), false);
  for (const file of materialFiles()) {
    const source = readFileSync(file, "utf8");
    const markup = htmlMarkup(source);
    const label = relative(root, file);
    assert.match(source, /MIT License/);
    assert.match(source, /Permission is hereby granted/);
    assert.doesNotMatch(markup, /<script\b[^>]*src=|<link\b[^>]*rel="stylesheet"/, label);
    for (const [, ref] of markup.matchAll(/\b(?:src|poster)="([^"]+)"/g)) {
      assert.match(ref, /^data:/, `${label}: required media must travel with the file`);
    }
    for (const [, css] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
      for (const [, ref] of css.matchAll(/url\(\s*["']?([^"')\s]+)/g)) {
        assert.match(ref, /^(?:data:|#)/, `${label}: CSS must not load external resources`);
      }
    }
    assert.deepEqual(screenshotInputs(label.replaceAll("\\", "/")), [label.replaceAll("\\", "/")],
      `${label}: the complete HTML binds its own runtime and appearance`);
  }
});

test("embedded first-paint assets preserve the supplied canonical runtime", () => {
  // html-docs 1.2.0 supplied 30 September 2026; no installed skill needed for this check.
  const hashes = {
    "data-doc-bootstrap": "cfee7b0ac77997cc5760918b8cd67f468ef726cb2d2e9aa1b127b8539ce7c3eb",
    "data-doc-tokens": "346a239a627dc09886256d1c4b76592836c9e809cc11407e6ecd89d554acdcf2"
  };
  for (const file of materialFiles()) {
    const source = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
    for (const [marker, hash] of Object.entries(hashes)) {
      const content = source.match(new RegExp(`<(?:script|style) ${marker}>([\\s\\S]*?)<\\/(?:script|style)>`))?.[1];
      assert.ok(content, `${file}: ${marker} required`);
      assert.equal(createHash("sha256").update(`${content.trim()}\n`).digest("hex"), hash,
        `${file}: canonical ${marker} changed`);
    }
  }
});
