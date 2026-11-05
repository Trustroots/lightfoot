import { describe, expect, it } from "vitest";
import { BOX_KIND, COMMENT_KIND, DAY_SECONDS, type NostrEvent } from "./nostr";
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
function report(
  pubkey: string,
  status: string | null,
  ageDays: number,
  extra: { a?: string; tags?: string[][]; ageSeconds?: number } = {},
): NostrEvent {
  const created = NOW - (extra.ageSeconds ?? Math.round(ageDays * DAY_SECONDS));
  return {
    id: `r${++counter}`,
    kind: COMMENT_KIND,
    pubkey,
    created_at: created,
    content: "",
    tags: [
      ["A", extra.a ?? COORD],
      ["K", String(BOX_KIND)],
      ...(status === null ? [] : [["status", status]]),
      ...(extra.tags ?? []),
    ],
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
    const r = aggregateStatus(box, [report(PUBLISHER, "letters-waiting", 2)], opts);
    expect(r.state).toBe("letters-waiting");
    expect(r.lead?.tier).toBe("host");
  });

  it("treats a keeper as a host", () => {
    const r = aggregateStatus(box, [report(KEEPER, "empty", 1)], opts);
    expect(r.state).toBe("empty");
    expect(r.lead?.tier).toBe("host");
  });

  it("lets a newer steward override the publisher", () => {
    const r = aggregateStatus(
      box,
      [report(PUBLISHER, "letters-waiting", 5), report(STEWARD, "empty", 1)],
      opts,
    );
    expect(r.state).toBe("empty");
    expect(r.lead?.tier).toBe("steward");
    expect(r.dissent).toBeUndefined();
  });

  it("lets a trusted report win over a newer agreeing visitor", () => {
    const r = aggregateStatus(box, [report(PUBLISHER, "empty", 5), report(V1, "empty", 1)], opts);
    expect(r.state).toBe("empty");
    expect(r.lead?.tier).toBe("host");
  });

  it("says differs when a newer visitor disagrees with the trusted lead", () => {
    const pub = report(PUBLISHER, "letters-waiting", 5);
    const vis = report(V1, "empty", 1);
    const r = aggregateStatus(box, [pub, vis], opts);
    expect(r.state).toBe("differs");
    expect(r.lead?.event.id).toBe(pub.id);
    expect(r.dissent?.event.id).toBe(vis.id);
  });

  it("ignores an older visitor who disagrees with a trusted report", () => {
    const r = aggregateStatus(
      box,
      [report(V1, "empty", 5), report(PUBLISHER, "letters-waiting", 1)],
      opts,
    );
    expect(r.state).toBe("letters-waiting");
    expect(r.dissent).toBeUndefined();
  });

  it("picks the newest dissenting visitor", () => {
    const pub = report(PUBLISHER, "letters-waiting", 10);
    const older = report(V1, "empty", 5);
    const newer = report(V2, "empty", 2);
    const r = aggregateStatus(box, [pub, older, newer], opts);
    expect(r.state).toBe("differs");
    expect(r.dissent?.event.id).toBe(newer.id);
  });

  it("uses the newest visitor when only visitors report", () => {
    const r = aggregateStatus(
      box,
      [report(V1, "empty", 20), report(V2, "letters-waiting", 1)],
      opts,
    );
    // V1 is 19 days before V2, outside the 7 day window
    expect(r.state).toBe("letters-waiting");
    expect(r.lead?.tier).toBe("visitor");
    expect(r.dissent).toBeUndefined();
  });

  it("says differs when two visitors disagree within 7 days", () => {
    const lead = report(V2, "letters-waiting", 1);
    const other = report(V1, "empty", 5);
    const r = aggregateStatus(box, [other, lead], opts);
    expect(r.state).toBe("differs");
    expect(r.lead?.event.id).toBe(lead.id);
    expect(r.dissent?.event.id).toBe(other.id);
  });

  it("does not say differs when two visitors agree", () => {
    const r = aggregateStatus(box, [report(V1, "empty", 5), report(V2, "empty", 1)], opts);
    expect(r.state).toBe("empty");
  });

  it("counts a visitor exactly 7 days before the lead", () => {
    const lead = report(V2, "letters-waiting", 1);
    const other = report(V1, "empty", 8);
    const r = aggregateStatus(box, [other, lead], opts);
    expect(r.state).toBe("differs");
  });

  it("counts only each author's newest report", () => {
    const r = aggregateStatus(
      box,
      [
        report(PUBLISHER, "letters-waiting", 10),
        report(PUBLISHER, "empty", 3),
        report(PUBLISHER, "letters-waiting", 20),
      ],
      opts,
    );
    expect(r.state).toBe("empty");
    expect(r.reports).toHaveLength(1);
  });

  it("does not let a visitor's older disagreeing report resurface after their newer one agrees", () => {
    const r = aggregateStatus(
      box,
      [report(PUBLISHER, "empty", 3), report(V1, "letters-waiting", 4), report(V1, "empty", 1)],
      opts,
    );
    expect(r.state).toBe("empty");
  });

  it("drops expired reports", () => {
    const expired = report(PUBLISHER, "letters-waiting", 2, {
      tags: [["expiration", String(NOW - 1)]],
    });
    const r = aggregateStatus(box, [expired], opts);
    expect(r.state).toBe("unknown");
  });

  it("falls back to an older unexpired report from the same author when the newest is expired", () => {
    // Per rule b the newest is picked after dropping expired ones.
    const expired = report(PUBLISHER, "letters-waiting", 1, {
      tags: [["expiration", String(NOW - 1)]],
    });
    const valid = report(PUBLISHER, "empty", 3);
    expect(aggregateStatus(box, [expired, valid], opts).state).toBe("empty");
  });

  it("drops reports dated more than 10 minutes in the future", () => {
    const future = report(PUBLISHER, "letters-waiting", 0, { ageSeconds: -11 * 60 });
    const slightlyAhead = report(STEWARD, "empty", 0, { ageSeconds: -5 * 60 });
    expect(aggregateStatus(box, [future], opts).state).toBe("unknown");
    expect(aggregateStatus(box, [slightlyAhead], opts).state).toBe("empty");
  });

  it("ignores reports whose A tag does not match the box", () => {
    const other = report(PUBLISHER, "letters-waiting", 1, { a: `${BOX_KIND}:${PUBLISHER}:other` });
    expect(aggregateStatus(box, [other], opts).state).toBe("unknown");
  });

  it("ignores unknown status values and comments without a status", () => {
    const r = aggregateStatus(
      box,
      [report(PUBLISHER, "full", 1), report(STEWARD, null, 1), report(V1, "", 1)],
      opts,
    );
    expect(r.state).toBe("unknown");
    expect(r.reports).toEqual([]);
  });

  it("lists per-author newest reports with tiers, newest first", () => {
    const r = aggregateStatus(
      box,
      [report(V1, "empty", 1), report(PUBLISHER, "empty", 3), report(STEWARD, "empty", 2)],
      opts,
    );
    expect(r.reports.map((x) => x.tier)).toEqual(["visitor", "steward", "host"]);
  });

  it("ranks a publisher on the whitelist as host", () => {
    const wl = new Set([PUBLISHER]);
    const r = aggregateStatus(box, [report(PUBLISHER, "empty", 1)], { whitelist: wl, now: NOW });
    expect(r.reports[0]?.tier).toBe("host");
  });
});

describe("commentsForBox", () => {
  it("keeps non-expired comments on the box, newest first, including notes", () => {
    const a = report(V1, null, 5);
    const b = report(PUBLISHER, "empty", 1);
    const c = report(V1, "empty", 2, { tags: [["expiration", String(NOW - 1)]] });
    const d = report(V1, "empty", 2, { a: "30404:x:y" });
    expect(commentsForBox(COORD, [a, b, c, d], NOW).map((e) => e.id)).toEqual([b.id, a.id]);
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
