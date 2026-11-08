<script lang="ts">
  import { page } from "$app/state";
  import HeaderSection from "$lib/components/Header.svelte";
  import FormField from "../shared/FormField.svelte";
  import Unauthentication from "$lib/components/Unauthentication.svelte";
</script>

<svelte:head>
  <title>Create New Auction - Book Bidding</title>
</svelte:head>

{#if !page.data.sessionId}
  <Unauthentication />
{:else}
  <div class="bg-background">
    <!-- Header -->
    <HeaderSection
      title="Create New Auction"
      description="Create a new auction to start a bid on a book."
      cta={{ text: "Back to Dashboard", href: "/dashboard" }}
    />

    <!-- Main Content -->
    <div>
      <div class="p-4 md:p-8 w-full overflow-auto">
        <FormField mode="create" />
      </div>
    </div>
  </div>
{/if}
