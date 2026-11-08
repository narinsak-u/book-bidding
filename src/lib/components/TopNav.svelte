<script lang="ts">
	import Icon from "./Icon.svelte";

	interface NavItem {
		label: string;
		href: string;
		active?: boolean;
	}

	const navItems: NavItem[] = [
		{ label: "Browse", href: "/auctions" },
		{ label: "Live Auctions", href: "/auctions", active: true },
		{ label: "Collections", href: "/collections" },
		{ label: "Scholarly Insights", href: "/insights" }
	];

	let searchQuery = $state("");
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest dark:bg-surface-container-high border-b border-outline/20 shadow-sm">
	<!-- Main Nav Bar -->
	<div class="flex items-center justify-between px-6 py-4">
		<!-- Brand -->
		<a href="/" class="text-xl font-headline font-bold text-primary tracking-tight">
			The Antiquarian
		</a>

		<!-- Navigation Links -->
		<nav class="hidden md:flex items-center gap-8">
			{#each navItems as item}
				<a
					href={item.href}
					class="text-sm font-medium transition-colors relative pb-1
						{item.active
							? 'text-primary border-b-2 border-primary'
							: 'text-on-surface-variant hover:text-on-surface'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Search Bar -->
		<div class="hidden md:flex items-center gap-3 bg-surface-container rounded-lg px-4 py-2.5 flex-1 max-w-sm mx-6">
			<Icon icon="search" class="text-lg text-on-surface-variant" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search archives..."
				class="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/60 flex-1"
			/>
		</div>

		<!-- Right Actions -->
		<div class="flex items-center gap-3">
			<button class="relative p-2 cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container">
				<Icon icon="notifications" class="text-xl" />
			</button>
			<a href="/user/activity" class="p-2 cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container">
				<Icon icon="account_circle" class="text-xl" />
			</a>
			<a
				href="/auctions"
				class="px-5 py-2 cursor-pointer bg-primary text-on-primary rounded-md hover:opacity-90 transition text-sm font-medium"
			>
				Place Bid
			</a>
		</div>
	</div>

	<!-- Spacer for fixed header -->
	<div class="h-[1px]"></div>
</header>

<!-- Spacer to push content below fixed header -->
<div class="h-16"></div>
