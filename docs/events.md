# Lightfoot events: draft spec, November 2026

Status: draft. The two kind numbers are placeholders.

Lightfoot uses two new kinds and one existing one:

- A **box** is an addressable event, kind **`37840`**.
- A **report** says how many letters are waiting at a box. It is an addressable event too, kind **`37841`**. Anyone may publish one.
- A **guestbook note** is a NIP-22 comment, kind `1111`, on the box. It has no meaning beyond the text.
- Hosts reach the crew with a **NIP-17 DM**.

Letters never go online. Locations use `g` geohashes, and every box and report expires through NIP-40 after 180 days.

## Kind ranges, and why both kinds are addressable

NIP-01 sorts kinds into four storage classes:

| Range                              | Class       | What a relay keeps                            |
| ---------------------------------- | ----------- | --------------------------------------------- |
| `1000–9999`, plus `1`, `2`, `4–44` | regular     | every event                                   |
| `10000–19999`, plus `0`, `3`       | replaceable | only the newest event per `(kind, pubkey)`    |
| `20000–29999`                      | ephemeral   | nothing; events are passed on, not stored     |
| `30000–39999`                      | addressable | only the newest event per `(kind, pubkey, d)` |

A box is a long-lived thing that its publisher edits and renews, so addressable fits:

- Every box gets one slot, `37840:<pubkey>:<d>`.
- Republishing with the same `d` replaces it. That is also how a host "checks in" and renews the 180 days.
- Other events point at the slot with an `a`/`A` tag that survives edits.
- One steward can publish many boxes, one `d` each.

A report is addressable for a different reason. Each author has one report per box, and the newest replaces the older one. That is exactly the rule we want: only an author's newest report counts. The relay enforces it, so clients don't have to sift through old reports. The slot is `37841:<author pubkey>:<box coordinate>`.

The other classes don't fit:

- A regular kind would pile up every edit and every old report.
- A replaceable kind would allow only one box per pubkey.
- An ephemeral kind isn't stored at all.

Guestbook notes are the opposite case. Kind 1111 is regular, so every note is kept.

## Collision check and decision

Checked on 6 Nov 2026. The first draft used `30401`, the second `30404`. Both turned out to be taken, so we moved out of the 3040x range.

| Kind             | What we found                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30401            | in use: CashuPay (`babdbtc/cashu-pos`, `src/types/nostr.ts`) has `TABLE_STATUS: 30401`                                                                                                |
| 30404            | in use: taikoxyz/pico (`packages/protocol/src/events.ts`) reserves `30401–30420`, with `ChannelOpenAd: 30404`, `HubStatus: 30407` and `DvmPaymentOption: 30408`                       |
| 30403–30408      | in use: OGSleepy/bodads (`src/deals.js`)                                                                                                                                              |
| 30402, 30403     | NIP-99 classifieds                                                                                                                                                                    |
| 30405, 30406     | Gamma Market spec                                                                                                                                                                     |
| 30397–30400      | Nostroots (map note, repost, third-party event, metrics)                                                                                                                              |
| **37840, 37841** | not in the NIPs README registry (nearest registered: 37516/37517 NIP-CC geocaching, 38000 NIP-87), not in nostr-tools `kinds.ts`, and GitHub code search finds no Nostr use of either |

**Decision: `37840` for the box and `37841` for the report.** Both are addressable, both were free in every source checked, and they are next to each other. Lightfoot also requires the `name` and `g` tags (box) and a valid `count` (report), so a stray foreign event wouldn't show up. The app keeps each number in one constant (`BOX_KIND` and `REPORT_KIND` in `apps/web/src/lib/nostr.ts`), so moving again is cheap, for example if we write a NIP.

Limits of the check: the registry says it isn't exhaustive, GitHub search only sees public indexed code, and a free number in these sources doesn't prove nobody uses it.

## Box, kind `37840` (addressable)

```json
{
  "kind": 37840,
  "pubkey": "<steward or host pubkey>",
  "created_at": 1793836800,
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
    ["p", "<host pubkey>", "", "keeper"],
    ["alt", "Lightfoot postbox: Café Kranich. See lightfoot.org"],
    ["expiration", "1809388800"]
  ]
}
```

| Tag          | Required | Meaning                                                                 |
| ------------ | -------- | ----------------------------------------------------------------------- |
| `d`          | yes      | The box's id, unique per publisher.                                     |
| `name`       | yes      | The box's name.                                                         |
| `g`          | yes      | Geohash, 4 to 9 characters. Publish all of them, so `#g` filters work.  |
| `expiration` | yes      | NIP-40. `created_at` plus 180 days. Republish to renew.                 |
| `location`   | no       | Where it is, in words.                                                  |
| `hint`       | no       | How to find the box once you are there.                                 |
| `p`          | no       | A host who looks after the box, with role `keeper` as the fourth value. |
| `alt`        | no       | NIP-31 text for clients that don't know the kind.                       |

`content` is the host's free text. Removal: a NIP-09 deletion, or let it expire. Photos are not part of the event for now.

## Report, kind `37841` (addressable)

```json
{
  "kind": 37841,
  "pubkey": "<anyone>",
  "created_at": 1794009600,
  "content": "Two letters in, one is going to Lisbon.",
  "tags": [
    ["d", "37840:<box pubkey>:cafe-kranich-neukoelln"],
    ["a", "37840:<box pubkey>:cafe-kranich-neukoelln", "wss://relay.trustroots.org"],
    ["count", "2"],
    ["alt", "Lightfoot box report: 2 letters waiting"],
    ["expiration", "1809561600"]
  ]
}
```

| Tag          | Required | Meaning                                                                            |
| ------------ | -------- | ---------------------------------------------------------------------------------- |
| `d`          | yes      | The box's coordinate, `37840:<box pubkey>:<box d>`. One report per author per box. |
| `a`          | yes      | The same coordinate, plus a relay hint. It makes `#a` filters work.                |
| `count`      | yes      | Letters waiting, a non-negative integer as a string. `"0"` means empty.            |
| `expiration` | yes      | NIP-40. `created_at` plus 180 days. A report is valid for 180 days.                |
| `alt`        | no       | NIP-31, for example "Lightfoot box report: 2 letters waiting".                     |

`content` is an optional free-text note.

A report is valid when:

- the kind is `37841`;
- `d` equals the box's coordinate;
- `count` matches `/^\d{1,4}$/`;
- it has not expired;
- it is not dated more than 10 minutes in the future.

The state follows from the count: more than 0 is "letters waiting", 0 is "empty". The count is one aggregate per box. A per-letter status may come later.

### Recommended aggregation rule

Implemented in `apps/web/src/lib/status.ts`, with unit tests. Clients are free to choose their own rule.

1. Ignore a report that is not valid (see above).
2. Count one report per author: their newest. Relays already keep only that one, but a client may see several through different relays.
3. Give each author a tier:
   - **host**: the box publisher or a `p` keeper;
   - **steward**: on the app's whitelist;
   - **visitor**: anyone else.
4. **The publisher's report is preferred.** The lead is the newest host report. If there is none, it is the newest steward report. If there is none, it is the newest visitor report.
5. **Compare states, not counts.** "2 letters" and "3 letters" agree; "2 letters" and "empty" don't.
6. **Discrepancies show as "reports differ".** That happens in two cases:
   - a report newer than the lead disagrees with it, typically a visitor or steward who saw something else after the host's last report;
   - the lead is a visitor, and another visitor reported the opposite in the 7 days before.
7. If nobody has reported, the state is "unknown", shown as "no reports yet".

So a visitor can never override a host, but a newer report can flag that something may have changed. The box page then shows both reports side by side. The "everyone" toggle only filters which boxes show, so visitor reports count either way.

How a client handles a discrepancy is up to it. It could show the lead, show both, or ask the person to go and look.

## Guestbook notes, kind `1111` (NIP-22 comment)

```json
{
  "kind": 1111,
  "pubkey": "<anyone>",
  "created_at": 1794096000,
  "content": "Lovely box. Left a postcard for my sister.",
  "tags": [
    ["A", "37840:<box pubkey>:cafe-kranich-neukoelln", "wss://relay.trustroots.org"],
    ["K", "37840"],
    ["P", "<box pubkey>"],
    ["a", "37840:<box pubkey>:cafe-kranich-neukoelln", "wss://relay.trustroots.org"],
    ["k", "37840"],
    ["p", "<box pubkey>"],
    ["expiration", "1809648000"]
  ]
}
```

- It is a plain note. A `status` tag on it means nothing, and the count lives only in kind `37841`.
- Clients show notes and reports together in one guestbook, newest first.
- Any NIP-22 client can show and publish these.

## Contact: a NIP-17 DM to the crew

"Put up a box" ends with "send the place and how to find it to the crew as a Nostr DM". The crew npub is in the "Put up a box" guide and in `apps/web/src/lib/whitelist.ts` (`CREW_NPUB`), next to the steward list (`STEWARDS`).

Why NIP-17 rather than NIP-04:

- **Privacy.** NIP-04 (kind 4) shows sender, recipient and timing to everyone. NIP-17 hides them. The message is a kind 14 rumor, sealed (kind 13) by the sender, then gift-wrapped (kind 1059) under a throwaway key with a randomised timestamp. The encryption is NIP-44, which is also stronger than NIP-04's.
- **Delivery.** The recipient's kind 10050 list says which relays to deliver to, so the crew chooses where its inbox lives.
- **Client support.** Major clients such as Amethyst and 0xchat support it, and NIP-04 is marked "unrecommended" in the NIPs repo.

Lightfoot itself builds no DM code. Hosts use their own Nostr app, and the crew answers by hand.

## What relay.trustroots.org must accept

- **Boxes, reports and notes.** The relay needs kinds `37840`, `37841` and `1111`. [Trustroots/nostroots#325](https://github.com/Trustroots/nostroots/pull/325) adds all three to the relay's accepted kinds; it is still open.
- **Open reports.** Anyone may publish a report, so the relay must not restrict `37841` to the whitelist.
- **DMs.** Nothing is needed for DMs. The crew's kind 10050 list points at relays that already carry gift wraps. If relay.trustroots.org accepted 1059, it would also need NIP-42 AUTH, so that gift wraps go only to their recipient. That's out of scope.

## Reading it

```json
["REQ", "boxes", {"kinds": [37840]}]
["REQ", "reports", {"kinds": [37841]}]
["REQ", "notes", {"kinds": [1111], "#K": ["37840"]}]
```

- The app reads both relays read-only.
- It applies the whitelist on the client.
- The "everyone" toggle (`?everyone=1`) turns the whitelist off. The old `?allowUnverified=true` still works.
- For "boxes near here", add `{"#g": ["u33d"]}` to the box filter.
- For the reports of one box, use `{"kinds": [37841], "#a": ["37840:<box pubkey>:<box d>"]}`.

## Deliberately left out

- letters as events;
- destinations;
- hand-offs;
- a per-letter status (one aggregate count per box for now);
- a public "add a box" form;
- plus codes and Nostroots labels;
- opening hours, ratings and zaps;
- image hosting: boxes have no photos for now, and we plan Blossom later, as part of our own relay;
- any DM code in the app.

## Sources

- NIP-01, kinds and tag indexing: https://github.com/nostr-protocol/nips/blob/master/01.md
- NIPs kind registry: https://github.com/nostr-protocol/nips#event-kinds
- nostr-tools `kinds.ts`: https://github.com/nbd-wtf/nostr-tools/blob/master/kinds.ts
- NIP-99 (30402/30403): https://github.com/nostr-protocol/nips/blob/master/99.md
- CashuPay kinds (30401 in use): https://github.com/babdbtc/cashu-pos/blob/main/src/types/nostr.ts
- pico protocol events (30401–30420 reserved): https://github.com/taikoxyz/pico/blob/main/packages/protocol/src/events.ts
- bodads deals (30403–30408 in use): https://github.com/OGSleepy/bodads/blob/main/src/deals.js
- Gamma Market spec (30405/30406): https://github.com/GammaMarkets/market-spec/blob/main/spec.md
- NIP-22 Comment: https://github.com/nostr-protocol/nips/blob/master/22.md
- NIP-17 Private DMs: https://github.com/nostr-protocol/nips/blob/master/17.md
- NIP-59 Gift wrap: https://github.com/nostr-protocol/nips/blob/master/59.md
- NIP-44 Encryption: https://github.com/nostr-protocol/nips/blob/master/44.md
- NIP-04 (marked unrecommended): https://github.com/nostr-protocol/nips/blob/master/04.md
- NIP-CC Geocaching, the model for the box: https://github.com/nostr-protocol/nips/blob/master/CC.md
- NIP-40 Expiration: https://github.com/nostr-protocol/nips/blob/master/40.md
- NIP-31 Unknown events (`alt`): https://github.com/nostr-protocol/nips/blob/master/31.md
- Nostroots kinds: `nr-common/constants.ts` and `docs/Events.md` in Trustroots/nostroots
