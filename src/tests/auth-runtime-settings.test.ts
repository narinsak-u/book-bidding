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
};

beforeEach(() => {
	for (const key of Object.keys(runtimeEnv)) delete runtimeEnv[key];
	Object.assign(runtimeEnv, productionSettings);
});

it("reads synthetic private env at runtime for production settings", () => {
	runtimeEnv.CENTRAL_OIDC_CLIENT_ID = "vercel-runtime-client-id";

	expect(getAuthRuntimeSettings(true)).toEqual({
		appOrigin: "https://bidding.example.test",
		issuer: "https://identity.example.test/api/auth",
		clientId: "vercel-runtime-client-id",
		clientSecret: "synthetic-client-secret",
		sessionSecret: "synthetic-session-secret",
	});
});

it.each(Object.keys(productionSettings))("rejects missing production %s", (name) => {
	delete runtimeEnv[name];
	expect(() => getAuthRuntimeSettings(true)).toThrow(`Missing required production environment variable: ${name}`);
});
