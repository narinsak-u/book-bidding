<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import AuthForm from "$lib/components/AuthForm.svelte";
  import { env as publicEnv } from "$env/dynamic/public";

  let loading = $state(false);
  let providerLoading: null | "google" | "github" | "central-identity" = $state(null);
  const centralIdentityUrl = publicEnv.PUBLIC_CENTRAL_IDENTITY_URL || "https://auth.127.0.0.1.nip.io";

  const signInWithProvider = async (provider: "google" | "github" | "central-identity") => {
    loading = true;
    providerLoading = provider;

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: provider === "central-identity" ? "/dashboard" : "/",
      });
    } catch (e) {
      console.error("Sign in with provider failed:", e);
    } finally {
      loading = false;
      providerLoading = null;
    }
  };
</script>

<svelte:head>
  <title>Sign In - Book Bidding</title>
</svelte:head>

<div
  class="min-h-screen bg-linear-to-b from-primary/10 to-background flex items-center justify-center px-4"
>
  <div class="w-full max-w-md">
    <div
      class="bg-primary/10 border border-primary/20 text-primary rounded-lg p-4 mb-4 text-center text-sm"
    >
      <p class="font-medium mb-1">Demo Account Access</p>
      <p>
        Email: <strong>admin@gmail.com</strong> &bull; Password:
        <strong>123456789</strong>
      </p>
    </div>
    <div class="bg-card border border-border rounded-lg p-8 shadow-lg">
      <div class="text-center mb-4">
        <div
          class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-primary-foreground font-bold text-xl">📚</span>
        </div>
        <h1 class="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
        <p class="text-muted-foreground">
          Sign in to your book bidding account
        </p>
      </div>

      <div class="space-y-3 mt-6">
        <button
          type="button"
          disabled={loading}
          onclick={() => signInWithProvider("central-identity")}
          class="w-full flex items-center justify-center cursor-pointer bg-card border border-border text-foreground py-2 rounded-lg font-medium hover:bg-muted/50 disabled:opacity-50 transition"
        >
          {loading && providerLoading === "central-identity"
            ? "Loading..."
            : "Continue with Central Identity"}
        </button>
        <a href={centralIdentityUrl} class="block py-2 text-center text-sm text-primary underline underline-offset-2">
          Manage Central Identity / sign out centrally
        </a>
        <button
          type="button"
          disabled={loading}
          onclick={() => signInWithProvider("google")}
          class="w-full flex items-center justify-center cursor-pointer bg-card border border-border text-foreground py-2 rounded-lg font-medium hover:bg-muted/50 disabled:opacity-50 transition"
        >
          <span class="inline-flex items-center justify-center w-5 h-5 me-2">
            <svg viewBox="0 0 48 48" class="w-5 h-5" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.9 0-12.5-5.6-12.5-12.5S17.1 11 24 11c3.2 0 6.1 1.2 8.3 3.3l5.7-5.7C34.9 5.1 29.7 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.2-.1-2.4-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.9 16.8 19.1 14 24 14c3.2 0 6.1 1.2 8.3 3.3l5.7-5.7C34.9 5.1 29.7 3 24 3 15.5 3 8.3 7.7 4.6 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 45c5.7 0 10.9-2.1 14.9-5.6l-6.9-5.6C30 35.6 27.2 36.5 24 36.5c-5.3 0-9.8-3.4-11.4-8.1l-6.7 5.2C8.9 40.8 15.9 45 24 45z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3.1-3.4 5.7-6.2 7.2l6.9 5.6C39 38.9 42 32.8 42 26c0-1.9-.3-3.8-.8-5.5z"
              />
            </svg>
          </span>
          {loading && providerLoading === "google"
            ? "Loading..."
            : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={loading}
          onclick={() => signInWithProvider("github")}
          class="w-full flex items-center justify-center cursor-pointer bg-card border border-border text-foreground py-2 rounded-lg font-medium hover:bg-muted/50 disabled:opacity-50 transition"
        >
          <span class="inline-flex items-center justify-center w-5 h-5 me-2">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-5 h-5"
              aria-hidden="true"
            >
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.98 0-1.32.47-2.4 1.24-3.25-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.24.96-.27 2-.4 3.03-.41 1.03.01 2.07.14 3.03.41 2.29-1.56 3.29-1.24 3.29-1.24.66 1.66.25 2.88.12 3.18.77.85 1.24 1.93 1.24 3.25 0 4.65-2.8 5.68-5.48 5.98.43.37.81 1.1.81 2.22 0 1.6-.01 2.88-.01 3.27 0 .32.21.7.82.58C20.57 21.8 24 17.31 24 12 24 5.37 18.63 0 12 0z"
              />
            </svg>
          </span>
          {loading && providerLoading === "github"
            ? "Loading..."
            : "Continue with GitHub"}
        </button>
      </div>

      <!-- Or continue with -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t border-border"></span>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <AuthForm />

      <div class="mt-6 text-center">
        <p class="text-muted-foreground text-sm">
          Don't have an account?
          <span class="text-primary font-medium">Create one</span>
        </p>
      </div>
    </div>
  </div>
</div>
