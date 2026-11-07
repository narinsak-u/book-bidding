import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "./server/db";
import { getRequestEvent } from "$app/server";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL, PUBLIC_FRONTEND_URL } from "$env/static/public";
import { dev } from "$app/environment";
import { getAuthRuntimeSettings } from "./server/auth-runtime-settings";

const settings = getAuthRuntimeSettings(!dev, dev ? "http://localhost:5173" : PUBLIC_BASE_URL);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),

    baseURL: settings.appOrigin,

    // Add trusted origins for dev and production
    trustedOrigins: dev
        ? [settings.appOrigin, PUBLIC_BASE_URL, PUBLIC_FRONTEND_URL].filter(Boolean)
        : [settings.appOrigin],
    advanced: {
        cookiePrefix: dev ? "bidding" : "better-auth",
        useSecureCookies: settings.appOrigin?.startsWith("https://") ?? true,
    },
    account: {
        accountLinking: {
            disableImplicitLinking: true,
            allowDifferentEmails: true,
        },
    },

    emailAndPassword: {
        enabled: false,
    },


    // Configure secret for session security
    secret: settings.sessionSecret,

    plugins: [
        genericOAuth({
            config: [{
                providerId: "central-identity",
                discoveryUrl: `${settings.issuer}/.well-known/openid-configuration`,
                redirectURI: settings.centralIdentityCallbackURL,
                requireIdTokenVerification: true,
                clientId: settings.clientId,
                clientSecret: settings.clientSecret,
                tokenEndpointAuth: { method: "client_secret_basic" },
                scopes: ["openid", "email", "profile"],
                pkce: true,
                disableProviderLogout: true,
            }],
        }),
        sveltekitCookies(getRequestEvent), // keep cookies last
    ],
});

