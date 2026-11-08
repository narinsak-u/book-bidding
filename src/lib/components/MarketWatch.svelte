<script lang="ts">
  let {
    title = "Market Watch",
    message = "Victorian first-editions are currently seeing a 15% surge in valuation.",
    buttonText = "Generate Report",
  }: {
    title?: string;
    message?: string;
    buttonText?: string;
  } = $props();
</script>

<div
  class="bg-[var(--surface-container-dark)] text-on-surface rounded-xl p-6 relative overflow-hidden"
>
  <!-- Decorative background -->
  <div class="absolute top-0 right-0 w-32 h-32 opacity-5">
    <svg viewBox="0 0 100 100" class="w-full h-full" fill="currentColor">
      <circle cx="80" cy="20" r="40" />
      <circle cx="20" cy="80" r="30" />
    </svg>
  </div>

  <div class="relative z-10">
    <h3 class="text-lg font-headline font-semibold mb-3">{title}</h3>
    <p class="text-sm text-on-surface-variant/90 mb-6 leading-relaxed">
      {message}
    </p>
    <button
      class="w-full px-4 py-3 bg-on-surface text-surface rounded-md font-medium text-sm hover:opacity-90 transition cursor-pointer"
    >
      {buttonText}
    </button>
  </div>
</div>
