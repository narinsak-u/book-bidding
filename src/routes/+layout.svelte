<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { FALLBACK_IMAGE } from "./dashboard/shared/constants";
  import { Button, Modal, P, Drawer } from "flowbite-svelte";
  import { PUBLIC_BASE_URL, PUBLIC_FRONTEND_URL } from "$env/static/public";
  import { dev } from "$app/environment";

  let { children, data }: { children: Snippet; data: LayoutData } = $props();
  let open = $state(false);
  let openDrawer = $state(false);

  const siteUrl = dev ? PUBLIC_BASE_URL : PUBLIC_FRONTEND_URL;
  const siteName = "Book Bidding";
  const siteDesc = "Premium book auction platform for collectors.";
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="canonical" href={siteUrl} />
  <meta name="robots" content="index,follow" />
  <meta name="description" content={siteDesc} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={siteName} />
  <meta property="og:description" content={siteDesc} />
  <meta property="og:image" content={FALLBACK_IMAGE} />
  <meta property="og:url" content={siteUrl} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={siteName} />
  <meta name="twitter:description" content={siteDesc} />
  <meta name="twitter:image" content={FALLBACK_IMAGE} />
</svelte:head>

<div
  class="min-h-screen flex flex-col bg-background mx-4 lg:px-4 lg:mx-auto max-w-7xl"
>
  <!-- Navigation -->
  {@render navigation()}
  <!-- Main Content -->
  <main class="flex-1">
    {@render children?.()}
  </main>
  <!-- Footer -->
  {@render footer()}

  <div>
    <Modal title="Terms of Service" form bind:open>
      <!-- write me the terms of service -->
      <P>
        By using Book Bidding you agree to bid honestly, pay for won items, and
        follow all auction rules. We may suspend accounts for violations. <br />
        We are not liable for listing errors or disputes between users. Use at your
        own risk.
      </P>

      {#snippet footer()}
        <Button class="cursor-pointer" type="submit" value="success">
          I accept
        </Button>
        <Button
          class="cursor-pointer"
          type="submit"
          value="decline"
          color="alternative"
        >
          Decline
        </Button>
      {/snippet}
    </Modal>
  </div>
</div>

<!-- Navigation Snippet -->
{#snippet navigation()}
  <nav class="bg-card border-b border-border sticky top-0 z-50">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center h-16">
        <a href="/" class="flex items-center gap-2">
          <div
            class="w-8 h-8 bg-primary rounded flex items-center justify-center"
          >
            <span class="text-primary-foreground font-bold">📚</span>
          </div>
          <span
            class="font-koulen text-xl font-semibold text-foreground tracking-wider"
          >
            Book Bidding
          </span>
        </a>

        <div class="hidden md:flex items-center gap-8">
          {#if data.sessionId}
            <a
              href="/dashboard"
              class="text-foreground hover:text-primary transition font-koulen"
            >
              Dashboard
            </a>
            <a
              href="/user/bids"
              class="text-foreground hover:text-primary transition font-koulen"
            >
              My Bids
            </a>
            <a
              href="/user/sales"
              class="text-foreground hover:text-primary transition font-koulen"
            >
              My Sales
            </a>
            <a
              href="/account/identity"
              class="text-foreground hover:text-primary transition font-koulen"
            >
              Identity Link
            </a>
          {/if}
        </div>

        <div class="hidden md:flex items-center gap-4 font-koulen">
          {#if data.sessionId && data.user}
            <div class="flex items-center gap-3">
              <img
                src={data.user.image || FALLBACK_IMAGE}
                alt={data.user?.name || "Username"}
                class="w-8 h-8 rounded-full border border-border"
              />
              <span
                class="text-sm font-medium text-foreground hidden sm:inline"
              >
                {data.user?.name || "Username"}
              </span>
            </div>
            <button
              onclick={async () => {
                await authClient.signOut();
                goto("/auth/login", { invalidateAll: true });
              }}
              class="px-4 font-koulen cursor-pointer py-2 text-foreground hover:bg-red-900/30 rounded-lg transition"
            >
              Sign Out
            </button>
          {:else}
            <a
              href="/auth/login"
              class="px-4 py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Sign In
            </a>
          {/if}
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border text-foreground hover:bg-muted transition"
          aria-label="Open menu"
          aria-expanded={openDrawer ? "true" : "false"}
          onclick={() => (openDrawer = true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>
      </div>
    </div>
  </nav>
  {@render drawer()}
{/snippet}

<!-- Footer Snippet -->
{#snippet footer()}
  <footer class="text-secondary-foreground border-t border-border mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 class="font-bold mb-4">About</h3>
          <p class="text-sm opacity-75">
            Premium book auction platform for collectors.
          </p>
        </div>
        <div>
          <h3 class=" font-bold mb-4">Auctions</h3>
          <ul class="text-sm space-y-2 opacity-75">
            <li>
              <a href="/auctions" class="hover:opacity-100">All Auctions</a>
            </li>
            <li>
              <a href="#ending-soon" class="hover:opacity-100">Ending Soon </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 class=" font-bold mb-4">Help</h3>
          <ul class="text-sm space-y-2 opacity-75">
            <li>
              <a href="#how-it-works" class="hover:opacity-100">How to Bid</a>
            </li>
            <li>
              <a href="/" class="hover:opacity-100">Contact</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 class=" font-bold mb-4">Legal</h3>
          <ul class="text-sm space-y-2 opacity-75">
            <li>
              <button
                onclick={() => (open = true)}
                class="hover:opacity-100 cursor-pointer font-sans"
              >
                Terms
              </button>
            </li>
            <li>
              <button
                onclick={() => (open = true)}
                class="hover:opacity-100 cursor-pointer font-sans"
              >
                Privacy
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div
      class="border-t mb-8 border-secondary-foreground/20 pt-8 text-center text-sm opacity-60"
    >
      <p>
        &copy; {new Date().getFullYear()} Book Bidding. All rights reserved.
      </p>
    </div>
  </footer>
{/snippet}

<!-- Drawer Snippet -->
{#snippet drawer()}
  <Drawer
    id="nav-drawer"
    placement="right"
    bind:open={openDrawer}
    class="backdrop:bg-black/50"
  >
    <div class="bg-card h-full">
      <div
        class="flex items-center justify-between h-16 px-4 border-b border-border"
      >
        <div class="flex items-center gap-3">
          {#if data.sessionId && data.user}
            <img
              src={data.user.image || FALLBACK_IMAGE}
              alt={data.user?.name || "Username"}
              class="w-8 h-8 rounded-full border border-border"
            />
            <span class="text-sm font-medium text-foreground"
              >{data.user?.name || "Username"}</span
            >
          {:else}
            <span class="font-koulen text-lg text-foreground">Menu</span>
          {/if}
        </div>
      </div>
      <div class="p-4">
        {#if data.sessionId}
          <div class="flex flex-col border-b border-border pb-4">
            <button
              onclick={() => {
                openDrawer = false;
                goto("/dashboard");
              }}
              class="block cursor-pointer w-full text-left py-3 px-2 rounded-lg text-foreground hover:bg-muted font-koulen"
            >
              Dashboard
            </button>
            <button
              onclick={() => {
                openDrawer = false;
                goto("/user/bids");
              }}
              class="block cursor-pointer w-full text-left py-3 px-2 rounded-lg text-foreground hover:bg-muted font-koulen"
            >
              My Bids
            </button>
            <button
              onclick={() => {
                openDrawer = false;
                goto("/user/sales");
              }}
              class="block cursor-pointer w-full text-left py-3 px-2 rounded-lg text-foreground hover:bg-muted font-koulen"
            >
              My Sales
            </button>
            <button
              onclick={() => {
                openDrawer = false;
                goto("/account/identity");
              }}
              class="block cursor-pointer w-full text-left py-3 px-2 rounded-lg text-foreground hover:bg-muted font-koulen"
            >
              Identity Link
            </button>
            <button
              onclick={() => {
                openDrawer = false;
                goto("/dashboard/create");
              }}
              class="block cursor-pointer w-full text-left py-3 px-2 rounded-lg text-foreground hover:bg-muted font-koulen"
            >
              Create Auction
            </button>
          </div>
        {/if}
        <div class="mt-4">
          {#if data.sessionId}
            <button
              onclick={async () => {
                await authClient.signOut();
                openDrawer = false;
                goto("/auth/login", { invalidateAll: true });
              }}
              class="w-full cursor-pointer py-3 px-2 rounded-lg text-foreground hover:bg-red-900/30 bg-red-900/50 transition font-koulen"
            >
              Sign Out
            </button>
          {:else}
            <a
              href="/auth/login"
              class="block cursor-pointer w-full py-3 px-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition font-koulen text-center"
            >
              Sign In
            </a>
          {/if}
        </div>
      </div>
    </div>
  </Drawer>
{/snippet}
