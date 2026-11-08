<script lang="ts">
  import Icon from "./Icon.svelte";

  interface StatCard {
    label: string;
    value: string;
    subtitle?: string;
    subtitleClass?: string;
    dark?: boolean;
    icon?: string;
  }

  let { cards }: { cards: StatCard[] } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  {#each cards as card}
    <div
      class="rounded-xl p-6 relative overflow-hidden border border-outline/10
				{card.dark
        ? 'bg-[var(--surface-container-dark)] text-on-surface'
        : 'bg-surface-container-lowest'}"
    >
      <p
        class="text-xs uppercase tracking-wider text-on-surface-variant/70 mb-3"
      >
        {card.label}
      </p>
      <p class="text-3xl font-headline font-semibold text-on-surface mb-3">
        {card.value}
      </p>
      {#if card.subtitle}
        <p
          class="text-sm font-medium {card.subtitleClass ||
            'text-on-surface-variant'}"
        >
          {#if card.subtitle.includes("+")}
            <Icon icon="trending_up" class="text-sm inline mr-1" />
          {/if}
          {card.subtitle}
        </p>
      {/if}
      {#if card.icon}
        <div class="absolute right-4 bottom-4 opacity-10">
          <Icon icon={card.icon} class="text-6xl" />
        </div>
      {/if}
    </div>
  {/each}
</div>
