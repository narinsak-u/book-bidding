<script lang="ts">
	interface Props {
		icon: string;
		filled?: boolean;
		class?: string;
	}

	let { icon, filled = false, class: className = '' }: Props = $props();
</script>

<span
	class="material-symbols-outlined {className}"
	style="font-variation-settings: 'FILL' {filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24"
>
	{icon}
</span>