import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const skillRoot = process.env.HTML_DOCS_SKILL
  ? resolve(process.env.HTML_DOCS_SKILL)
  : join(homedir(), ".copilot", "skills", "html-docs");
export const runtime = join(skillRoot, "assets");

if (!existsSync(join(runtime, "validate.js"))) {
  throw new Error("The global html-docs skill is required for browser validation. Set HTML_DOCS_SKILL to its installation directory.");
}
