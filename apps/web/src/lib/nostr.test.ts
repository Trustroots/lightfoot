import { describe, expect, it } from "vitest";
import {
  BOX_KIND,
  COMMENT_KIND,
  EXPIRY_DAYS,
  REPORT_KIND,
  RELAYS,
  boxCoord,
  isExpired,
  newestBoxEvents,
  parseBox,
  tag,
  tags,
  type NostrEvent,
} from "./nostr";

const NOW = 1_800_000_000;
const PK = "a1".repeat(32);

function ev(partial: Partial<NostrEvent> & { tags?: string[][] }): NostrEvent {
  return {
    id: Math.random().toString(16).slice(2),
    pubkey: PK,
    created_at: NOW - 1000,
    kind: BOX_KIND,
    content: "",
    tags: [],
    ...partial,
  };
}

const goodTags = [
  ["d", "box-1"],
  ["name", "A box"],
  ["g", "u33d"],
  ["g", "u33d9eh79"],
];

describe("constants", () => {
  it("defines the kinds, relays and expiry", () => {
    expect(BOX_KIND).toBe(37840);
    expect(REPORT_KIND).toBe(37841);
    expect(COMMENT_KIND).toBe(1111);
    expect(RELAYS).toEqual(["wss://relay.trustroots.org", "wss://relay.nomadwiki.org"]);
    expect(EXPIRY_DAYS).toBe(180);
  });
});

describe("tag helpers", () => {
  const e = ev({
    tags: [
      ["p", "x"],
      ["p", "y", "", "keeper"],
      ["name", "N"],
    ],
  });
  it("tag returns the first value of the first matching tag", () => {
    expect(tag(e, "name")).toBe("N");
    expect(tag(e, "p")).toBe("x");
    expect(tag(e, "missing")).toBeUndefined();
  });
  it("tags returns every first value", () => {
    expect(tags(e, "p")).toEqual(["x", "y"]);
    expect(tags(e, "missing")).toEqual([]);
  });
});

describe("boxCoord", () => {
  it("builds kind:pubkey:d", () => {
    expect(boxCoord(ev({ tags: [["d", "abc"]] }))).toBe(`37840:${PK}:abc`);
  });
  it("uses an empty d when absent", () => {
    expect(boxCoord(ev({}))).toBe(`37840:${PK}:`);
  });
});

describe("isExpired", () => {
  it("is false without an expiration tag", () => {
    expect(isExpired(ev({}), NOW)).toBe(false);
  });
  it("is false before and true at or after the expiration", () => {
    const e = ev({ tags: [["expiration", String(NOW + 10)]] });
    expect(isExpired(e, NOW)).toBe(false);
    expect(isExpired(e, NOW + 10)).toBe(true);
    expect(isExpired(e, NOW + 11)).toBe(true);
  });
  it("ignores a malformed expiration", () => {
    expect(isExpired(ev({ tags: [["expiration", "soon"]] }), NOW)).toBe(false);
  });
});

describe("parseBox", () => {
  it("parses a valid box", () => {
    const box = parseBox(
      ev({
        content: "A shoebox",
        tags: [
          ...goodTags,
          ["location", "Somewhere"],
          ["hint", "On the shelf"],
          ["p", "k".repeat(64), "", "keeper"],
          ["p", "z".repeat(64)],
          ["expiration", String(NOW + 100)],
        ],
      }),
      NOW,
    );
    expect(box).not.toBeNull();
    expect(box!.coord).toBe(`37840:${PK}:box-1`);
    expect(box!.name).toBe("A box");
    expect(box!.location).toBe("Somewhere");
    expect(box!.hint).toBe("On the shelf");
    expect(box).not.toHaveProperty("image");
    expect(box!.keepers).toEqual(["k".repeat(64)]);
    expect(box!.expiration).toBe(NOW + 100);
    expect(box!.position.lat).toBeCloseTo(52.5, 0);
  });

  it("requires d, name and a valid g", () => {
    expect(parseBox(ev({ tags: goodTags.filter((t) => t[0] !== "d") }), NOW)).toBeNull();
    expect(parseBox(ev({ tags: goodTags.filter((t) => t[0] !== "name") }), NOW)).toBeNull();
    expect(parseBox(ev({ tags: goodTags.filter((t) => t[0] !== "g") }), NOW)).toBeNull();
    expect(parseBox(ev({ tags: [...goodTags.slice(0, 2), ["g", "!!!"]] }), NOW)).toBeNull();
  });

  it("rejects the wrong kind and expired boxes", () => {
    expect(parseBox(ev({ kind: 1, tags: goodTags }), NOW)).toBeNull();
    expect(parseBox(ev({ tags: [...goodTags, ["expiration", String(NOW - 1)]] }), NOW)).toBeNull();
  });
});

describe("newestBoxEvents", () => {
  it("keeps the newest event per coordinate", () => {
    const older = ev({ id: "old", created_at: NOW - 500, tags: goodTags });
    const newer = ev({ id: "new", created_at: NOW - 100, tags: goodTags });
    const other = ev({ id: "other", tags: [["d", "box-2"], ...goodTags.slice(1)] });
    const result = newestBoxEvents([older, newer, other, ev({ kind: 1 })]);
    expect(result.map((e) => e.id).sort()).toEqual(["new", "other"]);
  });

  it("lets a newer invalid replacement hide the older valid one", () => {
    const older = ev({ id: "old", created_at: NOW - 500, tags: goodTags });
    const newer = ev({
      id: "new",
      created_at: NOW - 100,
      tags: [...goodTags, ["expiration", String(NOW - 1)]],
    });
    const boxes = newestBoxEvents([older, newer]).map((e) => parseBox(e, NOW));
    expect(boxes).toEqual([null]);
  });
});
