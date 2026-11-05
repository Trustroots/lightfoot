import { Link } from "@tanstack/react-router";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useApp } from "../app-context";
import { cityOf, formatDistance } from "../lib/format";
import { distanceKm } from "../lib/geohash";
import { RouteIcon } from "./icons";
import { StatusLine } from "./status";
import { Thumb } from "./Thumb";

const NEAR_KM = 60;

/**
 * The nearest boxes, docked at the bottom of the map. It replaces the sidebar: the map keeps the
 * whole screen, the four closest boxes are one tap away, and the full list is a window.
 */
export function NearestStrip() {
  const { boxes, center } = useApp();
  const ref = useRef<HTMLElement>(null);

  const sorted = useMemo(
    () =>
      boxes.map((vm) => ({ vm, km: distanceKm(center, vm.position) })).sort((a, b) => a.km - b.km),
    [boxes, center],
  );
  const first = sorted[0];
  const near = first && first.km < NEAR_KM;
  const waiting = sorted.filter(
    (x) => x.km < NEAR_KM && x.vm.status.state === "letters-waiting",
  ).length;

  useLayoutEffect(() => {
    // How far the strip's top edge is from the bottom of the screen (it floats 16px up on desktop).
    const top = ref.current?.getBoundingClientRect().top;
    const h = top === undefined ? 0 : Math.max(0, innerHeight - top);
    document.documentElement.style.setProperty("--strip-h", `${Math.round(h)}px`);
  });

  return (
    <section ref={ref} className="lf-strip" aria-labelledby="strip-title">
      <div className="lf-strip-bar">
        <h2 id="strip-title">
          {near ? `Boxes near ${cityOf(first.vm.box.location)}` : "The nearest boxes"}
        </h2>
        {near ? (
          <span className="lf-phone-hide text-ink-2">
            · {waiting ? `${waiting} with letters waiting` : "nothing waiting"}
          </span>
        ) : null}
        <Link to="/boxes" search={(s) => s}>
          All boxes
        </Link>
      </div>
      <div className="lf-cards">
        {sorted.slice(0, 4).map(({ vm, km }) => (
          <Link
            key={vm.box.coord}
            className="lf-card"
            to="/box/$d"
            params={{ d: vm.box.d }}
            search={(s) => s}
          >
            <Thumb box={vm.box} />
            <span className="n">{vm.box.name}</span>
            <span className="m">
              {formatDistance(km)} · {cityOf(vm.box.location)}
            </span>
            <StatusLine state={vm.status.state} />
          </Link>
        ))}
        <Link className="lf-card more" to="/boxes" search={(s) => s}>
          <span className="n">All {boxes.length} boxes</span>
          <span className="m">as a list</span>
        </Link>
      </div>
      <div className="lf-strip-foot">
        <Link to="/going" search={(s) => s}>
          <RouteIcon /> Going somewhere? Look for letters there
        </Link>
      </div>
    </section>
  );
}
