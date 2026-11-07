import { createHash, randomUUID } from "node:crypto";
import * as oidc from "openid-client";
import { and, eq, gt, sql } from "drizzle-orm";
import { dev } from "$app/environment";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { env } from "$env/dynamic/private";
import { auth } from "$lib/auth";
import { getAuthRuntimeSettings } from "$lib/server/auth-runtime-settings";
import { db } from "$lib/server/db";
import { account, user, verification } from "$lib/server/db/schema";

const recoveryLifetimeMs = 10 * 60 * 1000;
const passwordProofLimit = 5;
const passwordProofWindowMs = 15 * 60 * 1000;
const settings = getAuthRuntimeSettings(!dev, dev ? "http://localhost:5173" : PUBLIC_BASE_URL);
const providerClients = new Map<"google" | "github", Promise<oidc.Configuration>>();
let clientConfiguration: Promise<oidc.Configuration> | undefined;

function getOIDCClient() {
	if (!settings.recoveryOIDCRedirectURI) throw new Error("Recovery OIDC redirect URI is not configured.");
	return (clientConfiguration ??= oidc.discovery(
		new URL(settings.issuer),
		settings.clientId,
		{
			redirect_uris: [settings.recoveryOIDCRedirectURI],
			response_types: ["code"],
		},
		oidc.ClientSecretBasic(settings.clientSecret),
	));
}

function getProviderClient(provider: "google" | "github") {
	const existing = providerClients.get(provider);
	if (existing) return existing;
	const clientId = env[`BIDDING_RECOVERY_${provider.toUpperCase()}_CLIENT_ID`]?.trim();
	const clientSecret = env[`BIDDING_RECOVERY_${provider.toUpperCase()}_CLIENT_SECRET`]?.trim();
	if (!clientId || !clientSecret || !settings.appOrigin) throw new Error("Recovery provider client is not configured.");
	const metadata = {
		redirect_uris: [providerRedirectURI()],
		response_types: ["code"],
	};
	const configuration = provider === "google"
		? oidc.discovery(new URL("https://accounts.google.com"), clientId, metadata, oidc.ClientSecretBasic(clientSecret))
		: Promise.resolve(new oidc.Configuration({
			issuer: "https://github.com",
			authorization_endpoint: "https://github.com/login/oauth/authorize",
			token_endpoint: "https://github.com/login/oauth/access_token",
		}, clientId, metadata, oidc.ClientSecretPost(clientSecret)));
	providerClients.set(provider, configuration);
	return configuration;
}

function providerRedirectURI() {
	if (!settings.appOrigin) throw new Error("Recovery provider redirect URI is not configured.");
	return new URL("/api/identity-recovery/provider/callback", settings.appOrigin).toString();
}

function verificationIdentifier(kind: "challenge" | "state" | "provider-state", value: string) {
	return `identity-recovery:${kind}:${value}`;
}

async function startCentralAuthorization(userId: string, challenge: string) {
	if (!settings.recoveryOIDCRedirectURI) throw new Error("Recovery OIDC redirect URI is not configured.");
	const context = await auth.$context;
	const state = oidc.randomState();
	const codeVerifier = oidc.randomPKCECodeVerifier();
	const nonce = oidc.randomNonce();
	const expiresAt = new Date(Date.now() + recoveryLifetimeMs);
	await context.internalAdapter.createVerificationValue({
		identifier: verificationIdentifier("challenge", challenge),
		value: JSON.stringify({ userId }),
		expiresAt,
	});
	await context.internalAdapter.createVerificationValue({
		identifier: verificationIdentifier("state", state),
		value: JSON.stringify({ challenge, codeVerifier, nonce }),
		expiresAt,
	});
	const configuration = await getOIDCClient();
	const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
	const authorizationURL = oidc.buildAuthorizationUrl(configuration, {
		client_id: settings.clientId,
		redirect_uri: settings.recoveryOIDCRedirectURI,
		response_type: "code",
		scope: "openid email profile",
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
	});
	return { authorizationURL, challenge };
}

export async function beginRecovery(email: string, password: string) {
	const normalizedEmail = email.trim().toLowerCase();
	const identifier = `identity-recovery:password-proof:${createHash("sha256").update(normalizedEmail).digest("hex")}`;
	const now = new Date();
	const [attempt] = await db.insert(verification).values({
		id: identifier,
		identifier,
		value: "1",
		expiresAt: new Date(now.getTime() + passwordProofWindowMs),
	}).onConflictDoUpdate({
		target: verification.id,
		set: {
			value: sql`case when ${verification.expiresAt} > ${now.getTime()} then cast(${verification.value} as integer) + 1 else 1 end`,
			expiresAt: new Date(now.getTime() + passwordProofWindowMs),
		},
	}).returning({ value: verification.value });
	if (Number(attempt?.value ?? 0) > passwordProofLimit) throw new Error("RECOVERY_PROOF_INVALID");
	const context = await auth.$context;
	const [localUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, normalizedEmail)).limit(1);
	const credential = localUser ? await context.internalAdapter.findCredentialAccount(localUser.id) : null;
	if (!localUser || !credential?.password || !await context.password.verify({ hash: credential.password, password })) {
		throw new Error("RECOVERY_PROOF_INVALID");
	}
	await db.delete(verification).where(eq(verification.id, identifier));
	return startCentralAuthorization(localUser.id, randomUUID());
}

export async function beginProviderRecovery(provider: "google" | "github") {
	const state = oidc.randomState();
	const challenge = randomUUID();
	const codeVerifier = oidc.randomPKCECodeVerifier();
	const nonce = provider === "google" ? oidc.randomNonce() : undefined;
	const expiresAt = new Date(Date.now() + recoveryLifetimeMs);
	const context = await auth.$context;
	await context.internalAdapter.createVerificationValue({
		identifier: verificationIdentifier("provider-state", state),
		value: JSON.stringify({ provider, challenge, codeVerifier, nonce }),
		expiresAt,
	});
	const configuration = await getProviderClient(provider);
	const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
	const authorizationURL = oidc.buildAuthorizationUrl(configuration, {
		client_id: configuration.clientMetadata().client_id,
		redirect_uri: providerRedirectURI(),
		response_type: "code",
		scope: provider === "google" ? "openid email profile" : "read:user",
		state,
		...(nonce ? { nonce } : {}),
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
	});
	return { authorizationURL, challenge };
}

export async function finishProviderRecovery(callbackURL: URL, challenge: string | undefined) {
	const state = callbackURL.searchParams.get("state");
	if (!state || !challenge) throw new Error("RECOVERY_PROOF_INVALID");
	const context = await auth.$context;
	const stateRecord = await context.internalAdapter.consumeVerificationValue(verificationIdentifier("provider-state", state));
	if (!stateRecord) throw new Error("RECOVERY_PROOF_INVALID");
	const stateData = JSON.parse(stateRecord.value) as {
		provider: "google" | "github";
		challenge: string;
		codeVerifier: string;
		nonce?: string;
	};
	if (stateData.challenge !== challenge) throw new Error("RECOVERY_PROOF_INVALID");
	const configuration = await getProviderClient(stateData.provider);
	const tokens = await oidc.authorizationCodeGrant(configuration, callbackURL, {
		expectedState: state,
		...(stateData.nonce ? { expectedNonce: stateData.nonce, idTokenExpected: true } : {}),
		pkceCodeVerifier: stateData.codeVerifier,
	});
	let accountId: string | undefined;
	if (stateData.provider === "google") {
		accountId = tokens.claims()?.sub;
	} else if (tokens.access_token) {
		const response = await fetch("https://api.github.com/user", {
			headers: {
				accept: "application/vnd.github+json",
				authorization: `Bearer ${tokens.access_token}`,
				"user-agent": "book-bidding-identity-recovery",
			},
		});
		if (response.ok) {
			const profile = await response.json() as { id?: number | string };
			accountId = profile.id === undefined ? undefined : String(profile.id);
		}
	}
	if (!accountId) throw new Error("RECOVERY_PROOF_INVALID");
	const existingProviderAccounts = await db.select({ userId: account.userId }).from(account).where(and(
		eq(account.providerId, stateData.provider),
		eq(account.accountId, accountId),
	)).limit(2);
	if (existingProviderAccounts.length !== 1) throw new Error("RECOVERY_PROOF_INVALID");
	return startCentralAuthorization(existingProviderAccounts[0].userId, challenge);
}

export async function finishRecovery(callbackURL: URL, challenge: string | undefined) {
	const state = callbackURL.searchParams.get("state");
	if (!state || !challenge) throw new Error("RECOVERY_PROOF_INVALID");
	const context = await auth.$context;
	const stateRecord = await context.internalAdapter.consumeVerificationValue(verificationIdentifier("state", state));
	if (!stateRecord || stateRecord.expiresAt <= new Date()) throw new Error("RECOVERY_PROOF_INVALID");

	const stateData = JSON.parse(stateRecord.value) as { challenge: string; codeVerifier: string; nonce: string };
	if (stateData.challenge !== challenge) throw new Error("RECOVERY_PROOF_INVALID");
	const challengeRecord = await context.internalAdapter.consumeVerificationValue(verificationIdentifier("challenge", challenge));
	if (!challengeRecord || challengeRecord.expiresAt <= new Date()) throw new Error("RECOVERY_PROOF_INVALID");
	const { userId } = JSON.parse(challengeRecord.value) as { userId: string };

	const configuration = await getOIDCClient();
	const tokens = await oidc.authorizationCodeGrant(configuration, callbackURL, {
		expectedState: state,
		expectedNonce: stateData.nonce,
		pkceCodeVerifier: stateData.codeVerifier,
		idTokenExpected: true,
	});
	const claims = tokens.claims();
	if (!claims?.sub || claims.iss !== configuration.serverMetadata().issuer) throw new Error("RECOVERY_PROOF_INVALID");

	const [existingSubject] = await db.select({ userId: account.userId }).from(account).where(and(
		eq(account.providerId, "central-identity"),
		eq(account.accountId, claims.sub),
	)).limit(1);
	const [existingLocalLink] = await db.select({ accountId: account.accountId }).from(account).where(and(
		eq(account.providerId, "central-identity"),
		eq(account.userId, userId),
	)).limit(1);
	if (existingSubject || existingLocalLink || !await context.internalAdapter.findUserById(userId)) {
		throw new Error("IDENTITY_LINK_CONFLICT");
	}

	try {
		await context.internalAdapter.createAccount({ userId, accountId: claims.sub, providerId: "central-identity" });
	} catch (error) {
		if (typeof error === "object" && error !== null && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT")) {
			throw new Error("IDENTITY_LINK_CONFLICT");
		}
		throw error;
	}
}
