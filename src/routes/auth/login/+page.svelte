<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/auth-client";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let loading = $state(false);
  let error = $state(false);

  async function signIn() {
    loading = true;
    error = false;
    try {
      await authClient.signIn.social({
        provider: "central-identity",
        callbackURL: data.callbackURL,
        errorCallbackURL: "/auth/login?error=central-identity",
      });
    } catch {
      error = true;
      loading = false;
    }
  }

  onMount(() => {
    if (!data.error) void signIn();
  });
</script>

<svelte:head>
  <title>Sign In - Book Bidding</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-b from-primary/10 to-background flex items-center justify-center px-4">
  <main class="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg">
    <h1 class="text-3xl font-koulen">Sign in to Book Bidding</h1>
    <p class="mt-3 text-muted-foreground">Continue securely with Central Identity.</p>
    {#if error || data.error}
      <p class="mt-4 text-destructive" role="alert">Central Identity sign-in failed. Try again, or use Reviewed Recovery if you have an existing account.</p>
    {/if}
    <button
      type="button"
      onclick={signIn}
      disabled={loading}
      class="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : "Continue with Central Identity"}
    </button>
    <p class="mt-5 text-sm text-muted-foreground">
      Existing accounts without a Central Identity link require
      <a href="/account/identity/recovery" class="underline">Reviewed Recovery</a>.
    </p>
  </main>
</div>
