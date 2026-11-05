import type { LatLon } from "./geohash";
import { newestBoxEvents, parseBox, type Box, type NostrEvent } from "./nostr";
import { aggregateStatus, commentsForBox, type StatusResult } from "./status";

export interface BoxViewModel {
  box: Box;
  position: LatLon;
  status: StatusResult;
  /** Every non-expired comment on the box (reports and notes), newest first. */
  logbook: NostrEvent[];
  /** The box's publisher is a steward. */
  known: boolean;
  /** Built-in example data. */
  sample: boolean;
}

export interface ProjectOptions {
  showEveryone: boolean;
  /** Hex pubkeys of stewards. */
  whitelist: ReadonlySet<string>;
  /** Unix seconds. */
  now: number;
  /** Mark everything as example data. */
  sample?: boolean;
}

export function project(
  boxEvents: NostrEvent[],
  comments: NostrEvent[],
  { showEveryone, whitelist, now, sample = false }: ProjectOptions,
): BoxViewModel[] {
  const out: BoxViewModel[] = [];
  for (const ev of newestBoxEvents(boxEvents)) {
    const parsed = parseBox(ev, now);
    if (!parsed) continue;
    const known = whitelist.has(parsed.pubkey);
    if (!known && !showEveryone) continue;
    const box: Box = sample ? { ...parsed, sample: true } : parsed;
    out.push({
      box,
      position: box.position,
      status: aggregateStatus(box, comments, { whitelist, now }),
      logbook: commentsForBox(box.coord, comments, now),
      known,
      sample,
    });
  }
  return out;
}
