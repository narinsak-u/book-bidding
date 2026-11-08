<script lang="ts">
  import { page } from "$app/stores";
  import Icon from "./Icon.svelte";

  let { user } = $props<{ user: any }>();

  const navItems: {
    href?: string;
    icon: string;
    label: string;
    disabled?: boolean;
  }[] = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/user/activity", icon: "gavel", label: "Active Bids" },
    { icon: "menu_book", label: "My Library", disabled: true },
    { icon: "visibility", label: "Watchlist", disabled: true },
    { icon: "settings", label: "Settings", disabled: true },
  ];

  function isActive(href?: string) {
    if (!href) return false;
    const path = $page.url.pathname;
    return path === href || (href !== "/dashboard" && path.startsWith(href));
  }
</script>

<aside
  class="fixed left-0 top-16 flex flex-col h-[calc(100vh-4rem)] z-30 bg-surface-container-low dark:bg-surface-container-high w-64 border-r border-outline/10 hidden md:flex font-body"
>
  <nav class="mt-6 flex flex-col gap-1 px-3">
    {#each navItems as item}
      {#if item.disabled}
        <div
          class="flex items-center gap-3 px-4 py-3 text-on-surface-variant/50 cursor-not-allowed opacity-50 rounded-lg"
        >
          <Icon icon={item.icon} class="text-[18px]" />
          <span class="font-medium text-sm">{item.label}</span>
          <span
            class="ml-auto text-[10px] uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded"
            >Soon</span
          >
        </div>
      {:else}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 transition-colors duration-200 rounded-lg
						{isActive(item.href)
            ? 'bg-surface-container-lowest dark:bg-surface-container font-semibold text-on-surface shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}"
        >
          <Icon icon={item.icon} class="text-[18px]" />
          <span class="font-medium text-sm">{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>

  <div class="mt-auto p-4 border-t border-outline/10 space-y-3">
    {#if user}
      <div class="bg-surface-container p-4 rounded-xl">
        <p
          class="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant/70 mb-3"
        >
          Curator
        </p>
        <div class="flex items-center gap-3">
          {#if user.image}
            <img
              src={user.image}
              alt={user.name || "User"}
              class="w-10 h-10 rounded-full object-cover"
            />
          {:else}
            <div
              class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline font-bold text-sm"
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          {/if}
          <div>
            <p class="text-sm font-semibold text-on-surface">
              {user.name || "User"}
            </p>
            <p class="text-[10px] text-on-surface-variant">
              Rare Manuscripts Dept.
            </p>
          </div>
        </div>
      </div>
    {/if}
    <div class="flex flex-col gap-1">
      <a
        href="/auctions"
        class="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 text-sm hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
      >
        <Icon icon="help" class="text-[18px]" />
        Help Center
      </a>
      <button
        class="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 text-sm hover:text-on-surface transition-colors cursor-pointer rounded-lg hover:bg-surface-container w-full"
      >
        <Icon icon="logout" class="text-[18px]" />
        Logout
      </button>
    </div>
  </div>
</aside>
