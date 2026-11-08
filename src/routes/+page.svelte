<script lang="ts">
  import { page } from "$app/state";
  import { ChevronDoubleUpOutline, ClockOutline } from "flowbite-svelte-icons";
  import type { PageProps } from "./$types";
  import { FALLBACK_IMAGE } from "./dashboard/shared/constants";
  import { Section, Schedule, ScheduleItem } from "flowbite-svelte-blocks";

  let { data }: PageProps = $props();

  const formatEndDate = (endDate: Date | string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;

    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  interface Stat {
    // activeAuctions: number;
    transactions: number;
    rareBooks: number;
    happyCollectors: number;
    totalSales: number;
  }

  // create stats from data
  const stats: Stat = {
    // activeAuctions: data.books.filter(
    //   (book) => new Date(book.endDate) > new Date()
    // ).length,
    transactions: data.transactionCount,
    rareBooks: data.books.length,
    happyCollectors: data.userCount,
    // happyCollectors: (() => {
    //   const now = new Date();
    //   const winners = new Set<string>();

    //   data.books.forEach((book) => {
    //     if (new Date(book.endDate) <= now && book.bids && book.bids.length) {
    //       const winner = book.bids.reduce((max, bid) =>
    //         bid.amount > max.amount ? bid : max
    //       );
    //       winners.add(winner.userId);
    //     }
    //   });
    //   return winners.size;
    // })(),
    totalSales: data.books.reduce(
      (acc, book) => acc + (book.currentBid || 0),
      0
    ),
  };

  // ending within 3 days
  const endingSoonBooks = data.books.filter((b) => {
    const end = new Date(b.endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
  });

  const formatEndingSoonDate = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // filter books that are not ended and sort by endDate
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
    .slice(0, 8);
</script>

<svelte:head>
  <title>Book Bidding</title>
</svelte:head>

<div class="bg-background">
  <!-- Hero Section -->
  {@render hero()}

  <!-- Stats Section -->
  {@render statistics()}

  <!-- Featured Items -->
  {@render featuredItems()}

  <!-- How It Works -->
  {@render howItWorks()}

  <!-- Ending Soon (within 3 days) -->
  {#if endingSoonBooks.length !== 0}
    {@render endingSoon()}
  {/if}

  <!-- CTA Section -->
  {@render cta()}
</div>

{#snippet endingSoon()}
  <div id="ending-soon">
    <Section
      name="schedule"
      sectionClass="bg-white dark:bg-gray-900 antialiased px-4 md:px-8 py-8"
    >
      <Schedule scheduleName="Ending Soon">
        {#snippet subtitle()}
          <div class="mt-4">
            <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bid now to reserve the book you are interested in!
            </p>
          </div>
        {/snippet}
        {#each endingSoonBooks as item}
          <div class="flex gap-2 items-center">
            <!-- <ClockOutline class="shrink-0 h-6 w-6" /> -->
            <p class="text-lg">⏰</p>
            <ScheduleItem
              item={{
                title: item.name,
                href: `/auctions/${item.id}`,
                time: formatEndingSoonDate(item.endDate),
              }}
            />
          </div>
        {/each}
      </Schedule>
    </Section>
  </div>
{/snippet}

{#snippet featuredItems()}
  <section class="py-20 sm:px-6 lg:px-8 border-b border-border">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Featured Auctions
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Handpicked collection of the finest books currently up for auction
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6 gap-2.5">
        {#each activeBooks as book (book.id)}
          <a href={`/auctions/${book.id}`} class="group">
            <div
              class="bg-card min-h-[447px] rounded-md overflow-hidden border border-border transition-all duration-300 hover:shadow-xl"
            >
              <!-- Image -->
              <div class="relative h-64 overflow-hidden bg-muted">
                <img
                  src={book.fileKey || FALLBACK_IMAGE}
                  alt={book.name}
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div
                  class="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {book.condition}
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4 text-white"
                >
                  <p class="text-sm opacity-90">
                    {formatEndDate(book.endDate)}
                  </p>
                </div>
              </div>

              <!-- Content -->
              <div class="p-2 md:p-4">
                <h3
                  class="font-medium text-lg text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors"
                >
                  {book.name}
                </h3>
                <p class="text-sm text-muted-foreground mb-4">
                  {book.author}
                </p>

                <div class="flex items-center justify-between">
                  <div class="flex flex-col gap-1.5">
                    <p class="text-xs text-muted-foreground">Current Bid</p>
                    <div class="flex gap-1.5 items-baseline">
                      {#if book.startingPrice < book.currentBid}
                        <ChevronDoubleUpOutline
                          class="shrink-0 text-emerald-500 self-baseline"
                        />
                      {/if}
                      <p class="text-2xl tracking-wider font-koulen">
                        ${book.currentBid.toLocaleString()}
                      </p>
                      {#if book.startingPrice < book.currentBid}
                        <p
                          class="text-xs tracking-wider font-koulen text-destructive line-through"
                        >
                          ${book.startingPrice.toLocaleString()}
                        </p>
                      {/if}
                    </div>
                  </div>
                  <div
                    class="hidden w-10 h-10 bg-primary/10 rounded-lg md:flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  >
                    →
                  </div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>

      <div class="text-center mt-12">
        <a
          href="/auctions"
          class="inline-block font-koulen tracking-wider px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          View All Auctions
        </a>
      </div>
    </div>
  </section>
{/snippet}

<!-- Hero Section -->
{#snippet hero()}
  <section
    class="relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground pt-20 pb-32"
  >
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-20 -left-40 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 class="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Discover Rare Books, Win Treasures
          </h1>
          <p
            class="text-xl text-primary-foreground/90 mb-8 max-w-lg leading-relaxed"
          >
            Join thousands of collectors bidding on the world's most
            sought-after first editions, signed copies, and literary treasures.
          </p>
          <div class="flex gap-4 font-koulen tracking-wider items-center">
            <a
              href="/auctions"
              class="px-8 py-3 bg-primary-foreground text-primary rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Browse Auctions
            </a>
            <a
              href={page.data.sessionId ? "/dashboard" : "/auth/login"}
              class="px-8 py-3 border-2 border-primary-foreground text-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-all duration-300"
            >
              Join Now
            </a>
          </div>
        </div>

        <div class="relative h-96 hidden lg:block">
          <div
            class="absolute inset-0 bg-linear-to-br from-primary-foreground/10 to-transparent rounded-2xl"
          ></div>
          <img
            src={FALLBACK_IMAGE}
            alt="Rare book collection"
            class="w-full h-full object-cover rounded-md shadow-2xl"
          />
        </div>
      </div>
    </div>
  </section>
{/snippet}

<!-- Statistics Section -->
{#snippet statistics()}
  <section class="py-16 bg-card border-b border-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div class="text-center">
          <div
            class="text-3xl md:text-4xl font-bold text-primary mb-2 font-koulen tracking-wider"
          >
            {stats.rareBooks}
          </div>
          <div class="text-sm md:text-base text-muted-foreground">
            Rare Books
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl md:text-4xl font-bold text-primary mb-2 font-koulen tracking-wider"
          >
            {stats.transactions}
          </div>
          <div class="text-sm md:text-base text-muted-foreground">
            Transactions
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl md:text-4xl font-bold text-primary mb-2 font-koulen tracking-wider"
          >
            {stats.happyCollectors}
          </div>
          <div class="text-sm md:text-base text-muted-foreground">
            Happy Collectors
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl md:text-4xl font-bold text-primary mb-2 font-koulen tracking-wider"
          >
            {`$${stats.totalSales}`}
          </div>
          <div class="text-sm md:text-base text-muted-foreground">
            Total Values
          </div>
        </div>
      </div>
    </div>
  </section>
{/snippet}

<!-- How It Works Section -->
{#snippet howItWorks()}
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50" id="how-it-works">
    <div class="max-w-7xl mx-auto">
      <h2
        class="text-4xl md:text-5xl font-bold text-foreground text-center mb-16"
      >
        How It Works
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        {#each [{ num: "01", title: "Browse", desc: "Explore our curated collection of rare and collectible books" }, { num: "02", title: "Bid", desc: "Place your bid and compete with collectors worldwide" }, { num: "03", title: "Win", desc: "Secure your treasure with the highest bid" }, { num: "04", title: "Receive", desc: "Get your book safely shipped to your door" }] as step (step.num)}
          <div class="text-center">
            <div class="text-5xl font-bold text-primary/30 mb-4 font-koulen">
              {step.num}
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">
              {step.title}
            </h3>
            <p class="text-muted-foreground">{step.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/snippet}

<!-- Call-to-Action Section -->
{#snippet cta()}
  <section
    class="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground"
  >
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">
        Ready to Start Collecting?
      </h2>
      <p class="text-lg opacity-90 mb-8">
        Sign up today and get access to exclusive auctions and rare finds.
      </p>
      <div
        class="flex gap-4 items-center justify-center flex-wrap font-koulen tracking-wider"
      >
        <a
          href={page.data.sessionId ? "/dashboard/create" : "/auth/login"}
          class="px-6 py-2 bg-primary-foreground text-primary rounded-lg hover:shadow-lg transition-all"
        >
          {page.data.sessionId ? "Create Auction" : "Sign In"}
        </a>
        <a
          href="/auctions"
          class="px-6 py-2 border-2 border-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-all"
        >
          Browse Auctions
        </a>
      </div>
    </div>
  </section>
{/snippet}
