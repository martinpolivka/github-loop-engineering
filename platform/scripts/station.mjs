import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The repository root is the attendee station; these paths are the service without the workshop materials.
export const stationPaths = [
  ".devcontainer",
  ".gitattributes",
  ".github/agents/quality-engineer.agent.md",
  ".github/agents/requirement-refiner.agent.md",
  ".github/aw/actions-lock.json",
  ".github/copilot-instructions.md",
  ".github/instructions/intake-context.instructions.md",
  ".github/instructions/inventory.instructions.md",
  ".github/instructions/tests.instructions.md",
  ".github/ISSUE_TEMPLATE/reservation-feature.yml",
  ".github/workflows/aw.json",
  ".github/workflows/ci.yml",
  ".github/workflows/repository-pulse.lock.yml",
  ".github/workflows/repository-pulse.md",
  ".github/workflows/showcase-signal.lock.yml",
  ".github/workflows/showcase-signal.md",
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
