<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Unauthentication from "$lib/components/Unauthentication.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import ConditionChip from "$lib/components/ConditionChip.svelte";
  import type { PageProps } from "./$types";
  import { FALLBACK_IMAGE } from "./shared/constants";

  let { data }: PageProps = $props();

  interface Auction {
    id: string;
    title: string;
    author: string;
    condition: string;
    currentPrice: number;
    startingPrice: number;
    status: "active" | "ending-soon" | "ended";
    bidsCount: number;
    endDate: string;
    fileKey: string;
  }

  function mapBooksToAuctions(books: typeof data.books): Auction[] {
    return books.map((book) => ({
      id: book.id,
      title: book.name,
      author: book.author,
      condition: book.condition || "Fine",
      currentPrice: book.currentBid,
      startingPrice: book.startingPrice,
      status:
        book.endDate < new Date()
          ? "ended"
          : new Date(book.endDate).getTime() - Date.now() < 5 * 60 * 60 * 1000
            ? "ending-soon"
            : "active",
      bidsCount: book.bids?.length || 0,
      endDate: (() => {
        const end = new Date(book.endDate);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();
        if (diffMs <= 0) return "Ended";
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) return `${diffDays}d left`;
        return `${diffHours}h left`;
      })(),
      fileKey: book.fileKey,
    }));
  }

  let auctions: Auction[] = $state(mapBooksToAuctions(data.books));

  $effect(() => {
    auctions = mapBooksToAuctions(data.books);
  });

  let selectedTab = $state("all");
  let activeCount: number = $state(0);
  let endedCount: number = $state(0);
  let totalBids: number = $state(0);
  let totalRevenue: number = $state(0);

  let rowLoading: Record<string, boolean> = $state({});

  let deleteModalOpen = $state(false);
  let deleteTargetId: string | null = $state(null);
  let deleteFormRefs: Record<string, HTMLFormElement | null> = $state({});

  $effect(() => {
    activeCount = auctions.filter((a) => a.status !== "ended").length;
    endedCount = auctions.filter((a) => a.status === "ended").length;
    totalBids = auctions.reduce((sum, a) => sum + a.bidsCount, 0);
    totalRevenue = auctions
      .filter((a) => a.status === "ended")
      .reduce((sum, a) => sum + a.currentPrice, 0);
  });
</script>

<svelte:head>
  <title>Curator Dashboard | Book Bidding</title>
</svelte:head>

{#if !page.data.sessionId}
  <Unauthentication />
{:else}
  <div class="p-8 space-y-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-end gap-6">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-[2px] w-8 bg-secondary"></div>
          <span
            class="font-label font-bold text-xs uppercase tracking-widest text-secondary"
            >Curator</span
          >
        </div>
        <h1
          class="text-5xl font-headline font-black text-primary tracking-tighter"
        >
          DASHBOARD
        </h1>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative group">
          <Icon
            icon="search"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg"
          />
          <input
            type="text"
            placeholder="Search artifacts..."
            class="bg-surface-container-high border-none rounded-xl py-3 pl-12 pr-6 font-body text-sm text-primary w-64 focus:ring-2 focus:ring-secondary/20 transition-all"
          />
        </div>
        <a
          href="/dashboard/create"
          class="bg-primary text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3"
        >
          <Icon icon="add" class="text-lg" />
          New Listing
        </a>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="lg:col-span-2 bg-surface-container-dark p-8 rounded-2xl border border-outline-variant/5 shadow-sm relative overflow-hidden group"
      >
        <div class="relative z-10 flex flex-col justify-between h-full">
          <span
            class="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 mb-8"
            >Total Auction Revenue</span
          >
          <div class="space-y-2">
            <span
              class="font-headline font-black text-6xl text-on-surface tracking-tighter"
              >${totalRevenue.toLocaleString()}</span
            >
            <div class="flex items-center gap-2 text-secondary">
              <Icon icon="trending_up" class="text-sm" />
              <span
                class="text-xs font-label font-bold uppercase tracking-wider"
                >+12.4% from last month</span
              >
            </div>
          </div>
        </div>
        <div
          class="absolute -right-8 -bottom-8 opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700"
        >
          <Icon icon="payments" class="text-[12rem] text-on-surface" />
        </div>
      </div>

      <div
        class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between"
      >
        <span
          class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-8"
          >Active Artifacts</span
        >
        <div class="space-y-1">
          <span class="font-headline font-black text-5xl text-primary"
            >{activeCount}</span
          >
          <p
            class="text-[10px] font-label font-bold uppercase tracking-wider text-outline"
          >
            Currently Bidding
          </p>
        </div>
      </div>

      <div
        class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between"
      >
        <span
          class="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-8"
          >Pending Shipments</span
        >
        <div class="space-y-1">
          <span class="font-headline font-black text-5xl text-secondary"
            >03</span
          >
          <p
            class="text-[10px] font-label font-bold uppercase tracking-wider text-outline"
          >
            Awaiting Dispatch
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content Table -->
    <div class="space-y-8">
      <div
        class="flex justify-between items-center border-b border-outline-variant/10 pb-4"
      >
        <h2
          class="font-headline font-black text-2xl text-primary tracking-tighter uppercase"
        >
          Active Artifact Auctions
        </h2>
        <div class="flex gap-6">
          {#each ["all", "active", "ended"] as tab}
            <button
              onclick={() => (selectedTab = tab)}
              class="text-[10px] font-label font-bold uppercase tracking-widest transition-all relative pb-2
                {selectedTab === tab
                ? 'text-primary'
                : 'text-outline hover:text-primary'}"
            >
              {tab}
              {#if selectedTab === tab}
                <div
                  class="absolute bottom-0 left-0 w-full h-[2px] bg-secondary"
                ></div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div
        class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm"
      >
        <table class="w-full text-left">
          <thead>
            <tr class="bg-surface-container-low/50">
              <th
                class="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-outline"
                >Artifact</th
              >
              <th
                class="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-outline"
                >Status</th
              >
              <th
                class="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-outline"
                >Bids</th
              >
              <th
                class="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-outline"
                >Price</th
              >
              <th
                class="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-outline text-right"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/5">
            {#each auctions.filter((a) => {
              if (selectedTab === "all") return true;
              if (selectedTab === "active") return a.status !== "ended";
              return a.status === "ended";
            }) as auction (auction.id)}
              <tr
                class="group hover:bg-surface-container-low transition-colors"
              >
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-16 bg-surface-container-high rounded shadow-sm overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={auction.fileKey || FALLBACK_IMAGE}
                        alt={auction.title}
                        class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div>
                      <p
                        class="font-headline font-bold text-primary leading-tight mb-1"
                      >
                        {auction.title}
                      </p>
                      <div class="flex items-center gap-2">
                        <ConditionChip text={auction.condition} />
                        <span class="text-[9px] font-body text-outline italic"
                          >by {auction.author}</span
                        >
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <Icon icon="schedule" class="text-secondary text-sm" />
                    <span class="font-headline font-bold text-xs text-primary"
                      >{auction.endDate.toUpperCase()}</span
                    >
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span class="font-headline font-black text-lg text-primary"
                    >{auction.bidsCount.toString().padStart(2, "0")}</span
                  >
                </td>
                <td class="px-8 py-6">
                  <span class="font-headline font-black text-xl text-primary"
                    >${auction.currentPrice.toLocaleString()}</span
                  >
                </td>
                <td class="px-8 py-6">
                  <div
                    class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      onclick={() => goto(`/dashboard/edit/${auction.id}`)}
                      class="p-2 text-outline hover:text-primary hover:bg-surface-container-high rounded-lg transition-all"
                    >
                      <Icon icon="edit" />
                    </button>
                    <button
                      onclick={() => {
                        deleteTargetId = auction.id;
                        deleteModalOpen = true;
                      }}
                      class="p-2 text-outline hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all"
                    >
                      <Icon icon="delete" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<Modal open={deleteModalOpen}>
  <div class="p-4 space-y-6">
    <div class="flex items-center gap-4">
      <div
        class="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center"
      >
        <Icon icon="warning" class="text-2xl text-secondary" />
      </div>
      <div>
        <h3
          class="font-headline font-black text-2xl text-primary tracking-tighter uppercase"
        >
          Archive Removal
        </h3>
        <p class="text-sm font-body text-on-surface-variant">
          This artifact will be permanently delisted.
        </p>
      </div>
    </div>

    <div class="flex gap-4">
      <button
        class="flex-1 py-4 bg-surface-container border border-outline-variant/30 text-primary rounded-xl font-headline font-bold uppercase tracking-widest text-xs transition-all hover:bg-surface-container-high cursor-pointer"
        onclick={() => (deleteModalOpen = false)}
      >
        Preserve
      </button>
      <form
        action="?/deleteAuction"
        method="POST"
        use:enhance={() => {
          const tid = deleteTargetId;
          if (tid) rowLoading[tid] = true;
          return async ({ result, update }) => {
            if (result?.status === 200) await update();
            if (tid) rowLoading[tid] = false;
            deleteModalOpen = false;
          };
        }}
        class="flex-1"
      >
        <input type="hidden" name="auctionId" value={deleteTargetId} />
        <button
          type="submit"
          class="w-full py-4 bg-secondary text-on-secondary rounded-xl font-headline font-black uppercase tracking-widest text-xs transition-all hover:shadow-xl cursor-pointer"
        >
          Confirm Removal
        </button>
      </form>
    </div>
  </div>
</Modal>
