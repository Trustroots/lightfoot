/**
 * Example boxes, reports and notes for when the relays have nothing yet. Fictional boxes and hosts in real
 * neighbourhoods. Everything built from here is marked `sample: true` so the UI can label it.
 */
import { gTags } from "./geohash";
import {
  BOX_KIND,
  COMMENT_KIND,
  DAY_SECONDS,
  EXPIRY_DAYS,
  REPORT_KIND,
  RELAYS,
  boxCoord,
  tag,
  type NostrEvent,
} from "./nostr";
import type { Whitelist } from "./whitelist";

export const SAMPLE = true;

const MIA = "a1".repeat(32);
const JONAS = "b2".repeat(32);
const INES = "c3".repeat(32);
const TOMEK = "d4".repeat(32);
const LEILA = "e5".repeat(32);
const NEWCOMER = "f6".repeat(32);

export const SAMPLE_PEOPLE: Record<string, string> = {
  [MIA]: "Mia",
  [JONAS]: "Jonas",
  [INES]: "Inês",
  [TOMEK]: "Tomek",
  [LEILA]: "Leila",
  [NEWCOMER]: "someone new",
};

export interface SampleData {
  sample: true;
  boxes: NostrEvent[];
  reports: NostrEvent[];
  comments: NostrEvent[];
  /** The sample stewards: Mia, Jonas and Inês. */
  whitelist: Whitelist;
}

interface BoxSpec {
  pubkey: string;
  d: string;
  name: string;
  lat: number;
  lon: number;
  location: string;
  hint: string;
  content: string;
  ageDays: number;
  keepers?: string[];
}

const BOX_SPECS: BoxSpec[] = [
  {
    pubkey: MIA,
    d: "cafe-kranich-neukoelln",
    name: "Café Kranich",
    lat: 52.4878,
    lon: 13.4312,
    ageDays: 21,
    location: "Café Kranich, Weserstraße, Neukölln, Berlin",
    hint: "Ask at the counter. It's the shoebox on the shelf with the board games.",
    content:
      "A shoebox with a slot, decorated by the regulars. Leave a letter, take one that's going your way. Open daily 9 to 19.",
  },
  {
    pubkey: MIA,
    d: "hostel-ostkreuz",
    name: "Hostel by Ostkreuz",
    lat: 52.5048,
    lon: 13.4605,
    ageDays: 60,
    keepers: [TOMEK],
    location: "Reception, Hostel by Ostkreuz, Friedrichshain, Berlin",
    hint: "On the easel next to reception, under the city map.",
    content: "Our postcard box by the front desk. Night staff are happy to help if it's late.",
  },
  {
    pubkey: INES,
    d: "casa-do-largo-lisboa",
    name: "Casa do Largo",
    lat: 38.7131,
    lon: -9.1307,
    ageDays: 12,
    location: "Casa do Largo hostel, Alfama, Lisbon",
    hint: "In the lounge, on the window sill by the door to the stairs.",
    content: "A painted tin box in our lounge. Most letters here go north: Porto, Madrid, Paris.",
  },
  {
    pubkey: INES,
    d: "ribeira-porto",
    name: "Hostel Ribeira",
    lat: 41.1409,
    lon: -8.6131,
    ageDays: 40,
    location: "Hostel Ribeira, near the river, Porto",
    hint: "Behind the front desk. Ask for the Lightfoot box.",
    content: "Small wooden crate behind reception. We'll gladly hold a letter for a few weeks.",
  },
  {
    pubkey: JONAS,
    d: "kazimierz-krakow",
    name: "Book box in Kazimierz",
    lat: 50.0513,
    lon: 19.9449,
    ageDays: 30,
    keepers: [TOMEK],
    location: "Courtyard of a book café, Kazimierz, Kraków",
    hint: "In the courtyard, the red-and-white cabinet. Letters go on the top shelf.",
    content:
      "A book-swap cabinet with a shelf for Lightfoot letters. Tomek from the café looks after it.",
  },
  {
    pubkey: JONAS,
    d: "zizkov-praha",
    name: "Žižkov courtyard box",
    lat: 50.0835,
    lon: 14.4517,
    ageDays: 75,
    location: "Garden courtyard, Žižkov, Prague",
    hint: "Through the green gate, the wooden letterbox on the post. Lift the lid.",
    content: "An old wooden letterbox in our shared garden. The gate is open in daytime.",
  },
  {
    pubkey: JONAS,
    d: "phonebox-ljubljana",
    name: "The old phone box",
    lat: 46.0514,
    lon: 14.5092,
    ageDays: 100,
    location: "Book exchange phone box, near the central market, Ljubljana",
    hint: "Inside the red phone box, bottom shelf, the biscuit tin marked with a foot.",
    content: "A book exchange that also keeps a biscuit tin for letters.",
  },
  {
    pubkey: NEWCOMER,
    d: "gracia-bcn",
    name: "Box at a bar in Gràcia",
    lat: 41.4036,
    lon: 2.1565,
    ageDays: 9,
    location: "A bar on Carrer de Verdi, Gràcia, Barcelona",
    hint: "Ask the bartender.",
    content: "I put a box here last week, come by!",
  },
];

function boxEvent(spec: BoxSpec, now: number): NostrEvent {
  const created = now - spec.ageDays * DAY_SECONDS;
  return {
    id: `sample-box-${spec.d}`,
    kind: BOX_KIND,
    pubkey: spec.pubkey,
    created_at: created,
    content: spec.content,
    tags: [
      ["d", spec.d],
      ["name", spec.name],
      ...gTags(spec.lat, spec.lon),
      ["location", spec.location],
      ["hint", spec.hint],
      ...(spec.keepers ?? []).map((k) => ["p", k, "", "keeper"]),
      ["alt", `Lightfoot postbox: ${spec.name}. See lightfoot.org`],
      ["expiration", String(created + EXPIRY_DAYS * DAY_SECONDS)],
    ],
  };
}

interface ReportSpec {
  box: string;
  pubkey: string;
  /** Letters waiting; 0 means empty. */
  count: number;
  content: string;
  ageDays: number;
}

const REPORT_SPECS: ReportSpec[] = [
  {
    box: "cafe-kranich-neukoelln",
    pubkey: MIA,
    count: 2,
    ageDays: 3,
    content: "Two letters in. One is going to Lisbon, one to somewhere near Kraków.",
  },
  {
    box: "cafe-kranich-neukoelln",
    pubkey: JONAS,
    count: 0,
    ageDays: 16,
    content: "Took the letter for Prague with me on the night train.",
  },
  {
    box: "hostel-ostkreuz",
    pubkey: TOMEK,
    count: 0,
    ageDays: 2,
    content: "Empty after the weekend, waiting for new letters.",
  },
  {
    box: "casa-do-largo-lisboa",
    pubkey: INES,
    count: 2,
    ageDays: 5,
    content: "One letter for Berlin, one for Porto. Anyone heading north?",
  },
  {
    box: "casa-do-largo-lisboa",
    pubkey: LEILA,
    count: 2,
    ageDays: 1,
    content: "Saw them on the sill, yes.",
  },
  { box: "ribeira-porto", pubkey: INES, count: 0, ageDays: 26, content: "" },
  {
    box: "kazimierz-krakow",
    pubkey: TOMEK,
    count: 3,
    ageDays: 1,
    content: "Three on the top shelf: Vienna, Berlin, Budapest.",
  },
  // A visitor disagrees with the keeper: this box shows "differs".
  {
    box: "kazimierz-krakow",
    pubkey: LEILA,
    count: 0,
    ageDays: 0.3,
    content: "The shelf was bare when I stopped by this morning.",
  },
  {
    box: "kazimierz-krakow",
    pubkey: JONAS,
    count: 0,
    ageDays: 34,
    content: "Carried two to Prague.",
  },
  {
    box: "zizkov-praha",
    pubkey: JONAS,
    count: 2,
    ageDays: 33,
    content: "Two letters from Kraków arrived, one is for here in Prague.",
  },
  {
    box: "gracia-bcn",
    pubkey: NEWCOMER,
    count: 1,
    ageDays: 4,
    content: "There's a letter for Lisbon!",
  },
];

interface NoteSpec {
  box: string;
  pubkey: string;
  content: string;
  ageDays: number;
}

const NOTE_SPECS: NoteSpec[] = [
  {
    box: "cafe-kranich-neukoelln",
    pubkey: LEILA,
    ageDays: 18,
    content: "Lovely box. Left a postcard for my sister.",
  },
];

function reportEvent(spec: ReportSpec, box: NostrEvent, i: number, now: number): NostrEvent {
  const coord = boxCoord(box);
  const created = now - Math.round(spec.ageDays * DAY_SECONDS);
  return {
    id: `sample-report-${i}`,
    kind: REPORT_KIND,
    pubkey: spec.pubkey,
    created_at: created,
    content: spec.content,
    tags: [
      ["d", coord],
      ["a", coord, RELAYS[0] ?? ""],
      ["count", String(spec.count)],
      ["alt", `Lightfoot box report: ${reportAlt(spec.count)}`],
      ["expiration", String(created + EXPIRY_DAYS * DAY_SECONDS)],
    ],
  };
}

function reportAlt(count: number): string {
  if (count === 0) return "empty";
  return `${count} ${count === 1 ? "letter" : "letters"} waiting`;
}

function noteEvent(spec: NoteSpec, box: NostrEvent, i: number, now: number): NostrEvent {
  const coord = boxCoord(box);
  const created = now - Math.round(spec.ageDays * DAY_SECONDS);
  return {
    id: `sample-note-${i}`,
    kind: COMMENT_KIND,
    pubkey: spec.pubkey,
    created_at: created,
    content: spec.content,
    tags: [
      ["A", coord, RELAYS[0] ?? ""],
      ["K", String(BOX_KIND)],
      ["P", box.pubkey],
      ["a", coord, RELAYS[0] ?? ""],
      ["k", String(BOX_KIND)],
      ["p", box.pubkey],
      ["expiration", String(created + EXPIRY_DAYS * DAY_SECONDS)],
    ],
  };
}

export function buildSample(now: number): SampleData {
  const boxes = BOX_SPECS.map((spec) => boxEvent(spec, now));
  const byD = new Map(boxes.map((b) => [tag(b, "d"), b]));
  const boxFor = (d: string): NostrEvent => {
    const box = byD.get(d);
    if (!box) throw new Error(`sample entry for unknown box ${d}`);
    return box;
  };
  const reports = REPORT_SPECS.map((spec, i) => reportEvent(spec, boxFor(spec.box), i, now));
  const comments = NOTE_SPECS.map((spec, i) => noteEvent(spec, boxFor(spec.box), i, now));
  const stewards = [MIA, JONAS, INES];
  return {
    sample: true,
    boxes,
    reports,
    comments,
    whitelist: {
      pubkeys: new Set(stewards),
      labels: new Map(stewards.map((pk) => [pk, SAMPLE_PEOPLE[pk] ?? pk])),
    },
  };
}
