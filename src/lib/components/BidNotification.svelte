<script lang="ts">
  import Icon from "./Icon.svelte";
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

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200";
      case "warning":
        return "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200";
      default:
        return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "check_circle";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };
</script>

<div class="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
  {#each notifications as notification (notification.id)}
    <div
      class={`p-4 rounded-lg border animate-in slide-in-from-right-4 fade-in duration-300 shadow-lg ${getTypeStyles(notification.type)}`}
    >
      <div class="flex items-start gap-3">
        <Icon icon={getTypeIcon(notification.type)} class="text-xl shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <a 
            class="cursor-pointer hover:underline block" 
            href={`/auctions/${notification.auctionId}`}
          >
            <p class="text-sm font-medium break-words">{notification.message}</p>
            <p class="text-xs opacity-75 mt-1">{notification.timestamp}</p>
          </a>
        </div>
        <button
          onclick={() => removeNotification(notification.id)}
          class="text-lg opacity-50 hover:opacity-100 leading-none shrink-0"
        >
          <Icon icon="close" />
        </button>
      </div>
    </div>
  {/each}
</div>