# Loop Engineering with GitHub

This repository is the workshop station and its materials in one. Attendees fork it and work on the pharmacy reservation service at the root. The workshop materials live in `docs/`, `platform/`, `tests/`, and `templates/`; when you change them, follow `.github/instructions/workshop-materials.instructions.md`.

## Pharmacy reservation service

Use the issue and acceptance criteria as the implementation contract.

- Use Node.js 22 or newer and built-in modules only.
- Keep the service dependency-free, deterministic, and entirely synthetic.
- Preserve the public JSON response shape and explicit HTTP status codes.
- A rejected reservation request never creates a reservation or changes stock.
- Cover changed behavior with `node:test` and run `npm test` before proposing a pull request.
- Keep the diff bounded to the task; show the plan before changing files.
- Do not change workflows, ownership, or project skills without explicit platform-owner review.

The same contract applies to GitHub Copilot and external harnesses such as OpenCode. Agent output is a proposal, not approval.