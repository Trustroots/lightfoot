import { Button, buttonVariants } from "@lightfoot/ui/components/button";
import { Panel } from "@lightfoot/ui/components/panel";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../../app-context";
import { cityOf, formatDate, formatDistance } from "../../lib/format";
import { distanceKm } from "../../lib/geohash";
import { tag } from "../../lib/nostr";
import { isStatusValue, tierFor } from "../../lib/status";
import { RouteIcon, ShareIcon } from "../icons";
import { StatusLine, StatusPanel, TIER_LABEL } from "../status";
import { LfWindow } from "./LfWindow";

/** One box: photo, status, how to find it, the guestbook and the next boxes. */
export function BoxWindow({ d }: { d: string }) {
  const app = useApp();
  const vm = app.boxes.find((b) => b.box.d === d);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (vm) app.flyTo(vm.position, 13);
    // Only when the box changes, not on every recomputation of the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm?.box.coord]);

  if (!vm) {
    return (
      <LfWindow crumbs={["Not found"]} label="Box not found">
        <h1>{app.loading ? "Looking for this box…" : "This box isn't on the map anymore"}</h1>
        {app.loading ? null : (
          <p>
            Maybe the host took it down, or nobody checked on it for six months.{" "}
            <Link to="/boxes" search={(s) => s}>
              See all boxes
            </Link>
            .
          </p>
        )}
      </LfWindow>
    );
  }

  const { box, status, logbook, known } = vm;
  const city = cityOf(box.location);
  const { lat, lon } = vm.position;
  const osm = `https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lon.toFixed(5)}#map=18/${lat.toFixed(5)}/${lon.toFixed(5)}`;
  const others = app.boxes
    .filter((o) => o !== vm)
    .map((o) => ({ o, km: distanceKm(vm.position, o.position) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: box.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
      }
    } catch {
      /* the person cancelled the share sheet */
    }
  };

  return (
    <LfWindow crumbs={[city, box.name]} label={box.name}>
      <div className="lf-box-head">
        <figure className="lf-photo">
          {box.image ? (
            <>
              <img
                src={box.image}
                alt={`Where the box is: ${box.location ?? box.name}`}
                width={960}
                height={720}
              />
              {vm.sample ? (
                <figcaption>Stand-in photo from Wikimedia Commons (see credits).</figcaption>
              ) : null}
            </>
          ) : (
            <Panel title="Photo">
              <span className="text-[0.8125rem] text-ink-2">No photo of this box yet.</span>
            </Panel>
          )}
        </figure>
        <div>
          <h1>{box.name}</h1>
          <p className="text-ink-2">{box.location}</p>
          <StatusPanel status={status} />
        </div>
      </div>

      {known ? null : (
        <p className="lf-crew-note">
          <b>Not checked by the Lightfoot crew.</b> Someone we don't know yet put this box on the
          map. It's probably fine, but it might not be there.
        </p>
      )}

      <div className="lf-actions">
        <a className={buttonVariants({ variant: "go" })} href={osm} target="_blank" rel="noopener">
          <RouteIcon />
          Directions
        </a>
        <Button onClick={share}>
          <ShareIcon />
          {copied ? "Link copied" : "Share"}
        </Button>
      </div>

      <Panel title="About this box" flush>
        <table className="lf-facts">
          <tbody>
            {box.hint ? (
              <tr>
                <th scope="row">How to find it</th>
                <td>{box.hint}</td>
              </tr>
            ) : null}
            {box.content ? (
              <tr>
                <th scope="row">The host says</th>
                <td>{box.content}</td>
              </tr>
            ) : null}
            <tr>
              <th scope="row">On the map since</th>
              <td>
                {formatDate(box.createdAt)}, by {app.nameOf(box.pubkey)}
              </td>
            </tr>
            {box.expiration ? (
              <tr>
                <th scope="row">Stays until</th>
                <td>{formatDate(box.expiration)}, unless the host checks in again</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <h2>When you get there</h2>
      <p>
        <b>Got a letter?</b> Put it in, with the city written big.{" "}
        <Link to="/guide/$key" params={{ key: "send" }} search={(s) => s}>
          How to write it
        </Link>
      </p>
      <p>
        <b>Travelling on?</b> Look through the letters and take any that are going your way.{" "}
        <Link to="/guide/$key" params={{ key: "carry" }} search={(s) => s}>
          Carrying letters
        </Link>
      </p>

      <Panel
        title="Guestbook"
        aside={`${logbook.length} ${logbook.length === 1 ? "entry" : "entries"}`}
        flush
      >
        {logbook.length ? (
          <ol className="lf-guestbook">
            {logbook.map((c) => {
              const st = tag(c, "status");
              return (
                <li key={c.id}>
                  <div className="h">
                    <b>{app.nameOf(c.pubkey)}</b>
                    <span>{TIER_LABEL[tierFor(box, c.pubkey, app.whitelist.pubkeys)]}</span>
                    <span className="d">{formatDate(c.created_at)}</span>
                  </div>
                  {c.content ? <p>{c.content}</p> : null}
                  {isStatusValue(st) ? (
                    <div className="mt-1">
                      <StatusLine state={st} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="lf-panel-c text-ink-2">Nobody has signed the guestbook yet.</div>
        )}
      </Panel>
      <p className="text-[0.8125rem] text-ink-2">
        Been there? Anyone can add a note or a status report from a Nostr app; it shows up here. No
        app? Tell the host.
      </p>

      {others.length ? (
        <>
          <h2>The next boxes</h2>
          <table className="lf-tbl">
            <tbody>
              {others.map(({ o, km }) => (
                <tr key={o.box.coord}>
                  <td>
                    <Link to="/box/$d" params={{ d: o.box.d }} search={(s) => s}>
                      {o.box.name}
                    </Link>
                    <span className="lf-sub">{cityOf(o.box.location)}</span>
                  </td>
                  <td>
                    <StatusLine state={o.status.state} />
                  </td>
                  <td className="num">{formatDistance(km)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </LfWindow>
  );
}
