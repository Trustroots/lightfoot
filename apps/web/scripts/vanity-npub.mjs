#!/usr/bin/env node
// Find a Nostr key whose npub starts with npub1<prefix>.
//
//   node apps/web/scripts/vanity-npub.mjs lf00t [out-file]
//
// Prints only the npub. The nsec goes to out-file (default
// ~/.config/lightfoot/nsec), written with mode 600. It never goes to stdout.
// Each extra prefix character makes the search 32 times longer: 4 characters
// take seconds, 5 take minutes, 6 take hours.

import { mkdirSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { availableParallelism, homedir } from "node:os";
import { dirname, join } from "node:path";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

if (isMainThread) {
  const prefix = (process.argv[2] ?? "").toLowerCase();
  const out = process.argv[3] ?? join(homedir(), ".config", "lightfoot", "nsec");
  if (!prefix || [...prefix].some((c) => !CHARSET.includes(c))) {
    console.error(`Prefix must use only bech32 characters: ${CHARSET}`);
    process.exit(2);
  }
  if (existsSync(out)) {
    console.error(`${out} already exists; not overwriting it.`);
    process.exit(2);
  }
  const threads = availableParallelism();
  const started = Date.now();
  const tried = new Array(threads).fill(0);
  const workers = [];
  const progress = setInterval(() => {
    const total = tried.reduce((a, b) => a + b, 0);
    const secs = (Date.now() - started) / 1000;
    const rate = Math.round(total / secs);
    const expected = Math.round(32 ** prefix.length / rate);
    console.error(`${total} keys, ${rate}/s, ~${expected}s expected in total`);
  }, 30_000);
  for (let i = 0; i < threads; i++) {
    const w = new Worker(new URL(import.meta.url), { workerData: { prefix } });
    w.on("message", (msg) => {
      if (msg.tried !== undefined) tried[i] = msg.tried;
      if (msg.sk) {
        clearInterval(progress);
        for (const other of workers) other.terminate();
        const sk = Uint8Array.from(msg.sk);
        mkdirSync(dirname(out), { recursive: true, mode: 0o700 });
        writeFileSync(out, nip19.nsecEncode(sk) + "\n", { mode: 0o600 });
        chmodSync(out, 0o600);
        console.log(nip19.npubEncode(getPublicKey(sk)));
        console.error(`nsec saved to ${out} after ${Math.round((Date.now() - started) / 1000)}s`);
      }
    });
    workers.push(w);
  }
} else {
  const { prefix } = workerData;
  // npub data starts right after "npub1"; each character is 5 bits of the pubkey.
  const target = [...prefix].map((c) => CHARSET.indexOf(c));
  const bits = target.length * 5;
  let want = 0n;
  for (const v of target) want = (want << 5n) | BigInt(v);
  const hexChars = Math.ceil(bits / 4);
  let tried = 0;
  for (;;) {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const head = BigInt("0x" + pk.slice(0, hexChars)) >> BigInt(hexChars * 4 - bits);
    tried++;
    if (head === want) {
      parentPort.postMessage({ sk: [...sk], tried });
      break;
    }
    if (tried % 20_000 === 0) parentPort.postMessage({ tried });
  }
}
