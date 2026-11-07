import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { X509Certificate } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function centralCaPath(env: NodeJS.ProcessEnv, cwd: string): string {
  return resolve(cwd, env.NODE_EXTRA_CA_CERTS || "../book-auth-middleware/central-identity-root.crt");
}

export async function validateCentralCa(caPath: string): Promise<void> {
  try {
    if (!(await stat(caPath)).isFile()) throw new Error("not a regular file");
    new X509Certificate(await readFile(caPath));
  } catch (error) {
    throw new Error(
      `Central Identity public CA is missing, unreadable, or invalid: ${caPath}\n` +
        "Run bun run dev:setup in ../book-auth-middleware, or set NODE_EXTRA_CA_CERTS to a readable PEM CA certificate.",
      { cause: error },
    );
  }
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command) throw new Error("Usage: bun scripts/with-central-ca.ts <command> [args...]");

  const caPath = centralCaPath(process.env, process.cwd());
  try {
    await validateCentralCa(caPath);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, NODE_EXTRA_CA_CERTS: caPath },
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => child.kill(signal));
  }
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
