import { Panel } from "@lightfoot/ui/components/panel";
import { buttonVariants } from "@lightfoot/ui/components/button";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { LfWindow } from "./LfWindow";

export const SEEN_HELLO_KEY = "lf-seen-hello";

/** What Lightfoot is, for newcomers. Opens by itself on the first visit. */
export function HelloWindow() {
  useEffect(() => {
    localStorage.setItem(SEEN_HELLO_KEY, "1");
  }, []);

  return (
    <LfWindow crumbs={["About"]} label="What is Lightfoot?" wide>
      <div className="lf-hello">
        <div>
          <h1>
            Letters that travel <em>by people</em>
          </h1>
          <p className="text-[1.0625rem]">
            Lightfoot is a box. A shoebox at a hostel reception, a nicer one on a café shelf. You
            leave a letter in it, and someone heading that way carries it on.
          </p>
          <p className="text-ink-2">
            It started around 2009 as Lightfoot Sustainable Post. This is a new community project
            run by different people, picking the idea up with the original crew's consent.
          </p>
          <figure>
            <img
              src="/photos/hualien-reception.jpg"
              alt="A hostel reception with wooden panelling. On an easel stands a small blue box labelled 'carte postale'."
              width={960}
              height={720}
            />
            <figcaption>
              A postcard box on an easel by a hostel reception. That's all it takes. (Photo:
              Kai3952, CC BY-SA 4.0)
            </figcaption>
          </figure>
        </div>
        <div>
          <h2 className="!mt-1">How it works</h2>
          <ol className="lf-steps">
            <li>
              <b>Drop a letter.</b> Write the city big on the envelope and leave it in any box.
            </li>
            <li>
              <b>Someone takes it along.</b> A traveller going that way picks it up and drops it in
              a box nearer its city, or hands it over.
            </li>
            <li>
              <b>It arrives, slowly.</b> Maybe in a week, maybe in a season. That's part of it.
            </li>
          </ol>
          <div className="lf-actions">
            <Link to="/" search={(s) => s} className={buttonVariants({ variant: "go" })}>
              Find a box near me
            </Link>
            <Link
              to="/guide/$key"
              params={{ key: "send" }}
              search={(s) => s}
              className={buttonVariants()}
            >
              How to send a letter
            </Link>
          </div>
          <p>
            <Link to="/guide/$key" params={{ key: "setup" }} search={(s) => s}>
              I'd like to put up a box
            </Link>{" "}
            ·{" "}
            <Link to="/going" search={(s) => s}>
              I'm going on a trip
            </Link>
          </p>
          <Panel title="What's new">
            <ul className="lf-news">
              <li>
                <b>6 Nov 2026</b>
                <span>Hosts can DM the crew to get a box on the map. No photo needed.</span>
              </li>
              <li>
                <b>5 Nov 2026</b>
                <span>New map. Boxes now live on Nostr, so anyone can build on them.</span>
              </li>
              <li>
                <b>Soon</b>
                <span>Hosts can tell the map about their box without writing to us first.</span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </LfWindow>
  );
}
