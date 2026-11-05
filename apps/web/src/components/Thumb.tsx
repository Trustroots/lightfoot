import type { Box } from "../lib/nostr";
import { BoxIcon } from "./icons";

export function Thumb({ box, className = "thumb" }: { box: Box; className?: string }) {
  return box.image ? (
    <img className={className} src={box.image} alt="" loading="lazy" width={52} height={52} />
  ) : (
    <BoxIcon className={className} aria-hidden="true" />
  );
}
