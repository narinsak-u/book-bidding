# Book Bidding (SvelteKit)

An auction platform built with SvelteKit 5. Users create book auctions, upload cover images, place bids in real time, and track sales and payments.

![screenshot](src/lib/assets/screenshot.png)

## Stack

- SvelteKit 5, Svelte Runes
- Better Auth + Drizzle adapter (LibSQL/Turso)
- Supabase Storage for images
- Stripe Checkout
- Flowbite Svelte UI, Tailwind v4
- Vitest for tests

## Features
- Authentication: Central Identity OIDC login; legacy Book Bidding accounts use Reviewed Recovery to link.
- Auctions: Create/edit with image upload
- Bidding: Real-time updates via Server-Sent Events (SSE)
- My Bids: Separated Active and Ended sections
- Sales: Stats include Pending Payment Value, Expenses, and Sales Revenue
- Checkout: Stripe session creation API for won items

## Setup

Install dependencies and keep the dotenvx private key outside Git. Development
uses encrypted `.env.development`; production-like local runs use a separate
encrypted `.env.test-production`. Never use live `.env.production` for
`dev:prod`.

Before starting Book Bidding, run `bun run dev:setup` from the sibling
`book-auth-middleware` repository. This exports its public development CA to
`central-identity-root.crt`; the `dev` command uses that certificate through
`NODE_EXTRA_CA_CERTS`.

```sh
bun install
bun run dev        # development on :5173
# After creating separate encrypted test-production credentials:
bun run dev:prod   # production-mode preview on :5174
```

`dev` serves Book Bidding directly at `http://localhost:5173`. Central Identity
remains at `https://auth.localhost:8080` and does not proxy either application.

The `dev` command uses
`../book-auth-middleware/central-identity-root.crt` by default. Set
`NODE_EXTRA_CA_CERTS` to another readable PEM CA path to use a different
development CA. Startup reports guidance if the selected CA is missing,
unreadable, or invalid. The browser test does not require the local CA file; its
Playwright Chromium uses the operating system/browser trust store for the
configured Central Identity origin. `dev:prod` does not use this development
CA setting.

`dev:prod` builds a production bundle
from `.env.test-production` and serves it with Vite preview on `5174`. It uses
`https://bidding-test.localhost:8081` plus the test-prefixed Central
issuer. Its `DATABASE_URL` must use `file:local-test-production.db`; this
keeps test data apart from `local.db`. Startup initializes the schema only
when that isolated database file does not exist. Create `.env.test-production`
from `.env.test-production.example`, then provision its own confidential OIDC
client and app credentials before starting.

Checks, tests, and database commands load `.env.development`. Build and preview
load `.env.production`; `dev:prod` never does. Use `bun run env:encrypt` and
`bun run env:decrypt` for development, or `bun run env:encrypt:test-production`
and `bun run env:decrypt:test-production` for isolated test credentials. Back
up `.env.keys` and `.env.test-production.keys` outside Git. The pre-commit
hook rejects private keys and unencrypted staged environment values.

All configuration files contain the app's Better Auth, database, Supabase,
Stripe, email, and optional OAuth settings. Keep frontend-public variables
limited to values intended for browsers; secrets must not use a `PUBLIC_`
prefix.


## Database

Drizzle with LibSQL/Turso.

```sh
bun run db:generate   # generate SQL
bun run db:push       # create/update the local SQLite schema
bun run db:studio     # inspect
```

Schema in `src/lib/server/db/schema.ts`.

## Auth

- Server: `src/lib/auth.ts` disables local password and provider sign-in. `src/hooks.server.ts` mounts Better Auth and populates `event.locals.user`/`session`.
- Client: `src/lib/auth-client.ts` starts Central Identity OIDC login; normal authentication uses the Relying Party authorization flow.
- OAuth: Only Central Identity is configured for normal sign-in. Google/GitHub clients are restricted to migration-only recovery; see OIDC setup for confidential-client provisioning and exact callback URLs.

## Central Identity OIDC

Local development uses the issuer `https://auth.localhost:8080/api/auth`.
Register `http://localhost:5173/api/auth/callback/central-identity` and
`http://localhost:5173/api/identity-recovery/callback` with its OIDC client.
Migration-only Google/GitHub proof clients use
`http://localhost:5173/api/identity-recovery/provider/callback`.
Production-like local mode uses the separate issuer
`https://auth-test.localhost:8081/api/auth` and matching
`https://bidding-test.localhost:8081` callbacks. These are not production
registrations. Direct local HTTP uses a Bidding-specific, host-only session
cookie distinct from Reading; HTTPS mode retains its original Secure cookies.

For production, wait for the operator to supply the actual Vercel project and Book Bidding hostname. Register both exact HTTPS callbacks at Central Identity, replacing the placeholder with that supplied host:

```text
https://<bidding-host>/api/auth/callback/central-identity
https://<bidding-host>/api/identity-recovery/callback
```

Configure the Central Identity issuer as `<real-issuer-origin>/api/auth`. Put the provider-issued client ID and secret in the encrypted `.env.production` configuration and separately enter them in Vercel **Project Settings → Environment Variables** for the Production environment. Set these private Vercel runtime variables to the matching values from `.env.production`: `BETTER_AUTH_URL`, `CENTRAL_OIDC_ISSUER`, `CENTRAL_OIDC_CLIENT_ID`, `CENTRAL_OIDC_CLIENT_SECRET`, `BIDDING_RECOVERY_OIDC_REDIRECT_URI`, and `BETTER_AUTH_SECRET`. Set `BIDDING_RECOVERY_OIDC_REDIRECT_URI` to `https://<bidding-host>/api/identity-recovery/callback`. `BETTER_AUTH_URL` is the `https://<bidding-host>` app origin. Also set `PUBLIC_FRONTEND_URL` to the same origin and `PUBLIC_CENTRAL_IDENTITY_URL` to the provider's HTTPS origin as public build-time values; keep both represented in `.env.production`. The login page shows its local demo credentials only during development.

The app reads the private values through SvelteKit's `$env/dynamic/private` inside server code, so Vercel Functions receive them at runtime; no `.env.keys` decryption key or decrypted env file is needed in the build or Function. The committed `.env.production` remains encrypted, with its private key kept outside Git and Vercel artifacts. Keep the Vercel Production settings in sync with it when rotating credentials. Do not use local `.nip.io`/`.sslip.io` values in production or configure a registration until the real hostname is known.

The server config pins the provider redirect URI to `<BETTER_AUTH_URL>/api/auth/callback/central-identity`. Check the private runtime settings contract, issuer, callback host, and missing-secret failure with `bun run test:unit -- --run src/tests/auth-runtime-settings.test.ts`; this synthetic test does not verify values saved in Vercel or the live callback.

**Book Bidding sign-out** ends only this app's Application Session; Read in
Peace and Central Identity remain signed in. **Central sign-out** (also
accessible from the sign-in page) opens the provider page set by
`PUBLIC_CENTRAL_IDENTITY_URL`; choose **Sign out of Central Identity** there
to end only the Central SSO Session. A later fresh OIDC authorization returns
to Central sign-in; Google or GitHub may still retain a separate provider
session. Existing app sessions remain usable until each app ends them or they
expire.

For local development, follow the [Development SSO workflow](../book-auth-middleware/docs/local-oauth-sso.md) for confidential-client provisioning. Book Bidding runs directly at `http://localhost:5173`; Central Identity remains at `https://auth.localhost:8080/api/auth`, and Reading runs at `http://localhost:3001`. Store Supabase/Stripe values in `.env.development`; keep `.env.keys` outside Git. Set the OIDC client ID and secret printed by `bun run provision:bidding` in `CENTRAL_OIDC_CLIENT_ID` and `CENTRAL_OIDC_CLIENT_SECRET`. Initialize a new development database with `bun run db:push` only when needed.

For local proof, open a protected Book Bidding page at `http://localhost:5173`. The app starts Central Identity authorization; complete provider sign-in and confirm return to the original destination with an independent Application Session. A matching email must not claim an unlinked local account; that owner must use Reviewed Recovery.

Run `bun run test:oidc-browser` with `CENTRAL_IDENTITY_TEST_EMAIL` and `CENTRAL_IDENTITY_TEST_PASSWORD`. The script defaults to Book Bidding `http://localhost:5173`, Reading `http://localhost:3001`, and Central Identity `https://auth.localhost:8080`; override the `*_OIDC_TEST_ORIGIN` variables only when testing another topology. It verifies silent Central SSO reuse on Reading, separate host-only Application Session cookies, and restoration of both protected destinations.

### Disposable third Relying Party

`scripts/third-rp.ts` runs a separate confidential OIDC client and a separate
in-memory Application Session. Register its exact callback with Central
Identity; keep the secret in the backend process only. The temporary edge
overlay maps `third.localtest.me` to loopback port `15000`; do not add this host
to the production edge configuration.

From the standalone provider checkout, with its verified private environment file, register the exact callback:

```sh
docker compose --env-file /path/to/private-identity.env -f compose.identity.production.yaml run --rm --no-deps auth bun run --filter @central-identity/server provision:client third-rp '<operator-email-prefix>' https://third.localtest.me:15443/oidc/callback
```

This is operator-only enrollment; keep the one-time secret in the backend
process environment below.


```sh
THIRD_RP_ORIGIN=https://third.localtest.me:15443 \
THIRD_RP_ISSUER=https://identity.localtest.me:15443/api/auth \
THIRD_RP_CLIENT_ID='<issued-client-id>' \
THIRD_RP_CLIENT_SECRET='<issued-client-secret>' \
THIRD_RP_PORT=15000 \
NODE_EXTRA_CA_CERTS=/tmp/standalone42-ca.crt \
bun scripts/third-rp.ts
```
The app binds to `127.0.0.1` by default. In its disposable container only,
set `THIRD_RP_BIND_ADDRESS=0.0.0.0` and publish `15000` on host loopback.

Run the browser journey with the existing Bidding, Reading, and Central
Identity variables plus `THIRD_RP_TEST_ORIGIN=https://third.localtest.me:15443`.
It verifies actual discovery, PKCE authorization, token validation, destination restoration, and distinct Application Sessions.
For a same-run disable proof, set `THIRD_RP_DISABLE_RESUME_FILE=/tmp/standalone42-third-client-disabled` in the browser command. Remove stale signal first. The journey establishes all three Application Sessions, then pauses until the operator disables only the third client and creates the resume file in another terminal:
Remove any stale resume signal before starting:

```sh
rm -f /tmp/standalone42-third-client-disabled
```


```sh
docker compose --env-file /path/to/private-identity.env -f compose.identity.production.yaml run --rm --no-deps auth bun run --filter @central-identity/server disable:client '<issued-client-id>'
touch /tmp/standalone42-third-client-disabled
```

The journey resumes and verifies the existing Bidding, Reading, and third-RP sessions, then checks that fresh third-RP authorization fails with `401 OAuth client is not approved`. For a separate run against an already-disabled client, use `THIRD_RP_EXPECT_DISABLED=1`.


To link a legacy Application User, use Reviewed Recovery at `/account/identity/recovery`. It proves control of the existing local password or its already-linked Google/GitHub account, then verifies a Central Identity separately. Recovery creates no Application Session and changes no user or business data.

### Reviewed Recovery (no Application Session)

For local development, register `http://localhost:5173/api/identity-recovery/callback` with Central Identity and `http://localhost:5173/api/identity-recovery/provider/callback` with Google/GitHub. Production uses `https://<bidding-host>/api/identity-recovery/callback` and `https://<bidding-host>/api/identity-recovery/provider/callback`; set `BIDDING_RECOVERY_OIDC_REDIRECT_URI` to the Central Identity callback.

Configure separate, migration-only Google and GitHub OAuth clients for the provider callback. Store their secrets in encrypted `.env.production` and private Vercel runtime variables as `BIDDING_RECOVERY_GOOGLE_CLIENT_ID`, `BIDDING_RECOVERY_GOOGLE_CLIENT_SECRET`, `BIDDING_RECOVERY_GITHUB_CLIENT_ID`, and `BIDDING_RECOVERY_GITHUB_CLIENT_SECRET`. Do not reuse local-login clients or expose these values to browsers. Remove the migration-only clients after recovery is no longer needed.

1. Direct the user to `http://localhost:5173/account/identity/recovery` in development, or the matching HTTPS Book Bidding origin in production.
2. The user proves the existing Application User with its Book Bidding password or the Google/GitHub account already linked to that user. Provider recovery validates the provider account ID against the stored link; email does not prove ownership.
3. The browser redirects to Central Identity. The user completes normal OIDC authorization. The recovery callback validates issuer, audience, signature, nonce, state, and PKCE before reading the subject.
4. The app links that subject to the independently proven Application User only if neither side already has an Identity Link. Conflicts stop with no changes. Recovery creates no Application Session; the user signs in normally through Central Identity afterward.

The flow stores no password, access token, ID token, or new session. It changes only the Better Auth account mapping; it does not change the Application User ID, bids, purchases, or permissions. Never resolve a conflict by email, manual account merge, replacement user, or deleting records. If neither the existing password nor a previously linked provider can be proved, keep the records intact and escalate.

## Image Upload

Supabase Storage holds images. Previews use the public URL from the stored `fileKey`.

## Realtime Bids

SSE at `routes/api/realtime/bids` streams bid events. Client store in `src/lib/stores/realtime.ts` manages connection and updates.

## Sales & Payments

- API: `routes/api/checkout/+server.ts` creates Stripe sessions.
- Stats:
  - Pending Payment Value — sum of ended auctions awaiting payment
  - Expenses — sum of your successful payments (`paid/succeeded/completed`)
  - Sales Revenue — sum of successful payments to your auctions

## Deployment

- Book Bidding is configured for `@sveltejs/adapter-vercel`. Production issuer, client credentials, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET` must be present as private Vercel runtime variables; auth initialization rejects missing or blank values instead of falling back to local demo hosts.
- Follow **Central Identity OIDC** above for the exact production callback and the separate encrypted configuration/Vercel runtime setup. Live Vercel and callback verification require the operator's real hostname, project access, and credentials.
