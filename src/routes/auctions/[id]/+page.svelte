<script lang="ts">
  import { page } from "$app/state";
  import BidNotification from "$lib/components/BidNotification.svelte";
  import { realtime } from "$lib/stores/realtime";
  import { mapBooksToAuctions } from "../../helpers.js";
  import { enhance } from "$app/forms";
  import { FALLBACK_IMAGE } from "../../dashboard/shared/constants.js";
  import Icon from "$lib/components/Icon.svelte";
  import ConditionChip from "$lib/components/ConditionChip.svelte";

  let { data } = $props();

  let auction = $state(mapBooksToAuctions([data.book])[0]);

  $effect(() => {
    auction = mapBooksToAuctions([data.book])[0];
  });

  let bidAmount = $state(auction.bidInterval);
  let bidError = $state("");
  let bidSuccess = $state(false);
  let loading = $state(false);

  let activeTab = $state("description");

  let disabled = $derived.by(() => {
    return Boolean(
      !page.data?.sessionId ||
      loading ||
      !bidAmount ||
      Number(bidAmount) < auction.bidInterval,
    );
  });

  $effect(() => {
    realtime.connect();

    const unsubscribe = realtime.subscribe(auction.id!, (update) => {
      if (auction && update.auctionId === auction.id) {
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

  const formatTimeLeft = (endDate: Date | string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
</script>

<svelte:head>
  <title>{auction?.name || "Auction"} - Book Bidding</title>
</svelte:head>

<BidNotification />

{#if auction}
  <div class="bg-background min-h-screen">
    <!-- Breadcrumbs & Navigation -->
    <div class="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
      <nav
        class="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-8"
      >
        <a href="/" class="hover:text-primary transition-colors">Home</a>
        <Icon icon="chevron_right" class="text-xs" />
        <a href="/auctions" class="hover:text-primary transition-colors"
          >Auctions</a
        >
        <Icon icon="chevron_right" class="text-xs" />
        <span class="text-primary">{auction.name}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Image Column -->
        <div class="lg:col-span-7 space-y-6">
          <div
            class="relative aspect-[4/5] rounded-2xl overflow-hidden book-shadow bg-surface-container-high group"
          >
            <img
              src={auction.fileKey || FALLBACK_IMAGE}
              alt={auction.name}
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute top-6 right-0 z-10 scale-125">
              <ConditionChip
                text={auction.condition || "Fine"}
                rotated={true}
              />
            </div>

            {#if realtime.isConnected}
              <div
                class="absolute top-6 left-6 glass-overlay px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-lg"
              >
                <div
                  class="w-2 h-2 rounded-full bg-secondary animate-pulse"
                ></div>
                <span
                  class="text-[10px] font-label font-bold tracking-widest text-primary uppercase"
                  >Live Connection</span
                >
              </div>
            {/if}
          </div>

          <!-- Thumbnail Grid Placeholder -->
          <div class="grid grid-cols-4 gap-4">
            {#each Array(4) as _}
              <div
                class="aspect-square rounded-lg bg-surface-container-low border border-outline-variant/10 overflow-hidden cursor-pointer hover:border-secondary transition-colors"
              >
                <img
                  src={auction.fileKey || FALLBACK_IMAGE}
                  alt="Thumbnail"
                  class="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                />
              </div>
            {/each}
          </div>
        </div>

        <!-- Details Column -->
        <div class="lg:col-span-5 flex flex-col">
          <div class="space-y-6 mb-8 border-l-4 border-secondary pl-8">
            <div class="space-y-2">
              <h1
                class="text-5xl font-headline font-black text-primary leading-tight tracking-tighter"
              >
                {auction.name.toUpperCase()}
              </h1>
              <p class="text-xl font-body italic text-on-surface-variant">
                by {auction.author}
              </p>
            </div>

            <div class="flex items-end gap-12">
              <div class="flex flex-col">
                <span
                  class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-1"
                  >Current Bid</span
                >
                <span class="font-headline font-black text-4xl text-primary"
                  >${auction.currentBid.toLocaleString()}</span
                >
              </div>
              <div class="flex flex-col">
                <span
                  class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-1"
                  >Ends In</span
                >
                <span class="font-headline font-bold text-2xl text-secondary"
                  >{formatTimeLeft(auction.endDate)}</span
                >
              </div>
            </div>
          </div>

          <!-- Bidding Panel -->
          <div
            class="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-sm mb-8"
          >
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
              class="space-y-6"
            >
              <input type="hidden" name="auctionId" value={auction.id} />

              <div class="space-y-4">
                <label
                  for="bid-amount"
                  class="block text-[10px] font-label font-bold uppercase tracking-widest text-outline"
                >
                  Place Your Bid (Min. Interval ${auction.bidInterval})
                </label>
                <div class="relative group">
                  <span
                    class="absolute left-6 top-1/2 -translate-y-1/2 font-headline font-bold text-xl text-primary/40 group-focus-within:text-primary transition-colors"
                    >$</span
                  >
                  <input
                    required
                    type="number"
                    id="bid-amount"
                    name="bidAmount"
                    step={auction.bidInterval}
                    bind:value={bidAmount}
                    class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-6 font-headline font-bold text-xl text-primary focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {#if bidError}
                <div
                  class="p-4 bg-secondary/5 border border-secondary/20 rounded-xl"
                >
                  <p
                    class="text-xs font-label font-bold text-secondary uppercase tracking-widest"
                  >
                    {bidError}
                  </p>
                </div>
              {/if}

              {#if bidSuccess}
                <div
                  class="p-4 bg-green-500/5 border border-green-500/20 rounded-xl"
                >
                  <p
                    class="text-xs font-label font-bold text-green-600 uppercase tracking-widest"
                  >
                    Bid confirmed
                  </p>
                </div>
              {/if}

              <button
                type="submit"
                {disabled}
                class="w-full py-5 bg-primary text-on-primary rounded-xl font-headline font-black uppercase tracking-[0.2em] text-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none cursor-pointer"
              >
                {#if loading}
                  <span class="flex items-center justify-center gap-3">
                    <Icon icon="sync" class="animate-spin" />
                    Processing...
                  </span>
                {:else}
                  Confirm Bid
                {/if}
              </button>
            </form>
          </div>

          <!-- Curated By -->
          <div
            class="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 mb-8"
          >
            <div
              class="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-headline font-bold text-on-primary"
            >
              {auction.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <span
                class="text-[9px] font-label font-bold uppercase tracking-widest text-outline block mb-1"
                >Curated By</span
              >
              <span class="font-headline font-bold text-primary"
                >{auction.user.name}</span
              >
            </div>
            <button
              class="ml-auto text-outline hover:text-primary transition-colors"
            >
              <Icon icon="mail" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex-1 flex flex-col">
            <div class="flex gap-8 border-b border-outline-variant/10 mb-6">
              {#each ["description", "condition", "history"] as tab}
                <button
                  class="pb-4 text-[10px] font-label font-bold uppercase tracking-widest transition-all relative
                    {activeTab === tab
                    ? 'text-primary'
                    : 'text-outline hover:text-primary'}"
                  onclick={() => (activeTab = tab)}
                >
                  {tab}
                  {#if activeTab === tab}
                    <div
                      class="absolute bottom-0 left-0 w-full h-[2px] bg-secondary"
                    ></div>
                  {/if}
                </button>
              {/each}
            </div>

            <div
              class="font-body text-on-surface-variant leading-relaxed text-sm"
            >
              {#if activeTab === "description"}
                <div
                  class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <p>{auction.description}</p>
                  <div class="grid grid-cols-2 gap-4 pt-4">
                    <div class="p-4 bg-surface-container-low rounded-lg">
                      <span
                        class="text-[9px] font-label font-bold text-outline uppercase block mb-1"
                        >Year</span
                      >
                      <span class="font-headline font-bold text-primary"
                        >{auction.yearPublished}</span
                      >
                    </div>
                    <div class="p-4 bg-surface-container-low rounded-lg">
                      <span
                        class="text-[9px] font-label font-bold text-outline uppercase block mb-1"
                        >Pages</span
                      >
                      <span class="font-headline font-bold text-primary"
                        >{auction.pages}</span
                      >
                    </div>
                  </div>
                </div>
              {:else if activeTab === "condition"}
                <div
                  class="animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <p class="italic mb-4">
                    "The physical state of a book is as vital as the words
                    within."
                  </p>
                  <p>
                    Current assessment: <span class="text-primary font-bold"
                      >{auction.condition}</span
                    >. This volume has been meticulously inspected for
                    structural integrity and archival preservation standards.
                  </p>
                </div>
              {:else if activeTab === "history"}
                <div
                  class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  {#if auction.bids.length > 0}
                    {#each auction.bids as bid, i}
                      <div
                        class="flex justify-between items-center py-3 border-b border-outline-variant/5 last:border-0 opacity-{Math.max(
                          100 - i * 20,
                          40,
                        )}"
                      >
                        <div class="flex items-center gap-3">
                          <div
                            class="w-1.5 h-1.5 rounded-full bg-secondary"
                          ></div>
                          <span class="font-headline font-bold text-primary"
                            >{bid.user.name}</span
                          >
                        </div>
                        <span class="font-headline font-black text-primary"
                          >${bid.amount.toLocaleString()}</span
                        >
                      </div>
                    {/each}
                  {:else}
                    <p class="italic text-outline">
                      No bids recorded in the archive yet.
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="bg-background min-h-[70vh] flex items-center justify-center">
    <div class="text-center space-y-6">
      <h2
        class="text-4xl font-headline font-black text-primary tracking-tighter"
      >
        ARTIFACT NOT FOUND
      </h2>
      <a
        href="/auctions"
        class="inline-flex items-center gap-3 font-headline font-bold text-sm uppercase tracking-widest text-secondary hover:underline"
      >
        <Icon icon="arrow_back" />
        Return to Archives
      </a>
    </div>
  </div>
{/if}
