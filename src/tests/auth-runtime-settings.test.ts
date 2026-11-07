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

it("allows production startup without migration-only recovery callbacks", () => {
	delete runtimeEnv.BIDDING_RECOVERY_OIDC_REDIRECT_URI;
	expect(getAuthRuntimeSettings(true).recoveryOIDCRedirectURI).toBeUndefined();
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

it.each(Object.keys(productionSettings).filter((name) => name !== "BIDDING_RECOVERY_OIDC_REDIRECT_URI"))("rejects missing production %s", (name) => {
	delete runtimeEnv[name];
	expect(() => getAuthRuntimeSettings(true)).toThrow(`Missing required production environment variable: ${name}`);
});
it("uses the direct HTTP Bidding origin and HTTPS Central Identity by default", () => {
	delete runtimeEnv.CENTRAL_OIDC_ISSUER;
	runtimeEnv.BIDDING_RECOVERY_OIDC_REDIRECT_URI = "https://bidding.localhost:8080/api/identity-recovery/callback";
	runtimeEnv.BETTER_AUTH_URL = "https://bidding.localhost:8080";

	expect(getAuthRuntimeSettings(false, "http://localhost:5173")).toMatchObject({
		appOrigin: "http://localhost:5173",
		issuer: "https://auth.localhost:8080/api/auth",
		centralIdentityCallbackURL: "http://localhost:5173/api/auth/callback/central-identity",
		recoveryOIDCRedirectURI: "http://localhost:5173/api/identity-recovery/callback",
	});
});
