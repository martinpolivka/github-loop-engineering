# Loop Engineering with GitHub

This repository is the workshop station and its materials in one. Attendees fork it and work on the retail reservation service in `demo-app/`. Root `npm start` and `npm test` forward to that dependency-free application. Workshop tooling, fixtures, and integrity tests live in `workshop/`; HTML materials, workshop ADRs, and authoring templates live in `docs/`. When you change workshop materials, follow `.github/instructions/workshop-materials.instructions.md`.

## Retail reservation service

Use the issue and acceptance criteria as the implementation contract.

- Use Node.js 22 or newer and built-in modules only.
- Keep the service dependency-free, deterministic, and entirely synthetic.
- Preserve the public JSON response shape and explicit HTTP status codes.
- A rejected reservation request never creates a reservation or changes stock.
- Cover changed behavior with `node:test` and run `npm test` before proposing a pull request.
- Keep the diff bounded to the task; show the plan before changing files.
- Do not change workflows, ownership, or project skills without explicit platform-owner review.

The same contract applies to GitHub Copilot and external harnesses such as OpenCode. Agent output is a proposal, not approval.