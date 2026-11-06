import { nip19 } from "nostr-tools";

export interface Steward {
  /** bech32 `npub1...` */
  npub: string;
  label: string;
}

export interface Whitelist {
  /** Hex pubkeys of the stewards. */
  pubkeys: ReadonlySet<string>;
  /** Hex pubkey to label. */
  labels: ReadonlyMap<string, string>;
}

/**
 * The people who can put boxes on the map and whose reports count as trusted.
 * Entries that do not decode are skipped (with a warning in dev).
 */
export const STEWARDS: Steward[] = [
  // TODO: replace with Kasper's real npub. Skipped until then because it does not decode.
  { npub: "npub1kasperplaceholder", label: "Kasper (placeholder)" },
];

export { CREW_NPUB } from "./crew";

/** `VITE_STEWARD_NPUBS=npub1...,npub1...` adds entries without editing the config. */
export function parseEnvStewards(raw: string | undefined): Steward[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((npub) => ({ npub, label: "env" }));
}

export function resolveStewards(entries: Steward[]): Whitelist {
  const pubkeys = new Set<string>();
  const labels = new Map<string, string>();
  for (const entry of entries) {
    try {
      const decoded = nip19.decode(entry.npub);
      if (decoded.type !== "npub") throw new Error(`expected npub, got ${decoded.type}`);
      pubkeys.add(decoded.data);
      labels.set(decoded.data, entry.label);
    } catch {
      if (import.meta.env?.DEV) {
        console.warn(`Skipping steward "${entry.label}": "${entry.npub}" is not a valid npub.`);
      }
    }
  }
  return { pubkeys, labels };
}

/** The app's whitelist: configured stewards plus any from VITE_STEWARD_NPUBS. */
export function getWhitelist(): Whitelist {
  return resolveStewards([
    ...STEWARDS,
    ...parseEnvStewards(import.meta.env?.VITE_STEWARD_NPUBS as string | undefined),
  ]);
}

/* The "show everyone" toggle lives in the URL: `?everyone=1` (old links used `?allowUnverified=true`). */

export function readShowEveryone(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("everyone") === "1" || params.get("allowUnverified") === "true";
}

/** Returns the new search string (with a leading "?", or "" when empty). */
export function writeShowEveryone(search: string, on: boolean): string {
  const params = new URLSearchParams(search);
  params.delete("allowUnverified");
  params.delete("everyone");
  if (on) params.set("everyone", "1");
  const out = params.toString();
  return out ? `?${out}` : "";
}
