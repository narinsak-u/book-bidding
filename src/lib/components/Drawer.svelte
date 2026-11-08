<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		children: Snippet;
	}

	let { open = $bindable(), children }: Props = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-90">
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
			onclick={close}
			aria-label="Close drawer"
		></button>

		<!-- Drawer Content - slides in from right -->
		<div
			class="absolute right-0 top-0 h-full w-64 bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-out"
		>
			<div class="flex items-center justify-between p-4 border-b border-outline-variant/15">
				<span class="font-headline font-bold text-primary">Menu</span>
				<button
					class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
					onclick={close}
					aria-label="Close"
				>
					<Icon icon="close" />
				</button>
			</div>
			<div class="p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}