<script lang="ts">
	interface Props {
		text: string;
		rotated?: boolean;
	}

	let { text, rotated = false }: Props = $props();

	const isHighlighted = text === 'Excellent' || text === 'Museum Grade';
</script>

<span
	class="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-label
		{isHighlighted ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-primary'}
		{rotated ? 'transform rotate-3 shadow-lg' : ''}"
>
	{text}
</span>