import { Badge88 } from "@lightfoot/ui/components/badge88";
import { Notice } from "@lightfoot/ui/components/notice";
import { Panel } from "@lightfoot/ui/components/panel";
import { FootIcon } from "../components/icons";
import { CREW_NPUB } from "../lib/crew";

const REPO = "https://github.com/Trustroots/lightfoot";
const CIRCLE = "https://www.trustroots.org/circles/lightfoot";
const ORIGINAL =
  "https://web.archive.org/web/20091115030736/http://casarobino.org/2009/02/lightfoot-sustainable-post-sweeping-globe";

/** When something on the roadmap happens, move it up and change its state. */
const ROADMAP: { when: string; what: string; state: "done" | "now" | "next" | "later" }[] = [
  { when: "Nov 2026", what: "A draft of how boxes are written down on Nostr", state: "done" },
  {
    when: "Nov 2026",
    what: "A new map of boxes, with guides for writing and carrying letters",
    state: "now",
  },
  {
    when: "Next",
    what: "The first boxes, put up by people we know, in a few cities",
    state: "next",
  },
  {
    when: "Next",
    what: "Hosts send the crew a Nostr DM to get their box on the map",
    state: "next",
  },
  {
    when: "Later",
    what: "Hosts add their own boxes, and anyone can say “letters waiting”",
    state: "later",
  },
  { when: "Later", what: "Photos of boxes, once we run our own relay", state: "later" },
];

const STATE_LABEL = { done: "done", now: "working on it", next: "next", later: "later" } as const;

/**
 * The page lightfoot.trustroots.org shows until the map launches: what Lightfoot is, who runs it
 * now, what we're working on and where the code is. No map, no relay traffic.
 */
export function Placeholder() {
  return (
    <div className="lf-page">
      <header className="lf-head-row lf-kraft lf-page-head">
        <a href="/" className="lf-logo" aria-label="Lightfoot">
          <FootIcon />
          <b>Lightfoot</b>
          <i>letters that travel by people</i>
        </a>
      </header>
      <Notice>
        <b className="whitespace-nowrap">Under construction.</b>
        <span>The new map isn't up yet. This page says what Lightfoot is and what's coming.</span>
      </Notice>

      <main className="lf-page-main">
        <h1>
          Letters that travel <em>by people</em>
        </h1>
        <p className="lf-lede">
          Lightfoot is a box. A shoebox at a hostel reception, a nicer one on a café shelf. You
          leave a handwritten letter in it, and someone who is heading that way carries it on. No
          stamps, no planes, no hurry.
        </p>

        <Panel title="How it works">
          <ol className="lf-steps">
            <li>
              <b>Write a letter.</b> Any paper. Put who it's for and the city on the front, big.
            </li>
            <li>
              <b>Drop it in a box.</b> Any Lightfoot box will do.
            </li>
            <li>
              <b>Someone takes it along.</b> A traveller going that way picks it up, travels light
              (walking, cycling, hitchhiking, trains) and hands it over or leaves it in a box nearer
              its city.
            </li>
            <li>
              <b>It arrives, slowly.</b> In a week or a season. That's part of it.
            </li>
          </ol>
        </Panel>

        <Panel title="Who runs this">
          <p>
            Lightfoot started around 2009 as <a href={ORIGINAL}>Lightfoot Sustainable Post</a>, a
            postal community of travellers.
          </p>
          <p>
            <b>This is a new community project, run by different people.</b> We're a few people from
            the <a href="https://www.trustroots.org/">Trustroots</a> community, and we're picking
            the idea up again with the consent of the people behind the original. Same spirit, new
            map.
          </p>
          <blockquote className="lf-vow">
            “I am open, not closed. I trust myself, I trust others. I travel Light and stay aware. I
            protect solidarity. I hereby invoke my promise to deliver this parcel.”
            <span>The Lightfoot Vow, from the original site</span>
          </blockquote>
        </Panel>

        <Panel title="What we're working on" flush>
          <table className="lf-tbl">
            <tbody>
              {ROADMAP.map((r) => (
                <tr key={r.what}>
                  <td className="lf-when">{r.when}</td>
                  <td>{r.what}</td>
                  <td className="num">
                    <span className="lf-state" data-state={r.state}>
                      {STATE_LABEL[r.state]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <p>
          The map reads boxes from <a href="https://nostr.com/">Nostr</a>, so anyone can build on
          them. Letters never go online; only the boxes are on the map.
        </p>

        <Panel title="Want to help?">
          <ul className="lf-links">
            <li>
              <b>Code:</b> <a href={REPO}>github.com/Trustroots/lightfoot</a>. Issues and pull
              requests welcome, or just watch the progress.
            </li>
            <li>
              <b>Put up a box:</b>{" "}
              {CREW_NPUB ? (
                <>
                  send the Lightfoot crew a Nostr DM at <code className="lf-code">{CREW_NPUB}</code>
                </>
              ) : (
                "send the Lightfoot crew a Nostr DM"
              )}{" "}
              with the place and how to find the box.
            </li>
            <li>
              <b>Say hello:</b> the <a href={CIRCLE}>Lightfoot circle on Trustroots</a>.
            </li>
          </ul>
        </Panel>
      </main>

      <footer className="lf-page-foot">
        <p>No sign-up, no cookies, no tracking. Released into the public domain.</p>
        <div className="lf-b88s">
          <Badge88 left="SRC" right="GitHub" href={REPO} />
          <Badge88 left="NOSTR" right="inside" tone="green" href="https://nostr.com/" />
          <Badge88 left="TR" right="friends" tone="blue" href="https://www.trustroots.org/" />
          <Badge88 left="ANY" right="client" href="https://nostrapps.com/" />
        </div>
      </footer>
    </div>
  );
}
