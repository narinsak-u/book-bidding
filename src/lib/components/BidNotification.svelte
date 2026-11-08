<script lang="ts">
  import { realtime } from "$lib/stores/realtime";

  interface Notification {
    id: string;
    message: string;
    type: "info" | "success" | "warning";
    timestamp: string;
    auctionId: string;
  }

  let notifications: Notification[] = $state([]);

  $effect(() => {
    const unsubscribe = realtime.updates.subscribe((updates) => {
      if (updates.length > 0) {
        const latest = updates[0];
        addNotification(
          `${latest.bidder} biding $${latest.amount.toLocaleString()} on ${latest.auctionName}`,
          "info",
          latest.auctionId
        );
      }
    });

    return () => unsubscribe();
  });

  function addNotification(
    message: string,
    type: "info" | "success" | "warning" = "info",
    auctionId: string
  ) {
    const id = Math.random().toString(36);
    notifications.push({
      id,
      message,
      type,
      auctionId,
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(() => {
      notifications = notifications.filter((n) => n.id !== id);
    }, 5000);
  }

  function removeNotification(id: string) {
    notifications = notifications.filter((n) => n.id !== id);
  }
</script>

<!-- Notification Container -->
<div class="fixed bottom-4 right-4 z-40 space-y-2 max-w-sm">
  {#each notifications as notification (notification.id)}
    <div
      class={`p-4 rounded-lg border animate-in slide-in-from-right-4 fade-in ${
        notification.type === "success"
          ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
          : notification.type === "warning"
            ? "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200"
            : "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
      }`}
    >
      <div class="flex justify-between items-start gap-2">
        <a class="cursor-pointer" href={`/auctions/${notification.auctionId}`}>
          <p class="text-sm font-medium">{notification.message}</p>
          <p class="text-xs opacity-75 mt-1">{notification.timestamp}</p>
        </a>
        <button
          onclick={() => removeNotification(notification.id)}
          class="text-lg opacity-50 hover:opacity-100 leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  {/each}
</div>
