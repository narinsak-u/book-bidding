<script lang="ts">
  import { page } from "$app/state";
  import type { PageProps } from "./$types";
  import { FALLBACK_IMAGE } from "./dashboard/shared/constants";
  import Icon from "$lib/components/Icon.svelte";
  import AuctionCard from "$lib/components/AuctionCard.svelte";

  let { data }: PageProps = $props();

  const stats = {
    transactions: data.transactionCount,
    rareBooks: data.books.length,
    happyCollectors: data.userCount,
    totalSales: data.books.reduce((acc, book) => acc + (book.currentBid || 0), 0),
  };

  const activeBooks = data.books
    .filter((b) => {
      const end = new Date(b.endDate).getTime();
      const now = Date.now();
      return end > now;
    })
    .sort((a, b) => {
      const endA = new Date(a.endDate).getTime();
      const endB = new Date(b.endDate).getTime();
      return endA - endB;
    })
    .slice(0, 3);
</script>

<svelte:head>
  <title>The Antiquarian | Rare Literary Treasures</title>
</svelte:head>

<div class="bg-background overflow-hidden">
  {@render hero()}
  {@render activeCollections()}
  {@render howItWorks()}
  {@render cta()}
</div>

{#snippet hero()}
  <section class="relative pt-20 pb-40 px-4 md:px-8 max-w-screen-2xl mx-auto">
    <!-- Decorative Quote Mark -->
    <div class="absolute top-0 right-[20%] -z-10 opacity-5">
      <span class="font-headline text-[30rem] leading-none text-primary italic select-none pointer-events-none">"</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-10">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 bg-secondary px-3 py-1 rounded shadow-lg shadow-secondary/20">
            <div class="w-1.5 h-1.5 rounded-full bg-on-secondary animate-pulse"></div>
            <span class="font-label font-bold text-[10px] uppercase tracking-widest text-on-secondary">Masterpiece Auction</span>
          </div>

          <div class="space-y-2">
            <h1 class="text-7xl md:text-9xl font-headline font-black text-primary leading-[0.85] tracking-tighter">
              The Great <br /> <span class="text-secondary italic">Gatsby.</span>
            </h1>
          </div>

          <p class="text-lg font-body text-on-surface-variant max-w-lg leading-relaxed">
            A pristine 1925 first edition, first issue, featuring the iconic Francis Cugat dust jacket. An unparalleled artifact of the Jazz Age, preserved in exceptional condition for the discerning collector.
          </p>
        </div>

        <div class="flex flex-wrap gap-4">
          <a
            href="/auctions"
            class="px-10 py-4 bg-primary text-on-primary rounded-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 font-headline font-bold uppercase tracking-widest text-xs flex items-center gap-3"
          >
            Start Bidding
            <Icon icon="trending_up" class="text-lg" />
          </a>
          <button
            class="px-10 py-4 border-2 border-outline-variant/30 text-primary rounded-lg hover:bg-surface-container-low transition-all duration-500 font-headline font-bold uppercase tracking-widest text-xs"
          >
            View Provenance
          </button>
        </div>

        <div class="flex gap-16 pt-8 border-t border-outline-variant/10">
          <div class="flex flex-col">
            <span class="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Current High Bid</span>
            <span class="font-headline font-black text-4xl text-primary">$184,200.00</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Ends In</span>
            <span class="font-headline font-black text-4xl text-secondary">04:12:55</span>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5 relative">
        <!-- Main Hero Image -->
        <div class="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-1000">
          <div class="aspect-[4/5] rounded-xl overflow-hidden shadow-[30px_30px_60px_-15px_rgba(0,0,0,0.3)] border-b-8 border-primary">
            <img src={FALLBACK_IMAGE} alt="The Great Gatsby First Edition" class="w-full h-full object-cover" />
          </div>

          <!-- Quality Tag Overlap -->
          <div class="absolute bottom-12 -right-8 glass-overlay p-6 rounded-xl border border-white/20 shadow-2xl max-w-[280px] hidden md:block">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="bg-secondary text-on-secondary text-[8px] font-bold px-1.5 py-0.5 rounded">EXCELLENT</div>
              </div>
              <Icon icon="verified" class="text-secondary text-lg" />
            </div>
            <p class="text-xs font-body italic text-primary leading-relaxed mb-4">
              "So we beat on, boats against the current, borne back ceaselessly into the past."
            </p>
            <div class="flex items-center gap-2 border-t border-outline-variant/10 pt-3">
              <Icon icon="signature" class="text-sm text-outline" />
              <span class="text-[9px] font-label font-bold text-outline uppercase">Signed by F. Scott Fitzgerald</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
{/snippet}

{#snippet activeCollections()}
  <section class="py-24 px-4 md:px-8 max-w-screen-2xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
      <div class="space-y-2">
        <h2 class="text-5xl font-headline font-black text-primary tracking-tighter">ACTIVE COLLECTIONS</h2>
        <p class="text-sm font-body text-on-surface-variant">Curated rare artifacts currently accepting live bids.</p>
      </div>
      <a href="/auctions" class="group flex items-center gap-3 font-headline font-bold text-xs uppercase tracking-[0.2em] text-primary hover:text-secondary transition-colors">
        Browse Full Archive
        <Icon icon="arrow_forward" class="group-hover:translate-x-2 transition-transform" />
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {#each activeBooks as book, i (book.id)}
        <div class={i === 1 ? 'lg:translate-y-16' : ''}>
          <AuctionCard auction={book as any} />
        </div>
      {/each}
    </div>
  </section>
{/snippet}

{#snippet howItWorks()}
  <section class="py-32 bg-surface-container-low" id="how-it-works">
    <div class="max-w-screen-2xl mx-auto px-4 md:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
        <div class="lg:col-span-5 grid grid-cols-2 gap-4">
          <div class="space-y-4">
            <div class="aspect-square rounded-xl overflow-hidden shadow-lg grayscale hover:grayscale-0 transition-all duration-700">
              <img src={FALLBACK_IMAGE} alt="Process 1" class="w-full h-full object-cover" />
            </div>
            <div class="bg-secondary p-8 rounded-xl flex flex-col justify-end min-h-[160px]">
              <Icon icon="language" class="text-3xl text-on-secondary mb-4" />
              <span class="font-headline font-bold text-on-secondary text-sm uppercase tracking-widest">Global Live Bidding</span>
            </div>
          </div>
          <div class="space-y-4">
            <div class="bg-primary-container p-8 rounded-xl flex flex-col justify-end min-h-[160px]">
              <Icon icon="verified_user" class="text-3xl text-on-primary-container mb-4" />
              <span class="font-headline font-bold text-on-primary-container text-sm uppercase tracking-widest">Certified Provenance</span>
            </div>
            <div class="aspect-[3/4] rounded-xl overflow-hidden shadow-lg grayscale hover:grayscale-0 transition-all duration-700">
              <img src={FALLBACK_IMAGE} alt="Process 2" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div class="lg:col-span-7 space-y-16">
          <h2 class="text-6xl font-headline font-black text-primary tracking-tighter leading-none uppercase">
            The Scholarly Path <br /> to Ownership
          </h2>

          <div class="space-y-12">
            {#each [{ num: '01', title: 'Curated Authentication', desc: 'Every artifact undergoes rigorous physical examination by our Senior Curators to verify edition, condition, and provenance history.' }, { num: '02', title: 'Live Auction Dynamics', desc: 'Participate in high-stakes bidding sessions where digital and floor bidders compete in real-time for exclusive literary treasures.' }, { num: '03', title: 'Secured Archival Delivery', desc: 'Successful acquisitions are climate-controlled packed and shipped via white-glove logistics partners specialized in rare goods.' }] as step}
              <div class="flex gap-8 group">
                <span class="font-headline font-bold text-xs text-secondary bg-secondary/5 w-10 h-10 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-500">
                  {step.num}
                </span>
                <div class="space-y-2">
                  <h3 class="font-headline font-black text-2xl text-primary tracking-tight">{step.title}</h3>
                  <p class="font-body text-on-surface-variant leading-relaxed max-w-xl">{step.desc}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>
{/snippet}

{#snippet cta()}
  <section class="relative py-32 bg-primary overflow-hidden">
    <!-- Texture overlay -->
    <div class="absolute inset-0 opacity-5 pointer-events-none">
      <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_2px,transparent_1px)] [background-size:32px_32px]"></div>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 text-center space-y-12">
      <h2 class="text-6xl md:text-8xl font-headline font-black text-on-primary tracking-tighter leading-none uppercase">
        Start Your Legacy <br /> Collection
      </h2>
      <p class="text-lg font-body text-on-primary/50 max-w-2xl mx-auto">
        Join an elite community of bibliophiles and scholars. Gain access to private previews and exclusive live auction events.
      </p>
      <div class="flex flex-wrap gap-4 items-center justify-center">
        <a
          href={page.data.sessionId ? "/dashboard/create" : "/auth/login"}
          class="px-12 py-5 bg-secondary text-on-secondary rounded-lg hover:shadow-[0_20px_40px_-10px_rgba(175,40,0,0.5)] transition-all duration-500 transform hover:-translate-y-1 font-headline font-bold uppercase tracking-widest text-sm"
        >
          Start Collecting
        </a>
        <button
          class="px-12 py-5 border-2 border-on-primary/30 text-on-primary rounded-lg hover:bg-on-primary/10 transition-all duration-500 font-headline font-bold uppercase tracking-widest text-sm"
        >
          Request Catalog
        </button>
      </div>
    </div>
  </section>
{/snippet}
