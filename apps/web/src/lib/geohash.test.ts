import { describe, expect, it } from "vitest";
import { bestPosition, decode, distanceKm, encode, gTags } from "./geohash";

describe("encode", () => {
  it("matches the known reference value", () => {
    expect(encode(57.64911, 10.40744, 9)).toBe("u4pruydqq");
  });

  it("defaults to precision 9", () => {
    expect(encode(57.64911, 10.40744)).toHaveLength(9);
  });

  it("encodes the equator/prime meridian origin", () => {
    expect(encode(0, 0, 5)).toBe("s0000");
  });
});

describe("decode", () => {
  it("round-trips within the cell size", () => {
    const hash = encode(52.4878, 13.4312, 9);
    const pos = decode(hash);
    expect(pos).not.toBeNull();
    // a precision-9 cell is about 4.8 m x 4.8 m
    expect(distanceKm(pos!, { lat: 52.4878, lon: 13.4312 })).toBeLessThan(0.005);
  });

  it("is case-insensitive", () => {
    expect(decode("U4PRUYDQQ")).toEqual(decode("u4pruydqq"));
  });

  it("returns null for invalid characters", () => {
    expect(decode("u4pa")).toBeNull(); // 'a' is not in the alphabet
    expect(decode("u4pi")).toBeNull();
    expect(decode("u4pl")).toBeNull();
    expect(decode("u4po")).toBeNull();
    expect(decode("u 4p")).toBeNull();
  });

  it("returns null for an empty hash", () => {
    expect(decode("")).toBeNull();
  });
});

describe("gTags", () => {
  it("returns g tags at precisions 4 to 9", () => {
    const tags = gTags(57.64911, 10.40744);
    expect(tags).toEqual([
      ["g", "u4pr"],
      ["g", "u4pru"],
      ["g", "u4pruy"],
      ["g", "u4pruyd"],
      ["g", "u4pruydq"],
      ["g", "u4pruydqq"],
    ]);
  });
});

describe("bestPosition", () => {
  it("picks the longest valid g tag", () => {
    const pos = bestPosition([
      ["g", "u4pr"],
      ["g", "u4pruydqq"],
      ["g", "u4pruy"],
    ]);
    expect(pos).toEqual(decode("u4pruydqq"));
  });

  it("skips invalid tags", () => {
    const pos = bestPosition([
      ["g", "u4pruydqa"],
      ["g", "u4pruyd"],
    ]);
    expect(pos).toEqual(decode("u4pruyd"));
  });

  it("ignores other tags and returns null when nothing is valid", () => {
    expect(bestPosition([["d", "x"]])).toBeNull();
    expect(bestPosition([["g", "!!"]])).toBeNull();
    expect(bestPosition([])).toBeNull();
  });
});

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 1, lon: 2 }, { lat: 1, lon: 2 })).toBe(0);
  });

  it("measures Berlin to Lisbon at roughly 2310 km", () => {
    const d = distanceKm({ lat: 52.52, lon: 13.405 }, { lat: 38.7223, lon: -9.1393 });
    expect(d).toBeGreaterThan(2290);
    expect(d).toBeLessThan(2330);
  });
});
