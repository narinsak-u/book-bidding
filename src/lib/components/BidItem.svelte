<script lang="ts">
  import Icon from "./Icon.svelte";
  import { FALLBACK_IMAGE } from "../../routes/dashboard/shared/constants";
  import { formatDate } from "../../routes/helpers";
  import ConditionChip from "./ConditionChip.svelte";

  let {
    bid,
    userId,
    mode,
    onCheckout,
    book,
    purchase,
  }: {
    bid?: any;
    userId?: string | null;
    mode: "active" | "ended" | "awaiting" | "purchased" | "sold";
    onCheckout?: (b: any) => void;
    book?: any;
    purchase?: { item: any; receiptUrl?: string | null };
  } = $props();

  const item = $derived(
    mode === "active" || mode === "ended"
      ? (bid?.item ?? null)
      : mode === "purchased"
        ? (purchase?.item ?? null)
        : (book ?? null),
  );

  const imageUrl = $derived(item?.fileKey || FALLBACK_IMAGE);
  const isWinner = $derived(
    !!item?.currentBid &&
      !!bid &&
      bid?.amount >= item.currentBid &&
      bid?.userId === userId,
  );
  const isOutbid = $derived(
    !!item?.currentBid && !!bid && bid?.amount < item.currentBid,
  );

  const handleCheckout = () => {
    if (onCheckout) onCheckout(bid);
  };

  const getStatusDisplay = () => {
    switch (mode) {
      case "active":
        return {
          text: isOutbid ? "OUTBID" : "ACTIVE",
          class: isOutbid ? "text-secondary" : "text-primary",
        };
      case "awaiting":
        return { text: "AWAITING SETTLEMENT", class: "text-secondary" };
      case "purchased":
        return { text: "ACQUIRED", class: "text-green-600" };
      case "sold":
        return { text: "SOLD", class: "text-primary" };
      default:
        return {
          text: isWinner ? "WON" : "ENDED",
          class: isWinner ? "text-green-600" : "text-outline",
        };
    }
  };

  const status = $derived(getStatusDisplay());

  const getPriceLabel = () => {
    switch (mode) {
      case "sold":
        return "REVENUE";
      case "purchased":
        return "ACQUISITION";
      case "active":
        return "YOUR BID";
      default:
        return "FINAL PRICE";
    }
  };
</script>

<div
  class="group flex items-center gap-6 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
>
  <!-- Thumbnail -->
  <div
    class="w-20 h-24 bg-surface-container-high rounded shadow-md overflow-hidden flex-shrink-0 border-b-2 border-primary/10"
  >
    <img
      src={imageUrl}
      alt={item?.name}
      class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
    />
  </div>

  <!-- Content -->
  <div class="flex-1 flex items-center justify-between min-w-0">
    <div class="space-y-1 min-w-0 pr-4">
      <div class="flex items-center gap-3">
        <h3
          class="font-headline font-bold text-primary truncate text-lg tracking-tight group-hover:text-secondary transition-colors"
        >
          {item?.name.toUpperCase()}
        </h3>
        <ConditionChip text={item?.condition || "Fine"} />
      </div>
      <p class="text-xs font-body italic text-on-surface-variant">
        by {item?.author}
      </p>
    </div>

    <!-- Metadata Columns -->
    <div class="hidden md:flex items-center gap-8 text-center flex-shrink-0">
      <div class="w-px h-10 bg-outline-variant/10"></div>

      <div class="flex flex-col min-w-[80px]">
        <span
          class="text-[9px] font-label font-bold text-outline uppercase tracking-widest mb-1"
          >Status</span
        >
        <span
          class="font-headline font-black text-xs tracking-wider {status.class}"
          >{status.text}</span
        >
      </div>

      <div class="w-px h-10 bg-outline-variant/10"></div>

      <div class="flex flex-col min-w-[100px]">
        <span
          class="text-[9px] font-label font-bold text-outline uppercase tracking-widest mb-1"
          >{getPriceLabel()}</span
        >
        <span
          class="font-headline font-black text-lg text-primary leading-none"
        >
          ${(bid?.amount ?? item?.currentBid ?? 0).toLocaleString()}
        </span>
      </div>

      <div class="w-px h-10 bg-outline-variant/10"></div>

      <div class="flex flex-col min-w-[120px]">
        <span
          class="text-[9px] font-label font-bold text-outline uppercase tracking-widest mb-1"
          >DATE</span
        >
        <span class="font-headline font-bold text-xs text-primary uppercase"
          >{formatDate(item?.endDate || new Date())}</span
        >
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4 ml-8">
      {#if mode === "ended" && isWinner}
        <button
          onclick={handleCheckout}
          class="bg-secondary text-on-secondary px-6 py-2 rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest shadow-lg hover:shadow-secondary/20 transition-all active:scale-95 cursor-pointer"
        >
          Settle
        </button>
      {/if}
      <a
        href={`/auctions/${item?.id}`}
        class="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container-low transition-all"
      >
        <Icon icon="chevron_right" />
      </a>
    </div>
  </div>
</div>
