import {
  COMMENT_KIND,
  DAY_SECONDS,
  REPORT_KIND,
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
  /** From the count: more than zero letters waiting, or empty. */
  state: StatusValue;
  /** Letters waiting. */
  count: number;
  tier: Tier;
  createdAt: number;
  content: string;
}

export interface StatusResult {
  state: StatusValue | "differs" | "unknown";
  /** The report that decides the status (or that is contested when state is "differs"). */
  lead?: Report;
  /** The lead's count of letters waiting. */
  count?: number;
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

/** The state a count stands for. */
export function stateOfCount(count: number): StatusValue {
  return count > 0 ? "letters-waiting" : "empty";
}

/** The count of a report event, or undefined unless it is a plain integer of 1 to 4 digits. */
export function countOf(ev: Pick<NostrEvent, "tags">): number | undefined {
  const raw = tag(ev, "count");
  return raw !== undefined && /^\d{1,4}$/.test(raw) ? Number(raw) : undefined;
}

/** Non-expired plain comments on a box (guestbook notes), newest first. */
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

/** A valid report for this box, or null: right kind, `d` is the box coordinate, good count, not expired, not from the future. */
export function parseReport(
  box: BoxIdentity,
  ev: NostrEvent,
  { whitelist, now }: StatusOptions,
): Report | null {
  if (ev.kind !== REPORT_KIND) return null;
  if (tag(ev, "d") !== box.coord) return null;
  const count = countOf(ev);
  if (count === undefined) return null;
  if (isExpired(ev, now)) return null;
  if (ev.created_at > now + FUTURE_TOLERANCE_SECONDS) return null;
  return {
    event: ev,
    author: ev.pubkey,
    state: stateOfCount(count),
    count,
    tier: tierFor(box, ev.pubkey, whitelist),
    createdAt: ev.created_at,
    content: ev.content,
  };
}

/**
 * Work out whether letters are waiting at a box.
 *
 * The box host's report leads (publisher or keeper), else the newest steward's, else the newest
 * visitor's. A newer report that disagrees with a host or steward lead makes the result "differs";
 * so do two visitors who disagree within 7 days. States are compared, not exact counts.
 */
export function aggregateStatus(
  box: BoxIdentity,
  reportEvents: NostrEvent[],
  options: StatusOptions,
): StatusResult {
  // a. drop invalid, expired and future-dated reports; b. keep each author's newest
  const newestByAuthor = new Map<string, Report>();
  for (const ev of reportEvents) {
    const report = parseReport(box, ev, options);
    if (!report) continue;
    const prev = newestByAuthor.get(report.author);
    if (prev && prev.createdAt >= report.createdAt) continue;
    newestByAuthor.set(report.author, report);
  }
  const reports = [...newestByAuthor.values()].sort((a, b) => b.createdAt - a.createdAt);

  // c. lead: newest host, else newest steward, else newest visitor
  const lead =
    reports.find((r) => r.tier === "host") ??
    reports.find((r) => r.tier === "steward") ??
    reports[0];
  if (!lead) return { state: "unknown", reports };

  // d. disagreement
  const disagrees = (r: Report) => r.state !== lead.state;
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
  if (dissent) return { state: "differs", lead, count: lead.count, dissent, reports };

  // e. the lead's state
  return { state: lead.state, lead, count: lead.count, reports };
}
