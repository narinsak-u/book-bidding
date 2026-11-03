<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let linking = $state(false);
	let linked = $state(data.linked);
	let errorMessage = $state('');
	$effect(() => {
		if (linked || data.linkError) return;
		void authClient.listAccounts().then(({ data: accounts }) => {
			linked = accounts?.some((account) => account.providerId === 'central-identity') ?? false;
		});
	});

	const linkCentralIdentity = async () => {
		linking = true;
		errorMessage = '';
		try {
			const result = await authClient.linkSocial({
				provider: 'central-identity',
				callbackURL: '/account/identity?linked=1',
				errorCallbackURL: '/account/identity?error=link',
			});
			if (result.error) throw new Error(result.error.message);
		} catch {
			errorMessage = 'Central Identity could not be linked. If it is already linked to another Application User, stop and request reviewed recovery; do not create another account.';
			linking = false;
		}
	};
</script>

<svelte:head>
	<title>Identity Link - Book Bidding</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-3xl font-bold">Central Identity</h1>
	<p class="mt-4">Link your Central Identity to this signed-in Book Bidding user. You will authenticate with Central Identity separately. Your existing Application User and its bids, purchases, and permissions remain unchanged.</p>
	{#if linked}
		<p role="status" class="mt-6">Identity linked to this Application User.</p>
	{:else if data.linkError}
		<p role="alert" class="mt-6 text-red-700">Central Identity could not be linked. If it is already linked to another Application User, stop and request reviewed recovery; do not create another account.</p>
	{:else}
		<button type="button" disabled={linking} onclick={linkCentralIdentity} class="mt-6 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
			{linking ? 'Continue to Central Identity…' : 'Link Central Identity'}
		</button>
	{/if}
	{#if errorMessage}
		<p role="alert" class="mt-4 text-red-700">{errorMessage}</p>
	{/if}
</main>
