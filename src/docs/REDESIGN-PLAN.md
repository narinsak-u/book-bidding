# Redesign Plan: "Book Bidding"

> **Status**: Phase 1, 2, 3 & 4 COMPLETE | Phase 5 IN PROGRESS

## Completed Tasks

### Phase 1: Design System Foundation ✅

- **1.1** Updated `app.html` — Added Google Fonts (Space Grotesk, Work Sans, Inter, Material Symbols Outlined)
- **1.2** Rewrote `app.css` — Complete theme overhaul with new design tokens, surface hierarchy, dark mode, utilities (`.glass-overlay`, `.book-shadow`, `.ghost-border`)
- **1.3** Removed Flowbite dependencies — Removed `flowbite`, `flowbite-svelte`, `flowbite-svelte-blocks`, `flowbite-svelte-icons` from `package.json`, ran `npm install`

### Phase 2: Core Layout Components ✅

- **2.1** Created `src/lib/components/Icon.svelte` — Material Symbols wrapper with filled/variation support
- **2.2** Created `src/lib/components/TopBar.svelte` — Glassmorphism sticky header with nav, search, Place Bid CTA
- **2.3** Created `src/lib/components/SideNav.svelte` — Fixed sidebar with disabled nav items (My Library, Watchlist, Settings)
- **2.4** Created `src/lib/components/AppFooter.svelte` — Dark footer with nav links
- **2.5** Restructured layouts:
  - Created `src/routes/dashboard/+layout.svelte` — SideNav wrapper for dashboard pages
  - Created `src/routes/user/+layout.svelte` — SideNav wrapper for user pages
  - Updated `src/routes/+layout.svelte` — Replaced Flowbite with TopBar, AppFooter, custom Modal
  - Created `src/lib/components/Modal.svelte` — Custom modal with glassmorphism
  - Created `src/lib/components/Drawer.svelte` — Mobile drawer

### Phase 3: Shared UI Components ✅

- **3.1** Created `src/lib/components/ConditionChip.svelte` ✅
- **3.2** Rewrote `src/lib/components/AuctionCard.svelte` ✅
- **3.3** Created `src/lib/components/BidItem.svelte` (replaces BidItem) ✅
- **3.4** Rewrote `src/lib/components/Header.svelte` ✅
- **3.5** Rewrote `src/lib/components/BidNotification.svelte` ✅
- **3.6** Rewrite form components (no Flowbite) — *In progress*
- **3.7** Created `src/lib/components/Drawer.svelte` ✅
- **3.8** Created `src/lib/components/AuthForm.svelte` — *In progress*

### Phase 4: Page Redesigns (Mockup-backed) ✅

- **4.1** Home page `/` → `book_auction_landing_page` ✅
- **4.2** Auction detail `/auctions/[id]` → `rare_book_details` ✅
- **4.3** Dashboard `/dashboard` → `curator_dashboard` ✅
- **4.4** Activity page `/user/activity` → `bids_sales_history` ✅

> **Note**: Many pages still have Flowbite imports causing LSP errors. These are addressed in Phase 4-5 when pages are redesigned.

---

## Design System Changes (DESIGN.md)

| Aspect | Current | New |
|---|---|---|
| **Headings** | Koulen font | Space Grotesk (bold, condensed) |
| **Body** | System/default | Work Sans |
| **Labels** | System/default | Inter |
| **Icons** | Flowbite Svelte Icons | Material Symbols Outlined |
| **Primary** | `hsl(30 15% 24%)` ~ #3d362e | `#38342f` (stays similar) |
| **Secondary** | Cream/beige `hsl(40 30% 92%)` | Alert Red/Orange `#af2800` (major change) |
| **Surface system** | Simple card/bg | 6-tier tonal layering (`surface-container-lowest/low/high/highest`) |
| **Borders** | `1px solid` style | No 1px borders — use background shifts, ghost borders at 15% opacity |
| **Depth** | Box shadows | Tonal layering + glassmorphism |
| **Max border-radius** | `0.5rem` | `0.75rem` |
| **CTAs** | Flat buttons | Gradient (`primary` → `primary-container`) |
| **Condition labels** | Flowbite `Badge` | Overlapping "condition chips" in `secondary` color |

## Design-to-Route Mapping

| Design Mockup | Current Route(s) | Notes |
|---|---|---|
| `book_auction_landing_page` | `/` (Home) | Hero + featured grid + how-it-works + CTA |
| `rare_book_details` | `/auctions/[id]` | 2-col layout, image gallery, bid panel, tabs |
| `curator_dashboard` | `/dashboard` | Side nav, bento stats, redesigned table |
| `bids_sales_history` | `/user/bids` + `/user/sales` | Merged into single `/user/activity` with tabs |
| _(no mockup)_ | `/auth/login`, `/dashboard/create`, `/dashboard/edit/[id]`, `/auctions`, `/checkout/*` | Follow design system guidelines |

## Key Structural Change: Dual Layout

The design introduces a **side navigation** for authenticated pages (dashboard, bids/sales) while public pages (home, auction detail, browse) use a **glassmorphism top bar**. This requires:

- Authenticated routes get a `+layout.svelte` with fixed sidebar (`w-64`)
- Public routes get the glassmorphism sticky header
- Mobile: sidebar collapses to hamburger → drawer

### User Decisions

- **Bids + Sales**: Merge into one page with tabs at `/user/activity` (redirect old routes)
- **My Library / Watchlist nav items**: Show as disabled/coming soon
- **Flowbite Svelte**: Remove entirely — replace all components with custom Svelte components
- **Pages without mockups**: Apply design system guidelines (colors, typography, spacing, tokens)

---

## Phase 1: Design System Foundation

This phase replaces the visual foundation without changing any page layouts yet.

### 1.1 Update `app.html`

- Add Google Fonts links: `Space+Grotesk`, `Work+Sans`, `Inter`, `Material+Symbols+Outlined`
- Remove Koulen font import

### 1.2 Rewrite `app.css` — Complete theme overhaul

- Remove `@plugin 'flowbite/plugin'` and `@source` flowbite lines
- Replace Koulen `@theme` font with `font-headline`, `font-body`, `font-label`
- Replace all CSS custom properties with the "Book Bidding" design palette:
  - `--primary: #38342f`, `--secondary: #af2800`, `--on-primary: #ffffff`, `--on-secondary: #ffffff`
  - Surface hierarchy: `--surface`, `--surface-container-lowest/low/high/highest`, etc.
  - `--primary-container: #4f4b45`, `--on-primary-container: #c1bbb3`
  - `--outline: #7c766e`, `--outline-variant: #cdc5bc`
  - Border radius tokens: `2px / 4px / 8px / 12px`
- Add utility classes: `.glass-overlay` (backdrop-blur), `.book-shadow`, `.ghost-border` (outline-variant at 15%)
- Update `@layer base`: Replace `font-koulen` with `font-headline` for h1-h3, `font-body` for body/paragraphs, `font-label` for metadata
- Add dark mode variants for all new tokens

### 1.3 Remove Flowbite dependencies

- Remove `flowbite`, `flowbite-svelte`, `flowbite-svelte-blocks`, `flowbite-svelte-icons` from `package.json`
- Run `npm install` to update lockfile
- This will break many imports — addressed in Phase 2-3

---

## Phase 2: Core Layout Components

All new components use Material Symbols + custom Tailwind classes, zero Flowbite.

### 2.1 Create `src/lib/components/Icon.svelte`

- Props: `icon: string`, `filled?: boolean`, `class?: string`
- Renders `<span class="material-symbols-outlined">` with variable font settings
- Supports `font-variation-settings` for FILL/weight

### 2.2 Create `src/lib/components/TopBar.svelte`

- Glassmorphism sticky header: `bg-surface/80 backdrop-blur-md`
- Brand ("Book Bidding"), nav links, search bar, notification icon, account icon, "Place Bid" CTA
- Active link gets `border-b-2 border-secondary` styling
- Mobile: hamburger triggers drawer

### 2.3 Create `src/lib/components/SideNav.svelte`

- Fixed left sidebar, `w-64`, `bg-surface-container-low`
- Nav items with icons: Dashboard, Active Bids, My Library (disabled), Watchlist (disabled), Settings (disabled)
- Active state: `bg-surface-container-lowest rounded-r-full font-bold`
- Bottom section: profile card, "View Live Auction" CTA, Help/Logout links
- Hidden on mobile (replaced by TopBar hamburger → drawer)

### 2.4 Create `src/lib/components/AppFooter.svelte`

- Dark primary background (`bg-[#38342f]`)
- Brand name in secondary color, nav links, social icons
- Matches footer from all mockups

### 2.5 Restructure layouts

- Create `src/routes/dashboard/+layout.svelte` — wraps dashboard/auth pages with `SideNav` + main content `ml-64`
- Create `src/routes/user/+layout.svelte` — same side nav layout for user pages
- Update root `+layout.svelte` — handles public TopBar, Footer, Terms modal (custom Modal replacement)
- **Custom Modal component** (`src/lib/components/Modal.svelte`): replaces Flowbite Modal for Terms and delete confirmation. Uses `backdrop-blur` + layering per design system.

---

## Phase 3: Shared UI Components

### 3.1 Create `src/lib/components/ConditionChip.svelte`

- Props: `text: string` (e.g., "Excellent", "Fine", "Museum Grade")
- Style: `bg-secondary text-on-secondary` for Excellent/Museum Grade, `bg-surface-container-highest text-primary` for Fine/Good
- Rotated slightly (`transform rotate-3`) when overlaid on images
- Positioned `top-4 right-[-10px]` with `shadow-lg`

### 3.2 Rewrite `src/lib/components/AuctionCard.svelte`

- Props: same `auction` data, but completely new markup
- Background: `bg-surface-container-low p-6 rounded-xl`
- Large `aspect-[4/5]` image area with hover scale
- `ConditionChip` overlapping image corner
- Glassmorphism LIVE timer overlay (`absolute bottom-4 left-4 glass-overlay`)
- Decorative `"` quote mark behind title (`absolute -top-8 -left-2 text-6xl text-on-surface-variant/10`)
- "Current Bid" label + price in `font-headline font-bold`
- "Place Bid" button: `bg-primary text-on-primary` or `bg-secondary text-on-secondary`

### 3.3 Create `src/lib/components/ActivityItem.svelte` (replaces BidItem)

- Row card: `bg-surface-container-lowest p-5 rounded-xl flex items-center gap-6`
- Book thumbnail `w-20 h-24 rounded shadow-md border-b-2 border-primary/10`
- Title, author, condition chip, status (Completed/Active/Archived)
- Vertical separator dividers between metadata columns
- Chevron icon on right
- Mode variants: active, ended, awaiting, purchased, sold

### 3.4 Rewrite `src/lib/components/Header.svelte`

- Keep same props interface, new markup
- Breadcrumbs support, `text-4xl font-headline font-black tracking-tight`
- Description in `text-outline font-body`

### 3.5 Rewrite `src/lib/components/BidNotification.svelte`

- Floating toast: glassmorphism `glass-overlay rounded-xl`
- Position bottom-right
- Auto-dismiss after 5s (same behavior)

### 3.6 Rewrite form components (no Flowbite)

- `FormField.svelte`: Custom styled inputs using `surface-container-high bg` with ghost-border on focus
- `ImageDropzone.svelte`: Custom drag-and-drop (no Flowbite Dropzone) with `surface-container-low` style
- `DateTimeModal.svelte`: Custom modal with calendar/time pickers (may need a lightweight date picker library or custom)

### 3.7 Create `src/lib/components/Drawer.svelte`

- Slide-in mobile drawer, replaces Flowbite `Drawer`
- Uses design system tokens and glassmorphism if appropriate

### 3.8 Create `src/lib/components/AuthForm.svelte`

- Redesign login form with new design system tokens
- `surface-container-lowest bg` card, `font-headline` heading, custom inputs with ghost-border focus states
- Social login buttons styled per design system

---

## Phase 4: Page Redesigns (Mockup-backed)

### 4.1 Home page `/` → `book_auction_landing_page`

- Hero section: Large gradient CTA buttons, featured book image with `-rotate-3 hover:rotate-0` transition, glassmorphism detail card, decorative `"` quote
- "Active Collections" grid: 3-column asymmetric (middle offset `lg:translate-y-12`), new `AuctionCard`s
- "How It Works" section: Bento image grid + numbered steps
- CTA section: `bg-primary` with subtle texture, large typography
- Keep all server-side data loading (`+page.server.ts`) unchanged
- Update client logic to use new component names and classes

### 4.2 Auction detail `/auctions/[id]` → `rare_book_details`

- Breadcrumbs: `font-label text-outline` nav
- Two-column `lg:grid-cols-12`: image column (7) + details column (5)
- Image column: main image with `book-shadow`, thumbnail grid `grid-cols-4`
- Condition badge: overlapping `absolute top-4 right-4 bg-secondary`
- Bidding panel: `border-l-4 border-secondary`, current bid + timer, input with `$` prefix, `bg-secondary` CTA
- Recent activity: styled list with opacity gradient
- Curated By section with initials avatar
- Tabs section: Bibliographical Data / Condition / Provenance / Shipping
- Preserve all SSE real-time functionality and form action logic

### 4.3 Dashboard `/dashboard` → `curator_dashboard`

- Wrap with SideNav layout
- Bento stats grid: 4-column responsive grid (2-col revenue card, auction count, pending shipments)
- "Active Artifact Auctions" table: custom `<table>` with `surface-container-lowest bg`, image thumbnails, condition chips, Material Symbols timer icons
- Search input in `surface-container-high bg` with search icon
- "New Listing" button: `bg-primary text-on-primary`
- Preserve delete modal (custom Modal component) and tab filtering

### 4.4 Activity page `/user/activity` (merged Bids + Sales) → `bids_sales_history`

- New route combining `/user/bids` and `/user/sales`
- Wrap with SideNav layout
- Bento stats grid: 3 cards (Total Acquisition Value, Auction Revenue, Active Bidding Sessions)
- Activity list with tabs: All Activity / Buying / Selling
- Each item uses `ActivityItem` component
- Sidebar: Revenue performance bar chart (static CSS bars) + Market Watch CTA card
- Preserve all checkout/payment functionality
- Redirect old `/user/bids` and `/user/sales` routes to `/user/activity`

---

## Phase 5: Page Redesigns (Design System Applied)

### 5.1 Login `/auth/login`

- Apply new design tokens
- Glassmorphism card, `font-headline` heading
- Custom social login buttons
- Custom `AuthForm` with ghost-border inputs

### 5.2 Create auction `/dashboard/create`

- SideNav layout
- Custom form with `surface-container-high bg` inputs, ghost-border focus
- Custom ImageDropzone
- Custom date/time picker inline (or modal)

### 5.3 Edit auction `/dashboard/edit/[auctionId]`

- Same form design as Create, pre-populated

### 5.4 Browse auctions `/auctions`

- Use new `AuctionCard` components
- TopBar layout
- Filter sidebar: custom styled with `surface-container-low bg`
- Keep pagination, search, filter logic

### 5.5 Checkout pages `/checkout/success` and `/checkout/failure`

- Simple centered cards with new design tokens
- `font-headline` headings, Material Symbols icons

### 5.6 Unauthentication component

- Redesign with new design system tokens

---

## Phase 6: Route Redirects & Cleanup

### 6.1 Route redirects

- `/user/bids` → redirect to `/user/activity`
- `/user/sales` → redirect to `/user/activity`

### 6.2 Remove dead code

- Remove all Flowbite imports across codebase
- Remove `flowbite`, `flowbite-svelte`, `flowbite-svelte-blocks`, `flowbite-svelte-icons` from dependencies
- Delete any unused component files
- Remove `@plugin 'flowbite/plugin'` and `@source` lines from `app.css`

### 6.3 Update `src/lib/index.ts` barrel exports for new components

### 6.4 Update helpers/types if `BidItem` → `ActivityItem` rename requires it

---

## Phase 7: Testing & Polish

### 7.1 Type-check

```sh
npm run check
```

Fix all type errors.

### 7.2 Run tests

```sh
npm run test
```

Update any tests that reference removed components.

### 7.3 Mobile responsiveness

Test all pages at mobile breakpoints:

- SideNav hidden, TopBar hamburger → Drawer
- Hero responsive
- Auction cards stack
- Tables scroll horizontally or switch to card view
- Bidding panel stacks below image

### 7.4 Dark mode

Verify all new tokens have correct dark mode variants matching the mockup dark values.

### 7.5 Functional verification

Manually or integration-test:

- Auth: login, register, sign out
- Create / edit / delete auction
- Browse with filters and pagination
- Place bid with real-time SSE updates
- Stripe checkout flow
- Activity page (bids + sales)

---

## Estimated Complexity

| Phase | Effort | Risk |
|---|---|---|
| 1. Design Foundation | Medium | Low — mostly CSS changes |
| 2. Layout Components | High | Medium — layout restructuring affects all pages |
| 3. Shared Components | High | Medium — removing Flowbite leaves gaps temporarily |
| 4. Mockup Pages | Very High | Medium — most visual changes, real-time features at risk |
| 5. Design System Pages | Medium | Low — simpler pages, pattern already established |
| 6. Cleanup | Low | Low |
| 7. Testing | Medium | Medium — Flowbite removal may surface edge cases |

**Recommended execution order**: Phase 1 → 2 → 3 → 6 (can start early) → 4 → 5 → 7