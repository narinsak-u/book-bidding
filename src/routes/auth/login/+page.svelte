<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/auth-client";
  import type { PageProps } from "./$types";
  import Icon from "$lib/components/Icon.svelte";

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
        errorCallbackURL: `/auth/login?${new URLSearchParams({ error: "central-identity", next: data.callbackURL })}`,
      });
    } catch {
      error = true;
      loading = false;
    }
  }

  onMount(() => {
    if (!data.error && !data.manual) void signIn();
  });
</script>

<svelte:head>
  <title>Sign In - Book Bidding</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-b from-primary/10 to-background flex items-center justify-center px-4 py-12">
  <div class="w-full max-w-md">
    <div class="bg-surface-container-lowest border border-outline/20 text-on-surface rounded-xl p-8 shadow-lg">
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon icon="menu_book" class="text-3xl text-on-primary" />
        </div>
        <h1 class="text-3xl font-headline font-bold text-on-surface mb-2">Welcome back</h1>
        <p class="text-on-surface-variant">Sign in securely with Central Identity</p>
      </div>

      {#if error || data.error}
        <p class="mt-4 text-destructive" role="alert">Central Identity sign-in failed. Try again, or use Reviewed Recovery if you have an existing account.</p>
      {/if}
      <button
        type="button"
        onclick={signIn}
        disabled={loading}
        class="w-full bg-secondary text-on-secondary py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
      >
        {loading ? "Redirecting…" : "Continue with Central Identity"}
      </button>
      <p class="mt-5 text-sm text-on-surface-variant text-center">
        Existing accounts without a Central Identity link require
        <a href="/account/identity/recovery" class="underline">Reviewed Recovery</a>.
      </p>
    </div>
  </div>
</div>
