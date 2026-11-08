<script lang="ts">
  import {
    Button,
    Datepicker,
    Heading,
    Label,
    Modal,
    Timepicker,
    type DateOrRange,
  } from "flowbite-svelte";
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

  //    Function to handle date selection in the modal
  function handleModalDateSelect(selectedDate: DateOrRange): void {
    if (selectedDate instanceof Date) {
      modalSelectedDate = selectedDate;
    } else if (selectedDate && typeof selectedDate === "object") {
      // Handle range case if needed
      if (selectedDate.from) {
        modalSelectedDate = selectedDate.from;
      }
    }
  }

  function handleModalTimeSelect(data?: {
    time: string;
    [key: string]: string;
  }): void {
    if (data) {
      modalTimeSelection = {
        time: data.time,
      };
    }
  }

  function handleSave(): void {
    open = false;
  }
</script>

<Modal bind:open class="w-full max-w-sm">
  {#snippet header()}
    <Heading
      tag="h5"
      class="flex mx-auto font-medium text-gray-900 dark:text-white font-koulen"
    >
      Set Auction End Time
    </Heading>
  {/snippet}
  <div class="p-4 sm:p-5">
    <div class="mb-4">
      <Label class="mb-2 block">Pick date</Label>
      <Datepicker
        bind:value={modalSelectedDate}
        onselect={handleModalDateSelect}
        inline
        class="mx-auto [&_div>button]:bg-gray-50 [&>div>div]:bg-gray-50 [&>div>div]:shadow-none"
      />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block">Pick time</Label>
      <Timepicker
        type="inline-buttons"
        value={modalTimeSelection.time}
        timeIntervals={TIME_INTERVALS}
        onselect={handleModalTimeSelect}
        columns={3}
      />
    </div>
    <div class="flex items-center space-x-4">
      <Button color="primary" class="w-full" onclick={handleSave}>Save</Button>
      <Button color="alternative" class="w-full" onclick={() => (open = false)}>
        Discard
      </Button>
    </div>
  </div>
</Modal>
