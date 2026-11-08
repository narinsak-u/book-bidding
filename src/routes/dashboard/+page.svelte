<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Modal } from "flowbite-svelte";
  import HeaderSection from "$lib/components/Header.svelte";
  import Unauthentication from "$lib/components/Unauthentication.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  interface Auction {
    id: string;
    title: string;
    author: string;
    description: string;
    currentPrice: number;
    startingPrice: number;
    status: "active" | "ending-soon" | "ended";
    bidsCount: number;
    endDate: string;
  }

  function mapBooksToAuctions(books: typeof data.books): Auction[] {
    return books.map((book) => ({
      id: book.id,
      title: book.name,
      author: book.author,
      description: book.description || "",
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
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
      })(),
    }));
  }

  let auctions: Auction[] = $state(mapBooksToAuctions(data.books));

  // Recompute auctions when `data.books` updates after actions
  $effect(() => {
    auctions = mapBooksToAuctions(data.books);
  });

  let selectedTab = $state("overview");
  let activeCount: number = $state(0);
  let endedCount: number = $state(0);
  let totalBids: number = $state(0);
  let totalRevenue: number = $state(0);

  let rowLoading: Record<string, boolean> = $state({});

  // Delete confirmation modal and toast state
  let deleteModalOpen = $state(false);
  let deleteTargetId: string | null = $state(null);
  let deleteFormRefs: Record<string, HTMLFormElement | null> = $state({});

  $effect(() => {
    activeCount = auctions.filter((a) => a.status === "active").length;
    endedCount = auctions.filter((a) => a.status === "ended").length;
    totalBids = auctions.reduce((sum, a) => sum + a.bidsCount, 0);
    totalRevenue = auctions
      .filter((a) => a.status === "ended")
      .reduce((sum, a) => sum + a.currentPrice, 0);
  });
</script>

<svelte:head>
  <title>Admin Dashboard - Book Bidding</title>
</svelte:head>

{#if !page.data.sessionId}
  <Unauthentication />
{:else}
  <div class="bg-background">
    <HeaderSection
      title="Admin Dashboard"
      description="Manage your auctions and monitor activity"
      cta={{
        text: "Create Auction",
        href: `/dashboard/${page.data?.sessionId ? "create" : ""}`,
      }}
    />

    <!-- Main Content -->
    <div
      class="flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 gap-8"
    >
      <!-- Stats Grid -->
      {@render stats()}

      <!-- Tabs -->
      {#if auctions.length > 0}
        {@render tabs()}
      {:else}
        <p
          class="text-center text-muted-foreground text-lg font-medium font-koulen"
        >
          No auctions available. <br />
          Please create one to get started.
        </p>
      {/if}
    </div>
  </div>
{/if}

<!-- Stats Snippet -->
{#snippet stats()}
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
    {#each [{ label: "Total", value: auctions.length }, { label: "Active", value: activeCount }, { label: "Ended", value: endedCount }, { label: "Bids", value: totalBids, accent: true }, { label: "Revenue", value: `$${totalRevenue.toLocaleString()}` }] as stat}
      <div
        class="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center"
      >
        <p class="text-xs text-muted-foreground mb-1">{stat.label}</p>
        <p
          class={`text-xl font-koulen font-bold ${stat.accent ? "text-accent" : "text-foreground"}`}
        >
          {stat.value}
        </p>
      </div>
    {/each}
  </div>
{/snippet}

<!-- Tabs Snippet -->
{#snippet tabs()}
  <div class="bg-card border border-border rounded-lg overflow-hidden">
    <div class="flex border-b border-border">
      {#each ["overview", "active", "ended"] as tab}
        <button
          onclick={() => (selectedTab = tab)}
          class={`flex-1 px-6 py-2 font-medium transition ${
            selectedTab === tab
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          {tab === "overview"
            ? "All Auctions"
            : tab === "active"
              ? "Active"
              : "Ended"}
        </button>
      {/each}
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border">
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Title</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Author</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Starting Price</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Current Price</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Status</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Bids</th
            >
            <th
              class="px-6 py-3 text-left text-sm font-semibold text-foreground"
              >Actions</th
            >
          </tr>
        </thead>
        <tbody>
          {#each auctions.filter((a) => {
            if (selectedTab === "overview") return true;
            if (selectedTab === "active") return a.status === "active";
            return a.status === "ended";
          }) as auction (auction.id)}
            <tr class="border-b border-border hover:bg-muted/50 transition">
              <td class="px-6 py-4 text-sm text-foreground font-medium"
                >{auction.title}</td
              >
              <td class="px-6 py-4 text-sm text-muted-foreground"
                >{auction.author}</td
              >
              <td class="px-6 py-4 text-sm text-foreground"
                >${auction.startingPrice.toLocaleString()}</td
              >
              <td class="px-6 py-4 text-sm text-accent font-semibold"
                >${auction.currentPrice.toLocaleString()}</td
              >
              <td class="px-6 py-4 text-sm">
                <span
                  class={`px-3 py-1 rounded-full text-xs font-medium ${
                    auction.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : auction.status === "ending-soon"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {auction.status === "ending-soon"
                    ? "Ending Soon"
                    : auction.status.charAt(0).toUpperCase() +
                      auction.status.slice(1)}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-foreground"
                >{auction.bidsCount}</td
              >
              <td class="px-6 py-4 text-sm">
                <div class="flex gap-2">
                  <button
                    onclick={() => goto(`/dashboard/edit/${auction.id}`)}
                    class="px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded text-xs hover:opacity-90"
                  >
                    Edit
                  </button>

                  <form
                    action="?/deleteAuction"
                    method="POST"
                    bind:this={deleteFormRefs[auction.id]}
                    use:enhance={() => {
                      rowLoading[auction.id] = true;

                      return async ({ result, update }) => {
                        if (result?.status === 200) {
                          update();
                        } else {
                          console.error("Failed to delete auction");
                        }
                        rowLoading[auction.id] = false;
                      };
                    }}
                    class="inline"
                  >
                    <input type="hidden" name="auctionId" value={auction.id} />
                    <button
                      type="button"
                      onclick={() => {
                        deleteTargetId = auction.id;
                        deleteModalOpen = true;
                      }}
                      disabled={rowLoading[auction.id]}
                      class="px-3 cursor-pointer py-1 bg-destructive text-destructive-foreground rounded text-xs hover:opacity-90"
                    >
                      {rowLoading[auction.id] ? "Deleting..." : "Delete"}
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/snippet}

<!-- Delete Confirmation Modal -->
<Modal bind:open={deleteModalOpen} title="Confirm Deletion" class="w-80">
  <p class="text-sm text-muted-foreground">
    Are you sure you want to delete this auction? This action cannot be undone.
  </p>
  <div class="flex justify-end gap-3">
    <button
      class="px-3 py-1 cursor-pointer bg-muted text-foreground rounded text-xs hover:opacity-90"
      onclick={() => (deleteModalOpen = false)}
    >
      Cancel
    </button>
    <button
      class="px-3 cursor-pointer py-1 bg-destructive text-white rounded text-xs hover:opacity-90"
      onclick={() => {
        if (deleteTargetId && deleteFormRefs[deleteTargetId]) {
          deleteFormRefs[deleteTargetId]?.requestSubmit();
        }
        deleteModalOpen = false;
      }}
    >
      Delete
    </button>
  </div>
</Modal>
