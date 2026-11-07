import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function centralCaPath(env: NodeJS.ProcessEnv, cwd: string): string {
  return resolve(cwd, env.NODE_EXTRA_CA_CERTS || "../book-auth-middleware/central-identity-root.crt");
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command) throw new Error("Usage: bun scripts/with-central-ca.ts <command> [args...]");

  const caPath = centralCaPath(process.env, process.cwd());
  try {
    await access(caPath);
  } catch {
    console.error(`Central Identity public CA not found: ${caPath}`);
    console.error("Run bun run dev:setup in ../book-auth-middleware, or set NODE_EXTRA_CA_CERTS to a readable CA file.");
    process.exitCode = 1;
    return;
  }

  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, NODE_EXTRA_CA_CERTS: caPath },
  });
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  child.on("close", (code) => {
    process.exitCode = code ?? 1;
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
