<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
</script>

<svelte:head>
  <title>Payment Failed</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center px-4 py-12">
  <div class="bg-surface-container-lowest border border-outline/20 rounded-xl p-8 text-center max-w-md w-full">
    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <Icon icon="error" class="text-4xl text-red-600 dark:text-red-400" />
    </div>
    <h1 class="text-2xl font-headline mb-2 text-on-surface">Payment Failed</h1>
    <p class="text-on-surface-variant mb-6">Your payment was canceled or could not be completed.</p>
    <div class="flex gap-3 justify-center">
      <a href="/user/sales" class="px-5 py-2.5 cursor-pointer bg-primary text-on-primary rounded-lg hover:opacity-90 transition font-medium">Try Again</a>
      <a href="/" class="px-5 py-2.5 cursor-pointer bg-surface-container border border-outline/20 text-on-surface rounded-lg hover:bg-surface-container-high transition font-medium">Home</a>
    </div>
  </div>
</div>