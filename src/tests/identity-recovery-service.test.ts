import { beforeEach, expect, it, vi } from "vitest";

const { adapter, dbSelect, oidcGrant, oidcDiscovery } = vi.hoisted(() => ({
	adapter: {
		consumeVerificationValue: vi.fn(),
		findUserById: vi.fn(),
		createAccount: vi.fn(),
	},
	dbSelect: vi.fn(),
	oidcGrant: vi.fn(),
	oidcDiscovery: vi.fn(),
}));

vi.mock("$lib/auth", () => ({ auth: { $context: Promise.resolve({ internalAdapter: adapter }) } }));
vi.mock("$lib/server/db", () => ({ db: { select: dbSelect } }));
vi.mock("$lib/server/auth-runtime-settings", () => ({
	getAuthRuntimeSettings: () => ({
		appOrigin: "https://bidding.example.test",
		issuer: "https://identity.example.test/api/auth",
		recoveryOIDCRedirectURI: "https://bidding.example.test/api/identity-recovery/callback",
		clientId: "recovery-client",
		clientSecret: "recovery-secret",
	}),
}));
vi.mock("$app/environment", () => ({ dev: true }));
vi.mock("$env/static/public", () => ({ PUBLIC_BASE_URL: "https://bidding.example.test" }));
vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("openid-client", () => ({
	ClientSecretBasic: vi.fn(),
	discovery: oidcDiscovery,
	authorizationCodeGrant: oidcGrant,
}));

import { finishRecovery } from "../lib/server/identity-recovery";

beforeEach(() => {
	vi.clearAllMocks();
	adapter.consumeVerificationValue
		.mockResolvedValueOnce({ value: JSON.stringify({ challenge: "challenge-1", codeVerifier: "verifier", nonce: "nonce" }), expiresAt: new Date(Date.now() + 60_000) })
		.mockResolvedValueOnce({ value: JSON.stringify({ userId: "application-user-1" }), expiresAt: new Date(Date.now() + 60_000) });
	adapter.findUserById.mockResolvedValue({ id: "application-user-1" });
	adapter.createAccount.mockResolvedValue({ id: "mapping-1" });
	oidcDiscovery.mockResolvedValue({ serverMetadata: () => ({ issuer: "https://identity.example.test/api/auth" }) });
	oidcGrant.mockResolvedValue({ claims: () => ({ iss: "https://identity.example.test/api/auth", sub: "central-subject-1" }) });
	dbSelect.mockImplementation(() => ({
		from: () => ({
			where: () => ({ limit: async () => [] }),
		}),
	}));
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
