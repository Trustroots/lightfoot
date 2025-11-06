<script lang="ts">
  import MapLibre from "$lib/components/MapLibre.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import UserOverview from "$lib/components/UserOverview.svelte";
  import { DEFAULT_FILTERS } from "$lib/constants";
  import { EventProcessorWorkerManager } from "$lib/eventProcessor";
  import {
    closeSidebar,
    mapStore,
    openSidebar,
    setSelectedFeature,
    toggleSidebar,
  } from "$lib/mapStore.svelte";
  import { ndk } from "$lib/ndk.svelte";
  import { type NDKEvent, type NDKRawEvent } from "@nostr-dev-kit/ndk";
  import { onMount } from "svelte";

  let map = $state<maplibregl.Map | undefined>(undefined);

  let searchParams = $derived(
    new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search
    )
  );

  const INITIAL_NOTE_COUNT = $derived(
    Number(searchParams.get("limit") || 250)
  ); /** @todo Maybe make an environment variable. */

  let loadingState = $state<"loading" | "background" | null>("loading");

  const INITIAL_NOTES_STATE = {
    type: "FeatureCollection" as const,
    features: [
      // Test lightfoot box - Berlin
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [13.4050, 52.5200]
        },
        properties: {
          kind: 1,
          id: "test-box-berlin",
          pubkey: "test-pubkey-1",
          user: null,
          time: Math.floor(Date.now() / 1000) - 3600,
          content: "Lightfoot box at Berlin Central Library. Available 24/7, check with staff on ground floor.",
          geohash: "u33dc",
          coordinates: [13.4050, 52.5200],
          tags: [["t", "lightfoot"], ["t", "#lightfootbox"]],
          availability: "public",
          rawEvent: {}
        }
      },
      // Test regular note - Paris
      {
        type: "Feature",
        geometry: {
          type: "Point", 
          coordinates: [2.3522, 48.8566]
        },
        properties: {
          kind: 1,
          id: "test-note-paris",
          pubkey: "test-pubkey-2",
          user: null,
          time: Math.floor(Date.now() / 1000) - 1800,
          content: "Just delivered 3 letters from Paris to Lyon by train! The handwritten notes were so beautiful. #sustainabletravel #lightfoot",
          geohash: "u09tv",
          coordinates: [2.3522, 48.8566],
          tags: [["t", "lightfoot"]],
          rawEvent: {}
        }
      },
      // Test lightfoot box - Amsterdam  
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [4.9041, 52.3676]
        },
        properties: {
          kind: 1,
          id: "test-box-amsterdam",
          pubkey: "test-pubkey-3", 
          user: null,
          time: Math.floor(Date.now() / 1000) - 7200,
          content: "Amsterdam hackspace lightfoot box. Ring bell for access, usually someone around Wed-Sun 14:00-20:00.",
          geohash: "u173z",
          coordinates: [4.9041, 52.3676],
          tags: [["t", "lightfoot"], ["t", "#lightfootbox"]],
          availability: "scheduled",
          rawEvent: {}
        }
      }
    ] as any[],
  };

  let notesOnMap = $state.raw(INITIAL_NOTES_STATE);

  const workerManager = new EventProcessorWorkerManager();
  let eventsToProcess = $state(0);
  let processedEvents = $state(0);

  let debounceTimeout: any;
  let debouncedNotes: typeof notesOnMap = INITIAL_NOTES_STATE;

  const processEvent = async (
    event: NDKEvent | NDKRawEvent,
    { deduplicate }: { deduplicate?: boolean } = {}
  ) => {
    eventsToProcess++;
    const processedEvent = await workerManager.processWithWorker(event);
    processedEvents++;

    if (processedEvent) {
      const isDuplicate =
        (deduplicate ?? false)
          ? notesOnMap.features.some(
              (f: any) => f.properties?.id === processedEvent.properties?.id
            )
          : false;

      if (!isDuplicate) {
        debouncedNotes = {
          ...debouncedNotes,
          features: [...debouncedNotes.features, processedEvent],
        };
      }
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (loadingState === "loading" && processedEvents >= eventsToProcess) {
        loadingState = null;
        notesOnMap = debouncedNotes;
      }
      debounceTimeout = null;
    }, 1000);
  };

  /** @todo Remove this stupid variable and fix the effect or do it onMount or something. */
  let hasMatchedOnLoad = false;

  $effect(() => {
    // Only run this effect once after loading completes
    if (
      !hasMatchedOnLoad &&
      loadingState === null &&
      notesOnMap.features.length > 0
    ) {
      const [lng, lat] = mapStore.currentCoords || [];
      if (lat != null && lng != null) {
        const match = notesOnMap.features.find((f) => {
          const [featureLng, featureLat] = f.geometry?.coordinates || [];
          const epsilon = 0.0001;
          return (
            Math.abs(featureLat - lat) < epsilon &&
            Math.abs(featureLng - lng) < epsilon
          );
        });
        if (match) {
          setSelectedFeature(match.properties);
          openSidebar();
        }
      }
      hasMatchedOnLoad = true;
    }
  });

  onMount(async () => {
    ndk.subscribe(
      {
        ...DEFAULT_FILTERS,
        limit: INITIAL_NOTE_COUNT,
      },
      {
        closeOnEose: false,
        cacheUnconstrainFilter: ["limit"],
      },
      {
        onEvents: (events) => {
          for (const event of events) {
            processEvent(event);
          }
        },
        onEvent: (event) => {
          processEvent(event);
        },
      }
    );
  });

  const showSidebar = $derived(mapStore.sidebarOpen);
</script>

<main class="flex h-full max-h-full w-full flex-col p-2 md:flex-row">
  <div
    class="relative h-full max-h-full w-full flex-1 overflow-hidden rounded-2xl"
  >
    {#if loadingState === "loading"}
      <Modal open>
        <div class="flex flex-col items-center gap-4">
          <div
            class="size-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"
          ></div>
          <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Processing notes ({processedEvents}/{eventsToProcess})...
          </p>
        </div>
      </Modal>
    {/if}

    <UserOverview
      class="absolute top-2 right-2 z-20"
      {toggleSidebar}
      isLoadingInBackground={loadingState === "background"}
    />

    <Notice class="absolute right-2 bottom-2 z-20" />

    <MapLibre
      class="relative h-full w-full bg-gray-200 dark:bg-gray-800"
      data={notesOnMap}
      onClick={(feature) => {
        if (!feature) {
          closeSidebar();
          return;
        }

        setSelectedFeature(feature);
        openSidebar();
      }}
      bind:map
    />
  </div>

  {#if showSidebar}
    <section
      class={[
        "max-h-1/2 overflow-hidden overflow-y-auto p-6 py-8 md:max-h-full md:w-1/3",
      ]}
    >
      <Sidebar {map} />
    </section>
  {/if}
</main>
