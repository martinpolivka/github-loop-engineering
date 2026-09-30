import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The repository root is the attendee station; these paths are the service without the workshop materials.
export const stationPaths = [
  ".agents/skills/documentation-review",
  ".agents/skills/goal-card",
  ".agents/skills/goal-review",
  ".agents/skills/requirement-refiner",
  ".devcontainer",
  ".gitattributes",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/aw/actions-lock.json",
  ".github/copilot-instructions.md",
  ".github/instructions/intake-context.instructions.md",
  ".github/instructions/inventory.instructions.md",
  ".github/instructions/tests.instructions.md",
  ".github/ISSUE_TEMPLATE/reservation-bug.yml",
  ".github/ISSUE_TEMPLATE/reservation-feature.yml",
  ".github/workflows/aw.json",
  ".github/workflows/ci.yml",
  ".github/workflows/documentation-review.lock.yml",
  ".github/workflows/documentation-review.md",
  ".github/workflows/goal-review.lock.yml",
  ".github/workflows/goal-review.md",
  ".github/workflows/release-rehearsal.yml",
  ".github/workflows/repository-pulse.lock.yml",
  ".github/workflows/repository-pulse.md",
  ".github/workflows/showcase-signal.lock.yml",
  ".github/workflows/showcase-signal.md",
  ".github/workflows/title-check.yml",
  "AGENTS.md",
  "CLAUDE.md",
  "context",
  "data",
  "public",
  "scripts",
  "src",
  "test"
];

export function copyStation(destination, paths = stationPaths) {
  for (const path of paths) {
    const target = join(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(root, path), target, { recursive: true });
  }
  return destination;
}
