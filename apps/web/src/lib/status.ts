import {
  COMMENT_KIND,
  DAY_SECONDS,
  isExpired,
  tag,
  tags,
  type Box,
  type NostrEvent,
} from "./nostr";

export type StatusValue = "letters-waiting" | "empty";
export type Tier = "host" | "steward" | "visitor";

export interface Report {
  event: NostrEvent;
  author: string;
  status: StatusValue;
  tier: Tier;
  createdAt: number;
  content: string;
}

export interface StatusResult {
  state: StatusValue | "differs" | "unknown";
  /** The report that decides the status (or that is contested when state is "differs"). */
  lead?: Report;
  /** The newest report that disagrees with the lead, when state is "differs". */
  dissent?: Report;
  /** Each author's newest report, newest first. */
  reports: Report[];
}

export interface StatusOptions {
  /** Hex pubkeys of stewards. */
  whitelist: ReadonlySet<string>;
  /** Unix seconds. */
  now: number;
}

/** Reports dated further ahead than this are treated as clock errors and dropped. */
export const FUTURE_TOLERANCE_SECONDS = 10 * 60;
/** Visitor-vs-visitor disagreement counts within this window before the lead. */
export const VISITOR_WINDOW_SECONDS = 7 * DAY_SECONDS;

export function isStatusValue(value: unknown): value is StatusValue {
  return value === "letters-waiting" || value === "empty";
}

/** Non-expired comments on a box (status reports and logbook notes), newest first. */
export function commentsForBox(coord: string, comments: NostrEvent[], now: number): NostrEvent[] {
  return comments
    .filter((c) => c.kind === COMMENT_KIND && tags(c, "A").includes(coord) && !isExpired(c, now))
    .sort((a, b) => b.created_at - a.created_at);
}

type BoxIdentity = Pick<Box, "coord" | "pubkey" | "keepers">;

/** host = the box publisher or a keeper; steward = on the whitelist; visitor = anyone else. */
export function tierFor(
  box: Pick<Box, "pubkey" | "keepers">,
  pubkey: string,
  whitelist: ReadonlySet<string>,
): Tier {
  if (pubkey === box.pubkey || box.keepers.includes(pubkey)) return "host";
  return whitelist.has(pubkey) ? "steward" : "visitor";
}

/**
 * Work out whether letters are waiting at a box.
 *
 * Hosts (publisher or keeper) and stewards are trusted; visitors can only move the result to "differs"
 * when they disagree with a trusted report newer than it, or with each other within 7 days.
 */
export function aggregateStatus(
  box: BoxIdentity,
  comments: NostrEvent[],
  { whitelist, now }: StatusOptions,
): StatusResult {
  const tierOf = (pubkey: string): Tier => tierFor(box, pubkey, whitelist);

  // a. drop other boxes, expired and future-dated reports, and anything without a known status
  const newestByAuthor = new Map<string, Report>();
  for (const c of comments) {
    if (c.kind !== COMMENT_KIND) continue;
    if (!tags(c, "A").includes(box.coord)) continue;
    const status = tag(c, "status");
    if (!isStatusValue(status)) continue;
    if (isExpired(c, now)) continue;
    if (c.created_at > now + FUTURE_TOLERANCE_SECONDS) continue;
    // b. keep each author's newest
    const prev = newestByAuthor.get(c.pubkey);
    if (prev && prev.createdAt >= c.created_at) continue;
    newestByAuthor.set(c.pubkey, {
      event: c,
      author: c.pubkey,
      status,
      // c. tier
      tier: tierOf(c.pubkey),
      createdAt: c.created_at,
      content: c.content,
    });
  }
  const reports = [...newestByAuthor.values()].sort((a, b) => b.createdAt - a.createdAt);

  // d. lead: newest trusted, else newest overall
  const lead = reports.find((r) => r.tier !== "visitor") ?? reports[0];
  if (!lead) return { state: "unknown", reports };

  // e. disagreement
  const disagrees = (r: Report) => r.status !== lead.status;
  const dissent =
    lead.tier !== "visitor"
      ? reports.find((r) => r.createdAt > lead.createdAt && disagrees(r))
      : reports.find(
          (r) =>
            r !== lead &&
            r.tier === "visitor" &&
            r.createdAt <= lead.createdAt &&
            r.createdAt >= lead.createdAt - VISITOR_WINDOW_SECONDS &&
            disagrees(r),
        );
  if (dissent) return { state: "differs", lead, dissent, reports };

  // f. the lead's status
  return { state: lead.status, lead, reports };
}
