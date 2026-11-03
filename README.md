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

```sh
npm install
npm run dev
npm run check        # type check
npm run test         # unit tests
npm run build && npm run preview
```

## Environment

Set in `.env` (private) or `.env.local`:

- `BETTER_AUTH_SECRET` — long random secret
- `BETTER_AUTH_URL` — app base URL (e.g. http://localhost:5173)
- `DATABASE_URL` — LibSQL URL; local SQLite uses `file:local.db`
- `DATABASE_AUTH_TOKEN` — required for remote Turso databases; not needed for local SQLite
- `PUBLIC_SUPABASE_URL` — Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `SECRET_STRIPE_KEY` — Stripe secret key
- `PUBLIC_FRONTEND_URL` — public base URL used by Stripe redirects
- Optional email: `RESEND_API_KEY`, `EMAIL_FROM`
- Optional OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

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

The app uses Better Auth Generic OAuth against the central issuer `https://auth.127.0.0.1.nip.io/api/auth`. The exact registered callback is `https://bidding.127.0.0.1.sslip.io/api/auth/callback/central-identity`. Local cookies remain secure and host-only, and provider logout does not end the local Application Session.

For the complete local TLS and operator-only confidential-client provisioning sequence, follow **Book Bidding OIDC demo** in the sibling `book-auth-middleware` README. Set the one-time client ID and secret printed by its `bun run provision:bidding` command in this repository's ignored `.env` as `CENTRAL_OIDC_CLIENT_ID` and `CENTRAL_OIDC_CLIENT_SECRET`. Keep the secret private; do not commit it. Run the app with `npm run dev -- --host 0.0.0.0` behind the auth repo's Caddy TLS proxy so the registered HTTPS callback is reachable.

The live browser test uses a newly verified central test identity with no existing Book Bidding user:

```sh
VITE_OIDC_TEST_EMAIL='new-address@example.test' VITE_OIDC_TEST_PASSWORD='the verified identity password' npm run test:unit -- --run src/tests/oidc-login.test.ts
```

For the separate same-email protection test, verify a Central Identity that has no Book Bidding user yet. The test creates that ordinary local password user through the public auth endpoint, attempts Central sign-in using the same email, then signs back in locally and confirms the Application User ID is unchanged:

```sh
VITE_OIDC_CONFLICT_EMAIL='existing-user@example.test' VITE_OIDC_CONFLICT_PASSWORD='verified central password' VITE_OIDC_LOCAL_PASSWORD='local app password' npm run test:unit -- --run src/tests/oidc-email-collision.test.ts
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

- Set `BETTER_AUTH_URL` and `PUBLIC_FRONTEND_URL` to your domain.
- Configure your SvelteKit adapter.
- Ensure all environment variables are set on the host.
