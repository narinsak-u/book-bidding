<script lang="ts">
  import { FALLBACK_IMAGE } from "../../routes/dashboard/shared/constants";
  import type { Auction } from "../../routes/helpers";
  import Icon from "./Icon.svelte";
  import ConditionChip from "./ConditionChip.svelte";

  let { auction }: { auction: Partial<Auction> } = $props();

  const isLive = $derived(
    new Date(auction.endDate || 0).getTime() > Date.now(),
  );

  const formatTimeLeft = (endDate: Date | string | undefined) => {
    if (!endDate) return "00:00:00";
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
</script>

<a
  href={`/auctions/${auction.id}`}
  class="group flex flex-col bg-surface-container-low p-5 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-outline-variant/10"
>
  <!-- Image Container -->
  <div
    class="relative aspect-[4/5] mb-6 overflow-hidden rounded-lg bg-surface-container-high shadow-md"
  >
    <img
      src={auction.fileKey || FALLBACK_IMAGE}
      alt={auction.name}
      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />

    <!-- Condition Chip Overlay -->
    <div class="absolute top-4 -right-1 z-10">
      <ConditionChip text={auction.condition || "Fine"} rotated={true} />
    </div>

    <!-- Live Timer Overlay -->
    {#if isLive}
      <div
        class="absolute bottom-4 left-4 glass-overlay px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/20 shadow-lg"
      >
        <div class="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
        <span
          class="text-[11px] font-bold font-label tracking-widest text-primary uppercase"
        >
          {formatTimeLeft(auction.endDate)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="relative flex-1 flex flex-col">
    <!-- Decorative Quote Icon -->
    <div
      class="absolute -top-6 -left-2 pointer-events-none opacity-5 select-none"
    >
      <span class="font-headline text-7xl text-on-surface-variant italic"
        >"</span
      >
    </div>

    <div class="mb-4">
      <h3
        class="font-headline font-bold text-lg text-primary leading-tight line-clamp-2 mb-1 group-hover:text-secondary transition-colors"
      >
        {auction.name}
      </h3>
      <p class="text-xs font-body text-on-surface-variant italic">
        by {auction.author}
      </p>
    </div>

    <div class="mt-auto space-y-4">
      <div class="flex items-end justify-between">
        <div class="flex flex-col">
          <span
            class="text-[10px] font-label font-bold uppercase tracking-wider text-outline mb-1"
            >Current Bid</span
          >
          <span
            class="font-headline font-black text-2xl text-primary leading-none"
          >
            ${(
              auction.currentBid ||
              auction.startingPrice ||
              0
            ).toLocaleString()}
          </span>
        </div>

        <div class="flex flex-col items-end">
          <span
            class="text-[10px] font-label font-bold uppercase tracking-wider text-outline mb-1"
            >Bids</span
          >
          <span
            class="font-headline font-bold text-lg text-on-surface-variant leading-none"
          >
            {auction.bids?.length || 0}
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          class="flex-1 bg-primary text-on-primary py-3 rounded-lg font-headline font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-primary-container active:scale-95 cursor-pointer"
        >
          {isLive ? "Place Bid" : "View Details"}
        </button>
        <button
          class="w-12 h-12 flex items-center justify-center border border-outline-variant/30 rounded-lg text-primary hover:bg-surface-container-high transition-colors"
          aria-label="Add to watchlist"
        >
          <Icon icon="bookmark" class="text-xl" />
        </button>
      </div>
    </div>
  </div>
</a>
