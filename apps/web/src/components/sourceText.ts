import { RELAYS } from "../lib/nostr";

interface SourceInput {
  loading: boolean;
  usingSample: boolean;
  answered: string[];
  boxes: unknown[];
}

const host = (url: string) => url.replace(/^wss:\/\//, "");

/** One line saying where the boxes on screen come from. */
export function sourceText({ loading, usingSample, answered, boxes }: SourceInput): string {
  if (loading) return `Asking ${RELAYS.map(host).join(" and ")} for boxes…`;
  const ok = answered.map(host).join(" and ");
  if (!usingSample) return `Live from ${ok}: ${boxes.length} boxes.`;
  if (answered.length) return `Read ${ok}: no boxes there yet`;
  return "Couldn't reach the relays";
}
