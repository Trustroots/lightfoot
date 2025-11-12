import { verifiedPubkeys } from './ndk.svelte';

/**
 * Check if a given pubkey is part of the verified set.
 *
 * Used in:
 * - [`src/lib/processors/LightfootBoxProcessor.ts`](src/lib/processors/LightfootBoxProcessor.ts:1) as `isPubkeyVerified(pubkey)`.
 *
 * Behavior:
 * - Returns true if the pubkey is in the verified set.
 * - Pubkeys are treated case-sensitively to match Nostr pubkey semantics.
 */
export function isPubkeyVerified(pubkey: string): boolean {
  return (verifiedPubkeys as Set<string>).has(pubkey);
}
