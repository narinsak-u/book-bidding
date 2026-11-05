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

- Authentication: Email/password login, optional Google/GitHub signup
- Auctions: Create/edit with image upload
- Bidding: Real-time updates via Server-Sent Events (SSE)
- My Bids: Separated Active and Ended sections
- Sales: Stats include Pending Payment Value, Expenses, and Sales Revenue
- Checkout: Stripe session creation API for won items

## Setup

Install dependencies and keep the dotenvx key from the provider outside Git.
Encrypted `.env.development` and `.env.production` are loaded explicitly:

```sh
bun install
bun run dev
bun run check
bun run test
bun run build && bun run preview
```

`bun run dev`, checks, tests, and database commands load `.env.development`.
Build and preview load `.env.production`. Create/update config with dotenvx
(`bunx dotenvx encrypt -f .env.development` or `-f .env.production`); never
commit `.env.keys`. Back up the private key securely. Do not copy development
settings into production or add production credentials until provisioned.

Both files contain the app's Better Auth, database, Supabase, Stripe, email,
and optional OAuth settings. Keep frontend-public variables limited to values
intended for browsers; secrets must not use a `PUBLIC_` prefix.

## Database

Drizzle with LibSQL/Turso.

```sh
bun run db:generate   # generate SQL
bun run db:push       # create/update the local SQLite schema
bun run db:studio     # inspect
```

Schema in `src/lib/server/db/schema.ts`.

## Auth

- Server: `src/lib/auth.ts` enables email/password. `src/hooks.server.ts` mounts Better Auth and populates `event.locals.user`/`session`.
- Client: `src/lib/auth-client.ts` provides `authClient` for login and social sign-in.
- OAuth: Email/password, Google, GitHub, and Central Identity sign-in are configured in `src/lib/auth.ts`; see the OIDC setup below for confidential-client provisioning and the exact HTTPS callback.

## Central Identity OIDC

The local demo uses Better Auth Generic OAuth against `https://auth.127.0.0.1.nip.io/api/auth` with callback `https://bidding.127.0.0.1.sslip.io/api/auth/callback/central-identity`. These are local-only values, not production registrations. Local cookies remain secure and host-only, and provider logout does not end the local Application Session.

For production, wait for the operator to supply the actual Vercel project and Book Bidding hostname. Register only this exact HTTPS callback at Central Identity, replacing the placeholder with that supplied host:

```text
https://<bidding-host>/api/auth/callback/central-identity
```

Configure the Central Identity issuer as `<real-issuer-origin>/api/auth`. Put the provider-issued client ID and secret in the encrypted `.env.production` configuration and separately enter them in Vercel **Project Settings → Environment Variables** for the Production environment. Set these private Vercel runtime variables to the matching values from `.env.production`: `BETTER_AUTH_URL`, `CENTRAL_OIDC_ISSUER`, `CENTRAL_OIDC_CLIENT_ID`, `CENTRAL_OIDC_CLIENT_SECRET`, and `BETTER_AUTH_SECRET`. `BETTER_AUTH_URL` is the `https://<bidding-host>` app origin. Also set `PUBLIC_FRONTEND_URL` to the same origin and `PUBLIC_CENTRAL_IDENTITY_URL` to the provider's HTTPS origin as public build-time values; keep both represented in `.env.production`. The login page shows its local demo credentials only during development.

The app reads the private values through SvelteKit's `$env/dynamic/private` inside server code, so Vercel Functions receive them at runtime; no `.env.keys` decryption key or decrypted env file is needed in the build or Function. The committed `.env.production` remains encrypted, with its private key kept outside Git and Vercel artifacts. Keep the Vercel Production settings in sync with it when rotating credentials. Do not use local `.nip.io`/`.sslip.io` values in production or configure a registration until the real hostname is known.

The server config pins the provider redirect URI to `<BETTER_AUTH_URL>/api/auth/callback/central-identity`. Check the private runtime settings contract, issuer, callback host, and missing-secret failure with `bun run test:unit -- --run src/tests/auth-runtime-settings.test.ts`; this synthetic test does not verify values saved in Vercel or the live callback.

**Book Bidding sign-out** ends only this app's Application Session; Read in
Peace and Central Identity remain signed in. **Central sign-out** (also
accessible from the sign-in page) opens the provider page set by
`PUBLIC_CENTRAL_IDENTITY_URL`; choose **Sign out of Central Identity** there
to end only the Central SSO Session. A later fresh OIDC authorization requires
provider credentials, while existing app sessions remain usable until each
app ends them or they expire.

For the complete local TLS and operator-only confidential-client provisioning sequence, follow **Book Bidding OIDC demo** in the sibling `book-auth-middleware` README. Copy `.env.example` to ignored `.env`, use real Supabase/Stripe project credentials for those unrelated app features, and put the one-time OIDC client ID and secret printed by `bun run provision:bidding` in `CENTRAL_OIDC_CLIENT_ID` and `CENTRAL_OIDC_CLIENT_SECRET`. Keep the secret private. Initialize the local SQLite schema with `bun run db:push`; then start the app with `NODE_EXTRA_CA_CERTS=../book-auth-middleware/central-identity-root.crt bun run dev -- --host 0.0.0.0` behind the auth repo's Caddy TLS proxy.

The live browser test uses a newly verified central test identity with no existing Book Bidding user:

```sh
NODE_EXTRA_CA_CERTS=../book-auth-middleware/central-identity-root.crt VITE_OIDC_TEST_EMAIL='new-address@example.test' VITE_OIDC_TEST_PASSWORD='the verified identity password' bun run test:unit -- --run src/tests/oidc-login.test.ts
```

For the separate same-email protection test, verify a Central Identity that has no Book Bidding user yet. The test creates that ordinary local password user through the public auth endpoint, attempts Central sign-in using the same email, then signs back in locally and confirms the Application User ID is unchanged:

```sh
VITE_OIDC_CONFLICT_EMAIL='existing-user@example.test' VITE_OIDC_CONFLICT_PASSWORD='verified central password' VITE_OIDC_LOCAL_PASSWORD='local app password' npm run test:unit -- --run src/tests/oidc-email-collision.test.ts
```

To link an existing legacy Application User, sign in with its existing password or social provider and choose **Identity Link** in the signed-in navigation. The protected page starts Better Auth's explicit `linkSocial` flow; authenticate separately at Central Identity. The Central Identity can use a different verified email. A failed or conflicting link does not change the local user; conflicting identities require reviewed recovery.

The opt-in live browser journey signs in with both credentials, links Central Identity, then signs out and confirms a later Central Identity sign-in selects the original Application User:

```sh
NODE_EXTRA_CA_CERTS=../book-auth-middleware/central-identity-root.crt VITE_OIDC_LINK_LOCAL_EMAIL='legacy-user@example.test' VITE_OIDC_LINK_LOCAL_PASSWORD='legacy app password' VITE_OIDC_LINK_CENTRAL_EMAIL='different-address@example.test' VITE_OIDC_LINK_CENTRAL_PASSWORD='verified central password' bun run test:unit -- --run src/tests/oidc-identity-link.test.ts
```

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
