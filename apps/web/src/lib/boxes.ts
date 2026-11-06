import type { LatLon } from "./geohash";
import { newestBoxEvents, parseBox, type Box, type NostrEvent } from "./nostr";
import { aggregateStatus, commentsForBox, type Report, type StatusResult } from "./status";

/** One line of a box's guestbook: a plain note, or a report with its count. */
export type GuestbookEntry =
  | { type: "note"; event: NostrEvent }
  | { type: "report"; event: NostrEvent; report: Report };

export interface BoxViewModel {
  box: Box;
  position: LatLon;
  status: StatusResult;
  /** Notes and each author's newest valid report, newest first. */
  guestbook: GuestbookEntry[];
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
  reports: NostrEvent[],
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
    const status = aggregateStatus(box, reports, { whitelist, now });
    const guestbook: GuestbookEntry[] = [
      ...commentsForBox(box.coord, comments, now).map((event): GuestbookEntry => ({
        type: "note",
        event,
      })),
      ...status.reports.map((report): GuestbookEntry => ({
        type: "report",
        event: report.event,
        report,
      })),
    ].sort((a, b) => b.event.created_at - a.event.created_at);
    out.push({
      box,
      position: box.position,
      status,
      guestbook,
      known,
      sample,
    });
  }
  return out;
}
