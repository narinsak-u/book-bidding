<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
  import { TIME_INTERVALS } from "./constants";

  interface Props {
    open: boolean;
    modalSelectedDate: Date;
    modalTimeSelection: {
      time: string;
    };
  }

  let {
    open = $bindable(),
    modalSelectedDate = $bindable(),
    modalTimeSelection = $bindable(),
  }: Props = $props();

  let tempDate = $state(new Date());
  let tempTime = $state("10:00");

  $effect(() => {
    if (open) {
      tempDate = new Date(modalSelectedDate);
      tempTime = modalTimeSelection.time;
    }
  });

  function handleSave(): void {
    modalSelectedDate = tempDate;
    modalTimeSelection = { time: tempTime };
    open = false;
  }

  function handleClose(): void {
    open = false;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <button
      class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
      onclick={handleClose}
      aria-label="Close modal"
    ></button>
    <div class="relative bg-surface-container-lowest border border-outline/30 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-headline font-semibold text-on-surface">Set Auction End Time</h3>
        <button 
          onclick={handleClose}
          class="p-2 hover:bg-surface-container rounded-lg transition"
        >
          <Icon icon="close" />
        </button>
      </div>

      <div class="space-y-6">
        <div>
<label for="modal-date" class="block text-sm font-medium text-on-surface mb-2">
          Pick Date
        </label>
        <input
          id="modal-date"
          type="date"
            bind:value={tempDate}
            class="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div>
<p id="modal-time-label" class="block text-sm font-medium text-on-surface mb-2">
          Pick Time
        </p>
        <div class="grid grid-cols-3 gap-2" role="group" aria-labelledby="modal-time-label">
            {#each TIME_INTERVALS as time}
              <button
                type="button"
                onclick={() => tempTime = time}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tempTime === time
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container border border-outline/20 text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {time}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button
          type="button"
          onclick={handleClose}
          class="flex-1 px-4 py-2.5 cursor-pointer bg-surface-container border border-outline/30 text-on-surface rounded-lg hover:bg-surface-container-high transition font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleSave}
          class="flex-1 px-4 py-2.5 cursor-pointer bg-primary text-on-primary rounded-lg hover:opacity-90 transition font-medium"
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}