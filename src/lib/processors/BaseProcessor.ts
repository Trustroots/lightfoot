import type { NDKEvent, NDKRawEvent } from '@nostr-dev-kit/ndk';
import type { Feature as GeoJSONFeature, Geometry } from 'geojson';
import { decodeGeoHash } from '../geohash';
import type { SingleProperties } from './types';

// Abstract EventProcessor base class
export abstract class IEventProcessor {
	constructor() {}

	abstract process(
		event: NDKEvent | NDKRawEvent
	): Promise<GeoJSONFeature<Geometry, SingleProperties> | null>;

	// Shared method to validate event structure
	protected validateEvent(event: any): boolean {
		return event && typeof event === 'object' && 'kind' in event && 'content' in event;
	}

	// Extract location from event tags
	protected extractLocation(
		event: any
	): { lngLat: [number, number]; geohash: string | null } | null {
		if (!event?.tags?.length) return null;

		const longestGTag = event.tags
			.filter((tag: any) => tag[0] === 'g' && typeof tag[1] === 'string' && tag[1].length)
			.reduce(
				(longest: string, tag: any) => (tag[1].length > longest.length ? tag[1] : longest),
				''
			);

		if (!longestGTag) return null;

		// Check if longestGTag is in "lat,lng" format
		const latLngMatch = longestGTag.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
		if (latLngMatch) {
			const lat = parseFloat(latLngMatch[1]);
			const lng = parseFloat(latLngMatch[3]);
			if (isFinite(lat) && isFinite(lng)) {
				return { lngLat: [lng, lat], geohash: null };
			}
			return null;
		}

		// Import decodeGeoHash dynamically to avoid circular imports
		const location = decodeGeoHash(longestGTag);
		if (!location) return null;
		return { lngLat: [location.longitude[2], location.latitude[2]], geohash: longestGTag };
	}
}