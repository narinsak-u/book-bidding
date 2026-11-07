import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { validateCentralCa } from "../../scripts/with-central-ca";

let directory: string;

afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

it("rejects a missing CA with actionable setup guidance", async () => {
  directory = await mkdtemp(join(tmpdir(), "bidding-central-ca-"));
  await expect(validateCentralCa(join(directory, "missing.crt"))).rejects.toThrow(
    /Central Identity public CA is missing, unreadable, or invalid:[\s\S]*Run bun run dev:setup/,
  );
});

it("rejects a CA file that cannot be parsed as a certificate", async () => {
  directory = await mkdtemp(join(tmpdir(), "bidding-central-ca-"));
  const caPath = join(directory, "invalid.crt");
  await writeFile(caPath, "not a PEM certificate");
  await expect(validateCentralCa(caPath)).rejects.toThrow(/readable PEM CA certificate/);
});
