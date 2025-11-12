<script lang="ts">
  import {
    clearSelection,
    closeSidebar,
    mapStore,
    openSidebar,
    setSelectedUser,
  } from "$lib/mapStore.svelte";
  import { ndk, signer } from "$lib/ndk.svelte";
  import type { NDKUserProfile } from "@nostr-dev-kit/ndk";
  import { Gear } from "phosphor-svelte";
  import Button from "./ui/Button.svelte";

  const { toggleSidebar, isLoadingInBackground, ...props } = $props<{
    toggleSidebar?: () => void;
    isLoadingInBackground?: boolean;
    class?: string;
  }>();

  const currentPubkey = $derived(ndk.$currentPubkey);
  const currentUser = $derived(ndk.$currentUser);

  let profile: NDKUserProfile | undefined | false = $state(undefined);

  $effect(() => {
    if (!currentUser && signer.state === "initialized") {
      profile = false;
      return;
    }

    if (!currentUser) return;

    currentUser?.fetchProfile().then((newProfile) => {
      profile = newProfile ?? false;
    });
  });
</script>

<div {...props} class={["flex flex-row gap-2", props.class]}>
  <!-- <Button
    class="flex size-12 items-center justify-center rounded-full bg-white dark:bg-gray-900"
    onclick={() => {
      setIsAddingSpot(true);
      openSidebar();
    }}
  >
    <Plus size={20} />
  </Button> -->

  <Button
    class="flex size-12 items-center justify-center rounded-full bg-white dark:bg-gray-900"
    onclick={() => {
      if (
        mapStore.sidebarOpen &&
        !mapStore.selectedFeature &&
        !mapStore.selectedUser
      ) {
        closeSidebar();
        return;
      }

      clearSelection();
      openSidebar();
    }}
  >
    <Gear size={20} />
  </Button>

  <Button
    class="flex items-center justify-center gap-2 rounded-full bg-white p-2 pr-4 text-left text-xs dark:bg-gray-900"
    onclick={() => {
      if (mapStore.selectedUser?.pubkey === currentPubkey) {
        closeSidebar();
        return;
      }

      setSelectedUser({ ...profile, pubkey: currentPubkey });
      openSidebar();
    }}
  >
    <div class="size-8 rounded-full bg-gray-200"></div>
    <div class="flex w-24 flex-col">
      {#if profile === undefined}
        <span class="opacity-50">Loading...</span>
      {:else}
        <span
          >{profile === false || !profile.name
            ? "Anonymous"
            : profile?.name}</span
        >
        <span class="truncate opacity-50">
          {currentPubkey}
        </span>
      {/if}
    </div>
  </Button>
</div>
