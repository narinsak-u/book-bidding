import { afterEach, expect, it, vi } from "vitest";

const { beginRecovery, beginProviderRecovery, finishProviderRecovery, finishRecovery } = vi.hoisted(() => ({
	beginRecovery: vi.fn(),
	beginProviderRecovery: vi.fn(),
	finishProviderRecovery: vi.fn(),
	finishRecovery: vi.fn(),
}));

vi.mock("$lib/server/identity-recovery", () => ({
	beginRecovery,
	beginProviderRecovery,
	finishProviderRecovery,
	finishRecovery,
}));

import { POST } from "../routes/api/identity-recovery/+server";
import { GET } from "../routes/api/identity-recovery/callback/+server";
import { POST as beginProvider } from "../routes/api/identity-recovery/provider/+server";
import { GET as finishProvider } from "../routes/api/identity-recovery/provider/callback/+server";
import { load as identityLinkLoad } from "../routes/account/identity/+page.server";

afterEach(() => vi.clearAllMocks());

it("refuses recovery when prior Application User proof fails", async () => {
	beginRecovery.mockRejectedValueOnce(new Error("RECOVERY_PROOF_INVALID"));
	const response = await POST({
		request: new Request("https://bidding.example.test/api/identity-recovery", {
			method: "POST",
			headers: { origin: "https://bidding.example.test" },
			body: new URLSearchParams({ email: "person@example.test", password: "wrong-password" }),
		}),
		url: new URL("https://bidding.example.test/api/identity-recovery"),
		locals: {},
	} as never);

	expect(response.status).toBe(401);
	expect(response.headers.get("set-cookie")).toBeNull();
});
it("does not link or start recovery from a matching email alone", async () => {
	const response = await POST({
		request: new Request("https://bidding.example.test/api/identity-recovery", {
			method: "POST",
			headers: { origin: "https://bidding.example.test" },
			body: new URLSearchParams({ email: "person@example.test" }),
		}),
		url: new URL("https://bidding.example.test/api/identity-recovery"),
		locals: {},
	} as never);

	expect(response.status).toBe(400);
	expect(beginRecovery).not.toHaveBeenCalled();
});

it("fails closed on a conflicting Identity Link without creating an Application Session", async () => {
	finishRecovery.mockRejectedValueOnce(new Error("IDENTITY_LINK_CONFLICT"));
	const response = await GET({
		request: new Request("https://bidding.example.test/api/identity-recovery/callback?state=one-time"),
		url: new URL("https://bidding.example.test/api/identity-recovery/callback?state=one-time"),
		cookies: { get: () => "challenge" },
	} as never);

	expect(response.status).toBe(409);
	expect(response.headers.get("set-cookie") ?? "").not.toContain("better-auth");
});
it("rejects a provider account that has no existing Application User link", async () => {
	finishProviderRecovery.mockRejectedValueOnce(new Error("RECOVERY_PROOF_INVALID"));
	const cookies = { get: () => "challenge", delete: vi.fn() };
	const response = await finishProvider({
		request: new Request("https://bidding.example.test/api/identity-recovery/provider/callback?state=one-time"),
		url: new URL("https://bidding.example.test/api/identity-recovery/provider/callback?state=one-time"),
		cookies,
	} as never);

	expect(response.status).toBe(400);
	expect(cookies.delete).toHaveBeenCalledWith("bidding_identity_recovery", { path: "/api/identity-recovery" });
	expect(response.headers.get("set-cookie") ?? "").not.toContain("better-auth");
});

it("starts provider recovery only for a supported existing provider", async () => {
	const response = await beginProvider({
		request: new Request("https://bidding.example.test/api/identity-recovery/provider", {
			method: "POST",
			headers: { origin: "https://bidding.example.test" },
			body: new URLSearchParams({ provider: "unknown" }),
		}),
		url: new URL("https://bidding.example.test/api/identity-recovery/provider"),
		locals: {},
	} as never);

	expect(response.status).toBe(400);
	expect(beginProviderRecovery).not.toHaveBeenCalled();
});
it("redirects after Central Identity proof without issuing an Application Session", async () => {
	finishRecovery.mockResolvedValueOnce(undefined);
	const cookies = { get: () => "challenge", delete: vi.fn() };
	let result: unknown;
	try {
		await GET({
			request: new Request("https://bidding.example.test/api/identity-recovery/callback?state=one-time"),
			url: new URL("https://bidding.example.test/api/identity-recovery/callback?state=one-time"),
			cookies,
		} as never);
	} catch (error) {
		result = error;
	}

	expect(result).toMatchObject({ status: 303, location: "/account/identity/recovery?complete=1" });
	expect(cookies.delete).toHaveBeenCalledWith("bidding_identity_recovery", { path: "/api/identity-recovery" });
});
it("keeps the existing Identity Link page available to a valid Application Session", async () => {
	const result = await identityLinkLoad({
		locals: { user: { id: "application-user-1" }, session: { id: "session-1" } },
		url: new URL("https://bidding.example.test/account/identity"),
	} as never);

	expect(result).toEqual({ linkError: false });
});
it("starts provider proof with a short-lived HttpOnly recovery cookie", async () => {
	beginProviderRecovery.mockResolvedValueOnce({
		authorizationURL: new URL("https://accounts.google.com/o/oauth2/v2/auth"),
		challenge: "opaque-recovery-challenge",
	});
	const cookies = { set: vi.fn() };
	let result: unknown;
	try {
		await beginProvider({
			request: new Request("https://bidding.example.test/api/identity-recovery/provider", {
				method: "POST",
				headers: { origin: "https://bidding.example.test" },
				body: new URLSearchParams({ provider: "google" }),
			}),
			url: new URL("https://bidding.example.test/api/identity-recovery/provider"),
			locals: {},
			cookies,
		} as never);
	} catch (error) {
		result = error;
	}

	expect(result).toMatchObject({ status: 303, location: "https://accounts.google.com/o/oauth2/v2/auth" });
	expect(cookies.set).toHaveBeenCalledWith("bidding_identity_recovery", "opaque-recovery-challenge", expect.objectContaining({
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		maxAge: 600,
	}));
});
