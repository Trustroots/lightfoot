import NDKCacheAdapterSqliteWasm from '@nostr-dev-kit/cache-sqlite-wasm';
import { NDKNip07Signer, NDKPrivateKeySigner, type NDKCacheAdapter } from '@nostr-dev-kit/ndk';
import { NDKSvelte } from '@nostr-dev-kit/svelte';
import { SvelteSet } from 'svelte/reactivity';
import { BASE_PATH, DEFAULT_RELAYS } from './constants';

let cacheAdapter: NDKCacheAdapter | undefined = $state(undefined);

if (typeof window !== 'undefined') {
	cacheAdapter = new NDKCacheAdapterSqliteWasm({
		dbName: 'lightfoot-ndk',
		useWorker: true,
		workerUrl: `${BASE_PATH}wasm/worker.js`,
		wasmUrl: `${BASE_PATH}wasm/sql-wasm.wasm`
	}) as any;
}

let selectedRelayUrls = new SvelteSet(DEFAULT_RELAYS);
export const availableRelays = DEFAULT_RELAYS;

export let signer: {
	state: 'initialized' | 'pending' | 'error';
	instance: NDKPrivateKeySigner | NDKNip07Signer | undefined;
} = $state({
	state: 'pending',
	instance: undefined
});

export const ndk = new NDKSvelte({
	explicitRelayUrls: Array.from(selectedRelayUrls),
	autoConnectUserRelays: true,
	cacheAdapter
});

// @todo Test NIP-07
export async function initializeSigner() {
	if (signer.instance) return signer.instance;

	signer.state = 'pending';

	try {
		const setSigner = (newSigner: NDKPrivateKeySigner | NDKNip07Signer) => {
			signer.instance = newSigner;
			ndk.signer = signer.instance;
			signer.state = 'initialized';
			return signer.instance;
		};

		if (window.nostr) {
			try {
				const nip07Signer = new NDKNip07Signer();
				await nip07Signer.blockUntilReady();
				return setSigner(nip07Signer);
			} catch (e) {
				console.warn('Failed to initialize NIP-07 signer, falling back to private key signer.', e);
			}
		}

		const storedSigner = localStorage.getItem('lightfoot:signer');
		if (storedSigner) {
			return setSigner(await NDKPrivateKeySigner.fromPayload(storedSigner, ndk));
		}

		const ncryptsec = localStorage.getItem('lightfoot:ncryptsec');
		if (ncryptsec) {
			return setSigner(NDKPrivateKeySigner.fromNcryptsec(ncryptsec, 'password', ndk));
		}

		const privateKeySigner = NDKPrivateKeySigner.generate();
		localStorage.setItem('lightfoot:signer', privateKeySigner.toPayload());
		return setSigner(privateKeySigner);
	} catch (e) {
		signer.instance = undefined;
		signer.state = 'error';
		console.error(e);
	}
}

export async function resetSigner() {
	localStorage.removeItem('lightfoot:signer');
	localStorage.removeItem('lightfoot:ncryptsec');
	signer.instance = undefined;
	return initializeSigner();
}

(async () => {
	if (typeof window === 'undefined') return;

	if (cacheAdapter) {
		console.log(
			`Setting up NDK Sqlite WASM Cache Adapter, ${cacheAdapter ? 'success' : 'failed'} – ${JSON.stringify(cacheAdapter)}`
		);
		await cacheAdapter?.initializeAsync?.(ndk);
	}

	await ndk.connect().then(() => console.log('NDK Connected'));

	initializeSigner().then((signer) => {
		console.log('NDK Signer initialized:', signer);
	});
})();
