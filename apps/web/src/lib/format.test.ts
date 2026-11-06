import { describe, expect, it } from "vitest";
import { ago, cityOf, formatDistance, shortKey } from "./format";

const DAY = 86_400;

describe("formatDistance", () => {
  it("rounds short distances to 50 m", () => {
    expect(formatDistance(0.33)).toBe("350 m");
    expect(formatDistance(0)).toBe("0 m");
  });
  it("uses one decimal under 20 km", () => {
    expect(formatDistance(1.44)).toBe("1.4 km");
  });
  it("uses whole kilometres with separators beyond that", () => {
    expect(formatDistance(1527.6)).toBe("1,528 km");
  });
});

describe("ago", () => {
  const now = 1_762_300_800;
  it("says today, yesterday, days, weeks and months", () => {
    expect(ago(now - 3600, now)).toBe("today");
    expect(ago(now - DAY, now)).toBe("yesterday");
    expect(ago(now - 5 * DAY, now)).toBe("5 days ago");
    expect(ago(now - 21 * DAY, now)).toBe("3 weeks ago");
    expect(ago(now - 90 * DAY, now)).toBe("3 months ago");
  });
  it("treats future timestamps as today", () => {
    expect(ago(now + 300, now)).toBe("today");
  });
});

describe("cityOf", () => {
  it("takes the last comma-separated part of the location", () => {
    expect(cityOf("Café Kranich, Weserstraße, Neukölln, Berlin")).toBe("Berlin");
  });
  it("falls back when there is no location", () => {
    expect(cityOf(undefined)).toBe("Somewhere");
    expect(cityOf("  ")).toBe("Somewhere");
  });
});

describe("shortKey", () => {
  it("shortens a hex pubkey", () => {
    expect(shortKey("ab".repeat(32))).toBe("abababab…");
  });
});
