import { describe, expect, it, vi } from "vitest";
import { BOX_KIND, COMMENT_KIND, type NostrEvent } from "./nostr";
import {
  FILTERS,
  loadLive,
  mergeResults,
  readRelay,
  type RelayResult,
  type SocketLike,
} from "./relays";

function event(id: string, kind: number): NostrEvent {
  return { id, kind, pubkey: "aa".repeat(32), created_at: 1, content: "", tags: [] };
}

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((m: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  closed = false;
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.closed = true;
  }
  message(...msg: unknown[]) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe("FILTERS", () => {
  it("asks for boxes and for comments on boxes", () => {
    expect(FILTERS.map((f) => f.kinds)).toEqual([[BOX_KIND], [COMMENT_KIND]]);
    expect(FILTERS[1]?.["#K"]).toEqual([String(BOX_KIND)]);
  });
});

describe("readRelay", () => {
  it("sends only REQ messages and resolves after every EOSE", async () => {
    const socket = new FakeSocket();
    const p = readRelay("wss://x", FILTERS, { createSocket: () => socket, timeoutMs: 1000 });
    socket.onopen?.();
    expect(socket.sent).toHaveLength(2);
    for (const s of socket.sent) expect(JSON.parse(s)[0]).toBe("REQ");
    socket.message("EVENT", "lf0", event("1", BOX_KIND));
    socket.message("EOSE", "lf0");
    socket.message("EVENT", "lf1", event("2", COMMENT_KIND));
    socket.message("EOSE", "lf1");
    const result = await p;
    expect(result.ok).toBe(true);
    expect(result.events.map((e) => e.id)).toEqual(["1", "2"]);
    expect(socket.closed).toBe(true);
  });

  it("is not ok on error", async () => {
    const socket = new FakeSocket();
    const p = readRelay("wss://x", FILTERS, { createSocket: () => socket, timeoutMs: 1000 });
    socket.onerror?.();
    expect((await p).ok).toBe(false);
  });

  it("is not ok when the socket cannot be created", async () => {
    const result = await readRelay("wss://x", FILTERS, {
      createSocket: () => {
        throw new Error("nope");
      },
    });
    expect(result.ok).toBe(false);
  });

  it("times out, keeping what arrived; ok only if something answered", async () => {
    vi.useFakeTimers();
    try {
      const silent = new FakeSocket();
      const p1 = readRelay("wss://x", FILTERS, { createSocket: () => silent, timeoutMs: 500 });
      const partial = new FakeSocket();
      const p2 = readRelay("wss://y", FILTERS, { createSocket: () => partial, timeoutMs: 500 });
      partial.message("EVENT", "lf0", event("1", BOX_KIND));
      partial.message("EOSE", "lf0");
      await vi.advanceTimersByTimeAsync(600);
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.ok).toBe(false);
      expect(r2.ok).toBe(true);
      expect(r2.events).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores malformed messages", async () => {
    const socket = new FakeSocket();
    const p = readRelay("wss://x", [FILTERS[0]!], { createSocket: () => socket, timeoutMs: 1000 });
    socket.onmessage?.({ data: "not json" });
    socket.message("EVENT", "lf0", { nope: true });
    socket.message("EOSE", "lf0");
    expect((await p).events).toEqual([]);
  });
});

describe("mergeResults", () => {
  it("dedupes by id, splits by kind and lists the relays that answered", () => {
    const results: RelayResult[] = [
      { url: "wss://a", ok: true, events: [event("1", BOX_KIND), event("2", COMMENT_KIND)] },
      { url: "wss://b", ok: true, events: [event("1", BOX_KIND), event("3", COMMENT_KIND)] },
      { url: "wss://c", ok: false, events: [] },
    ];
    const merged = mergeResults(results);
    expect(merged.boxes.map((e) => e.id)).toEqual(["1"]);
    expect(merged.comments.map((e) => e.id)).toEqual(["2", "3"]);
    expect(merged.answered).toEqual(["wss://a", "wss://b"]);
  });
});

describe("loadLive", () => {
  it("reads every relay and merges", async () => {
    const sockets: FakeSocket[] = [];
    const p = loadLive(["wss://a", "wss://b"], {
      createSocket: () => {
        const s = new FakeSocket();
        sockets.push(s);
        return s;
      },
      timeoutMs: 1000,
    });
    for (const s of sockets) {
      s.message("EVENT", "lf0", event("same", BOX_KIND));
      s.message("EOSE", "lf0");
      s.message("EOSE", "lf1");
    }
    const live = await p;
    expect(live.boxes).toHaveLength(1);
    expect(live.answered).toHaveLength(2);
  });
});
