<script lang="ts">
  import { page } from "$app/stores";
  import Icon from "./Icon.svelte";

  let { session, user, centralIdentityUrl, onSignOut, signOutError } = $props<{
    session: string | null;
    user: any;
    centralIdentityUrl: string | undefined;
    onSignOut: () => void;
    signOutError: string;
  }>();

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/auctions", label: "Live Auctions" },
    { href: "/auctions", label: "Collections" },
    { href: "#", label: "Scholarly Insights" },
  ];

  function isActive(href: string, exact = false) {
    const path = $page.url.pathname;
    if (exact) return path === href;
    return path.startsWith(href) && href !== "/";
  }
</script>

<header
  class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/10"
>
  <div
    class="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4"
  >
    <!-- Logo -->
    <a
      href="/"
      class="font-headline font-black text-xl tracking-tighter text-primary whitespace-nowrap"
    >
      THE ANTIQUARIAN
    </a>

    <!-- Desktop Navigation -->
    <nav class="hidden lg:flex items-center gap-6">
      {#each navLinks as link}
        <a
          href={link.href}
          class="font-label font-bold text-[11px] uppercase tracking-widest transition-colors
						{isActive(link.href)
            ? 'text-secondary border-b-2 border-secondary'
            : 'text-primary hover:text-secondary'}"
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Search Bar -->
    <div class="hidden md:flex flex-1 max-w-sm relative group">
      <Icon
        icon="search"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm"
      />
      <input
        class="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-6 text-xs font-body text-primary focus:ring-1 focus:ring-secondary/20 placeholder:text-outline/50"
        placeholder="Search archives..."
        type="search"
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4">
      <button
        class="text-primary hover:text-secondary transition-colors p-1"
        aria-label="Notifications"
      >
        <Icon icon="notifications" class="text-xl" />
      </button>

      <a
        href={user ? "/dashboard" : "/auth/login"}
        class="text-primary hover:text-secondary transition-colors p-1"
        aria-label="Account"
      >
        <Icon icon="account_circle" class="text-xl" />
      </a>

      <a
        href="/auctions"
        class="bg-secondary text-on-secondary px-5 py-2 text-[10px] font-headline font-bold uppercase tracking-widest rounded-md hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95"
      >
        Place Bid
      </a>
      {#if session}
        <button
          type="button"
          onclick={onSignOut}
          class="text-primary hover:text-secondary transition-colors p-1"
          aria-label="Book Bidding sign-out"
        >
          <Icon icon="logout" class="text-xl" />
        </button>
        {#if centralIdentityUrl}
          <a
            href={centralIdentityUrl}
            class="hidden md:inline text-primary hover:text-secondary text-xs"
          >
            Central Identity
          </a>
        {/if}
      {/if}
      {#if signOutError}
        <p class="text-destructive text-xs" role="alert">{signOutError}</p>
      {/if}
  </div>
  </div>
</header>
