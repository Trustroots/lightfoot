/**
 * Read-only relay client. It only ever sends REQ messages: there is deliberately no publish path.
 */
import { BOX_KIND, COMMENT_KIND, RELAYS, type NostrEvent } from "./nostr";

export interface Filter {
  kinds: number[];
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

export const FILTERS: Filter[] = [
  { kinds: [BOX_KIND], limit: 300 },
  { kinds: [COMMENT_KIND], "#K": [String(BOX_KIND)], limit: 500 },
];

export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((message: { data: string }) => void) | null;
  onerror: (() => void) | null;
  send(data: string): void;
  close(): void;
}

export interface ReadOptions {
  timeoutMs?: number;
  createSocket?: (url: string) => SocketLike;
}

export interface RelayResult {
  url: string;
  /** True when the relay answered (at least one EOSE arrived). */
  ok: boolean;
  events: NostrEvent[];
}

export interface LiveData {
  results: RelayResult[];
  boxes: NostrEvent[];
  comments: NostrEvent[];
  /** URLs of the relays that answered. */
  answered: string[];
}

const defaultSocket = (url: string): SocketLike => new WebSocket(url) as unknown as SocketLike;

function isEvent(value: unknown): value is NostrEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.pubkey === "string" &&
    typeof e.kind === "number" &&
    typeof e.created_at === "number" &&
    typeof e.content === "string" &&
    Array.isArray(e.tags)
  );
}

export function readRelay(
  url: string,
  filters: Filter[],
  { timeoutMs = 4500, createSocket = defaultSocket }: ReadOptions = {},
): Promise<RelayResult> {
  return new Promise((resolve) => {
    const events: NostrEvent[] = [];
    let socket: SocketLike | undefined;
    let done = false;
    let eose = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        socket?.close();
      } catch {
        // already closed
      }
      resolve({ url, ok, events });
    };

    try {
      socket = createSocket(url);
    } catch {
      return finish(false);
    }
    timer = setTimeout(() => finish(eose > 0), timeoutMs);
    socket.onopen = () => {
      filters.forEach((filter, i) => socket?.send(JSON.stringify(["REQ", `lf${i}`, filter])));
    };
    socket.onmessage = (m) => {
      let msg: unknown;
      try {
        msg = JSON.parse(m.data);
      } catch {
        return;
      }
      if (!Array.isArray(msg)) return;
      if (msg[0] === "EVENT" && isEvent(msg[2])) events.push(msg[2]);
      if (msg[0] === "EOSE" && ++eose === filters.length) finish(true);
    };
    socket.onerror = () => finish(false);
  });
}

/** Merge relay results: dedupe by event id, split into boxes and comments. */
export function mergeResults(results: RelayResult[]): LiveData {
  const seen = new Set<string>();
  const boxes: NostrEvent[] = [];
  const comments: NostrEvent[] = [];
  for (const result of results) {
    for (const ev of result.events) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      if (ev.kind === BOX_KIND) boxes.push(ev);
      else if (ev.kind === COMMENT_KIND) comments.push(ev);
    }
  }
  return { results, boxes, comments, answered: results.filter((r) => r.ok).map((r) => r.url) };
}

export async function loadLive(urls: string[] = RELAYS, options?: ReadOptions): Promise<LiveData> {
  const results = await Promise.all(urls.map((url) => readRelay(url, FILTERS, options)));
  return mergeResults(results);
}
