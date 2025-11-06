<script lang="ts">
	import { MapLibre, GeoJSON, CircleLayer, type LayerClickInfo } from 'svelte-maplibre';
	import type { Feature, Geometry } from 'geojson';

	let {
		latitude = $bindable(0),
		longitude = $bindable(0),
		height = '200px'
	}: {
		latitude: number;
		longitude: number;
		height?: string;
	} = $props();

	let map: maplibregl.Map | undefined = $state();
	let selectedLocation = $state<[number, number] | null>(null);

	// Create a GeoJSON feature for the selected location
	let locationData = $derived({
		type: 'FeatureCollection' as const,
		features: selectedLocation ? [{
			type: 'Feature' as const,
			geometry: {
				type: 'Point' as const,
				coordinates: selectedLocation
			},
			properties: {}
		}] : []
	});

	function handleMapClick(e: any) {
		if (e.lngLat) {
			const [lng, lat] = e.lngLat;
			selectedLocation = [lng, lat];
			latitude = lat;
			longitude = lng;
		}
	}

	// Update selectedLocation when props change
	$effect(() => {
		if (latitude !== 0 || longitude !== 0) {
			selectedLocation = [longitude, latitude];
		}
	});
</script>

<div class="relative rounded border border-gray-300 overflow-hidden" style="height: {height};">
	<MapLibre
		center={selectedLocation || [0, 0]}
		zoom={selectedLocation ? 10 : 2}
		maxZoom={14}
		attributionControl={false}
		style="https://tiles.openfreemap.org/styles/liberty"
		onclick={handleMapClick}
		bind:map
	>
		{#if selectedLocation}
			<GeoJSON id="selected-location" data={locationData}>
				<CircleLayer
					paint={{
						'circle-color': '#3b82f6',
						'circle-radius': 8,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#ffffff'
					}}
				/>
			</GeoJSON>
		{/if}
	</MapLibre>

	{#if !selectedLocation}
		<div class="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
			<p class="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
				Click on the map to select a location
			</p>
		</div>
	{/if}

	{#if selectedLocation}
		<div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-700">
			{latitude.toFixed(6)}, {longitude.toFixed(6)}
		</div>
	{/if}
</div>