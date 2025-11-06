const BITS = [16, 8, 4, 2, 1];
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

type Direction = 'right' | 'left' | 'top' | 'bottom';
type Parity = 'even' | 'odd';

const NEIGHBORS: Record<Direction, Record<Parity, string>> = {
	right: { even: 'bc01fg45238967deuvhjyznpkmstqrwx', odd: '' },
	left: { even: '238967debc01fg45kmstqrwxuvhjyznp', odd: '' },
	top: { even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy', odd: '' },
	bottom: { even: '14365h7k9dcfesgujnmqp0r2twvyx8zb', odd: '' }
};

const BORDERS: Record<Direction, Record<Parity, string>> = {
	right: { even: 'bcfguvyz', odd: '' },
	left: { even: '0145hjnp', odd: '' },
	top: { even: 'prxz', odd: '' },
	bottom: { even: '028b', odd: '' }
};

// Fill odd parity values
NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
NEIGHBORS.top.odd = NEIGHBORS.right.even;
NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
NEIGHBORS.right.odd = NEIGHBORS.top.even;

BORDERS.bottom.odd = BORDERS.left.even;
BORDERS.top.odd = BORDERS.right.even;
BORDERS.left.odd = BORDERS.bottom.even;
BORDERS.right.odd = BORDERS.top.even;

function refineInterval(interval: [number, number], cd: number, mask: number): void {
	if (cd & mask) interval[0] = (interval[0] + interval[1]) / 2;
	else interval[1] = (interval[0] + interval[1]) / 2;
}

export function calculateAdjacent(srcHash: string, dir: Direction): string {
	srcHash = srcHash.toLowerCase();
	const lastChr = srcHash.charAt(srcHash.length - 1);
	const type: Parity = srcHash.length % 2 ? 'odd' : 'even';
	let base = srcHash.substring(0, srcHash.length - 1);
	if (BORDERS[dir][type].indexOf(lastChr) !== -1) {
		base = calculateAdjacent(base, dir);
	}
	const neighborIndex = NEIGHBORS[dir][type].indexOf(lastChr);
	return base + BASE32[neighborIndex];
}

export interface GeoHashBox {
	latitude: [number, number, number];
	longitude: [number, number, number];
}

export function decodeGeoHash(geohash: string): GeoHashBox {
	let is_even = true;
	const lat: [number, number, number?] = [-90.0, 90.0];
	const lon: [number, number, number?] = [-180.0, 180.0];
	let lat_err = 90.0;
	let lon_err = 180.0;

	for (let i = 0; i < geohash.length; i++) {
		const c = geohash[i];
		const cd = BASE32.indexOf(c);
		for (let j = 0; j < 5; j++) {
			const mask = BITS[j];
			if (is_even) {
				lon_err /= 2;
				refineInterval(lon as [number, number], cd, mask);
			} else {
				lat_err /= 2;
				refineInterval(lat as [number, number], cd, mask);
			}
			is_even = !is_even;
		}
	}
	lat[2] = (lat[0] + lat[1]) / 2;
	lon[2] = (lon[0] + lon[1]) / 2;

	return { latitude: lat as [number, number, number], longitude: lon as [number, number, number] };
}

export function encodeGeoHash(latitude: number, longitude: number, precision: number = 12): string {
	let is_even = true;
	let bit = 0;
	let ch = 0;
	let geohash = '';

	const lat: [number, number] = [-90.0, 90.0];
	const lon: [number, number] = [-180.0, 180.0];

	while (geohash.length < precision) {
		if (is_even) {
			const mid = (lon[0] + lon[1]) / 2;
			if (longitude > mid) {
				ch |= BITS[bit];
				lon[0] = mid;
			} else {
				lon[1] = mid;
			}
		} else {
			const mid = (lat[0] + lat[1]) / 2;
			if (latitude > mid) {
				ch |= BITS[bit];
				lat[0] = mid;
			} else {
				lat[1] = mid;
			}
		}

		is_even = !is_even;
		if (bit < 4) {
			bit++;
		} else {
			geohash += BASE32[ch];
			bit = 0;
			ch = 0;
		}
	}
	return geohash;
}
