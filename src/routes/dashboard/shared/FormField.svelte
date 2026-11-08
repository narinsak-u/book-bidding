<script lang="ts">
  import type { ActionResult } from "@sveltejs/kit";
  import { CONDITIONS } from "./constants";
  import type { Snippet } from "svelte";
  import { applyAction, deserialize } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import DateTimeModal from "./DateTimeModal.svelte";
  import { Button, P } from "flowbite-svelte";
  import { ClockSolid } from "flowbite-svelte-icons";
  import ImageDropzone from "./ImageDropzone.svelte";

  interface Auction {
    id: string;
    title: string;
    author: string; // Name of the author
    description: string;
    currentBid: number;
    startingPrice: number;
    // status: "active" | "ending-soon" | "ended";
    // bidsCount: number;
    endDate: string;
    pages: number;
    yearPublished: number;
    condition: string;
    filekey: string;
  }

  interface Props {
    mode?: "create" | "edit";
    initialData?: Auction | null;
  }

  let { mode = "create", initialData = null }: Props = $props();

  let loading = $state(false);
  let open = $state(false);
  let modalSelectedDate = $state(new Date());
  let modalTimeSelection = $state({ time: "10:00" });
  let filesInDropzone: FileList | null = $state(null);

  let formData: Auction = $state({
    id: "",
    title: "",
    author: "",
    description: "",
    startingPrice: 0,
    endDate: "",
    condition: CONDITIONS[1],
    pages: 0,
    yearPublished: 2000,
    filekey: "",
    currentBid: 0,
  });

  let auctionId: string | null = $state(null);
  let existingFileKey: string | null = $state(null);
  let formAction: string = $state(
    mode === "create" ? "?/createAuction" : "?/updateAuction"
  );
  let imageRequired: boolean = $state(mode === "create");
  let previewUrl: string | null = $state(null);

  $effect(() => {
    if (filesInDropzone && filesInDropzone.length > 0) {
      const url = URL.createObjectURL(filesInDropzone[0]);
      previewUrl = url;

      return () => {
        URL.revokeObjectURL(url);
        previewUrl = null;
      };
    } else {
      previewUrl = null;
    }
  });

  // If initial data is provided (edit mode), prefill the form
  $effect(() => {
    if (mode === "edit" && initialData) {
      auctionId = initialData.id ?? null;
      formData.title = initialData.title ?? initialData.title ?? "";
      formData.author = initialData.author ?? "";
      formData.description = initialData.description ?? "";
      formData.startingPrice =
        initialData.startingPrice ?? initialData.currentBid ?? 0;
      formData.pages = initialData.pages ?? 0;
      formData.yearPublished = initialData.yearPublished ?? 2000;
      formData.condition = initialData.condition ?? CONDITIONS[1];
      existingFileKey = (initialData as any).fileKey ?? null;

      // derive date and time from endDate (ms)
      const ms = (initialData as any).endDate ?? (initialData as any).endDateMs;
      if (ms) {
        const d = new Date(ms);
        modalSelectedDate = d;
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mm = String(d.getUTCMinutes()).padStart(2, "0");
        modalTimeSelection = { time: `${hh}:${mm}` };
      }
      formAction = "?/updateAuction";
      imageRequired = false;
    } else {
      formAction = "?/createAuction";
      imageRequired = true;
    }
  });

  function resetForm() {
    formData = {
      id: "",
      title: "",
      author: "",
      startingPrice: 0,
      description: "",
      endDate: "",
      condition: CONDITIONS[1],
      pages: 0,
      yearPublished: 2000,
      filekey: "",
      currentBid: 0,
    };
    modalSelectedDate = new Date();
    modalTimeSelection = { time: "12:00" };
  }

  const handleSubmit = async (
    event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
  ) => {
    event.preventDefault();
    loading = true;
    // base validation
    if (
      !formData.title ||
      !formData.author ||
      formData.startingPrice <= 0 ||
      !formData.condition ||
      !formData.pages ||
      !formData.yearPublished ||
      (mode === "create" && !filesInDropzone)
    ) {
      alert("Please fill in all required fields");
      loading = false;
      return;
    }

    if (!modalSelectedDate || !modalTimeSelection.time) {
      alert("Please select an end date and time");
      loading = false;
      return;
    }

    // Build form payload
    const data = new FormData(event.currentTarget, event.submitter);
    data.append("currentBid", formData.currentBid.toString());
    if (filesInDropzone && filesInDropzone[0]) {
      data.append("file", filesInDropzone[0]);
    }

    const year = modalSelectedDate.getFullYear();
    const month = String(modalSelectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(modalSelectedDate.getDate()).padStart(2, "0");
    const [hhStr, mmStr] = modalTimeSelection.time.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    const endUtcIso = new Date(
      Date.UTC(year, Number(month) - 1, Number(day), hh, mm, 0)
    ).toISOString();

    data.append("endDate", endUtcIso);

    if (mode === "edit" && auctionId) {
      data.append("auctionId", auctionId);
    }

    const response = await fetch(event.currentTarget.action, {
      method: "POST",
      body: data,
    });

    const result: ActionResult = deserialize(await response.text());
    // console.log(result, "result");

    if (result.type === "success") {
      // rerun all `load` functions, following the successful update
      await invalidateAll();
      if (mode === "create") {
        resetForm();
      }
      loading = false;
    }

    if (result.type === "failure") {
      console.log(result.data?.message || "Failed to create auction");
      loading = false;
    }

    applyAction(result);
  };
</script>

<form
  method="POST"
  action={formAction}
  enctype="multipart/form-data"
  onsubmit={handleSubmit}
  class="space-y-4"
>
  <div>
    <label for="title" class="block text-sm font-medium text-foreground mb-1">
      Title *
    </label>
    <input
      required
      type="text"
      id="title"
      name="title"
      placeholder="Book title"
      bind:value={formData.title}
      class="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
  <div>
    <label for="author" class="block text-sm font-medium text-foreground mb-1">
      Author *
    </label>
    <input
      type="text"
      id="author"
      name="author"
      placeholder="Book author"
      bind:value={formData.author}
      class="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
  <div>
    <label
      for="description"
      class="block text-sm font-medium text-foreground mb-1"
    >
      Description *
    </label>
    <textarea
      required
      id="description"
      name="description"
      placeholder="Book description"
      bind:value={formData.description}
      class="w-full h-24 px-4 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    ></textarea>
  </div>
  <div class="flex gap-4 items-center justify-between w-full flex-wrap mb-6">
    <div>
      <label
        for="condition"
        class="block text-sm font-medium text-foreground mb-1"
      >
        Condition *
      </label>
      <select
        id="condition"
        required
        name="condition"
        bind:value={formData.condition}
        class="w-full px-8 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {#each CONDITIONS as condition}
          <option value={condition}>{condition}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="pages" class="block text-sm font-medium text-foreground mb-1">
        Pages *
      </label>
      <input
        required
        min="0"
        type="number"
        id="pages"
        name="pages"
        placeholder="Number of pages"
        bind:value={formData.pages}
        class="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
    <div>
      <label
        for="yearPublished"
        class="block text-sm font-medium text-foreground mb-1"
      >
        Year Published *
      </label>
      <input
        required
        type="number"
        id="yearPublished"
        name="yearPublished"
        placeholder="Year published"
        bind:value={formData.yearPublished}
        class="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
    <div>
      <label
        for="startingPrice"
        class="block text-sm font-medium text-foreground mb-1"
      >
        Starting Price *
      </label>
      <input
        required
        type="number"
        id="startingPrice"
        name="startingPrice"
        bind:value={formData.startingPrice}
        min="0"
        step="50"
        class="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  </div>

  <!-- Image Dropzone -->
  <ImageDropzone
    bind:filesInDropzone
    required={imageRequired}
    {existingFileKey}
  />

  <!-- show image preview -->
  {#if filesInDropzone && filesInDropzone.length > 0}
    <div class="w-full">
      <img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
    </div>
  {:else if existingFileKey}
    <div class="w-full">
      <img
        src={existingFileKey}
        alt="Preview"
        class="w-full h-full object-cover"
      />
    </div>
  {/if}

  <!-- Set Auction End Time -->
  <div class="flex gap-4 items-center w-full">
    <Button class="cursor-pointer" onclick={() => (open = true)}>
      <ClockSolid class="me-2 h-4 w-4" />
      Set Auction End Time
    </Button>

    {#if modalTimeSelection}
      <P>
        Auction end time set for
        <span class="font-semibold">
          {modalSelectedDate.toDateString()} at {modalTimeSelection.time}
        </span>
      </P>
    {/if}
  </div>

  <DateTimeModal bind:open bind:modalSelectedDate bind:modalTimeSelection />

  <div class="flex gap-3 pt-4">
    {#if mode === "create"}
      <button
        type="submit"
        disabled={loading}
        class="flex-1 cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
      >
        {#if loading}
          Creating...
        {:else}
          Create
        {/if}
      </button>
    {:else}
      <button
        type="submit"
        disabled={loading}
        class="flex-1 cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
      >
        {#if loading}
          Updating...
        {:else}
          Update
        {/if}
      </button>
    {/if}
  </div>
</form>
