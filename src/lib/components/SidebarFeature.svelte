<script lang="ts">
	import { setSelectedUser } from '$lib/mapStore.svelte';
	import { ndk } from '$lib/ndk.svelte';
	import type { SingleProperties } from '$lib/processors/types';
	import { type GeoJSONSource } from 'maplibre-gl';

	const { selectedFeature, map, ...props } = $props<{
		selectedFeature: any;
		map: maplibregl.Map | undefined;
		class?: string;
	}>();
</script>

{#snippet overview(rating?: number, waitingTime?: number, distance?: number)}
	<div class="flex items-center gap-4 text-xs text-gray-700">
		{#if rating}
			<div class="flex items-center gap-1">
				<span class="text-gray-500">Rating</span>
				<span class="font-semibold">{Math.round(rating)}</span>
				<span class="text-gray-400">/</span>
				<span class="text-gray-400">5</span>
				<span class="text-yellow-400">★</span>
			</div>
		{/if}
		{#if waitingTime}
			<div>
				<span class="text-gray-500">Waiting Time</span>
				<span class="font-semibold">{waitingTime}</span>
				<span class="text-gray-400">min</span>
			</div>
		{/if}
		{#if distance}
			<div>
				<span class="text-gray-500">Ride Distance</span>
				<span class="font-semibold">{distance}</span>
				<span class="text-gray-400">km</span>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet note(entry: SingleProperties)}
	{@const username =
		(entry.username ?? entry.user?.name ?? typeof entry.user === 'string') ? entry.user : undefined}
	<div class="space-y-3 border-b border-gray-300 last-of-type:border-0">
		<div>{entry.content}</div>
		<details class="space-y-4">
			<summary class="flex list-none items-center justify-between">
				{#if entry.time}
					<div class="text-xs text-gray-500">
						<!-- Cascade of hell, maybe move into a component to use $derived or similar. -->
						- {#if entry.pubkey}
							{#await ndk.fetchUser(entry.pubkey)}
								{username ?? 'Anonymous'}
							{:then user}
								{#await user?.fetchProfile()}
									{username ?? 'Anonymous'}
								{:then profile}
									{#if profile}
										<button
											class="text-blue-500 hover:underline"
											onclick={() => setSelectedUser({ ...profile, pubkey: entry.pubkey })}
										>
											{username ?? profile?.name ?? 'Anonymous'}
										</button>
									{:else}
										{username ?? 'Anonymous'}
									{/if}
								{/await}
							{/await}
						{/if},
						{new Date(entry.time * 1000).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long'
						})}
					</div>
				{/if}
				<span class="cursor-pointer text-xs text-gray-400">Show raw data</span>
			</summary>
			<pre class="bg-gray-100 dark:bg-gray-800 p-2 text-xs whitespace-pre-wrap">{JSON.stringify(
					Object.fromEntries(Object.entries(entry.rawEvent).reverse()),
					null,
					2
				)}</pre>
		</details>
	</div>
{/snippet}

{#if selectedFeature.cluster}
	{#await (async () => {
		const source = map?.getSource('notes') as GeoJSONSource;
		let allChildren: any[] = [];
		let queue = [selectedFeature.cluster_id];
		const seen = new Set();

		while (queue.length > 0) {
			const clusterId = queue.pop();
			if (!clusterId || seen.has(clusterId)) continue;
			seen.add(clusterId);

			const children = await source.getClusterChildren(clusterId);
			for (const child of children) {
				if (child.properties?.cluster) {
					queue.push(child.properties.cluster_id);
				} else {
					allChildren.push(child);
				}
			}
		}

		return allChildren.sort((a, b) => b.properties.time - a.properties.time);
	})()}
		<h2 class="font-bold">Cluster ({selectedFeature.point_count} points)</h2>
		<p>Loading...</p>
	{:then children}
		<details class="mb-4">
			<summary class="flex list-none items-center justify-between">
				<h2 class="font-bold">Cluster ({selectedFeature.point_count} points)</h2>
				<span class="cursor-pointer text-xs text-gray-400">Show raw data</span>
			</summary>
			<pre class="bg-gray-100 dark:bg-gray-800 p-2 text-xs whitespace-pre-wrap">{JSON.stringify(
					{ ...selectedFeature, children },
					null,
					2
				)}</pre>
		</details>
		{@render overview(
			selectedFeature.total_rating / selectedFeature.total_rating_count,
			undefined,
			undefined
		)}
		<h3 class="font-bold">Comments</h3>
		<div class="space-y-4">
			{#each children as child, i (child.properties?.id || i)}
				{#if child.properties?.content && child.properties.content.trim() !== ''}
					{@render note(child.properties as any)}
				{/if}
			{:else}
				<p class="text-gray-600 italic">No content available for this point.</p>
			{/each}
		</div>
		{#if children.length < selectedFeature.point_count}
			<p class="text-gray-600 italic">
				...{selectedFeature.point_count - children.length} more point{selectedFeature.point_count -
					children.length ===
				1
					? ''
					: 's'} (zoom in to see all)
			</p>
		{/if}
	{:catch error}
		<p class="text-red-500">Failed to load cluster children: {error.message}</p>
	{/await}
{:else}
	{@render overview(selectedFeature.rating, undefined, undefined)}
	{@render note(selectedFeature as any)}
{/if}
