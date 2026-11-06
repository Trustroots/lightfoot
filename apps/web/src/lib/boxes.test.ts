import { describe, expect, it } from "vitest";
import { project } from "./boxes";
import { gTags } from "./geohash";
import { BOX_KIND, COMMENT_KIND, DAY_SECONDS, REPORT_KIND, type NostrEvent } from "./nostr";

const NOW = 1_800_000_000;
const STEWARD = "aa".repeat(32);
const STRANGER = "bb".repeat(32);
const VISITOR = "cc".repeat(32);
const whitelist = new Set([STEWARD]);

let n = 0;
function boxEvent(pubkey: string, d: string, ageDays = 1): NostrEvent {
  return {
    id: `b${++n}`,
    kind: BOX_KIND,
    pubkey,
    created_at: NOW - ageDays * DAY_SECONDS,
    content: "",
    tags: [["d", d], ["name", d], ...gTags(52.5, 13.4)],
  };
}
function report(coord: string, pubkey: string, count: number, ageDays: number): NostrEvent {
  return {
    id: `r${++n}`,
    kind: REPORT_KIND,
    pubkey,
    created_at: NOW - ageDays * DAY_SECONDS,
    content: "",
    tags: [
      ["d", coord],
      ["a", coord],
      ["count", String(count)],
    ],
  };
}
function comment(coord: string, pubkey: string, ageDays: number): NostrEvent {
  return {
    id: `c${++n}`,
    kind: COMMENT_KIND,
    pubkey,
    created_at: NOW - ageDays * DAY_SECONDS,
    content: "hello",
    tags: [["A", coord]],
  };
}

describe("project", () => {
  const known = boxEvent(STEWARD, "known");
  const unknown = boxEvent(STRANGER, "unknown");
  const knownCoord = `${BOX_KIND}:${STEWARD}:known`;
  const unknownCoord = `${BOX_KIND}:${STRANGER}:unknown`;

  it("shows only steward boxes by default", () => {
    const vms = project([known, unknown], [], [], { showEveryone: false, whitelist, now: NOW });
    expect(vms.map((v) => v.box.d)).toEqual(["known"]);
    expect(vms[0]?.known).toBe(true);
    expect(vms[0]?.position.lat).toBeCloseTo(52.5, 2);
  });

  it("shows everyone's boxes when asked, marking them not known", () => {
    const vms = project([known, unknown], [], [], { showEveryone: true, whitelist, now: NOW });
    expect(vms.map((v) => [v.box.d, v.known]).sort()).toEqual([
      ["known", true],
      ["unknown", false],
    ]);
  });

  it("counts reports from anyone, with tiers, even when everyone is hidden", () => {
    const reports = [report(knownCoord, STEWARD, 2, 3), report(knownCoord, VISITOR, 0, 1)];
    const [vm] = project([known], reports, [], { showEveryone: false, whitelist, now: NOW });
    expect(vm?.status.state).toBe("differs");
    expect(vm?.status.reports.map((r) => r.tier)).toEqual(["visitor", "host"]);
  });

  it("builds the guestbook from notes and reports, newest first", () => {
    const reports = [report(knownCoord, STEWARD, 1, 1), report(unknownCoord, VISITOR, 1, 1)];
    const comments = [
      comment(knownCoord, VISITOR, 5),
      comment(knownCoord, VISITOR, 0.5),
      comment(unknownCoord, VISITOR, 1),
    ];
    const [vm] = project([known, unknown], reports, comments, {
      showEveryone: false,
      whitelist,
      now: NOW,
    });
    expect(vm?.guestbook.map((g) => [g.type, g.event.id])).toEqual([
      ["note", comments[1]!.id],
      ["report", reports[0]!.id],
      ["note", comments[0]!.id],
    ]);
  });

  it("is unknown without reports", () => {
    const [vm] = project([known], [], [], { showEveryone: false, whitelist, now: NOW });
    expect(vm?.status.state).toBe("unknown");
  });

  it("skips expired and invalid boxes and keeps only the newest event per box", () => {
    const expired = {
      ...boxEvent(STEWARD, "gone"),
      tags: [...boxEvent(STEWARD, "gone").tags, ["expiration", String(NOW - 5)]],
    };
    const older = { ...boxEvent(STEWARD, "dup", 10), id: "older" };
    const newer = { ...boxEvent(STEWARD, "dup", 2), id: "newer" };
    const vms = project([expired, older, newer], [], [], {
      showEveryone: false,
      whitelist,
      now: NOW,
    });
    expect(vms.map((v) => v.box.event.id)).toEqual(["newer"]);
  });

  it("flags sample boxes", () => {
    const [vm] = project([known], [], [], {
      showEveryone: false,
      whitelist,
      now: NOW,
      sample: true,
    });
    expect(vm?.box.sample).toBe(true);
    expect(vm?.sample).toBe(true);
  });
});
