<script lang="ts">
  import type { Snippet } from "svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import SideNav from "$lib/components/SideNav.svelte";

  interface Props {
    children: Snippet;
    data: {
      user: any;
      sessionId: string | null;
    };
  }

  let { children, data }: Props = $props();
</script>

<div class="min-h-screen flex flex-col">
  <TopNav />
  <div class="flex flex-1">
    <SideNav user={data.user} />
    <main class="flex-1 md:ml-64">
      {@render children()}
    </main>
  </div>
</div>
