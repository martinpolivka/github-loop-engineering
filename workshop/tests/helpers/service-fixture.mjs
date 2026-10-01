import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { root } from "../../tools/materials/validation.mjs";

export function copyService(destination) {
  mkdirSync(destination, { recursive: true });
  for (const path of ["package.json", "src", "public", "test", "contracts"]) {
    cpSync(join(root, "demo-app", path), join(destination, path), { recursive: true });
  }
  return destination;
}
