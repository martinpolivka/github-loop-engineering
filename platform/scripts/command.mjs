import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function azureMsiInvocation(launcher, args) {
  return { file: win32.resolve(win32.dirname(launcher), "..", "python.exe"),
    args: ["-IBm", "azure.cli", ...args] };
}

function resolveCommand(command, args) {
  if (process.platform !== "win32" || command !== "az") return { file: command, args };
  const found = spawnSync("where.exe", ["az.cmd"], { encoding: "utf8", shell: false });
  if (found.error) throw found.error;
  if (found.status !== 0) throw new Error("Azure CLI Windows MSI launcher az.cmd is missing.");
  const invocation = azureMsiInvocation(found.stdout.trim().split(/\r?\n/)[0], args);
  if (!existsSync(invocation.file)) throw new Error("Use the Azure CLI Windows MSI installation; its Python launcher is missing.");
  return { ...invocation, env: { ...process.env, AZ_INSTALLER: "MSI" } };
}

export function run(command, args, options = {}) {
  const invocation = resolveCommand(command, args);
  const result = spawnSync(invocation.file, invocation.args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    shell: false,
    env: invocation.env,
    timeout: options.timeout ?? 180_000,
    stdio: options.capture === false ? "inherit" : "pipe"
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed (${result.status})${detail ? `\n${detail}` : ""}`);
  }
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim()
  };
}

export function runJson(command, args, options = {}) {
  const result = run(command, args, options);
  return result.ok && result.stdout ? JSON.parse(result.stdout) : null;
}

export function runJsonOrMissing(command, args, missingPattern) {
  const result = run(command, args, { allowFailure: true });
  if (result.ok) return result.stdout ? JSON.parse(result.stdout) : null;
  const detail = `${result.stdout}\n${result.stderr}`.trim();
  if (missingPattern.test(detail)) return null;
  throw new Error(`${command} ${args.join(" ")} failed\n${detail}`);
}
