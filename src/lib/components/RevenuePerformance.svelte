<script lang="ts">
	import Icon from "./Icon.svelte";

	interface MonthlyData {
		month: string;
		value: number;
	}

	let {
		data = [
			{ month: "JUL", value: 35 },
			{ month: "AUG", value: 55 },
			{ month: "SEP", value: 40 },
			{ month: "OCT", value: 70 },
			{ month: "NOV", value: 60 },
			{ month: "DEC", value: 45 }
		],
		averageRoi = "2.4x",
		inventoryTurnover = "18.2 Days"
	}: {
		data?: MonthlyData[];
		averageRoi?: string;
		inventoryTurnover?: string;
	} = $props();

	const maxValue = $derived(Math.max(...data.map((d) => d.value)));
</script>

<div class="bg-surface-container-lowest border border-outline/10 rounded-xl p-6">
	<h3 class="text-lg font-headline font-semibold text-on-surface mb-6">Revenue Performance</h3>

	<!-- Bar Chart -->
	<div class="flex items-end gap-3 h-40 mb-4 px-2">
		{#each data as entry}
			<div class="flex flex-col items-center gap-2 flex-1">
				<div
					class="w-full rounded-t-sm transition-all duration-300 {entry.month === 'NOV'
						? 'bg-primary'
						: 'bg-surface-container-highest'}"
					style="height: {(entry.value / maxValue) * 100}%"
				></div>
				<span class="text-[10px] text-on-surface-variant uppercase">{entry.month}</span>
			</div>
		{/each}
	</div>

	<!-- Metrics -->
	<div class="border-t border-outline/10 pt-4 mt-4 space-y-2">
		<div class="flex justify-between text-sm">
			<span class="text-on-surface-variant">Average ROI</span>
			<span class="font-semibold text-on-surface">{averageRoi}</span>
		</div>
		<div class="flex justify-between text-sm">
			<span class="text-on-surface-variant">Inventory Turnover</span>
			<span class="font-semibold text-on-surface">{inventoryTurnover}</span>
		</div>
	</div>
</div>
