import type { NDKEvent, NDKRawEvent } from '@nostr-dev-kit/ndk';

export interface LocationData {
	latitude: number;
	longitude: number;
	accuracy?: number;
	timestamp?: number;
}

export interface UserProfile {
	id: string;
	name: string;
	avatar?: string;
	bio?: string;
}

export interface Feature {
	name: string;
	enabled: boolean;
	value?: any;
}

export interface ProcessedContent {
	text: string;
	media?: string[];
	links?: string[];
}

export interface ProcessedData {
	content: ProcessedContent;
	location?: LocationData;
	user: UserProfile;
	features: Feature[];
	timestamp: number;
	kind: number;
}

export type SingleProperties = {
	kind: number;
	id: string;
	pubkey: string;
	user: any;
	time?: number;
	username?: string;
	content: string;
	geohash?: string;
	coordinates: [number, number];
	tags: any[];
	rating?: number;
	rawEvent: NDKEvent | NDKRawEvent;
};
