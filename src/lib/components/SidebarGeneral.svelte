<script lang="ts">
  import { updateSearchParamsForShowVerifiedOnly } from "$lib/constants";
  import { mapStore, setShowVerifiedOnly } from "$lib/mapStore.svelte";
  import { availableRelays, ndk } from "$lib/ndk.svelte";
  import { GithubLogo, Lifebuoy } from "phosphor-svelte";
  import { type Component } from "svelte";

  const getRelayStatus = $derived.by(() => {
    const statusMap = new Map<string, string>();
    for (const relay of ndk.$pool.relays.values()) {
      // Store both with and without trailing slash to handle URL normalization
      statusMap.set(relay.url, relay.status);
      const urlWithoutSlash = relay.url.endsWith("/")
        ? relay.url.slice(0, -1)
        : relay.url;
      statusMap.set(urlWithoutSlash, relay.status);
    }
    return statusMap;
  });

  const showVerifiedOnly = $derived(mapStore.showVerifiedOnly);

  const toggleVerifiedOnly = () => {
    const next = !mapStore.showVerifiedOnly;
    setShowVerifiedOnly(next);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      updateSearchParamsForShowVerifiedOnly(url, next);
      window.history.replaceState({}, "", url);
    }
  };
</script>

{#snippet link(Icon: Component, text: string, href: string)}
  <li class="flex items-center space-x-2">
    <Icon size={20} class="text-gray-500" />
    <a {href} class="text-blue-500 hover:underline">{text}</a>
  </li>
{/snippet}

<div class="my-6 space-y-4">
  <div
    class="pb-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2"
  >
    <button
      class={`flex items-center justify-start gap-2 rounded-md px-2 py-1 ${
        showVerifiedOnly
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-100"
      }`}
      onclick={toggleVerifiedOnly}
      title={showVerifiedOnly
        ? "Showing verified postal boxes only"
        : "Showing all postal boxes"}
      aria-pressed={showVerifiedOnly}
    >
      <span
        class="inline-flex h-3 w-3 items-center justify-center rounded-full border border-current"
      >
        {#if showVerifiedOnly}
          <span class="h-2 w-2 rounded-full bg-current"></span>
        {/if}
      </span>
      <span class="uppercase text-xs"> Verified only </span>
    </button>
    <p class="text-xs text-gray-600 dark:text-gray-400">
      Note: This is a temporary filter. We plan to replace it with a more
      decentralized "web of trust" system.
    </p>
  </div>
  <p class="text-sm">
    The map shows <strong>Lightfoot postal boxes</strong> around the world where
    you can drop off or pick up handwritten letters. Click on any box to see its
    location details and availability.
  </p>

  <p class="text-sm">
    <strong>Lightfoot</strong> is a postal delivery community built on
    <a href="https://www.trustroots.org/circles/lightfoot">Trustroots</a>
    and Nostr, reviving the art of letter writing. Real handwritten letters—not digital
    patterns, but real paper written in your personal hand, carrying your creativity
    and unique style—delivered by travelers using sustainable transport only.
  </p>

  <p class="text-sm">
    There's something pure that inspires trust when a handwritten letter is
    delivered by a light-footed traveler with a smile and a story about the
    letter's journey. This personal touch strengthens communities and connects
    people in harmony with the Earth, fostering a sharing environment based on
    trust.
  </p>

  <p class="text-sm">
    Anyone can become a Lightfoot Deputy—drop a letter in a box, take one going
    your way, and deliver it using walking, cycling, hitchhiking, sailing, or
    other carbon-light methods. Travel Light, stay aware, and be the bridge that
    spans the gap between separated communities.
  </p>

  <p class="text-xs text-gray-600">
    Learn more:
    <a
      href="https://wiki.trustroots.org/en/Lightfoot"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-600 hover:underline">Trustroots Wiki</a
    >
    ·
    <a
      href="https://casarobino.org/2009/02/lightfoot-sustainable-post-sweeping-globe"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-600 hover:underline">Casa Robino</a
    >
  </p>
</div>

<h3 class="mb-2 text-lg font-semibold">Relays</h3>

<ul class="flex flex-col gap-1 overflow-x-auto rounded text-sm">
  {#each availableRelays as relay (relay)}
    {@const status = getRelayStatus.get(relay)}
    <li
      class="pointer-events-none flex items-center gap-2 whitespace-nowrap uppercase"
    >
      <span aria-label={status} title={status} class="animate-pulse">
        {#if status === "connected"}
          <span class="text-green-500">●</span>
        {:else if status === "connecting" || status === "reconnecting"}
          <span class="text-yellow-500">●</span>
        {:else}
          <span class="text-red-500">●</span>
        {/if}
      </span>
      <span class="text-xs">{relay}</span>
    </li>
  {/each}
</ul>

<h3 class="mt-6 mb-2 text-lg font-semibold">Links</h3>

<ul class="list-none space-y-2 p-0">
  {@render link(
    GithubLogo,
    "Contribute",
    "https://github.com/Trustroots/lightfoot"
  )}
  {@render link(Lifebuoy, "Support", "https://trustroots.org/support")}
</ul>

<h3 class="mt-6 mb-2 text-lg font-semibold">License</h3>

<p class="text-sm">This client is released into the public domain.</p>
