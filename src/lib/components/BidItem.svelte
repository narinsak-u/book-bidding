<script lang="ts">
  import { ChevronDoubleRightOutline } from "flowbite-svelte-icons";
  import { FALLBACK_IMAGE } from "../../routes/dashboard/shared/constants";
  import { formatDate } from "../../routes/helpers";

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
        : (book ?? null)
  );
  const receiptUrl = $derived(
    mode === "purchased" ? (purchase?.receiptUrl ?? null) : null
  );
  const imageUrl = $derived(item?.fileKey || FALLBACK_IMAGE);
  const isWinner = $derived(
    !!item?.currentBid &&
      !!bid &&
      bid?.amount >= item.currentBid &&
      bid?.userId === userId
  );
  const isOutbid = $derived(
    !!item?.currentBid && !!bid && bid?.amount < item.currentBid
  );

  const handleCheckout = () => {
    if (onCheckout) onCheckout(bid);
  };
</script>

<div
  class="flex items-center gap-4 bg-card border border-border rounded-md p-4"
>
  <img
    src={imageUrl}
    alt={item?.name || "Auction"}
    class="w-20 h-20 rounded object-cover border border-border"
  />
  <div class="flex-1">
    <div class="flex flex-wrap items-center gap-2">
      <a
        href={`/auctions/${item?.id}`}
        class="font-semibold text-foreground hover:underline"
      >
        {item?.name}
      </a>
      {#if item?.author}
        <span class="text-sm text-muted-foreground">by {item.author}</span>
      {/if}

      <!-- Status Badge -->
      {#if mode === "active"}
        <span
          class="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded text-xs"
        >
          Active
        </span>
      {:else if mode === "awaiting"}
        <span
          class="inline-block bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded text-xs"
        >
          Awaiting Payment
        </span>
      {:else if mode === "purchased"}
        <span
          class="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded text-xs"
        >
          Purchased
        </span>
      {:else if mode === "sold"}
        <span
          class="inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded text-xs"
        >
          Sold
        </span>
      {:else}
        <span
          class="inline-block bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 rounded text-xs"
        >
          Ended
        </span>
      {/if}
    </div>

    <!-- Bid Details -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
    >
      <div class="mt-2 text-sm text-muted-foreground">
        <!-- metadata -->
        {#if mode === "active" || mode === "ended"}
          Placed: {formatDate(bid?.createdAt)} · Your bid:
          <span class="font-semibold text-foreground">
            ${bid?.amount != null ? `${bid?.amount?.toLocaleString?.()}` : ""}
          </span>
          {#if item?.currentBid}
            {#if mode === "active"}
              · Current: <span class="font-semibold text-accent">
                ${`${item.currentBid?.toLocaleString?.()}`}
              </span>
            {:else}
              · Final: <span class="font-semibold text-accent">
                ${`${item.currentBid?.toLocaleString?.()}`}
              </span>
            {/if}
          {/if}
        {:else}
          Ended: {formatDate(item?.endDate)} · {mode === "sold"
            ? "Sold for"
            : "Final"}:
          <span class="font-semibold text-foreground">
            ${item?.currentBid != null
              ? `${item?.currentBid?.toLocaleString?.()}`
              : ""}
          </span>
          {#if mode === "awaiting" && item?.bids?.length}
            · Bids: <span class="font-semibold">{item.bids.length}</span>
          {/if}
        {/if}

        <!-- winner tag -->
        {#if mode === "ended" && isWinner}
          <span class="font-semibold text-green-600 dark:text-green-400">
            Won:
          </span>
          <span class="ml-1">Congratulations! You've won this item. 🎉</span>
        {/if}

        <!-- outbid tag -->
        {#if mode === "active" && isOutbid}
          <br />
          <span class="font-semibold text-red-600 dark:text-red-400">
            Outbid:
          </span>
          <span class="ml-1">Increase your bid to secure this item!</span>
        {/if}
      </div>

      <!-- Action Buttons, active => bid now, ended -> winner => checkout, else => view detail -->
      {#if mode === "ended"}
        {#if isWinner}
          <button
            onclick={handleCheckout}
            class="group w-28 text-center font-koulen flex items-center gap-1 px-4 py-2 cursor-pointer bg-green-600 text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            <span class="transition-transform group-hover:translate-x-0">
              Checkout
            </span>
            <ChevronDoubleRightOutline
              class="shrink-0 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:scale-110"
            />
          </button>
        {:else}
          <a
            href={`/auctions/${item?.id}`}
            class="px-4 w-28 text-center py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            View Detail
          </a>
        {/if}
      {:else if mode === "active"}
        <a
          href={`/auctions/${item?.id}`}
          class="px-4 w-28 text-center py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
        >
          Bid Now
        </a>
      {:else if mode === "awaiting"}
        <a
          href={`/auctions/${item?.id}`}
          class="px-4 w-28 text-center py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
        >
          View Detail
        </a>
      {:else if mode === "purchased"}
        {#if receiptUrl}
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 w-36 text-center py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            View Receipt
          </a>
        {/if}
      {:else if mode === "sold"}
        <a
          href={`/auctions/${item?.id}`}
          class="px-4 w-28 text-center py-2 cursor-pointer font-koulen bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
        >
          View Detail
        </a>
      {/if}
    </div>
  </div>
</div>
