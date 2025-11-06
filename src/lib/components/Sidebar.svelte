<script lang="ts">
  import { clearSelection, mapStore } from "$lib/mapStore.svelte";
  import { ArrowLeft } from "phosphor-svelte";
  import SidebarFeature from "./SidebarFeature.svelte";
  import SidebarGeneral from "./SidebarGeneral.svelte";
  import SidebarUserProfile from "./SidebarUserProfile.svelte";
  import Button from "./ui/Button.svelte";

  const { ...props } = $props<{
    map: maplibregl.Map | undefined;
    children?: () => unknown;
    class?: string;
  }>();

  const selectedUser = $derived(mapStore.selectedUser);
  const selectedFeature = $derived(mapStore.selectedFeature);
</script>

{#if selectedUser || selectedFeature}
  <Button onclick={clearSelection} class="mb-4">
    <ArrowLeft />
  </Button>
{/if}

{#if selectedUser}
  <SidebarUserProfile {selectedUser} />
{:else if selectedFeature}
  <SidebarFeature {selectedFeature} {...props} />
{:else}
  <SidebarGeneral />
{/if}

<details class="mt-4 text-xs opacity-25 hover:opacity-100">
  <summary class="uppercase">Debug</summary>
  <pre>{JSON.stringify(mapStore, null, 2)}</pre>
</details>
