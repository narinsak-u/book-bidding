import { afterEach, expect, it, vi } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import * as schema from "../lib/server/db/schema";

const { state, passwordVerify } = vi.hoisted(() => ({
	state: { db: null as unknown },
	passwordVerify: vi.fn(),
}));

vi.mock("$lib/server/db", () => ({ get db() { return state.db; } }));
vi.mock("$lib/auth", () => ({
	auth: { $context: Promise.resolve({
		internalAdapter: { findCredentialAccount: vi.fn(async () => ({ password: "stored-hash" })) },
		password: { verify: passwordVerify },
	}) },
}));
vi.mock("$lib/server/auth-runtime-settings", () => ({
	getAuthRuntimeSettings: () => ({
		appOrigin: "https://bidding.example.test",
		issuer: "https://identity.example.test/api/auth",
		recoveryOIDCRedirectURI: "https://bidding.example.test/api/identity-recovery/callback",
		clientId: "recovery-client",
		clientSecret: "synthetic-secret",
	}),
}));
vi.mock("$app/environment", () => ({ dev: true }));
vi.mock("$env/static/public", () => ({ PUBLIC_BASE_URL: "https://bidding.example.test" }));
vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("openid-client", () => ({
	ClientSecretBasic: vi.fn(),
	ClientSecretPost: vi.fn(),
	Configuration: class {},
	discovery: vi.fn(),
	authorizationCodeGrant: vi.fn(),
	buildAuthorizationUrl: vi.fn(),
	calculatePKCECodeChallenge: vi.fn(),
	randomNonce: vi.fn(),
	randomPKCECodeVerifier: vi.fn(),
	randomState: vi.fn(),
}));

import { beginRecovery } from "../lib/server/identity-recovery";

let client: ReturnType<typeof createClient>;
let databasePath: string;

afterEach(async () => {
	if (client) await client.close();
	state.db = null;
	if (databasePath) await unlink(databasePath).catch(() => undefined);
	vi.clearAllMocks();
});

it("persists failed proofs in shared storage and throttles after reconnect", async () => {
	databasePath = join(tmpdir(), `bidding-recovery-${randomUUID()}.db`);
	client = createClient({ url: `file:${databasePath}` });
	await client.execute(`CREATE TABLE user (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
		email_verified INTEGER NOT NULL DEFAULT 0, image TEXT,
		created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0
	)`);
	await client.execute(`CREATE TABLE verification (
		id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
		expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT 0,
		updated_at INTEGER NOT NULL DEFAULT 0
	)`);
	const database = drizzle(client, { schema });
	state.db = database;
	await database.insert(schema.user).values({ id: "user-1", name: "Reader", email: "reader@example.test" });
	passwordVerify.mockResolvedValue(false);

	for (let index = 0; index < 5; index += 1) {
		await expect(beginRecovery("reader@example.test", "wrong-password"))
			.rejects.toThrow("RECOVERY_PROOF_INVALID");
	}
	await client.close();
	client = createClient({ url: `file:${databasePath}` });
	state.db = drizzle(client, { schema });

	await expect(beginRecovery("reader@example.test", "wrong-password"))
		.rejects.toThrow("RECOVERY_PROOF_INVALID");
	expect(passwordVerify).toHaveBeenCalledTimes(5);
});
