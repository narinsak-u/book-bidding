<script lang="ts">
  import { page } from "$app/state";
  import BidNotification from "$lib/components/BidNotification.svelte";
  import { realtime } from "$lib/stores/realtime";
  import { ArrowLeftOutline } from "flowbite-svelte-icons";
  import { mapBooksToAuctions } from "../../helpers.js";
  import { enhance } from "$app/forms";
  import { Button, Spinner } from "flowbite-svelte";
  import { FALLBACK_IMAGE } from "../../dashboard/shared/constants.js";

  let { data } = $props();

  let auction = $state(mapBooksToAuctions([data.book])[0]);

  // Recompute auctions when `data.books` updates after actions
  $effect(() => {
    auction = mapBooksToAuctions([data.book])[0];
  });

  let bidAmount = $derived(auction.bidInterval);
  let bidError = $state("");
  let bidSuccess = $state(false);
  let loading = $state(false);

  let disabled = $derived.by(() => {
    return Boolean(
      !page.data?.sessionId ||
        loading ||
        !bidAmount ||
        Number(bidAmount) < auction.bidInterval
    );
  });

  $effect(() => {
    realtime.connect();

    const unsubscribe = realtime.subscribe(auction.id!, (update) => {
      if (auction && update.auctionId === auction.id) {
        console.log("[v0] Received real-time bid update:", update);
        auction = {
          ...auction,
          currentBid: Math.max(auction.currentBid, update.amount),
        };
      }
    });

    return () => {
      unsubscribe();
      realtime.disconnect();
    };
  });
</script>

<svelte:head>
  <title>{auction?.name || "Auction"} - Book Bidding</title>
</svelte:head>

<!-- Real-time notifications -->
<BidNotification />

{#if auction}
  <!-- Header -->
  {@render header()}

  <div class="bg-background">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: auction info -->
        {@render auctionInfo()}
        <!-- Right Column: Bidding Panel -->
        {@render bidPanel()}
      </div>
    </div>
  </div>
{:else}
  <div
    class="bg-background w-full m-auto flex items-center justify-center min-h-[500px]"
  >
    <div class="text-center">
      <p class="text-lg text-muted-foreground mb-4 font-koulen">
        Auction not found
      </p>
      <a
        href="/auctions"
        class="text-primary hover:text-accent flex items-center gap-2"
      >
        <ArrowLeftOutline class="shrink-0 h-6 w-6" />
        <span> Back to Auctions</span>
      </a>
    </div>
  </div>
{/if}

<!-- Auction info snippet -->
{#snippet auctionInfo()}
  <div class="lg:col-span-2">
    <div class="bg-card border border-border rounded-lg overflow-hidden mb-8">
      <img
        src={auction.image || FALLBACK_IMAGE}
        alt={auction.name}
        class="w-full h-96 lg:h-[530px] object-cover"
      />
    </div>

    <!-- Description -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-bold text-foreground mb-4">Description</h2>
      <p class="text-foreground leading-relaxed mb-6">
        {auction.description}
      </p>

      <!-- Details Grid -->
      <div
        class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border"
      >
        <div>
          <p class="text-sm text-muted-foreground mb-1">Condition</p>
          <p class="font-semibold text-foreground">
            {auction.condition}
          </p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Year Published</p>
          <p class="font-semibold text-foreground">
            {auction.yearPublished}
          </p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Pages</p>
          <p class="font-semibold text-foreground">{auction.pages}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Seller</p>
          <p class="font-semibold text-foreground">{auction.user.name}</p>
        </div>
      </div>
    </div>

    <!-- Bid History -->
    <div class="bg-card border border-border rounded-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-foreground">Bid History</h2>
        <span class="text-sm text-muted-foreground"
          >{auction.bids.length} bids</span
        >
      </div>
      {#if auction.bids.length > 0}
        <div class="space-y-3">
          {#each auction.bids as bid (bid.id)}
            <div
              class="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition"
            >
              <div>
                <p class="font-medium text-foreground">{bid.user.name}</p>
                <p class="text-xs text-muted-foreground">
                  {new Date(bid.createdAt).toLocaleString("en-GB", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
              <p class="font-bold text-accent text-lg">
                ${bid.amount.toLocaleString()}
              </p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-muted-foreground">No bids yet. Be the first to bid!</p>
      {/if}
    </div>
  </div>
{/snippet}

<!-- Bidding Panel -->
{#snippet bidPanel()}
  <div class="lg:col-span-1">
    <form
      method="POST"
      action="?/createBid"
      use:enhance={(event) => {
        loading = true;

        return async ({ update, result }) => {
          if (result?.status === 200) {
            bidError = "";
            bidSuccess = true;
            await update();
          } else {
            bidSuccess = false;
            bidError = "Failed to place bid";
          }
          loading = false;
        };
      }}
    >
      <input type="hidden" name="auctionId" value={auction.id} />
      <div class="bg-card border border-border rounded-lg p-6 sticky top-24">
        <!-- Status Badge -->
        <div class="mb-6">
          {#if auction.status === "active"}
            <span
              class="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium"
            >
              Active Auction
            </span>
          {:else if auction.status === "ending-soon"}
            <span
              class="inline-block bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium"
            >
              Ending Soon
            </span>
          {:else}
            <span
              class="inline-block bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium"
            >
              Auction Ended
            </span>
          {/if}
        </div>

        <!-- Price Information -->
        <div class="space-y-4 mb-6 pb-6 border-b border-border">
          <div>
            <p class="text-sm text-muted-foreground mb-1">Starting Price</p>
            <p class="text-2xl font-bold text-foreground">
              ${auction.startingPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Current Bid</p>
            <p class="text-3xl font-bold text-accent">
              ${auction.currentBid.toLocaleString()}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Time Remaining</p>
            <p class="text-lg font-semibold text-foreground">
              {auction.endDate}
            </p>
          </div>
        </div>

        <!-- Bidding Form -->
        {#if auction.status !== "ended"}
          <div class="space-y-4">
            <div>
              <label
                for="bid-amount"
                class="block text-sm font-medium text-foreground mb-2"
              >
                Your Bid
              </label>
              <div class="flex gap-2">
                <span
                  class="inline-flex text-lg font-koulen items-center px-3 bg-muted rounded-lg text-foreground"
                >
                  $
                </span>
                <input
                  required
                  type="number"
                  id="bid-amount"
                  name="bidAmount"
                  step={auction.bidInterval}
                  bind:value={bidAmount}
                  placeholder={auction.bidInterval.toString()}
                  class="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <!-- <p class="text-xs text-muted-foreground mt-2">
                Minimum bid: ${Math.max(
                  auction.currentBid + auction.bidInterval,
                  auction.startingPrice
                ).toLocaleString()}
              </p> -->
              <p class="text-xs text-muted-foreground my-4">
                Bid interval: {auction.bidInterval}
              </p>
            </div>

            {#if bidError}
              <div
                class="p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
              >
                <p class="text-sm text-destructive">{bidError}</p>
              </div>
            {/if}

            {#if bidSuccess}
              <div
                class="p-3 bg-green-100 border border-green-300 rounded-lg dark:bg-green-900 dark:border-green-700"
              >
                <p class="text-sm text-green-800 dark:text-green-200">
                  Bid placed successfully!
                </p>
              </div>
            {/if}

            <Button
              type="submit"
              {disabled}
              class="{disabled
                ? 'cursor-not-allowed'
                : 'cursor-pointer'} w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
            >
              {#if loading}
                <Spinner class="me-3" size="4" color="gray" />Placing Bid...
              {:else}
                Place Bid
              {/if}
            </Button>
          </div>
        {:else}
          <div class="p-4 bg-muted/30 rounded-lg text-center">
            <p class="text-foreground font-medium mb-2">
              This auction has ended
            </p>
            <p class="text-sm text-muted-foreground">
              {auction.bids.length > 0 && auction.currentBid > 0
                ? `Won by ${auction.bids[auction.bids.length - 1]?.user.name}`
                : "No bids were placed"}
            </p>
          </div>
        {/if}
      </div>
    </form>
  </div>
{/snippet}

<!-- Header snippet -->
{#snippet header()}
  <div
    class="bg-linear-to-r from-primary/10 to-accent/10 border-b border-border py-8"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <a
        href="/auctions"
        class="text-primary hover:text-accent mb-4 inline-block"
      >
        ← Back to Auctions
      </a>
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-4xl md:text-5xl font-bold text-foreground">
            {auction.name}
          </h1>
          <p class="text-muted-foreground mt-2">by {auction.author}</p>
        </div>
        <div
          class="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium"
        >
          <span class="w-2 h-2 bg-current rounded-full animate-pulse"></span>
          {realtime.isConnected ? "Live" : "Offline"}
        </div>
      </div>
    </div>
  </div>
{/snippet}
