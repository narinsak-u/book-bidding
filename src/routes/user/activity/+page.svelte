<script lang="ts">
  import { page } from "$app/state";
  import { FALLBACK_IMAGE } from "../../dashboard/shared/constants";
  import BidItem from "$lib/components/BidItem.svelte";
  import Unauthentication from "$lib/components/Unauthentication.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import RevenuePerformance from "$lib/components/RevenuePerformance.svelte";
  import MarketWatch from "$lib/components/MarketWatch.svelte";
  import AppFooter from "$lib/components/AppFooter.svelte";

  let { data } = $props();

  let activeTab = $state<"all" | "buying" | "selling">("all");

  const onCheckout = async (bid: any) => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    const { url } = await response.json();
    window.location = url;
  };

  function formatCurrency(n?: number) {
    return `$${(n || 0).toLocaleString()}`;
  }

  const hasBids = $derived(
    (data.activeBids?.length ?? 0) > 0 ||
      (data.endedBids?.length ?? 0) > 0 ||
      (data.purchasedItems?.length ?? 0) > 0,
  );
  const hasSales = $derived(
    (data.awaitingPayment?.length ?? 0) > 0 ||
      (data.purchasedItems?.length ?? 0) > 0 ||
      (data.soldItems?.length ?? 0) > 0,
  );
</script>

<svelte:head>
  <title>Activity Archive | Book Bidding</title>
</svelte:head>

{#if !page.data.sessionId}
  <Unauthentication />
{:else}
  <div class="bg-background min-h-screen flex flex-col">
    <div class="flex-1 p-8 space-y-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-end gap-6">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="h-[2px] w-8 bg-secondary"></div>
            <span
              class="font-label font-bold text-xs uppercase tracking-widest text-secondary"
              >History</span
            >
          </div>
          <h1
            class="text-5xl font-headline font-black text-primary tracking-tighter uppercase"
          >
            Activity Archive
          </h1>
        </div>
      </div>

      <!-- Stats Grid (Bento Style) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-surface-container-dark p-8 rounded-2xl border border-outline-variant/5 shadow-sm flex flex-col justify-between group overflow-hidden relative"
        >
          <div class="relative z-10">
            <span
              class="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 mb-8 block"
              >Total Acquisition Value</span
            >
            <div class="space-y-2">
              <span
                class="font-headline font-black text-4xl text-on-surface tracking-tighter"
                >{formatCurrency(data.stats?.expenses)}</span
              >
              <div class="flex items-center gap-2 text-secondary">
                <Icon icon="trending_up" class="text-sm" />
                <span
                  class="text-[10px] font-label font-bold uppercase tracking-wider"
                  >+12.4% from last quarter</span
                >
              </div>
            </div>
          </div>
          <Icon
            icon="shopping_cart"
            class="absolute -right-4 -bottom-4 text-8xl text-on-surface opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700"
          />
        </div>

        <div
          class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between group overflow-hidden relative"
        >
          <div class="relative z-10">
            <span
              class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-8 block"
              >Auction Revenue</span
            >
            <div class="space-y-2">
              <span
                class="font-headline font-black text-4xl text-primary tracking-tighter"
                >{formatCurrency(data.stats?.salesRevenue)}</span
              >
              <div class="flex items-center gap-2 text-green-600">
                <Icon icon="check_circle" class="text-sm" />
                <span
                  class="text-[10px] font-label font-bold uppercase tracking-wider"
                  >All payments cleared</span
                >
              </div>
            </div>
          </div>
          <Icon
            icon="payments"
            class="absolute -right-4 -bottom-4 text-8xl text-primary opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700"
          />
        </div>

        <div
          class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between group overflow-hidden relative"
        >
          <div class="relative z-10">
            <span
              class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-8 block"
              >Active Bidding Sessions</span
            >
            <div class="space-y-2">
              <span
                class="font-headline font-black text-4xl text-primary tracking-tighter"
                >{String(data.activeBids?.length ?? 0).padStart(2, "0")}</span
              >
              <div class="flex items-center gap-2 text-secondary">
                <Icon icon="schedule" class="text-sm" />
                <span
                  class="text-[10px] font-label font-bold uppercase tracking-wider"
                  >{Math.min(3, data.activeBids?.length ?? 0)} sessions ending soon</span
                >
              </div>
            </div>
          </div>
          <Icon
            icon="history"
            class="absolute -right-4 -bottom-4 text-8xl text-primary opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700"
          />
        </div>
      </div>

      <!-- Main Content + Sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div class="lg:col-span-8 space-y-8">
          <!-- Tab Navigation -->
          <div class="flex gap-8 border-b border-outline-variant/10 pb-4">
            {#each ["all", "buying", "selling"] as tab}
              <button
                onclick={() => (activeTab = tab as any)}
                class="text-[10px] font-label font-bold uppercase tracking-widest transition-all relative pb-2
                  {activeTab === tab
                  ? 'text-primary'
                  : 'text-outline hover:text-primary'}"
              >
                {tab} Activity
                {#if activeTab === tab}
                  <div
                    class="absolute bottom-0 left-0 w-full h-[2px] bg-secondary"
                  ></div>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Activity Lists -->
          <div class="space-y-12">
            {#if activeTab === "all" || activeTab === "buying"}
              {#if hasBids}
                <!-- Ended Bids / Acquisitions -->
                {#if data.endedBids?.length > 0}
                  <div class="space-y-6">
                    <h2
                      class="font-headline font-black text-xl text-primary tracking-tighter uppercase"
                    >
                      Recent Acquisitions
                    </h2>
                    <div class="grid gap-4">
                      {#each data.endedBids as bid (bid.id)}
                        <BidItem
                          mode="ended"
                          {bid}
                          userId={data.user?.id}
                          {onCheckout}
                        />
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Active Bids -->
                {#if data.activeBids?.length > 0}
                  <div class="space-y-6">
                    <h2
                      class="font-headline font-black text-xl text-primary tracking-tighter uppercase"
                    >
                      Active Artifact Bids
                    </h2>
                    <div class="grid gap-4">
                      {#each data.activeBids as bid (bid.id)}
                        <BidItem mode="active" {bid} userId={data.user?.id} />
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Purchased -->
                {#if data.purchasedItems?.length > 0}
                  <div class="space-y-6">
                    <h2
                      class="font-headline font-black text-xl text-primary tracking-tighter uppercase"
                    >
                      Permanent Collection
                    </h2>
                    <div class="grid gap-4">
                      {#each data.purchasedItems as purchase (purchase.item.id)}
                        <BidItem mode="purchased" {purchase} />
                      {/each}
                    </div>
                  </div>
                {/if}
              {:else if activeTab === "buying"}
                <div
                  class="bg-surface-container-low/30 rounded-2xl border border-outline-variant/10 p-16 text-center space-y-4"
                >
                  <Icon icon="gavel" class="text-5xl text-outline/30" />
                  <p
                    class="font-headline font-bold text-primary uppercase tracking-widest text-sm"
                  >
                    No acquisitions found
                  </p>
                  <a
                    href="/auctions"
                    class="inline-block text-[10px] font-label font-bold uppercase tracking-widest text-secondary hover:underline transition-all"
                    >Explore Archives</a
                  >
                </div>
              {/if}
            {/if}

            {#if activeTab === "all" || activeTab === "selling"}
              {#if hasSales}
                <!-- Awaiting Payment -->
                {#if data.awaitingPayment?.length > 0}
                  <div class="space-y-6">
                    <h2
                      class="font-headline font-black text-xl text-primary tracking-tighter uppercase"
                    >
                      Awaiting Settlement
                    </h2>
                    <div class="grid gap-4">
                      {#each data.awaitingPayment as book (book.id)}
                        <BidItem mode="awaiting" {book} />
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Sold Items -->
                {#if data.soldItems?.length > 0}
                  <div class="space-y-6">
                    <h2
                      class="font-headline font-black text-xl text-primary tracking-tighter uppercase"
                    >
                      Curation Results
                    </h2>
                    <div class="grid gap-4">
                      {#each data.soldItems as book (book.id)}
                        <BidItem mode="sold" {book} />
                      {/each}
                    </div>
                  </div>
                {/if}
              {:else if activeTab === "selling"}
                <div
                  class="bg-surface-container-low/30 rounded-2xl border border-outline-variant/10 p-16 text-center space-y-4"
                >
                  <Icon icon="storefront" class="text-5xl text-outline/30" />
                  <p
                    class="font-headline font-bold text-primary uppercase tracking-widest text-sm"
                  >
                    No curation activity
                  </p>
                  <a
                    href="/dashboard"
                    class="inline-block text-[10px] font-label font-bold uppercase tracking-widest text-secondary hover:underline transition-all"
                    >Create New Listing</a
                  >
                </div>
              {/if}
            {/if}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-4 space-y-12">
          <div class="space-y-4">
            <h3
              class="font-headline font-black text-xs uppercase tracking-widest text-primary mb-6"
            >
              Revenue Performance
            </h3>
            <div
              class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm"
            >
              <RevenuePerformance />
            </div>
          </div>

          <div class="space-y-4">
            <h3
              class="font-headline font-black text-xs uppercase tracking-widest text-primary mb-6"
            >
              Market Insights
            </h3>
            <MarketWatch />
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
{/if}
