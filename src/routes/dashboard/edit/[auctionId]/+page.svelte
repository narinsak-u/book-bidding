<script lang="ts">
  import { page } from "$app/state";
  import HeaderSection from "$lib/components/Header.svelte";
  import FormField from "../../shared/FormField.svelte";
  import Unauthentication from "$lib/components/Unauthentication.svelte";

  let { data } = $props();

  const initialData = $derived(data?.book ?? null);
</script>

<svelte:head>
  <title>Edit Auction - Book Bidding</title>
</svelte:head>

{#if !page.data.sessionId}
  <Unauthentication />
{:else}
  <div class="bg-background">
    <!-- Header -->
    <HeaderSection
      title="Edit Auction"
      description="Update auction details and image or end date"
      cta={{ text: "Back to Dashboard", href: "/dashboard" }}
    />

    <!-- Main Content -->
    <div>
      <div class="p-4 md:p-8 w-full overflow-auto">
        <FormField
          mode="edit"
          initialData={initialData
            ? {
                ...initialData,
                title: initialData.name,
                filekey: initialData.fileKey,
                description: initialData.description ?? "",
                endDate: String(initialData.endDate),
              }
            : null}
        />
      </div>
    </div>
  </div>
{/if}
