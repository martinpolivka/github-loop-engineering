# Partial stock visibility run

## Run binding

- Run ID: `09eb654b-afa2-4f6c-900f-cebfc11172b5`
- Card: `partial-stock-visibility`, version `1.0`
- Issue: https://github.com/martinpolivka/github-loop-engineering/issues/2
- Run start: `2026-10-08T10:18:05Z`
- Starting revision: `5523a3eabc4fd9984cf31563f1183ad549c3980c`
- Starting dirty-worktree paths: none
- Starting artifacts:
  - `demo-app/public/app.js` — SHA-256 `a0a7c2d1c88d8773592e4c91ddd4aad35a3afbc33a54aad1c9e3086fe9f60375`
  - `workshop/tools/materials/browser.mjs` — SHA-256 `412e6b5c0cbf8d8a4bc216f3295dcf0f9a9d4aac7f97724e6b17f4ba4bcda055`
- Final artifacts: `demo-app/public/app.js` — SHA-256 `67018607a9af26c43b94a85f1870e0fb03b0cdd328b6e0477b14c9d58596f73e`; `workshop/tools/materials/browser.mjs` — SHA-256 `13a56712057c2ddba6a840841bd4c0602b69831701592ea261052c61de9f24a2`; this run record is saved at its listed path in the working tree (not committed).
- Final working-tree identity: base revision `5523a3eabc4fd9984cf31563f1183ad549c3980c` plus the three allowlisted changed paths; no commit or push performed per card.
- Cumulative limits: cycle 2/2 (one implementation/verification cycle); 3/5 test-command executions; evidence recorded `2026-10-08T10:20:51Z`, within the 45-minute cap.
- External effects: local storefront served for browser reproduction; no paths outside the three allowlisted outputs were changed. `npm ci` was attempted to access the declared Playwright dependency but failed because the configured package registry host was unreachable; no dependency files were changed.

## Baseline and checks

### C01 — Available quantity visible

- Baseline status: `FAIL` on the starting revision.
- Evidence: Live local storefront at `http://127.0.0.1:44185/`; selected `SKU-002`, entered quantity `5`, and submitted. `#result[data-status="409"]` displayed `HTTP 409 / Requested stock unavailable` and `No suggestion in this response. Nothing reserved.` It omitted the requested item's four available units.
- Raw API disclosure showed HTTP 409 with `{"error":"insufficient stock","available":4}`; stock table still showed `4`. These are baseline observations only, not a passing visible-result check.
- Browser tool: Playwright interaction completed at `2026-10-08T10:17Z` (approximate tool-session timestamp; exact timestamp unavailable). A separate attempt to import the repository's Playwright package with Node failed because it is not installed; `npm ci` then failed with `ENOTFOUND` for the configured registry.
- Status: `BLOCKED` for the required automated check; visible behavior was manually confirmed in the updated live storefront.
- Final live browser observation: `#result[data-status="409"]` displayed `HTTP 409 / Requested stock unavailable`, `Requested SKU-002: 4 available.`, and `No suggestion in this response. Nothing reserved.` The request returned HTTP 409 and the displayed SKU-002 stock remained `4`.
- Added browser assertion: `Retail ${state}/${theme}: visible SKU-002 conflict result states 4 available`. It was not executed by the repository browser command because Playwright is unavailable.
- Final status: `BLOCKED` because the required browser check could not start. Required command: `npm run test:browser` — exit code `1`, `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`. `npm ci` also exited `1` with `ENOTFOUND` for the configured package registry, so the declared dependency could not be installed. Evidence recorded `2026-10-08T10:20:51Z`.

### C02 — Accessible and usable result

- Status: `BLOCKED` for the required automated browser journey; all listed conditions were manually observed in the updated live storefront.
- Final browser observation: after the conflict, `#result` had `aria-live="polite"` and `aria-atomic="true"`. In light and dark modes, the result fit 1280x720 (top `501.125`, bottom `630.203`); at 390x844, `document.documentElement.scrollWidth` was `390`. The visible result text was `Requested SKU-002: 4 available.`
- Required automated checks were added to `retailJourney()` but `npm run test:browser` could not load Playwright (exit code `1`, as recorded under C01). Evidence recorded `2026-10-08T10:20:51Z`.

### C03 — API and stock unchanged

- Status: `PASS`.
- Command: `npm test` — exit code `0`; 20 tests passed, 0 failed. Named test `both learner tasks remain unsolved in the retail baseline` passed; it asserts the HTTP 409 body for quantity 5 of SKU-002 and unchanged available stock `4`.
- Boundary inspection: no changes under `demo-app/src/` or `demo-app/contracts/`; no service or contract changes. Updated live storefront also retained SKU-002 stock `4` after the conflict. Evidence recorded `2026-10-08T10:20:51Z`.

### C04 — Existing checks

- Status: `BLOCKED` because the required browser command could not start.
- `npm test` — exit code `0`; 20 passed, 0 failed.
- `npm run test:materials` — exit code `0`; 52 passed, 0 failed.
- `npm run test:browser` — exit code `1` before browser journeys began because the declared Playwright package is not installed; dependency installation was blocked by registry DNS failure. Evidence recorded `2026-10-08T10:20:51Z`.

### C05 — Bounded final change

- Status: `PASS`.
- Reviewed paths: `demo-app/public/app.js`, `workshop/tools/materials/browser.mjs`, and `demo-app/specs/partial-stock-visibility.run.md` only. No changes under `demo-app/src/` or `demo-app/contracts/`; no dependency changes. The approved card's scope excludes a separate `partial-stock-visibility.goal-card.md`, so none was created.
- `git diff --check` — exit code `0`; no errors. Final application and browser artifact hashes are recorded above. Evidence recorded `2026-10-08T10:20:51Z`.
- The approved card itself is supplied in the Issue comment. No separate `partial-stock-visibility.goal-card.md` has been created because the card's write allowlist excludes that fourth path.

## Repairs and next step

- Repairs attempted: one focused repair. The storefront now renders the requested SKU and API `available` quantity using the existing text helper. The existing retail journey now submits SKU-002 quantity 5 and checks the visible result, live-region attributes, unchanged stock, projector fit, and mobile overflow in both themes and service states.
- Outcome: application and materials checks pass; direct live-browser verification confirms the updated result and accessibility/layout observations. The official browser suite remains unverified because its declared Playwright package is unavailable and the registry cannot be reached.
- Next gap / safe continuation: restore access to the configured package registry or provide the already-declared Playwright dependency, then run `npm run test:browser` from the repository root. Update only this run record with its exit code and any resulting evidence; do not expand the file allowlist without owner approval.
- Exit: `BLOCKED` by unavailable browser-test dependency. Both allowed cycles were used; no time or test-command cap was reached. No commit, push, pull request, or issue edit was performed.
