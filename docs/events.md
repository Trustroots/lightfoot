# Lightfoot events (draft, November 2026)

Two kinds, and only one of them is new:

- A **postbox** is an addressable event of kind **`30404`**. The number is a placeholder; an earlier draft used 30401, which turned out to be taken.
- A **status report** ("letters waiting" or "empty") is a NIP-22 comment, kind `1111`, on that box. Anyone may post one, and clients aggregate the reports.
- Hosts reach the crew with a **NIP-17 DM**.

Letters never go online. Locations use `g` geohashes, and every event expires through NIP-40 after 180 days.

## Kind ranges, and why the box is addressable

NIP-01 sorts kinds into four storage classes:

| Range                              | Class       | What a relay keeps                            |
| ---------------------------------- | ----------- | --------------------------------------------- |
| `1000–9999`, plus `1`, `2`, `4–44` | regular     | every event                                   |
| `10000–19999`, plus `0`, `3`       | replaceable | only the newest event per `(kind, pubkey)`    |
| `20000–29999`                      | ephemeral   | nothing; events are passed on, not stored     |
| `30000–39999`                      | addressable | only the newest event per `(kind, pubkey, d)` |

A box is a long-lived thing that its publisher edits and renews, so addressable is the right class:

- Every box gets one slot, `30404:<pubkey>:<d>`.
- Republishing with the same `d` replaces it. That is also how a host "checks in" and renews the 180 days.
- Other events point at the slot with an `a`/`A` tag that survives edits. The status comments do that.
- One steward can publish many boxes, one `d` each.

The other classes don't fit:

- A regular kind would pile up every edit.
- A replaceable kind would allow only one box per pubkey.
- An ephemeral kind isn't stored at all.

Status reports are the opposite case. Kind 1111 is **regular**, so every report is kept, and that history is the box's guestbook.

## Collision check and decision

I checked these sources on 5 Nov 2026:

| Kind         | NIPs registry      | nostr-tools `kinds.ts` | Nostroots                                                | Public code on GitHub                                                                                                                          |
| ------------ | ------------------ | ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 30401        | free               | free                   | free                                                     | **in use**: CashuPay (`babdbtc/cashu-pos`, `src/types/nostr.ts`) has `TABLE_STATUS: 30401` for restaurant tables, on damus, nos.lol and primal |
| 30402, 30403 | NIP-99 classifieds | yes                    | free                                                     | widely used                                                                                                                                    |
| **30404**    | free               | free                   | free                                                     | **no Nostr hits** for `30404` or `30404 kind`                                                                                                  |
| 30405, 30406 | free               | free                   | free                                                     | Gamma Market spec (collections, shipping options)                                                                                              |
| 30397–30400  | free               | free                   | Nostroots (map note, repost, third-party event, metrics) | —                                                                                                                                              |

**Decision: `30404`.** It is addressable, it was free in every source I checked, and it sits next to Nostroots and NIP-99. Lightfoot also filters on the whitelist and on the required `name` and `g` tags, so a stray foreign event wouldn't show as a box. The app keeps the number in one constant, so moving later is cheap, for example if we write a NIP.

Limits of the check: the registry says it isn't exhaustive, GitHub search only sees public indexed code, and nostrbook.dev has no page for these numbers, which doesn't prove they're unused.

## Postbox, kind `30404` (addressable)

```json
{
  "kind": 30404,
  "pubkey": "<steward or host pubkey>",
  "created_at": 1762300800,
  "content": "A shoebox on the shelf behind the counter. Leave a letter, take one that's going your way.",
  "tags": [
    ["d", "cafe-kranich-neukoelln"],
    ["name", "Café Kranich"],
    ["g", "u33d"],
    ["g", "u33d9"],
    ["g", "u33d9e"],
    ["g", "u33d9eh"],
    ["g", "u33d9eh7"],
    ["g", "u33d9eh79"],
    ["location", "Café Kranich, Weserstraße, Neukölln, Berlin"],
    ["hint", "Ask at the counter. It's on the shelf with the board games."],
    ["image", "https://example.org/box.jpg"],
    ["p", "<host pubkey>", "", "keeper"],
    ["alt", "Lightfoot postbox: Café Kranich. See lightfoot.org"],
    ["expiration", "1777852800"]
  ]
}
```

The tags:

- **Required:** `d`, `name`, at least one `g` (4 to 9 characters, publish all of them), and `expiration` (`created_at` plus 180 days).
- **Optional:** `location`, `hint`, `image`, `p` with role `keeper`, and `alt` (NIP-31).
- **Removal:** a NIP-09 deletion, or let it expire.

## Status reports, kind `1111` (NIP-22 comment on the box)

```json
{
  "kind": 1111,
  "pubkey": "<anyone>",
  "created_at": 1762473600,
  "content": "Two letters in, one is going to Lisbon.",
  "tags": [
    ["A", "30404:<box pubkey>:cafe-kranich-neukoelln", "wss://relay.trustroots.org"],
    ["K", "30404"],
    ["P", "<box pubkey>"],
    ["a", "30404:<box pubkey>:cafe-kranich-neukoelln", "wss://relay.trustroots.org"],
    ["k", "30404"],
    ["p", "<box pubkey>"],
    ["status", "letters-waiting"],
    ["expiration", "1778025600"]
  ]
}
```

- **`status`** is `letters-waiting` or `empty`. A comment without it, or with any other value, is a plain guestbook note. NIP-22 doesn't forbid extra tags; other clients just show the comment.
- **Who may report:** anyone. Clients aggregate the reports.
- **Expiry:** 180 days. There is one aggregate status per box for now; per-letter status may come later.

### Recommended aggregation rule

Implemented in `apps/web/src/lib/status.ts`, with unit tests. Other clients may choose differently.

1. Ignore a report if it has expired (NIP-40), is dated more than 10 minutes in the future, doesn't point at this box's `A` coordinate, or has no valid `status`.
2. Count one report per author: their newest.
3. Give each author a tier:
   - **host**: the box publisher or a `p` keeper;
   - **steward**: on the app's whitelist;
   - **visitor**: anyone else.
4. **The newest report wins, and hosts and stewards are weighted above visitors.** The lead is the newest host or steward report. If there is none, it is the newest report overall.
5. **Disagreement shows as "reports differ".** That happens in two cases:
   - a report newer than the lead disagrees with it, typically a visitor who saw something else after the host's last report;
   - the lead is a visitor, and another visitor reported the opposite in the 7 days before.
6. If nobody has reported, the state is "unknown", shown as "no reports yet".

So a visitor can never override a host, but a newer visitor report can flag that something may have changed. The box page then shows both reports side by side. The "everyone" toggle only filters which boxes show, so visitor reports count either way.

## Contact: a NIP-17 DM to the crew

"Put up a box" ends with "send the photo, the place and how to find it to the crew as a Nostr DM". Two npubs are placeholders in `apps/web/src/lib/whitelist.ts`: the crew account (`CREW_NPUB`) and one steward (`STEWARDS`).

Why NIP-17 rather than NIP-04:

- **Privacy.** NIP-04 (kind 4) shows sender, recipient and timing to everyone. NIP-17 hides them. The message is a kind 14 rumor, sealed (kind 13) by the sender, then gift-wrapped (kind 1059) under a throwaway key with a randomised timestamp. The encryption is NIP-44, which is also stronger than NIP-04's.
- **Delivery.** The recipient's kind 10050 list says which relays to deliver to, so the crew chooses where its inbox lives.
- **Client support.** Major clients such as Amethyst and 0xchat support it, and NIP-04 is marked "unrecommended" in the NIPs repo.

Lightfoot itself builds no DM code. Hosts use their own Nostr app, and the crew answers by hand.

## What relay.trustroots.org must accept

- **Box and comments.** The relay needs the box kind (now `30404`) and comments (`1111`). The nostroots branch `feat/lightfoot-kinds` is updated from 30401 to 30404.
- **DMs.** Nothing is needed for DMs. The crew's kind 10050 list points at relays that already carry gift wraps. If relay.trustroots.org accepted 1059, it would also need NIP-42 AUTH, so that gift wraps go only to their recipient. That's out of scope.
- **Open status reports.** They change nothing on the relay, because 1111 is already on the list.

## Reading it

```json
["REQ", "boxes", {"kinds": [30404]}]
["REQ", "status", {"kinds": [1111], "#K": ["30404"]}]
```

- The app reads both relays read-only.
- It applies the whitelist on the client.
- The "everyone" toggle (`?everyone=1`) turns the whitelist off. The old `?allowUnverified=true` still works.
- For "boxes near here", add `{"#g": ["u33d"]}`.

## Deliberately left out

- letters as events;
- destinations;
- hand-offs;
- letter counts;
- a public "add a box" form;
- plus codes and Nostroots labels;
- opening hours, ratings and zaps;
- image hosting;
- a per-letter status (one aggregate per box for now);
- any DM code in the app.

## Sources

- NIP-01, kinds and tag indexing: https://github.com/nostr-protocol/nips/blob/master/01.md
- NIPs kind registry: https://github.com/nostr-protocol/nips#event-kinds
- nostr-tools `kinds.ts`: https://github.com/nbd-wtf/nostr-tools/blob/master/kinds.ts
- NIP-99 (30402/30403): https://github.com/nostr-protocol/nips/blob/master/99.md
- CashuPay kinds (30401 in use): https://github.com/babdbtc/cashu-pos/blob/main/src/types/nostr.ts
- Gamma Market spec (30405/30406): https://github.com/GammaMarkets/market-spec/blob/main/spec.md
- nostrbook.dev (no page for 30401): https://nostrbook.dev/kinds/30401
- NIP-22 Comment: https://github.com/nostr-protocol/nips/blob/master/22.md
- NIP-17 Private DMs: https://github.com/nostr-protocol/nips/blob/master/17.md
- NIP-59 Gift wrap: https://github.com/nostr-protocol/nips/blob/master/59.md
- NIP-44 Encryption: https://github.com/nostr-protocol/nips/blob/master/44.md
- NIP-04 (marked unrecommended): https://github.com/nostr-protocol/nips/blob/master/04.md
- NIP-CC Geocaching, the model for the box: https://github.com/nostr-protocol/nips/blob/master/CC.md
- NIP-40 Expiration: https://github.com/nostr-protocol/nips/blob/master/40.md
- Nostroots kinds: `nr-common/constants.ts` and `docs/Events.md` in Trustroots/nostroots
