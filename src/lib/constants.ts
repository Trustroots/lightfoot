// Use empty base path - custom domain serves from root
export const BASE_PATH = '/';
export const DEFAULT_RELAYS = ['wss://relay.nomadwiki.org', 'wss://relay.trustroots.org'];
export const DEFAULT_KINDS = [1];
export const DEFAULT_FILTERS = {
	kinds: DEFAULT_KINDS as any[],
	'#t': ['lightfoot']
	// This will result in too few results.
	// '#g': [...'0123456789bcdefghjkmnpqrstuvwxyz']
};
