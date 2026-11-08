<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<footer class="bg-primary w-full py-12 mt-auto flex flex-col items-center gap-6 px-12 border-t border-primary-container">
	<div class="flex flex-col md:flex-row gap-8 items-center justify-between w-full max-w-screen-2xl">
		<div class="flex flex-col gap-2">
			<span class="font-headline text-secondary font-bold text-2xl uppercase tracking-tighter">
				Book Bidding
			</span>
			<p class="text-on-primary/60 text-sm font-body">© {new Date().getFullYear()} Book Bidding. All rights reserved.</p>
		</div>
		<nav class="flex flex-wrap gap-6 justify-center">
			<a class="text-on-primary/60 hover:text-secondary transition-colors font-body text-sm tracking-wide" href="/auctions">
				Terms of Sale
			</a>
			<a class="text-on-primary/60 hover:text-secondary transition-colors font-body text-sm tracking-wide" href="/auctions">
				Provenance Guarantee
			</a>
			<a class="text-on-primary underline decoration-secondary font-body text-sm tracking-wide" href="/auctions">
				Privacy Policy
			</a>
			<a class="text-on-primary/60 hover:text-secondary transition-colors font-body text-sm tracking-wide" href="/auctions">
				Auction Calendar
			</a>
		</nav>
	</div>
</footer>