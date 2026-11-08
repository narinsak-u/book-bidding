<script lang="ts">
  import { goto } from "$app/navigation";

  interface Props {
    title: string;
    description: string;
    cta?: {
      text: string;
      href: string;
    };
  }

  let {
    title,
    description,
    cta = { text: "Back to Dashboard", href: "/dashboard" },
  }: Props = $props();
</script>

<div
  class="bg-linear-to-r from-primary/10 to-accent/10 border-b border-border py-10"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-4xl font-bold text-foreground">{title}</h1>
        <p class="text-muted-foreground mt-2">{description}</p>
      </div>
      {#if cta}
        <button
          onclick={() => goto(cta.href)}
          class="hidden md:inline-block px-6 py-2 cursor-pointer bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
        >
          {cta.text}
        </button>
      {/if}
    </div>
  </div>
</div>
