# Vendored html-docs

- Source: https://github.com/tkubica12/tomas-skills/tree/fa0d27cd28b9f231398c8ecd87cf207a6ec9357d/skills/html-docs
- Revision: `fa0d27cd28b9f231398c8ecd87cf207a6ec9357d`
- Skill version: `1.2.0`
- Vendored: 2026-10-08
- License: MIT; the upstream `LICENSE` is included unchanged.

All 33 files under upstream `skills/html-docs/` are copied unchanged, including
templates, component galleries, references, and assets. Repository-specific
additions are this record and a dependency-free `package.json` declaring
CommonJS so the upstream Node.js tools run inside this ES-module repository.
No companion extension or example exports are included.

To update, select and review an upstream commit, replace the upstream files as
one complete set (including removals), preserve the license and CommonJS
package boundary, and update this record. Do not patch the canonical runtime locally. Run `npm test`,
`npm run test:materials`, `npm run validate:html`, and `npm run test:browser`.
If canonical runtime assets change, synchronize and regenerate affected
standalone HTML before validation; do not hand-edit its embedded runtime.

The workshop tools default to this directory, independently of the working
directory. `HTML_DOCS_SKILL` remains an explicit override. Browser validation
and PDF export still require Playwright and a compatible browser; vendoring
the skill does not install dependencies or register it in a running host.
