<script lang="ts">
  import type { PageProps } from "./$types";
  import HeaderSection from "$lib/components/Header.svelte";
  import BidItem from "$lib/components/BidItem.svelte";

  let { data }: PageProps = $props();

  function formatCurrency(n?: number) {
    return `$${(n || 0).toLocaleString()}`;
  }
</script>

<svelte:head>
  <title>My Sales - Book Bidding</title>
</svelte:head>

<div class="bg-background min-h-screen">
  <HeaderSection
    title="My Sales"
    description="Your auctions and sales performance"
    cta={{ text: "Manage Auctions", href: "/dashboard" }}
  />

  <div class="max-w-7xl mx-auto md:px-4 lg:px-8 py-10 space-y-8">
    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-card border border-border rounded-lg p-4">
        <p class="text-sm text-muted-foreground">Sales Revenue</p>
        <p class="text-2xl font-koulen mt-2">
          {formatCurrency(data.stats.salesRevenue)}
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <p class="text-sm text-muted-foreground">Pending Payment Value</p>
        <p class="text-2xl font-koulen mt-2">
          {formatCurrency(data.stats.pendingPaymentValue)}
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <p class="text-sm text-muted-foreground">Total Expenses</p>
        <p class="text-2xl font-koulen mt-2">
          {formatCurrency(data.stats.expenses)}
        </p>
      </div>
    </div>

    <!-- Awaiting Payment -->
    {@render awaitingPaymentItems()}

    <!-- Purchased Items -->
    {@render purchasedItems()}

    <!-- Sold Items -->
    {@render soldItems()}

    <!-- No items -->
    {#if (!data.awaitingPayment || data.awaitingPayment.length === 0) && (!data.purchasedItems || data.purchasedItems.length === 0) && (!data.soldItems || data.soldItems.length === 0)}
      <div class="bg-card border border-border rounded-lg p-8 text-center">
        <p class="text-lg font-medium text-foreground mb-2">
          No ended activity
        </p>
        <p class="text-muted-foreground mb-6">
          When auctions end, you'll see pending payments, purchased, and sold
          items here.
        </p>
        <a
          href="/dashboard"
          class="inline-block font-koulen px-6 py-2 cursor-pointer bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Create Auction
        </a>
      </div>
    {/if}
  </div>
</div>

<!-- Awaiting Payment Snippet -->
{#snippet awaitingPaymentItems()}
  {#if data.awaitingPayment && data.awaitingPayment.length > 0}
    <h2 class="text-xl font-semibold text-foreground">Awaiting Payment</h2>
    <div class="space-y-4">
      {#each data.awaitingPayment as book (book.id)}
        <BidItem mode="awaiting" {book} />
      {/each}
    </div>
  {/if}
{/snippet}

<!-- Purchased Items Snippet -->
{#snippet purchasedItems()}
  {#if data.purchasedItems && data.purchasedItems.length > 0}
    <h2 class="text-xl font-semibold text-foreground mt-8">Purchased Items</h2>
    <div class="space-y-4">
      {#each data.purchasedItems as purchase (purchase.item.id)}
        <BidItem mode="purchased" {purchase} />
      {/each}
    </div>
  {/if}
{/snippet}

<!-- Sold Items Snippet -->
{#snippet soldItems()}
  {#if data.soldItems && data.soldItems.length > 0}
    <h2 class="text-xl font-semibold text-foreground mt-8">Sold Items</h2>
    <div class="space-y-4">
      {#each data.soldItems as book (book.id)}
        <BidItem mode="sold" {book} />
      {/each}
    </div>
  {/if}
{/snippet}
