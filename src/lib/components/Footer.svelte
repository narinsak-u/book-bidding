<script lang="ts">
  interface FooterLink {
    label: string;
    href: string;
  }

  const links: FooterLink[] = [
    { label: "Terms of Sale", href: "/terms" },
    { label: "Provenance Guarantee", href: "/provenance" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Auction Calendar", href: "/calendar" },
  ];
</script>

<footer
  class="bg-[var(--surface-container-dark)] text-on-surface-variant mt-16"
>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
    >
      <!-- Brand -->
      <div>
        <p
          class="text-lg font-headline font-bold text-primary tracking-tight uppercase"
        >
          The Antiquarian
        </p>
        <p class="text-sm text-on-surface-variant/70 mt-1">
          &copy; 2024 The Modern Antiquarian. All artifacts curated for
          excellence.
        </p>
      </div>

      <!-- Links -->
      <nav class="flex flex-wrap gap-6">
        {#each links as link}
          <a
            href={link.href}
            class="text-sm text-on-surface-variant/80 hover:text-on-surface transition-colors"
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </div>
  </div>
</footer>
