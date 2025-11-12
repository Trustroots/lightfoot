// Use empty base path - custom domain serves from root
export const BASE_PATH = '/';
export const DEFAULT_RELAYS = [
  'wss://relay.nomadwiki.org',
  'wss://relay.trustroots.org',
];
export const DEFAULT_KINDS = [1];
export const DEFAULT_FILTERS = {
  kinds: DEFAULT_KINDS as number[],
  '#t': ['lightfoot'],
  // This will result in too few results.
  // '#g': [...'0123456789bcdefghjkmnpqrstuvwxyz']
};

function parseVerifiedPubkeys(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

/**
 * Comma-separated list of pubkeys injected via Vite environment variables.
 * Example:
 *   VITE_VERIFIED_PUBKEYS=abcdef...,123456...
 */
const ENV_VERIFIED_PUBKEYS = parseVerifiedPubkeys(
  import.meta.env.VITE_VERIFIED_PUBKEYS
);

/**
 * Pubkeys that are authorized to publish/sign Lightfoot events.
 * Extend this array to add more verified operators.
 */
export const VERIFIED_PUBKEYS: readonly string[] = ENV_VERIFIED_PUBKEYS;

const URL_PARAM_ALLOW_UNVERIFIED = 'allowUnverified';

export function getShowVerifiedOnlyFromSearchParams(
  searchParams: URLSearchParams
): boolean {
  const allowUnverifiedRaw = searchParams.get(URL_PARAM_ALLOW_UNVERIFIED);

  if (allowUnverifiedRaw === null) {
    // Default: verified-only ON when param is absent
    return true;
  }

  // Only a strict "true" turns OFF verified-only
  return allowUnverifiedRaw.toLowerCase() !== 'true';
}

export function updateSearchParamsForShowVerifiedOnly(
  url: URL,
  showVerifiedOnly: boolean
): void {
  const searchParams = url.searchParams;

  if (showVerifiedOnly) {
    // Default behavior: do not persist explicit param
    searchParams.delete(URL_PARAM_ALLOW_UNVERIFIED);
  } else {
    // Opt-in to show unverified entries
    searchParams.set(URL_PARAM_ALLOW_UNVERIFIED, 'true');
  }
}
