<script lang="ts">
  import { availableRelays, ndk } from "$lib/ndk.svelte";
  import { BugBeetle, GithubLogo } from "phosphor-svelte";
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
</script>

{#snippet link(Icon: Component, text: string, href: string)}
  <li class="flex items-center space-x-2">
    <Icon size={20} class="text-gray-500" />
    <a {href} class="text-blue-500 hover:underline">{text}</a>
  </li>
{/snippet}

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
  {@render link(
    BugBeetle,
    "Report bugs",
    "https://github.com/Trustroots/lightfoot/issues/new"
  )}
</ul>

<div class="my-6 space-y-2">
  <h3 class="text-lg font-semibold">About</h3>

  <p class="text-sm">
    Lightfoot is a postal delivery community built on Nostr, reviving the art of
    letter writing. Real handwritten letters delivered by travelers using
    sustainable transport only.
  </p>

  <p class="text-sm">
    Anyone can become a Lightfoot Deputy - drop a letter in a box, take one
    going your way, and deliver it using walking, cycling, hitchhiking, or other
    carbon-light methods.
  </p>
</div>

<h3 class="mt-6 mb-2 text-lg font-semibold">License</h3>

<p class="text-sm">This client is released into the public domain.</p>
