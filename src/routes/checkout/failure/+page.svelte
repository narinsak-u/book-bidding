<svelte:head>
  <title>Payment Failed</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center px-4">
  <div
    class="bg-card border border-border rounded-lg p-8 text-center max-w-md w-full"
  >
    <h1 class="text-2xl font-koulen mb-2 text-foreground">Payment Failed</h1>
    <p class="text-muted-foreground mb-6">
      Your payment was canceled or could not be completed.
    </p>
    <div class="flex gap-3 justify-center">
      <a
        href="/user/sales"
        class="font-koulen px-4 py-2 cursor-pointer bg-primary text-primary-foreground rounded-lg"
        >Try Again</a
      >
      <a
        href="/"
        class="font-koulen px-4 py-2 cursor-pointer bg-card border border-border text-foreground rounded-lg"
        >Home</a
      >
    </div>
  </div>
</div>
