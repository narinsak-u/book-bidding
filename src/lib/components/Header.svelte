<script lang="ts">
  import Icon from "./Icon.svelte";
  import { goto } from "$app/navigation";

  interface Props {
    title: string;
    description: string;
    cta?: {
      text: string;
      href: string;
      icon?: string;
    };
  }

  let {
    title,
    description,
    cta = { text: "Back to Dashboard", href: "/dashboard" },
  }: Props = $props();
</script>

<div class="bg-linear-to-r from-primary/10 to-secondary/10 border-b border-outline/20 py-10">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-4xl font-headline font-bold text-on-surface">{title}</h1>
        <p class="text-on-surface-variant mt-2">{description}</p>
      </div>
      {#if cta}
        <button
          onclick={() => goto(cta.href)}
          class="hidden md:inline-flex items-center gap-2 px-6 py-2.5 cursor-pointer bg-primary text-on-primary rounded-lg hover:opacity-90 transition font-medium"
        >
          {cta.text}
          {#if cta.icon}
            <Icon icon={cta.icon} class="text-lg" />
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>
