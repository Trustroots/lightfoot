import { nip19 } from "nostr-tools";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STEWARDS,
  parseEnvStewards,
  readShowEveryone,
  resolveStewards,
  writeShowEveryone,
} from "./whitelist";

const HEX = "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d";
const NPUB = nip19.npubEncode(HEX);

afterEach(() => vi.restoreAllMocks());

describe("resolveStewards", () => {
  it("decodes npubs to hex with their labels", () => {
    const { pubkeys, labels } = resolveStewards([{ npub: NPUB, label: "Mia" }]);
    expect(pubkeys.has(HEX)).toBe(true);
    expect(labels.get(HEX)).toBe("Mia");
  });

  it("skips entries that do not decode and warns in dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { pubkeys } = resolveStewards([
      { npub: "npub1kasperplaceholder", label: "Kasper (placeholder)" },
      { npub: NPUB, label: "Mia" },
    ]);
    expect([...pubkeys]).toEqual([HEX]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("Kasper (placeholder)");
  });

  it("skips non-npub bech32 such as an nsec-shaped value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const nprofile = nip19.nsecEncode(new Uint8Array(32).fill(1));
    expect(resolveStewards([{ npub: nprofile, label: "x" }]).pubkeys.size).toBe(0);
  });
});

describe("the configured stewards", () => {
  it("lists the Kasper placeholder, which does not resolve", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const entry = STEWARDS.find((s) => s.label === "Kasper (placeholder)");
    expect(entry?.npub).toBe("npub1kasperplaceholder");
    expect(resolveStewards([entry!]).pubkeys.size).toBe(0);
  });
});

describe("parseEnvStewards", () => {
  it("parses a comma-separated list, trimming blanks", () => {
    expect(parseEnvStewards(` ${NPUB} , ,npub1abc`)).toEqual([
      { npub: NPUB, label: "env" },
      { npub: "npub1abc", label: "env" },
    ]);
  });
  it("returns an empty list for undefined or empty", () => {
    expect(parseEnvStewards(undefined)).toEqual([]);
    expect(parseEnvStewards("")).toEqual([]);
  });
});

describe("showEveryone param", () => {
  it("defaults to false", () => {
    expect(readShowEveryone("")).toBe(false);
    expect(readShowEveryone("?foo=bar")).toBe(false);
  });
  it("reads everyone=1", () => {
    expect(readShowEveryone("?everyone=1")).toBe(true);
    expect(readShowEveryone("everyone=1&x=2")).toBe(true);
    expect(readShowEveryone("?everyone=0")).toBe(false);
  });
  it("accepts the old allowUnverified=true alias", () => {
    expect(readShowEveryone("?allowUnverified=true")).toBe(true);
    expect(readShowEveryone("?allowUnverified=false")).toBe(false);
  });
  it("writes and removes the param, keeping others", () => {
    expect(writeShowEveryone("", true)).toBe("?everyone=1");
    expect(writeShowEveryone("?x=1", true)).toBe("?x=1&everyone=1");
    expect(writeShowEveryone("?x=1&everyone=1", false)).toBe("?x=1");
    expect(writeShowEveryone("?everyone=1", false)).toBe("");
  });
  it("replaces the legacy alias when writing", () => {
    expect(writeShowEveryone("?allowUnverified=true", true)).toBe("?everyone=1");
    expect(writeShowEveryone("?allowUnverified=true", false)).toBe("");
  });
});
