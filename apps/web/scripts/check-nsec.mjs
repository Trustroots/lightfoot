#!/usr/bin/env node
// Print the npub for a saved nsec file, without printing the nsec.
//   node apps/web/scripts/check-nsec.mjs [file]   (default ~/.config/lightfoot/nsec)
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getPublicKey, nip19 } from "nostr-tools";

const file = process.argv[2] ?? join(homedir(), ".config", "lightfoot", "nsec");
const decoded = nip19.decode(readFileSync(file, "utf8").trim());
if (decoded.type !== "nsec") throw new Error(`${file} holds a ${decoded.type}, not an nsec`);
console.log(nip19.npubEncode(getPublicKey(decoded.data)));
