import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { htmlMarkup, localTarget, materialFiles, root, screenshotInputs } from "../tools/materials/validation.mjs";

test("embedded media are not mistaken for local files while file references remain checked", () => {
  const file = join(root, "docs", "loop-engineering.en.html");
  assert.equal(localTarget(file, "data:image/png;base64,aGVsbG8="), null);
  assert.equal(localTarget(file, "DATA:image/svg+xml,%3Csvg%3E%3C/svg%3E"), null);
  assert.equal(localTarget(file, "missing-logo.png"), join(root, "docs", "missing-logo.png"));
});

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

test("title logos embed byte-identical original Microsoft and GitHub assets", () => {
  const source = readFileSync(join(root, "docs", "loop-engineering.en.html"), "utf8");
  const opening = source.match(/<section class="slide slide--title" id="s-title">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(opening);
  assert.doesNotMatch(opening, /<svg\b|<text\b/);
  const originals = {
    microsoft: {
      type: "image/png",
      url: "https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png",
      hash: "112fec798b78aa02e102a724b5cb1990c0f909bc1d8b7b1fa256eab41bbc0960"
    },
    "github-black": {
      type: "image/svg+xml",
      url: "https://brand.github.com/GitHub_Logos.zip",
      entry: "GitHub Logos/SVG/GitHub_Lockup_Black.svg",
      hash: "802172fd58f2956be454f45e07c351d5c3d6830554632796b8f16fcecc7d273b"
    },
    "github-white": {
      type: "image/svg+xml",
      url: "https://brand.github.com/GitHub_Logos.zip",
      entry: "GitHub Logos/SVG/GitHub_Lockup_White.svg",
      hash: "d26a77282b5f0fc5e36d52aa64d0a8dfeb042dab5b65802805ce83373d72f5f5"
    }
  };
  const images = [...opening.matchAll(/<img\b[^>]*data-brand-asset="([^"]+)"[^>]*>/g)];
  assert.deepEqual(images.map(([, name]) => name).sort(), Object.keys(originals).sort());
  for (const [tag, name] of images) {
    const original = originals[name];
    const media = tag.match(/\bsrc="data:([^;]+);base64,([^"]+)"/);
    assert.ok(media, `${name}: embedded image required`);
    assert.equal(media[1], original.type);
    assert.equal(tag.match(/\bdata-source-url="([^"]+)"/)?.[1], original.url);
    if (original.entry) assert.equal(tag.match(/\bdata-source-entry="([^"]+)"/)?.[1], original.entry);
    const bytes = Buffer.from(media[2], "base64");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), original.hash,
      `${name}: do not redraw, recolor, or replace the original wordmark with live text`);
  }
});
