import { beforeEach, expect, it, vi } from "vitest";

const { runtimeEnv } = vi.hoisted(() => ({ runtimeEnv: {} as Record<string, string | undefined> }));
vi.mock("$env/dynamic/private", () => ({ env: runtimeEnv }));

import { getAuthRuntimeSettings } from "../lib/server/auth-runtime-settings";

const productionSettings = {
	BETTER_AUTH_URL: "https://bidding.example.test",
	CENTRAL_OIDC_ISSUER: "https://identity.example.test/api/auth/",
	CENTRAL_OIDC_CLIENT_ID: "synthetic-client-id",
	CENTRAL_OIDC_CLIENT_SECRET: "synthetic-client-secret",
	BETTER_AUTH_SECRET: "synthetic-session-secret",
	BIDDING_RECOVERY_OIDC_REDIRECT_URI: "https://bidding.example.test/api/identity-recovery/callback",
};

beforeEach(() => {
	for (const key of Object.keys(runtimeEnv)) delete runtimeEnv[key];
	Object.assign(runtimeEnv, productionSettings);
});

it("pins the standard OIDC callback to the configured Vercel host", () => {
	expect(getAuthRuntimeSettings(true).centralIdentityCallbackURL).toBe(
		"https://bidding.example.test/api/auth/callback/central-identity",
	);
});

it("uses the recovery-only callback configured for the OIDC client", () => {
	expect(getAuthRuntimeSettings(true).recoveryOIDCRedirectURI).toBe(
		"https://bidding.example.test/api/identity-recovery/callback",
	);
});
it("reads synthetic private env at runtime for production settings", () => {
	runtimeEnv.CENTRAL_OIDC_CLIENT_ID = "vercel-runtime-client-id";

	expect(getAuthRuntimeSettings(true)).toEqual({
		appOrigin: "https://bidding.example.test",
		issuer: "https://identity.example.test/api/auth",
		centralIdentityCallbackURL: "https://bidding.example.test/api/auth/callback/central-identity",
		recoveryOIDCRedirectURI: "https://bidding.example.test/api/identity-recovery/callback",
		clientId: "vercel-runtime-client-id",
		clientSecret: "synthetic-client-secret",
		sessionSecret: "synthetic-session-secret",
	});
});
it("rejects a recovery callback outside the exact app callback URL", () => {
	runtimeEnv.BIDDING_RECOVERY_OIDC_REDIRECT_URI = "https://attacker.example/callback";
	expect(() => getAuthRuntimeSettings(true)).toThrow("BIDDING_RECOVERY_OIDC_REDIRECT_URI must match the app recovery callback");
});

it.each(Object.keys(productionSettings))("rejects missing production %s", (name) => {
	delete runtimeEnv[name];
	expect(() => getAuthRuntimeSettings(true)).toThrow(`Missing required production environment variable: ${name}`);
});
