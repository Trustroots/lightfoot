// Lightfoot Box Types
// Types for Lightfoot boxes that integrate with the existing GeoJSON feature architecture

export type Availability = 'public' | 'scheduled' | 'host' | 'transient';

export interface LightfootBox {
  geohash: string;
  tag: '#lightfootbox';
  kind: 1;
  availability: Availability;
  // Additional properties can be added as needed
}

// Extended properties for GeoJSON features representing Lightfoot boxes
export interface LightfootBoxProperties {
  kind: number;
  id: string;
  pubkey: string;
  user: any;
  time?: number;
  username?: string;
  content: string;
  geohash: string;
  coordinates: [number, number];
  tags: any[];
  availability: Availability;
  verified: boolean;
  rawEvent: any; // NDKEvent or NDKRawEvent
}

// Type for client-side Lightfoot box data
export interface ClientLightfootBox {
  id: string;
  geohash: string;
  availability: Availability;
  coordinates: [number, number];
  created_at: number;
  pubkey: string;
  content?: string;
}
