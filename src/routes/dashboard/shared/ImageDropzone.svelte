<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";

  let {
    filesInDropzone = $bindable(),
    required = true,
    existingFileKey,
  } = $props();

  function handleOnChange(event: Event) {
    const target = event.target as HTMLInputElement;
    filesInDropzone = target.files;
  }

  function handleOnDrop(event: DragEvent) {
    event.preventDefault();
    filesInDropzone = event.dataTransfer?.files ?? null;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function showFiles(files: FileList | null): string {
    if (!files || files.length === 0) return "No files selected.";
    return Array.from(files)
      .map((file) => file.name)
      .join(", ");
  }

  function clearFiles() {
    filesInDropzone = null;
    existingFileKey = null;
  }

  const hasFile = $derived((!filesInDropzone || filesInDropzone.length === 0) && !existingFileKey);
</script>

<div
  class="relative w-full h-48 border-2 border-dashed border-outline/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-primary hover:bg-surface-container/50"
  role="button"
  tabindex="0"
  ondrop={handleOnDrop}
  ondragover={handleDragOver}
>
  <input
    type="file"
    accept=".jpg,.png,.gif"
    multiple
    {required}
    onchange={handleOnChange}
    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
  />
  
  <div class="flex flex-col items-center text-center">
    <div class="mb-3 p-3 rounded-full bg-surface-container">
      <Icon icon="cloud_upload" class="text-3xl text-on-surface-variant" />
    </div>

    {#if hasFile}
      <p class="mb-1 text-sm text-on-surface">
        <span class="font-semibold">Click to upload</span>
        or drag and drop
      </p>
      <p class="text-xs text-on-surface-variant">
        SVG, PNG, JPG or GIF (MAX. 800x400px)
      </p>
    {:else}
      <p class="text-sm text-green-600 dark:text-green-400 wrap-anywhere">
        {#if existingFileKey}
          Current Image: {existingFileKey}
        {:else}
          Selected: {showFiles(filesInDropzone)}
        {/if}
      </p>
      <button
        type="button"
        class="mt-2 text-sm text-secondary hover:underline"
        onclick={(e) => { e.preventDefault(); clearFiles(); }}
      >
        Clear Files
      </button>
    {/if}
  </div>
</div>