import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type ServerResponse } from "node:http";
import * as oidc from "openid-client";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const origin = new URL(required("THIRD_RP_ORIGIN"));
if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash) {
  throw new Error("THIRD_RP_ORIGIN must be an HTTPS origin without a path");
}
const issuer = new URL(required("THIRD_RP_ISSUER"));
if (issuer.protocol !== "https:") throw new Error("THIRD_RP_ISSUER must use HTTPS");
const clientId = required("THIRD_RP_CLIENT_ID");
const clientSecret = required("THIRD_RP_CLIENT_SECRET");
const callback = new URL("/oidc/callback", origin).toString();
const port = Number(process.env.THIRD_RP_PORT ?? "15000");
const bindAddress = process.env.THIRD_RP_BIND_ADDRESS ?? "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("THIRD_RP_PORT must be a valid TCP port");

const configuration = oidc.discovery(
  issuer,
  clientId,
  { redirect_uris: [callback], response_types: ["code"] },
  oidc.ClientSecretBasic(clientSecret),
);
const pending = new Map<string, { verifier: string; nonce: string; returnTo: string; expiresAt: number }>();
const sessions = new Map<string, { subject: string; expiresAt: number }>();
const cookieName = "third_rp_session";
const stateCookieName = "third_rp_state";
const lifetime = 8 * 60 * 60 * 1000;

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/private";
  const parsed = new URL(value, origin);
  return parsed.origin === origin.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/private";
}

function cookies(header: string | undefined): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const index = part.indexOf("=");
    if (index >= 0) result.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }
  return result;
}

function send(response: ServerResponse, status: number, body: string, headers: Record<string, string | string[]> = {}) {
  response.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...headers });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", origin);
    const sessionId = cookies(request.headers.cookie).get(cookieName);
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (session && session.expiresAt <= Date.now()) sessions.delete(sessionId!);

    if (url.pathname === "/healthz") return send(response, 200, "ok");
    if (url.pathname === "/api/session") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      return response.end(JSON.stringify(session && session.expiresAt > Date.now() ? { active: true } : null));
    }
    if (url.pathname === "/logout") {
      if (sessionId) sessions.delete(sessionId);
      return send(response, 303, "", { location: "/", "set-cookie": `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
    }
    if (url.pathname === "/oidc/callback") {
      const state = url.searchParams.get("state");
      const transaction = state ? pending.get(state) : undefined;
      const stateCookie = cookies(request.headers.cookie).get(stateCookieName);
      if (!state || !transaction || transaction.expiresAt <= Date.now() || stateCookie !== state) {
        return send(response, 400, "Invalid or expired authorization transaction");
      }
      pending.delete(state);
      const client = await configuration;
      const tokens = await oidc.authorizationCodeGrant(client, url, {
        expectedState: state,
        expectedNonce: transaction.nonce,
        pkceCodeVerifier: transaction.verifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims?.sub || claims.iss !== client.serverMetadata().issuer) return send(response, 401, "Invalid identity token");
      const id = randomBytes(32).toString("base64url");
      sessions.set(id, { subject: claims.sub, expiresAt: Date.now() + lifetime });
      return send(response, 303, "", {
        location: transaction.returnTo,
        "set-cookie": [
          `${cookieName}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${lifetime / 1000}`,
          `${stateCookieName}=; Path=/oidc/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        ],
      });
    }
    if (session && session.expiresAt > Date.now()) {
      if (url.pathname === "/login") return send(response, 200, "Sign-in already complete");
      return send(response, 200, `<!doctype html><title>Third RP</title><h1>Third RP</h1><p>Application Session active</p><a href="/logout">Sign out</a>`);
    }
    if (url.pathname !== "/login") {
      const target = safeReturnTo(`${url.pathname}${url.search}`);
      return send(response, 303, "", { location: `/login?returnTo=${encodeURIComponent(target)}` });
    }
    const client = await configuration;
    const state = randomUUID();
    const verifier = oidc.randomPKCECodeVerifier();
    const nonce = oidc.randomNonce();
    const challenge = await oidc.calculatePKCECodeChallenge(verifier);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
    pending.set(state, { verifier, nonce, returnTo, expiresAt: Date.now() + 10 * 60 * 1000 });
    const authorizationURL = oidc.buildAuthorizationUrl(client, {
      client_id: clientId,
      redirect_uri: callback,
      response_type: "code",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return send(response, 302, "", {
      location: authorizationURL.href,
      "set-cookie": `${stateCookieName}=${state}; Path=/oidc/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    });
  } catch (error) {
    console.error("Third RP request failed", error);
    return send(response, 502, "OIDC request failed");
  }
});

server.listen(port, bindAddress, () => console.log(`Third RP listening on ${bindAddress}:${port}; callback ${callback}`));
