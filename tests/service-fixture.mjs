import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { root } from "./validation.mjs";

export function copyService(destination) {
  mkdirSync(destination, { recursive: true });
  for (const path of ["src", "public", "test"]) {
    cpSync(join(root, path), join(destination, path), { recursive: true });
  }
  return destination;
}
