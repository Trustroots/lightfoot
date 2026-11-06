const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export interface LatLon {
  lat: number;
  lon: number;
}

/** Encode a position as a geohash of the given length. */
export function encode(lat: number, lon: number, precision = 9): string {
  const latRange: [number, number] = [-90, 90];
  const lonRange: [number, number] = [-180, 180];
  let hash = "";
  let bit = 0;
  let ch = 0;
  let even = true;
  while (hash.length < precision) {
    const range = even ? lonRange : latRange;
    const value = even ? lon : lat;
    const mid = (range[0] + range[1]) / 2;
    if (value >= mid) {
      ch = (ch << 1) | 1;
      range[0] = mid;
    } else {
      ch = ch << 1;
      range[1] = mid;
    }
    even = !even;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

/** Decode a geohash to its cell centre, or null when it is empty or has invalid characters. */
export function decode(hash: string): LatLon | null {
  if (hash.length === 0) return null;
  const latRange: [number, number] = [-90, 90];
  const lonRange: [number, number] = [-180, 180];
  let even = true;
  for (const c of hash.toLowerCase()) {
    const code = BASE32.indexOf(c);
    if (code < 0) return null;
    for (let mask = 16; mask >= 1; mask >>= 1) {
      const range = even ? lonRange : latRange;
      const mid = (range[0] + range[1]) / 2;
      if (code & mask) range[0] = mid;
      else range[1] = mid;
      even = !even;
    }
  }
  return { lat: (latRange[0] + latRange[1]) / 2, lon: (lonRange[0] + lonRange[1]) / 2 };
}

/** The `g` tags a box publishes: one per precision from 4 to 9, so relays can index each. */
export function gTags(lat: number, lon: number): string[][] {
  const full = encode(lat, lon, 9);
  return [4, 5, 6, 7, 8, 9].map((n) => ["g", full.slice(0, n)]);
}

/** The position from the longest valid `g` tag, or null if there is none. */
export function bestPosition(tags: string[][]): LatLon | null {
  const hashes = tags
    .filter((t) => t[0] === "g" && typeof t[1] === "string")
    .map((t) => t[1] as string)
    .sort((a, b) => b.length - a.length);
  for (const hash of hashes) {
    const pos = decode(hash);
    if (pos) return pos;
  }
  return null;
}

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
