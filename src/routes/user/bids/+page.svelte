<script lang="ts">
  import { FALLBACK_IMAGE } from "../../dashboard/shared/constants";
  import HeaderSection from "$lib/components/Header.svelte";
  import type { PageProps } from "./$types";
  import BidItem from "$lib/components/BidItem.svelte";

  let { data }: PageProps = $props();

  // Handle checkout
  const onCheckout = async (bid: (typeof data.activeBids)[0]) => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: bid.item?.currentBid,
        currency: "usd",
        name: bid.item?.name || "Auction",
        mode: "payment",
        metadata: {
          auctionId: bid.item?.id,
          userId: bid.userId,
          image: bid.item?.fileKey || FALLBACK_IMAGE,
        },
      }),
    });

    const { sessionId, url } = await response.json();
    // console.log(sessionId, "sessionId");
    window.location = url;
  };
</script>

<svelte:head>
  <title>My Bids - Book Bidding</title>
</svelte:head>

<div class="bg-background min-h-screen">
  <HeaderSection
    title="My Bids"
    description="Your bidding activity across auctions"
    cta={{ text: "Browse Auctions", href: "/auctions" }}
  />

  <div class="max-w-7xl mx-auto md:px-4 lg:px-8 py-10">
    {#if (data.activeBids && data.activeBids.length > 0) || (data.endedBids && data.endedBids.length > 0)}
      {@render endedBids()}
      {@render activeBids()}
    {:else}
      <div class="bg-card border border-border rounded-lg p-8 text-center">
        <p class="text-lg font-medium text-foreground mb-2">No bids yet</p>
        <p class="text-muted-foreground mb-6">
          Browse auctions and place your first bid.
        </p>
        <a
          href="/auctions"
          class="inline-block font-koulen px-6 py-2 cursor-pointer bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Place Bid
        </a>
      </div>
    {/if}
  </div>
</div>

<!-- Ended Bids -->
{#snippet endedBids()}
  {#if data.endedBids && data.endedBids.length > 0}
    <h2 class="text-xl font-semibold text-foreground mb-4">Ended</h2>
    <div class="space-y-4 mb-8">
      {#each data.endedBids as bid (bid.id)}
        <BidItem mode="ended" {bid} userId={data.user?.id} {onCheckout} />
      {/each}
    </div>
  {/if}
{/snippet}

<!-- Active Bids -->
{#snippet activeBids()}
  {#if data.activeBids && data.activeBids.length > 0}
    <h2 class="text-xl font-semibold text-foreground mb-4">Active</h2>
    <div class="space-y-4">
      {#each data.activeBids as bid (bid.id)}
        <BidItem mode="active" {bid} userId={data.user?.id} />
      {/each}
    </div>
  {/if}
{/snippet}
