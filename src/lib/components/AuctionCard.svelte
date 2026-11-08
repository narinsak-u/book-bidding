<script lang="ts">
  import { FALLBACK_IMAGE } from "../../routes/dashboard/shared/constants";
  import type { Auction } from "../../routes/helpers";
  import { Badge } from "flowbite-svelte";

  let { auction }: { auction: Partial<Auction> } = $props();

  const getTimeColor = (status: string) => {
    return status === "ending-soon"
      ? "text-orange-600"
      : "text-muted-foreground";
  };
</script>

<a href={`/auctions/${auction.id}`} class="auction-card">
  <!-- Image -->
  <div class="relative mb-4 overflow-hidden rounded-md bg-muted h-48">
    <img
      src={auction.image || FALLBACK_IMAGE}
      alt={auction.name}
      class="w-full h-full object-cover hover:scale-105 transition-transform"
    />
    <div class="absolute top-2 right-2">
      {#if auction.status === "ending-soon"}
        <Badge color="yellow" class="auction-badge">⏰ Ending Soon</Badge>
      {:else if auction.status === "ended"}
        <Badge color="gray" class="auction-badge">Ended</Badge>
      {:else}
        <Badge color="green" class="auction-badge">Active</Badge>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="space-y-3">
    <div>
      <h3 class="font-bold text-foreground line-clamp-2 text-sm">
        {auction.name}
      </h3>
      <p class="text-xs text-muted-foreground">by {auction.author}</p>
    </div>

    <!-- Pricing -->
    <div class="space-y-1 border-t border-border pt-3">
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">Current Bid</span>
        <span class="font-bold text-accent text-lg">
          ${auction?.startingPrice?.toLocaleString() || "N/A"}
        </span>
      </div>
      {#if auction?.currentBid && auction.currentBid > 0}
        <div
          class="flex justify-between items-center text-xs text-muted-foreground"
        >
          <span>Highest Bid</span>
          <span>${auction?.currentBid?.toLocaleString() || "N/A"}</span>
        </div>
      {/if}
    </div>

    <div
      class={`text-center font-medium text-sm py-2 bg-accent/5 rounded ${getTimeColor(auction?.status || "")}`}
    >
      {auction.endDate}
    </div>

    <button
      class="w-full cursor-pointer bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition text-sm"
    >
      {auction.status === "ended" ? "View Details" : "Place Bid"}
    </button>
  </div>
</a>
