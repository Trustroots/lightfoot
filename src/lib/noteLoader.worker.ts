import NDKCacheAdapterSqliteWasm from '@nostr-dev-kit/cache-sqlite-wasm';
import type { NDKCacheAdapter } from '@nostr-dev-kit/ndk';
import NDK from '@nostr-dev-kit/ndk';
import { BASE_PATH, DEFAULT_FILTERS, DEFAULT_RELAYS } from './constants';

const BATCH_SIZE = 500;
const LIMIT = Number.MAX_SAFE_INTEGER; // 9007199254740991

const selectedRelayUrls = new Set(DEFAULT_RELAYS);
export const availableRelays = DEFAULT_RELAYS;

/**
 * @todo The problem with the cache in the background worker seems to be either:
 * a) the IndexedDB is persisted only after the final save in SQLite is done; this might take a while.
 * b) a cache needs to be properly initialized before the background worker runs (i.e. reload once?)
 * */
const cacheAdapter: NDKCacheAdapter = new NDKCacheAdapterSqliteWasm({
  dbName: 'lightfoot-ndk',
  useWorker: true,
  workerUrl: `${BASE_PATH}wasm/worker.js`,
  wasmUrl: `${BASE_PATH}wasm/sql-wasm.wasm`,
}) as any;

export const ndk = new NDK({
  explicitRelayUrls: Array.from(selectedRelayUrls),
  autoConnectUserRelays: true,
  cacheAdapter,
});
(async () => {
  await ndk
    .connect()
    .then(() =>
      self.postMessage({ type: 'log', message: 'Web Worker: NDK Connected' })
    );

  await cacheAdapter.initializeAsync?.(ndk);

  /** @todo Check if with new fixes, the subscription will work again (allows us to communicate progress) */
  const events = await ndk.fetchEvents({
    ...DEFAULT_FILTERS,
    limit: LIMIT,
  });

  const batchedEvents = [];
  for (const event of events) {
    batchedEvents.push(event.rawEvent());
  }

  self.postMessage({ type: 'done', items: JSON.stringify(batchedEvents) });
})();
