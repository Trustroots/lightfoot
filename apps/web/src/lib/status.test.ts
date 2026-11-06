import { describe, expect, it } from "vitest";
import { BOX_KIND, COMMENT_KIND, DAY_SECONDS, REPORT_KIND, type NostrEvent } from "./nostr";
import { aggregateStatus, commentsForBox, tierFor } from "./status";

const NOW = 1_800_000_000;
const PUBLISHER = "aa".repeat(32);
const KEEPER = "bb".repeat(32);
const STEWARD = "cc".repeat(32);
const V1 = "d1".repeat(32);
const V2 = "d2".repeat(32);
const COORD = `${BOX_KIND}:${PUBLISHER}:box-1`;
const box = { coord: COORD, pubkey: PUBLISHER, keepers: [KEEPER] };
const whitelist = new Set([STEWARD]);
const opts = { whitelist, now: NOW };

let counter = 0;
/** A kind 37841 report. `count` may be a number or a raw string; use "waiting"/0 shorthand via W/E. */
function report(
  pubkey: string,
  count: number | string | null,
  ageDays: number,
  extra: { d?: string; tags?: string[][]; ageSeconds?: number; kind?: number } = {},
): NostrEvent {
  const created = NOW - (extra.ageSeconds ?? Math.round(ageDays * DAY_SECONDS));
  const coord = extra.d ?? COORD;
  return {
    id: `r${++counter}`,
    kind: extra.kind ?? REPORT_KIND,
    pubkey,
    created_at: created,
    content: "",
    tags: [
      ["d", coord],
      ["a", coord],
      ...(count === null ? [] : [["count", String(count)]]),
      ...(extra.tags ?? []),
      ["expiration", String(created + 180 * DAY_SECONDS)],
    ],
  };
}

function note(pubkey: string, ageDays: number, tags: string[][] = [["A", COORD]]): NostrEvent {
  return {
    id: `n${++counter}`,
    kind: COMMENT_KIND,
    pubkey,
    created_at: NOW - Math.round(ageDays * DAY_SECONDS),
    content: "hi",
    tags: [...tags, ["K", String(BOX_KIND)]],
  };
}

describe("aggregateStatus", () => {
  it("is unknown without reports", () => {
    const r = aggregateStatus(box, [], opts);
    expect(r.state).toBe("unknown");
    expect(r.reports).toEqual([]);
    expect(r.lead).toBeUndefined();
  });

  it("uses a lone publisher report", () => {
    const r = aggregateStatus(box, [report(PUBLISHER, 2, 2)], opts);
    expect(r.state).toBe("letters-waiting");
    expect(r.lead?.tier).toBe("host");
  });

  it("treats a keeper as a host", () => {
    const r = aggregateStatus(box, [report(KEEPER, 0, 1)], opts);
    expect(r.state).toBe("empty");
    expect(r.lead?.tier).toBe("host");
  });

  it("prefers the publisher over a newer steward that agrees", () => {
    const pub = report(PUBLISHER, 2, 5);
    const r = aggregateStatus(box, [pub, report(STEWARD, 3, 1)], opts);
    expect(r.state).toBe("letters-waiting");
    expect(r.lead?.event.id).toBe(pub.id);
    expect(r.count).toBe(2);
    expect(r.dissent).toBeUndefined();
  });

  it("prefers the publisher over a newer steward, but says differs when they disagree", () => {
    const pub = report(PUBLISHER, 2, 5);
    const stew = report(STEWARD, 0, 1);
    const r = aggregateStatus(box, [stew, pub], opts);
    expect(r.state).toBe("differs");
    expect(r.lead?.event.id).toBe(pub.id);
    expect(r.dissent?.event.id).toBe(stew.id);
  });

  it("leads with the newest steward when no host reported", () => {
    const r = aggregateStatus(box, [report(STEWARD, 0, 3), report(V1, 0, 1)], opts);
    expect(r.lead?.tier).toBe("steward");
    expect(r.state).toBe("empty");
  });

  it("compares states, not counts", () => {
    const r = aggregateStatus(box, [report(PUBLISHER, 1, 5), report(V1, 4, 1)], opts);
    expect(r.state).toBe("letters-waiting");
    expect(r.count).toBe(1);
  });

  it("treats count 0 as empty and exposes the lead's count", () => {
    const r = aggregateStatus(box, [report(PUBLISHER, 0, 1)], opts);
    expect(r.state).toBe("empty");
    expect(r.count).toBe(0);
  });

  it("ignores a bad count", () => {
    const bad = ["abc", "-1", "1.5", "", "12345", " 3"];
    const reports = bad.map((c) => report(PUBLISHER, c, 1));
    reports.push(report(V1, null, 1));
    const r = aggregateStatus(box, reports, opts);
    expect(r.state).toBe("unknown");
    expect(r.reports).toEqual([]);
  });

  it("ignores a report with the wrong d", () => {
    const other = report(PUBLISHER, 2, 1, { d: `${BOX_KIND}:${PUBLISHER}:other` });
    expect(aggregateStatus(box, [other], opts).state).toBe("unknown");
  });

  it("ignores events of other kinds", () => {
    const wrong = report(PUBLISHER, 2, 1, { kind: COMMENT_KIND });
    expect(aggregateStatus(box, [wrong], opts).state).toBe("unknown");
  });

  it("lets a trusted report win over a newer agreeing visitor", () => {
    const r = aggregateStatus(box, [report(PUBLISHER, 0, 5), report(V1, 0, 1)], opts);
    expect(r.state).toBe("empty");
    expect(r.lead?.tier).toBe("host");
  });

  it("says differs when a newer visitor disagrees with the trusted lead", () => {
    const pub = report(PUBLISHER, 2, 5);
    const vis = report(V1, 0, 1);
    const r = aggregateStatus(box, [pub, vis], opts);
    expect(r.state).toBe("differs");
    expect(r.lead?.event.id).toBe(pub.id);
    expect(r.dissent?.event.id).toBe(vis.id);
  });

  it("ignores an older visitor who disagrees with a trusted report", () => {
    const r = aggregateStatus(box, [report(V1, 0, 5), report(PUBLISHER, 2, 1)], opts);
    expect(r.state).toBe("letters-waiting");
    expect(r.dissent).toBeUndefined();
  });

  it("picks the newest dissenting visitor", () => {
    const pub = report(PUBLISHER, 2, 10);
    const older = report(V1, 0, 5);
    const newer = report(V2, 0, 2);
    const r = aggregateStatus(box, [pub, older, newer], opts);
    expect(r.state).toBe("differs");
    expect(r.dissent?.event.id).toBe(newer.id);
  });

  it("uses the newest visitor when only visitors report", () => {
    const r = aggregateStatus(box, [report(V1, 0, 20), report(V2, 2, 1)], opts);
    // V1 is 19 days before V2, outside the 7 day window
    expect(r.state).toBe("letters-waiting");
    expect(r.lead?.tier).toBe("visitor");
    expect(r.dissent).toBeUndefined();
  });

  it("says differs when two visitors disagree within 7 days", () => {
    const lead = report(V2, 2, 1);
    const other = report(V1, 0, 5);
    const r = aggregateStatus(box, [other, lead], opts);
    expect(r.state).toBe("differs");
    expect(r.lead?.event.id).toBe(lead.id);
    expect(r.dissent?.event.id).toBe(other.id);
  });

  it("does not say differs when two visitors agree", () => {
    const r = aggregateStatus(box, [report(V1, 0, 5), report(V2, 0, 1)], opts);
    expect(r.state).toBe("empty");
  });

  it("counts a visitor exactly 7 days before the lead", () => {
    const lead = report(V2, 2, 1);
    const other = report(V1, 0, 8);
    const r = aggregateStatus(box, [other, lead], opts);
    expect(r.state).toBe("differs");
  });

  it("counts only each author's newest report", () => {
    const r = aggregateStatus(
      box,
      [report(PUBLISHER, 2, 10), report(PUBLISHER, 0, 3), report(PUBLISHER, 2, 20)],
      opts,
    );
    expect(r.state).toBe("empty");
    expect(r.reports).toHaveLength(1);
  });

  it("does not let a visitor's older disagreeing report resurface after their newer one agrees", () => {
    const r = aggregateStatus(
      box,
      [report(PUBLISHER, 0, 3), report(V1, 2, 4), report(V1, 0, 1)],
      opts,
    );
    expect(r.state).toBe("empty");
  });

  it("drops expired reports", () => {
    const expired = report(PUBLISHER, 2, 2, {
      tags: [["expiration", String(NOW - 1)]],
    });
    const r = aggregateStatus(box, [expired], opts);
    expect(r.state).toBe("unknown");
  });

  it("falls back to an older unexpired report from the same author when the newest is expired", () => {
    // Per rule b the newest is picked after dropping expired ones.
    const expired = report(PUBLISHER, 2, 1, {
      tags: [["expiration", String(NOW - 1)]],
    });
    const valid = report(PUBLISHER, 0, 3);
    expect(aggregateStatus(box, [expired, valid], opts).state).toBe("empty");
  });

  it("drops reports dated more than 10 minutes in the future", () => {
    const future = report(PUBLISHER, 2, 0, { ageSeconds: -11 * 60 });
    const slightlyAhead = report(STEWARD, 0, 0, { ageSeconds: -5 * 60 });
    expect(aggregateStatus(box, [future], opts).state).toBe("unknown");
    expect(aggregateStatus(box, [slightlyAhead], opts).state).toBe("empty");
  });

  it("lists per-author newest reports with tiers, newest first", () => {
    const r = aggregateStatus(
      box,
      [report(V1, 0, 1), report(PUBLISHER, 0, 3), report(STEWARD, 0, 2)],
      opts,
    );
    expect(r.reports.map((x) => x.tier)).toEqual(["visitor", "steward", "host"]);
  });

  it("ranks a publisher on the whitelist as host", () => {
    const wl = new Set([PUBLISHER]);
    const r = aggregateStatus(box, [report(PUBLISHER, 0, 1)], { whitelist: wl, now: NOW });
    expect(r.reports[0]?.tier).toBe("host");
  });
});

describe("commentsForBox", () => {
  it("keeps non-expired plain comments on the box, newest first, and ignores reports", () => {
    const a = note(V1, 5);
    const b = note(PUBLISHER, 1);
    const c = note(V1, 2, [
      ["A", COORD],
      ["expiration", String(NOW - 1)],
    ]);
    const d = note(V1, 2, [["A", `${BOX_KIND}:x:y`]]);
    const r = report(V1, 1, 1);
    expect(commentsForBox(COORD, [a, b, c, d, r], NOW).map((e) => e.id)).toEqual([b.id, a.id]);
  });
});

describe("tierFor", () => {
  it("ranks publisher and keepers as host, the whitelist as steward, anyone else as visitor", () => {
    expect(tierFor(box, PUBLISHER, whitelist)).toBe("host");
    expect(tierFor(box, KEEPER, whitelist)).toBe("host");
    expect(tierFor(box, STEWARD, whitelist)).toBe("steward");
    expect(tierFor(box, V1, whitelist)).toBe("visitor");
  });
});
