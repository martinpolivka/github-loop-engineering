import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export function validationExecutable(executable, override, exists = existsSync, entries = readdirSync) {
  if (override) return override;
  const installation = dirname(dirname(executable));
  const revision = basename(installation).match(/^chromium-(\d+)$/)?.[1];
  if (!revision) return executable;
  const headless = join(dirname(installation), `chromium_headless_shell-${revision}`);
  if (!exists(headless)) return executable;
  const binaryNames = new Set(["chrome-headless-shell.exe", "chrome-headless-shell", "headless_shell"]);
  for (const directory of entries(headless, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    const folder = join(headless, directory.name);
    for (const binary of entries(folder, { withFileTypes: true })) {
      if (binary.isFile() && binaryNames.has(binary.name)) return join(folder, binary.name);
    }
  }
  return executable;
}
