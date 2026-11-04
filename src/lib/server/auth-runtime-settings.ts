import { env } from "$env/dynamic/private";

const localIssuer = "https://auth.127.0.0.1.nip.io/api/auth";

function required(name: string): string {
	const value = env[name]?.trim();
	if (!value) throw new Error(`Missing required production environment variable: ${name}`);
	return value;
}

export function getAuthRuntimeSettings(production: boolean, localBaseUrl?: string) {
	if (production) {
		return {
			appOrigin: required("BETTER_AUTH_URL"),
			issuer: required("CENTRAL_OIDC_ISSUER").replace(/\/$/, ""),
			clientId: required("CENTRAL_OIDC_CLIENT_ID"),
			clientSecret: required("CENTRAL_OIDC_CLIENT_SECRET"),
			sessionSecret: required("BETTER_AUTH_SECRET"),
		};
	}

	return {
		appOrigin: localBaseUrl || env.BETTER_AUTH_URL,
		issuer: env.CENTRAL_OIDC_ISSUER || localIssuer,
		clientId: env.CENTRAL_OIDC_CLIENT_ID || "",
		clientSecret: env.CENTRAL_OIDC_CLIENT_SECRET || "",
		sessionSecret: env.BETTER_AUTH_SECRET,
	};
}

