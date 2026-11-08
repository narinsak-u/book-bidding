<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		title?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(), title, children, footer }: Props = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[100] flex items-center justify-center">
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
			onclick={close}
			aria-label="Close modal"
		></button>

		<!-- Modal Content -->
		<div
			class="relative bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto glass-overlay border border-white/20"
		>
			{#if title}
				<div class="flex items-center justify-between p-6 border-b border-outline-variant/15">
					<h2 class="text-xl font-headline font-bold text-primary">{title}</h2>
					<button
						class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
						onclick={close}
						aria-label="Close"
					>
						<Icon icon="close" />
					</button>
				</div>
			{/if}
			<div class="p-6">
				{@render children()}
			</div>
			{#if footer}
				<div class="flex justify-end gap-3 p-6 border-t border-outline-variant/15">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}