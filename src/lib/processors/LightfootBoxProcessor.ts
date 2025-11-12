import type { Feature as GeoJSONFeature, Geometry } from 'geojson';
import type { Availability, LightfootBoxProperties } from '../types/lightfoot';
import { IEventProcessor } from './BaseProcessor';
import type { SingleProperties } from './types';
import { isPubkeyVerified } from '$lib/auth';

// Concrete LightfootBoxProcessor class
export class LightfootBoxProcessor extends IEventProcessor {
  async process(
    event: any
  ): Promise<GeoJSONFeature<Geometry, SingleProperties> | null> {
    if (!this.validateEvent(event)) {
      throw new Error('Invalid event structure');
    }

    if (event.kind !== 1) return null;

    // Check for #lightfootbox tag
    const hasLightfootBoxTag = event.tags?.some(
      (tag: any) => tag[0] === 't' && tag[1] === '#lightfootbox'
    );
    if (!hasLightfootBoxTag) return null;

    const location = this.extractLocation(event);
    if (!location) return null;

    const { lngLat: coordinates, geohash } = location;

    // Parse content for box details
    let availability: Availability = 'public'; // default
    let content = event.content;
    try {
      const parsed = JSON.parse(event.content);
      if (
        parsed.availability &&
        ['public', 'scheduled', 'host', 'transient'].includes(
          parsed.availability
        )
      ) {
        availability = parsed.availability as Availability;
      }
      if (parsed.content) {
        content = parsed.content;
      }
    } catch (error) {
      // Treat as plain text, keep default availability
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates,
      },
      properties: {
        kind: event.kind,
        id: event.id,
        pubkey: event.pubkey,
        user: null,
        time: event.created_at,
        username: undefined,
        content: content.trim(),
        geohash: geohash || undefined,
        coordinates,
        tags: event.tags,
        availability,
        verified: isPubkeyVerified(event.pubkey),
        rawEvent: event,
      } as LightfootBoxProperties,
    };
  }
}
