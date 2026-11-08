# AGENTS.md — SvelteKit Book Bidding

## Build & Run Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check with `svelte-check` |
| `npm run test` | Run all tests once |
| `npm run test:unit` | Run tests in watch mode (Vitest) |

### Running a Single Test

```sh
npx vitest run src/tests/helpers.test.ts              # by file path
npx vitest run --testNamePattern="getImage returns"    # by test name
npx vitest run -t "adds 1 + 2"                        # short flag
npx vitest run --project server                        # server project only
npx vitest run --project client                        # browser project only
```

### Database Commands

```sh
npm run db:generate   # Generate SQL from Drizzle schema
npm run db:migrate    # Apply migrations
npm run db:push       # Push schema directly
npm run db:studio     # Drizzle Studio inspector
```

## Project Structure

```
src/
├── app.css                    # Tailwind v4 + theme CSS variables
├── app.d.ts                   # App.Locals (session, user)
├── app.html                   # HTML shell
├── hooks.server.ts            # Better Auth session middleware
├── demo.spec.ts               # Smoke test
├── lib/
│   ├── auth.ts                 # Better Auth server config
│   ├── auth-client.ts          # Better Auth browser client
│   ├── components/             # Svelte components (AuctionCard, Header, etc.)
│   ├── index.ts                # $lib barrel
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts        # Drizzle db instance (LibSQL)
│   │   │   └── schema.ts       # Drizzle schema (user, books, bids, payments)
│   │   └── realtime.ts         # SSE helper
│   ├── stores/
│   │   └── realtime.ts         # Svelte writable/derived store for SSE bids
│   ├── stripe.ts               # Stripe server client
│   └── supabase-client.ts      # Supabase Storage client
├── routes/
│   ├── helpers.ts              # Shared helpers (getImage, formatDate, types)
│   ├── dashboard/              # Create/edit auctions, shared UI
│   ├── api/
│   │   ├── checkout/+server.ts # Stripe checkout session creator
│   │   ├── stripe/webhook/     # Stripe webhook handler
│   │   └── realtime/bids/     # SSE endpoint
│   ├── auth/                   # Login/register pages
│   ├── user/bids/              # My Bids page
│   └── user/sales/             # My Sales page
└── tests/                      # Unit tests (server environment)
    ├── helpers.test.ts
    ├── api.checkout.test.ts
    ├── api.stripe.webhook.test.ts
    └── realtime.store.test.ts
```

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte Runes: `$state`, `$props`, `$derived`, `$effect`)
- **Language**: TypeScript (strict mode)
- **Database**: Drizzle ORM + LibSQL/Turso
- **Auth**: Better Auth with `sveltekitCookies` plugin
- **Storage**: Supabase Storage (image uploads)
- **Payments**: Stripe Checkout + Webhooks
- **UI**: Flowbite Svelte + Tailwind CSS v4
- **Realtime**: Server-Sent Events (SSE) for live bid updates
- **Testing**: Vitest (server: Node, client: Playwright/Browser)

## Code Style Guidelines

### Imports

- Use SvelteKit path aliases: `$lib`, `$app/environment`, `$app/server`, `$app/navigation`, `$env/static/private`, `$env/static/public`, `$env/dynamic/private`
- Server-only code goes in `$lib/server/` — never import server modules from client code
- Group imports: SvelteKit builtins first, then external packages, then local modules

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- Use `type` keyword for type-only imports: `import type { … } from`
- Prefer `InferSelectModel<typeof table>` over manual type duplication for DB row types
- Define interfaces for API shapes (see `BidUpdate`, `Auction` in `routes/helpers.ts`)
- Use `as any` sparingly; prefer proper typing in test mocks

### Svelte Components

- Use Svelte 5 runes syntax: `$state()`, `$derived()`, `$props()`, `$effect()`
- Use `{#snippet}` blocks for reusable template fragments over separate component files when logic is simple
- Destructure props with `let { children, data }: { children: Snippet; data: LayoutData } = $props()`
- Add `lang="ts"` to `<script>` blocks
- Use `class:cursor-pointer` on interactive elements for clarity

### Naming Conventions

- **Files**: `kebab-case.svelte` for components, `camelCase.ts` for utilities
- **Page routes**: SvelteKit convention (`+page.svelte`, `+page.server.ts`, `+layout.svelte`)
- **API routes**: `+server.ts` with named exports (`GET`, `POST`, etc.)
- **Database tables**: `camelCase` in Drizzle schema (`books`, `bids`, `payments`)
- **Constants**: `UPPER_SNAKE_CASE` (`BUCKET_NAME`, `FALLBACK_IMAGE`)
- **Stores**: `camelCase` exported instances (`realtime`, `authClient`)

### Error Handling

- Validate required env vars at module top level with early `throw new Error(…)` (see `db/index.ts`, `stripe.ts`, `supabase-client.ts`)
- Upload helpers return `{ err: string }` shape for user-facing errors
- API routes should return `json({ error: … }, { status: … })` for error responses
- Wrap client-side async calls in try/catch and use `console.warn` for non-critical failures

### Testing

- Server tests go in `src/tests/` or alongside the source file; Svelte component tests use `.svelte.spec.ts` extension
- Use `vi.mock()` to mock `$lib/*`, `$app/*`, `$env/*` modules
- Mock Drizzle `db` by providing stubbed `query/update/insert` chains
- Browser tests use `vitest-browser-svelte` with `render()` and `page.getByRole()`
- Every test file should have a comment explaining what it validates
- Configuration: `expect.requireAssertions: true` — every test must contain at least one assertion

### CSS & Theming

- Tailwind v4 with `@import "tailwindcss"` and `@theme` block in `app.css`
- Custom design tokens via CSS variables (`--primary`, `--background`, etc.)
- Use `@custom-variant dark` for dark mode
- Use semantic color classes (`bg-primary`, `text-foreground`, `border-border`) not raw values
- Font: `Koulen` for headings and interactive text, serif for subheadings

### Environment Variables

- Private: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SECRET_STRIPE_KEY`
- Public: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_BASE_URL`, `PUBLIC_FRONTEND_URL`
- Never commit `.env`; see `.env.example` for template