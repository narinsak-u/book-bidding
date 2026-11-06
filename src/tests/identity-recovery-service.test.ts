import { beforeEach, expect, it, vi } from "vitest";
import { user } from "../lib/server/db/schema";

const { adapter, dbDelete, dbInsert, dbSelect, oidcGrant, oidcDiscovery, passwordVerify, runtimeSettings } = vi.hoisted(() => ({
	adapter: {
		consumeVerificationValue: vi.fn(),
		createVerificationValue: vi.fn(),
		findUserById: vi.fn(),
		findCredentialAccount: vi.fn(),
		createAccount: vi.fn(),
	},
	dbDelete: vi.fn(),
	dbInsert: vi.fn(),
	dbSelect: vi.fn(),
	oidcGrant: vi.fn(),
	oidcDiscovery: vi.fn(),
	passwordVerify: vi.fn(),
	runtimeSettings: {
		appOrigin: "https://bidding.example.test",
		issuer: "https://identity.example.test/api/auth",
		recoveryOIDCRedirectURI: "https://bidding.example.test/api/identity-recovery/callback",
		clientId: "recovery-client",
		clientSecret: "recovery-secret",
	},
}));

vi.mock("$lib/auth", () => ({
	auth: { $context: Promise.resolve({ internalAdapter: adapter, password: { verify: passwordVerify } }) },
}));
vi.mock("$lib/server/db", () => ({ db: { select: dbSelect, insert: dbInsert, delete: dbDelete } }));
vi.mock("$lib/server/auth-runtime-settings", () => ({
	getAuthRuntimeSettings: () => runtimeSettings,
}));
vi.mock("$app/environment", () => ({ dev: true }));
vi.mock("$env/static/public", () => ({ PUBLIC_BASE_URL: "https://bidding.example.test" }));
vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("openid-client", () => ({
	ClientSecretBasic: vi.fn(),
	discovery: oidcDiscovery,
	authorizationCodeGrant: oidcGrant,
	randomState: () => "random-state",
	randomNonce: () => "random-nonce",
	randomPKCECodeVerifier: () => "verifier",
	calculatePKCECodeChallenge: vi.fn().mockResolvedValue("challenge"),
	buildAuthorizationUrl: () => new URL("https://identity.example.test/authorize"),
}));

import { beginRecovery, finishRecovery } from "../lib/server/identity-recovery";

let attemptCount: number;

beforeEach(() => {
	vi.clearAllMocks();
	runtimeSettings.recoveryOIDCRedirectURI = "https://bidding.example.test/api/identity-recovery/callback";
	attemptCount = 0;
	adapter.consumeVerificationValue
		.mockResolvedValueOnce({ value: JSON.stringify({ challenge: "challenge-1", codeVerifier: "verifier", nonce: "nonce" }), expiresAt: new Date(Date.now() + 60_000) })
		.mockResolvedValueOnce({ value: JSON.stringify({ userId: "application-user-1" }), expiresAt: new Date(Date.now() + 60_000) });
	adapter.findUserById.mockResolvedValue({ id: "application-user-1" });
	adapter.findCredentialAccount.mockResolvedValue({ password: "stored-hash" });
	adapter.createAccount.mockResolvedValue({ id: "mapping-1" });
	passwordVerify.mockResolvedValue(false);
	adapter.createVerificationValue.mockResolvedValue(undefined);
	oidcDiscovery.mockResolvedValue({ serverMetadata: () => ({ issuer: "https://identity.example.test/api/auth" }) });
	oidcGrant.mockResolvedValue({ claims: () => ({ iss: "https://identity.example.test/api/auth", sub: "central-subject-1" }) });
	dbSelect.mockImplementation(() => ({
		from: (table: unknown) => ({
			where: () => ({
				limit: async () => table === user ? [{ id: "application-user-1" }] : [],
			}),
		}),
	}));
	dbInsert.mockImplementation(() => ({
		values: () => ({
			onConflictDoUpdate: () => ({
				returning: async () => [{ value: String(++attemptCount) }],
			}),
		}),
	}));
	dbDelete.mockImplementation(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
});

it("throttles repeated failed password proofs using persisted shared state", async () => {
	for (let i = 0; i < 6; i += 1) {
		await expect(beginRecovery("reader@example.test", "wrong-password")).rejects.toThrow("RECOVERY_PROOF_INVALID");
	}
	expect(passwordVerify).toHaveBeenCalledTimes(5);
	expect(dbInsert).toHaveBeenCalledTimes(6);
});

it("allows a valid password proof before the shared failure limit", async () => {
	attemptCount = 4;
	passwordVerify.mockResolvedValueOnce(true);
	await expect(beginRecovery("reader@example.test", "correct-password")).resolves.toHaveProperty("authorizationURL");
	expect(passwordVerify).toHaveBeenCalledTimes(1);
});
it("fails closed when recovery callback is absent despite successful password proof", async () => {
	runtimeSettings.recoveryOIDCRedirectURI = undefined as never;
	passwordVerify.mockResolvedValueOnce(true);
	await expect(beginRecovery("reader@example.test", "correct-password"))
		.rejects.toThrow("Recovery OIDC redirect URI is not configured.");
	expect(passwordVerify).toHaveBeenCalledTimes(1);
});

const callback = new URL("https://bidding.example.test/api/identity-recovery/callback?code=one-time&state=state-1");

it("links the validated subject to the proven Application User without creating a session", async () => {
	await finishRecovery(callback, "challenge-1");

	expect(adapter.createAccount).toHaveBeenCalledWith({
		userId: "application-user-1",
		accountId: "central-subject-1",
		providerId: "central-identity",
	});
	expect(adapter.createAccount).toHaveBeenCalledTimes(1);
});

it("refuses an already-linked Central Identity without changing either user", async () => {
	dbSelect.mockImplementationOnce(() => ({
		from: () => ({
			where: () => ({ limit: async () => [{ userId: "different-application-user" }] }),
		}),
	}));

	await expect(finishRecovery(callback, "challenge-1")).rejects.toThrow("IDENTITY_LINK_CONFLICT");
	expect(adapter.createAccount).not.toHaveBeenCalled();
});
it("refuses a second Central Identity for the existing Application User", async () => {
	dbSelect
		.mockImplementationOnce(() => ({
			from: () => ({
				where: () => ({ limit: async () => [] }),
			}),
		}))
		.mockImplementationOnce(() => ({
			from: () => ({
				where: () => ({ limit: async () => [{ accountId: "different-central-subject" }] }),
			}),
		}));

	await expect(finishRecovery(callback, "challenge-1")).rejects.toThrow("IDENTITY_LINK_CONFLICT");
	expect(adapter.createAccount).not.toHaveBeenCalled();
});

it("fails closed when the unique Identity Link constraint wins a race", async () => {
	adapter.createAccount.mockRejectedValueOnce(Object.assign(new Error("unique constraint"), { code: "SQLITE_CONSTRAINT_UNIQUE" }));

	await expect(finishRecovery(callback, "challenge-1")).rejects.toThrow("IDENTITY_LINK_CONFLICT");
});
it("rejects a Central Identity claim without a subject", async () => {
	oidcGrant.mockResolvedValueOnce({ claims: () => ({ iss: "https://identity.example.test/api/auth" }) });

	await expect(finishRecovery(callback, "challenge-1")).rejects.toThrow("RECOVERY_PROOF_INVALID");
	expect(adapter.createAccount).not.toHaveBeenCalled();
});
