import { bestPosition, type LatLon } from "./geohash";

/** Placeholder kind for a Lightfoot postbox (addressable). Change it here only. */
export const BOX_KIND = 37840;
/** Placeholder kind for a box report: how many letters are waiting (addressable). Change it here only. */
export const REPORT_KIND = 37841;
/** NIP-22 comment: plain guestbook notes on a box. */
export const COMMENT_KIND = 1111;
export const RELAYS = ["wss://relay.trustroots.org", "wss://relay.nomadwiki.org"];
export const EXPIRY_DAYS = 180;
export const DAY_SECONDS = 86_400;

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

export interface Box {
  /** `37840:<pubkey>:<d>` */
  coord: string;
  pubkey: string;
  d: string;
  name: string;
  content: string;
  position: LatLon;
  location?: string;
  hint?: string;
  /** Hosts listed as `p` tags with role "keeper". */
  keepers: string[];
  /** Unix seconds, from NIP-40. */
  expiration?: number;
  createdAt: number;
  event: NostrEvent;
  /** True for the built-in example boxes. */
  sample?: boolean;
}

/** First value of the first tag with this name. */
export function tag(ev: Pick<NostrEvent, "tags">, name: string): string | undefined {
  return ev.tags.find((t) => t[0] === name)?.[1];
}

/** First value of every tag with this name. */
export function tags(ev: Pick<NostrEvent, "tags">, name: string): string[] {
  return ev.tags
    .filter((t) => t[0] === name && typeof t[1] === "string")
    .map((t) => t[1] as string);
}

export function boxCoord(ev: Pick<NostrEvent, "pubkey" | "tags">): string {
  return `${BOX_KIND}:${ev.pubkey}:${tag(ev, "d") ?? ""}`;
}

/** The NIP-40 expiration in unix seconds, if the event has a valid one. */
export function expirationOf(ev: Pick<NostrEvent, "tags">): number | undefined {
  const raw = tag(ev, "expiration");
  if (raw === undefined || !/^\d+$/.test(raw)) return undefined;
  return Number(raw);
}

export function isExpired(ev: Pick<NostrEvent, "tags">, now: number): boolean {
  const x = expirationOf(ev);
  return x !== undefined && x <= now;
}

/** Of all box events, the newest per coordinate (addressable-event replacement). */
export function newestBoxEvents(events: NostrEvent[]): NostrEvent[] {
  const latest = new Map<string, NostrEvent>();
  for (const e of events) {
    if (e.kind !== BOX_KIND || !tag(e, "d")) continue;
    const key = boxCoord(e);
    const prev = latest.get(key);
    if (!prev || prev.created_at < e.created_at) latest.set(key, e);
  }
  return [...latest.values()];
}

/** A typed Box, or null when the event is not a usable, unexpired box. */
export function parseBox(ev: NostrEvent, now: number): Box | null {
  if (ev.kind !== BOX_KIND) return null;
  const d = tag(ev, "d");
  const name = tag(ev, "name");
  if (!d || !name) return null;
  if (isExpired(ev, now)) return null;
  const position = bestPosition(ev.tags);
  if (!position) return null;
  const keepers = ev.tags
    .filter((t) => t[0] === "p" && t[3] === "keeper" && t[1])
    .map((t) => t[1] as string);
  return {
    coord: boxCoord(ev),
    pubkey: ev.pubkey,
    d,
    name,
    content: ev.content,
    position,
    location: tag(ev, "location"),
    hint: tag(ev, "hint"),
    keepers,
    expiration: expirationOf(ev),
    createdAt: ev.created_at,
    event: ev,
  };
}
