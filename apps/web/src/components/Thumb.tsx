import type { Box } from "../lib/nostr";
import { BoxIcon } from "./icons";

/** The box icon. There are no photos for now. */
export function Thumb({ className = "thumb" }: { box?: Box; className?: string }) {
  return <BoxIcon className={className} aria-hidden="true" />;
}
