// Hitchhiking Ride Standard Data Structures
// Based on the JSON schema for hitchhiking ride data sharing standard

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  country?: string;
  city?: string;
  address?: string;
}

export interface Stop extends Location {
  arrival_time?: string; // ISO 8601
  departure_time?: string; // ISO 8601
}

export interface Person {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
}

export interface Signal {
  type: 'thumb' | 'sign' | 'phone' | 'other';
  description?: string;
  duration?: number; // in minutes
}

export interface RideDetails {
  distance?: number; // in km
  duration?: number; // in minutes
  cost?: number; // in local currency
  currency?: string;
}

export interface DeclinedRide {
  reason?: string;
  timestamp?: string; // ISO 8601
  location?: Location;
}

export interface HitchhikingRide {
  version: string;
  stops: Stop[];
  rating: number; // 1-5 scale
  hitchhikers: Person[];
  comment?: string;
  signals: Signal[];
  occupants: number;
  mode_of_transportation: 'car' | 'truck' | 'bus' | 'train' | 'other';
  ride: RideDetails;
  declined_rides: DeclinedRide[];
  source: string; // URL or identifier
  license: string; // e.g., 'CC-BY-SA-4.0'
  submission_time: string; // ISO 8601 timestamp
}