import { Button, buttonVariants } from "@lightfoot/ui/components/button";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CREW_NPUB } from "../../lib/whitelist";
import { FootIcon } from "../icons";
import { LfWindow } from "./LfWindow";

export const GUIDE_KEYS = ["send", "carry", "setup"] as const;
export type GuideKey = (typeof GUIDE_KEYS)[number];

export function isGuideKey(key: string): key is GuideKey {
  return (GUIDE_KEYS as readonly string[]).includes(key);
}

function Envelope() {
  return (
    <figure className="lf-envelope" aria-label="An example envelope addressed to Lisbon">
      <span className="via">
        <FootIcon />
        via
        <br />
        Lightfoot
      </span>
      <div className="to">
        For Ana Costa
        <br />
        Rua da Rosa 12, 3º
      </div>
      <div className="city">→ LISBON</div>
    </figure>
  );
}

function CrewNpub() {
  const [copied, setCopied] = useState(false);
  return (
    <span className="lf-npub">
      <code>{CREW_NPUB ?? "npub1… (the crew's npub goes here)"}</code>
      <Button
        disabled={!CREW_NPUB}
        onClick={async () => {
          if (!CREW_NPUB) return;
          await navigator.clipboard.writeText(CREW_NPUB).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </span>
  );
}

interface Guide {
  title: string;
  lede: string;
  steps: { h: string; body: React.ReactNode }[];
  after: React.ReactNode;
}

const GUIDES: Record<GuideKey, Guide> = {
  send: {
    title: "Send a letter",
    lede: "No stamps, no website. Paper, a pen and a box.",
    steps: [
      {
        h: "Find a box",
        body: "Look on the map for a box near you, or one in a place you're going. Any box will do; letters find their way.",
      },
      {
        h: "Write it",
        body: (
          <>
            Any paper, any envelope. On the front: who it's for and the city, big. A full address
            helps, or say who in that city could pass it on. Draw the little foot so carriers know
            it's a Lightfoot letter.
            <Envelope />
          </>
        ),
      },
      {
        h: "Drop it in",
        body: "Leave it in the box. If the host is around, say hello; they like knowing letters came in.",
      },
      {
        h: "Let go",
        body: "Someone heading that way will take it along. It may change hands a few times and take weeks. That's the charm.",
      },
    ],
    after: (
      <p>
        <b>Tip:</b> letters to cities on busy routes (Lisbon, Berlin, Kraków, Prague) travel
        fastest. A letter to a tiny village may wait for the right person.
      </p>
    ),
  },
  carry: {
    title: "Carry letters",
    lede: "Going somewhere? You might be the person a letter has been waiting for.",
    steps: [
      {
        h: "Check your route",
        body: (
          <>
            Before you leave, look at the boxes along the way. A box with letters waiting has a
            little green envelope.{" "}
            <Link to="/going" search={(s) => s}>
              Look up a city
            </Link>
          </>
        ),
      },
      {
        h: "Stop by",
        body: "Open the box and look through the envelopes. Take any going your way, or closer to it. Leave the rest.",
      },
      {
        h: "Carry it",
        body: "Keep it somewhere dry. You're a postman now, a slow and friendly one.",
      },
      {
        h: "Drop it, or hand it over",
        body: "Put it in a box near its city, or deliver it by hand if the address is close. Both are lovely.",
      },
      {
        h: "Tell the map, if you like",
        body: "Got a Nostr app? Leave a note on the box saying what you took or left. It shows in the guestbook and helps the next person.",
      },
    ],
    after: (
      <p>
        <b>No pressure:</b> if plans change, drop the letter in any box. Someone else will carry it
        on.
      </p>
    ),
  },
  setup: {
    title: "Put up a box",
    lede: "A shoebox and a corner of a shelf. Here's how to start one.",
    steps: [
      {
        h: "Find a spot",
        body: "A place travellers pass through, with someone around: a hostel reception, a café counter, a community space. Ask the people who run it first.",
      },
      {
        h: "Make the box",
        body: "A shoebox works. Cut a slot, write LIGHTFOOT on it and one line: “Leave a letter. Take one that's going your way.” Draw the foot. Decorate as you like.",
      },
      {
        h: "Write down how to find it",
        body: "The name of the place, the address, and a sentence like “behind reception, on the shelf with the board games”.",
      },
      {
        h: "Send us a Nostr DM",
        body: (
          <>
            For now, a few of us put boxes on the map by hand. Send the place, the address and how
            to find the box to the Lightfoot crew as a direct message from any Nostr app:
            <CrewNpub />
            We'll write back when your box is up. No photo needed.
          </>
        ),
      },
      {
        h: "Look after it",
        body: "Peek in now and then and tell the map whether letters are waiting. The box stays on the map for six months and renews whenever it's checked.",
      },
    ],
    after: (
      <p>
        <b>Why by hand?</b> We're starting small, with boxes run by people we know, so every box on
        the map is really there. Later anyone will be able to add one.
      </p>
    ),
  },
};

/** The three guides, as tabs in one window. */
export function GuideWindow({ guideKey }: { guideKey: string }) {
  const key: GuideKey = isGuideKey(guideKey) ? guideKey : "send";
  const g = GUIDES[key];
  return (
    <LfWindow crumbs={["Guides", g.title]} label={g.title}>
      <nav className="lf-tabs" aria-label="Guides">
        {GUIDE_KEYS.map((k) => (
          <Link
            key={k}
            to="/guide/$key"
            params={{ key: k }}
            search={(s) => s}
            aria-current={k === key ? "page" : undefined}
          >
            {GUIDES[k].title}
          </Link>
        ))}
      </nav>
      <h1>{g.title}</h1>
      <p className="text-[1.0625rem]">{g.lede}</p>
      <ol className="lf-steps">
        {g.steps.map((s) => (
          <li key={s.h}>
            <h3>{s.h}</h3>
            <div>{s.body}</div>
          </li>
        ))}
      </ol>
      {g.after}
      <div className="lf-actions">
        <Link to="/" search={(s) => s} className={buttonVariants({ variant: "go" })}>
          Find a box on the map
        </Link>
      </div>
    </LfWindow>
  );
}
