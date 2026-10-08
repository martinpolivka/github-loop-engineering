import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const skillRoot = process.env.HTML_DOCS_SKILL
  ? resolve(process.env.HTML_DOCS_SKILL)
  : fileURLToPath(new URL("../../../.agents/skills/html-docs/", import.meta.url));
export const runtime = join(skillRoot, "assets");

if (!existsSync(join(runtime, "validate.js"))) {
  throw new Error(`The html-docs validator is missing from ${runtime}. Restore .agents/skills/html-docs or set HTML_DOCS_SKILL to a complete skill directory.`);
}
