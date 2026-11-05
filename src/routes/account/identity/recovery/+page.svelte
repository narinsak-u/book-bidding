<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Recover Identity Link - Book Bidding</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-3xl font-bold">Recover an Identity Link</h1>
	{#if data.complete}
		<p role="status" class="mt-6">Identity Link established. You are not signed in to Book Bidding. Continue with Central Identity to start a normal Application Session.</p>
	{:else}
		<p class="mt-4">Prove control of the existing Application User with its Book Bidding password or the Google/GitHub provider already linked to it. You will then sign in to Central Identity separately. Email matching alone never proves ownership. Recovery does not create an Application Session.</p>
		<form method="POST" action="/api/identity-recovery" class="mt-6 space-y-4">
			<label class="block">
				<span class="mb-1 block">Existing Book Bidding email</span>
				<input name="email" type="email" autocomplete="username" required class="w-full rounded border border-border bg-background px-3 py-2" />
			</label>
			<label class="block">
				<span class="mb-1 block">Existing Book Bidding password</span>
				<input name="password" type="password" autocomplete="current-password" required class="w-full rounded border border-border bg-background px-3 py-2" />
			</label>
			<button type="submit" class="rounded bg-primary px-4 py-2 text-primary-foreground">Continue with password</button>
		</form>
		<h2 class="mt-8 text-xl font-semibold">Or use a provider already linked to this user</h2>
		<p class="mt-2 text-sm text-muted-foreground">Use the same Google or GitHub account previously linked to this Book Bidding user.</p>
		<div class="mt-4 flex gap-3">
			<form method="POST" action="/api/identity-recovery/provider">
				<input type="hidden" name="provider" value="google" />
				<button type="submit" class="rounded border border-border px-4 py-2">Prove with Google</button>
			</form>
			<form method="POST" action="/api/identity-recovery/provider">
				<input type="hidden" name="provider" value="github" />
				<button type="submit" class="rounded border border-border px-4 py-2">Prove with GitHub</button>
			</form>
		</div>
	{/if}
</main>
