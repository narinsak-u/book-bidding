import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "./server/db";
import { getRequestEvent } from "$app/server";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL, PUBLIC_FRONTEND_URL } from "$env/static/public";
import { dev } from "$app/environment";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),

    // Configure base URL for dev vs production
    baseURL: dev ? (PUBLIC_BASE_URL || env.BETTER_AUTH_URL) : PUBLIC_FRONTEND_URL,

    // Add trusted origins for dev and production
    trustedOrigins: [
        dev ? (PUBLIC_BASE_URL || env.BETTER_AUTH_URL) : PUBLIC_FRONTEND_URL,
        PUBLIC_BASE_URL,
        PUBLIC_FRONTEND_URL,
    ].filter(Boolean),
    advanced: {
        useSecureCookies: true,
    },

    account: {
        accountLinking: {
            disableImplicitLinking: true,
        },
    },

    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },

        github: {
            clientId: env.GITHUB_CLIENT_ID as string,
            clientSecret: env.GITHUB_CLIENT_SECRET as string,
        },
    },

    // Configure secret for session security
    secret: env.BETTER_AUTH_SECRET,

    plugins: [
        genericOAuth({
            config: [{
                providerId: "central-identity",
                discoveryUrl: env.CENTRAL_OIDC_ISSUER
                    ? `${env.CENTRAL_OIDC_ISSUER}/.well-known/openid-configuration`
                    : "https://auth.127.0.0.1.nip.io/api/auth/.well-known/openid-configuration",
                requireIdTokenVerification: true,
                clientId: env.CENTRAL_OIDC_CLIENT_ID ?? "",
                clientSecret: env.CENTRAL_OIDC_CLIENT_SECRET ?? "",
                tokenEndpointAuth: { method: "client_secret_basic" },
                scopes: ["openid", "email", "profile"],
                pkce: true,
                disableProviderLogout: true,
            }],
        }),
        sveltekitCookies(getRequestEvent), // keep cookies last
    ],
});
