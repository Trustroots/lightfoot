<script lang="ts">
  import { browser } from "$app/environment";
  import { DEFAULT_KINDS } from "$lib/constants";
  import { mapStore } from "$lib/mapStore.svelte";
  import { type SingleProperties } from "$lib/processors/types";
  import MaplibreGeocoder, {
    type MaplibreGeocoderApi,
  } from "@maplibre/maplibre-gl-geocoder";
  import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
  import type { Feature, Geometry } from "geojson";
  import maplibregl from "maplibre-gl";
  import { Mailbox } from "phosphor-svelte";
  import { onMount } from "svelte";
  import {
    CircleLayer,
    GeoJSON,
    type LayerClickInfo,
    MapLibre,
    Marker,
    MarkerLayer,
    SymbolLayer,
  } from "svelte-maplibre";

  let {
    onClick,
    onAddSpot,
    data,
    map = $bindable(undefined),
    ...props
  }: {
    class: string;
    onClick: (feature: SingleProperties | null) => void;
    onAddSpot?: (coordinates: [number, number]) => void;
    data: GeoJSON.FeatureCollection<Geometry, SingleProperties>;
    map: maplibregl.Map | undefined;
  } = $props();

  // Read filters from search params
  let searchParams = $derived(
    new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search
    )
  );

  // Combined filter functions for search params
  const filterFunctions = $derived.by(() => [
    // Filter by kind
    (f: any) => {
      const kinds: number[] =
        searchParams
          .get("kinds")
          ?.split(",")
          .map((k) => Number(k.trim())) || DEFAULT_KINDS;
      return kinds.includes(f.properties.kind);
    },
    // Filter by minRating
    (f: any) => {
      const min = Number(searchParams.get("minRating"));
      return !min || (f.properties.rating ?? 0) >= min;
    },
    // Filter by username
    (f: any) => {
      const filter = searchParams.get("username")?.toLowerCase();
      if (!filter) return true;
      const name =
        f.properties.username ??
        (typeof f.properties.user === "string" ? f.properties.user : "");
      return name?.toLowerCase() === filter;
    },
    // Filter by content
    (f: any) => {
      const filter = searchParams.get("content")?.toLowerCase();
      return !filter || f.properties.content?.toLowerCase().includes(filter);
    },
    // Filter by minimum content length
    (f: any) => {
      const minLength = Number(searchParams.get("minContentLength"));
      return !minLength || (f.properties.content?.length ?? 0) >= minLength;
    },
    // Filter by maximum content length
    (f: any) => {
      const maxLength = Number(searchParams.get("maxContentLength"));
      return !maxLength || (f.properties.content?.length ?? 0) <= maxLength;
    },
  ]);

  const filteredData = $derived.by(() => {
    return {
      ...data,
      features: data.features.filter((feature: any) =>
        filterFunctions.every((fn: (f: any) => boolean) => fn(feature))
      ),
    };
  });

  // Constants and helpers for styling
  const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

  let style = $state(
    !browser
      ? LIGHT_STYLE
      : window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ? DARK_STYLE
        : LIGHT_STYLE
  );

  const MIN_ZOOM = 2;
  const MAX_ZOOM = 14;

  const CLUSTER_STROKE_WIDTH = 6;

  const SPOT_RADIUS = 6;
  const SPOT_STROKE_WIDTH = 1;
  const SPOT_STROKE_WIDTH_HIGHLIGHTED = 2;
  const SPOT_STROKE_COLOR = "#000000";
  const SPOT_HIGHLIGHT_COUNT = 2;

  const POINT_COUNT_THRESHOLD_1 = 50;
  const POINT_COUNT_THRESHOLD_2 = 300;

  // Helper expression to safely calculate average rating without dividing by zero
  const CALCULATE_AVERAGE_RATING = [
    "case",
    ["==", ["get", "total_rating_count"], 0],
    0,
    ["/", ["get", "total_rating"], ["get", "total_rating_count"]],
  ];

  // Determine whether to use average rating for cluster coloring based on search param
  const USE_AVERAGE_RATING_FOR_CLUSTERS = $derived(
    searchParams.has("averageClusterColoring")
  );

  const createPointColor = (
    ratingAttribute: string | typeof CALCULATE_AVERAGE_RATING
  ) => {
    return [
      "interpolate",
      ["linear"],
      [
        "coalesce",
        typeof ratingAttribute === "string"
          ? ["get", ratingAttribute]
          : ratingAttribute,
        0,
      ],
      0,
      "#11b4da", // fallback color if value is 0 or missing
      1,
      "#9c2f2f", // red for bad (rating 1)
      3,
      "#ff9800", // orange for medium (rating 3)
      5,
      "#2ecc40", // brighter green for good (rating 5)
    ] as any;
  };

  const geocoderApi = {
    forwardGeocode: async (config) => {
      const features = [];
      try {
        const request = `https://nominatim.openstreetmap.org/search?q=${
          config.query
        }&format=geojson&polygon_geojson=1&addressdetails=1`;
        const response = await fetch(request);
        const geojson = await response.json();
        for (const feature of geojson.features) {
          const center = [
            feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
            feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2,
          ];
          const id = feature.properties.osm_id
            ? `${feature.properties.osm_type || "nominatim"}.${feature.properties.osm_id}`
            : feature.properties.display_name ||
              Math.random().toString(36).slice(2);
          const point = {
            type: "Feature" as const,
            id,
            geometry: {
              type: "Point" as const,
              coordinates: center,
            },
            place_name: feature.properties.display_name,
            properties: feature.properties,
            text: feature.properties.display_name,
            place_type: ["place"],
            center,
            bbox: feature.bbox,
          };
          features.push(point);
        }
      } catch (e) {
        console.error(`Failed to forwardGeocode with error: ${e}`);
      }

      return {
        type: "FeatureCollection" as const,
        features,
      };
    },
  } satisfies MaplibreGeocoderApi;

  onMount(() => {
    // Parse #map=zoom/lat/lng from URL hash and set mapStore.currentCoords and currentZoom
    if (browser && window.location.hash.startsWith("#map=")) {
      const match = window.location.hash.match(
        /^#map=([\d.]+)\/([\d.-]+)\/([\d.-]+)/
      );
      if (match) {
        const [, zoomStr, latStr, lngStr] = match;
        const zoom = parseFloat(zoomStr);
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng)) {
          mapStore.currentCoords = [lng, lat];
        }

        if (!isNaN(zoom)) {
          mapStore.currentZoom = zoom;
        }

        // Optionally move the map immediately if available
        if (map) {
          map.jumpTo({ center: [lng, lat], zoom });
        }
      }
    }

    map?.addControl(
      new MaplibreGeocoder(geocoderApi, {
        maplibregl,
        marker: false,
        placeholder: "Search for places",
      }),
      "top-left"
    );

    map?.on("move", () => {
      if (!map) return;
      const { lat, lng } = map.getCenter();
      const zoom = map.getZoom();
      mapStore.currentCoords = [lng, lat];
      mapStore.currentZoom = zoom;
    });

    map?.on("moveend", () => {
      if (!map) return;
      // Update URL hash in OSM style: #map=zoom/lat/lng
      const { lat, lng } = map.getCenter();
      const zoom = map.getZoom();
      const url = new URL(window.location.href);
      url.hash = `map=${zoom.toFixed(2)}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
      window.history.replaceState({}, "", url);
    });

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (e) {
        style = e.matches ? DARK_STYLE : LIGHT_STYLE;
      });
  });
</script>

<MapLibre
  center={[-98.5795, 39.8283]}
  zoom={2}
  minZoom={MIN_ZOOM}
  maxZoom={MAX_ZOOM}
  standardControls
  attributionControl={false}
  onclick={() => onClick(null)}
  projection={{ type: "globe" }}
  {style}
  bind:map
  {...props}
>
  {#if mapStore.isAddingSpot && mapStore.currentCoords}
    <Marker
      lngLat={mapStore.currentCoords}
      class="flex size-3 items-center justify-center rounded-full border bg-fuchsia-500"
    ></Marker>
  {/if}

  <GeoJSON
    id="notes"
    data={filteredData}
    cluster={{
      radius: 75,
      properties: {
        total_rating: ["+", ["case", ["has", "rating"], ["get", "rating"], 0]],
        total_rating_count: ["+", ["case", ["has", "rating"], 1, 0]],
      },
    }}
  >
    <CircleLayer
      id="cluster_circles"
      applyToClusters
      onclick={async (e: LayerClickInfo<Feature<Geometry, any>>) => {
        const feature = e.features?.[0];
        onClick(feature?.properties);

        // If this is a cluster, zoom to its bounds
        if (
          feature &&
          feature.properties &&
          feature.properties.cluster_id &&
          map
        ) {
          const source = map.getSource("notes") as
            | import("maplibre-gl").GeoJSONSource
            | undefined;
          if (
            source &&
            "getClusterExpansionZoom" in source &&
            typeof source.getClusterExpansionZoom === "function"
          ) {
            try {
              // getClusterExpansionZoom returns a Promise<number> in maplibre-gl >=2.4.0
              const zoom = await (
                source.getClusterExpansionZoom as (
                  clusterId: number
                ) => Promise<number>
              )(feature.properties.cluster_id);
              // Get cluster coordinates
              const coords =
                feature.geometry.type === "Point"
                  ? feature.geometry.coordinates
                  : null;
              if (coords && map) {
                map.easeTo({
                  center: coords as [number, number],
                  zoom: zoom,
                });
              }
            } catch (err) {
              console.error("Error expanding cluster:", err);
            }
          }
        }
      }}
      hoverCursor="pointer"
      manageHoverState
      paint={{
        "circle-color": USE_AVERAGE_RATING_FOR_CLUSTERS
          ? createPointColor(CALCULATE_AVERAGE_RATING)
          : [
              "step",
              ["zoom"],
              [
                "step",
                ["get", "point_count"],
                "rgba(23, 106, 60, 0.9)", // green for <50, 70% opacity
                POINT_COUNT_THRESHOLD_1,
                "rgba(255, 152, 0, 0.9)", // orange for 50-300
                POINT_COUNT_THRESHOLD_2,
                "rgba(156, 47, 47, 0.9)", // red for >=300
              ],
              MAX_ZOOM,
              createPointColor(CALCULATE_AVERAGE_RATING),
            ],
        "circle-radius": [
          "step",
          ["zoom"],
          ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
          MAX_ZOOM,
          SPOT_RADIUS,
        ],
        "circle-stroke-width": [
          "step",
          ["zoom"],
          CLUSTER_STROKE_WIDTH,
          MAX_ZOOM,
          [
            "step",
            ["get", "point_count"],
            SPOT_STROKE_WIDTH,
            SPOT_HIGHLIGHT_COUNT,
            SPOT_STROKE_WIDTH_HIGHLIGHTED,
          ],
        ],
        "circle-stroke-opacity": 0.3, // 30% opacity for cluster strokes
        "circle-stroke-color": USE_AVERAGE_RATING_FOR_CLUSTERS
          ? createPointColor(CALCULATE_AVERAGE_RATING)
          : [
              "step",
              ["zoom"],
              [
                "step",
                ["get", "point_count"],
                "rgba(23, 106, 60)", // green stroke
                POINT_COUNT_THRESHOLD_1,
                "rgba(255, 152, 0)", // orange stroke
                POINT_COUNT_THRESHOLD_2,
                "rgba(156, 47, 47)", // red stroke
              ],
              MAX_ZOOM,
              SPOT_STROKE_COLOR,
            ],
      }}
    />

    <SymbolLayer
      interactive={false}
      maxzoom={MAX_ZOOM}
      applyToClusters
      layout={{
        "text-font": ["Noto Sans Regular"], // Needs to match available fonts in map style
        "text-field": ["format", ["get", "point_count_abbreviated"]],
        "text-size": 12,
        "text-offset": [0, -0.1],
      }}
      paint={{
        "text-color": "#ffffff",
      }}
    />

    <MarkerLayer applyToClusters={false} interactive>
      {#snippet children({ feature })}
        <button
          type="button"
          class="rounded-full bg-white p-2 shadow cursor-pointer"
          onclick={() => onClick(feature.properties as SingleProperties)}
        >
          <Mailbox size={24} />
        </button>
      {/snippet}
    </MarkerLayer>
  </GeoJSON>
</MapLibre>
