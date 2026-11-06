import { Link } from "@tanstack/react-router";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../app-context";
import { cityOf, formatDistance } from "../lib/format";
import { distanceKm } from "../lib/geohash";
import { StatusLine } from "./status";
import { Thumb } from "./Thumb";

const NEAR_KM = 60;
const FOLDED_KEY = "lf-strip-folded";

/**
 * The nearest boxes, docked at the bottom of the map instead of a sidebar. The map keeps the whole
 * screen, the four closest boxes are one tap away, and the [–] button folds it down to its title
 * bar, like the boxes on an old portal page. The full list is the "All boxes" window.
 */
export function NearestStrip() {
  const { boxes, center } = useApp();
  const ref = useRef<HTMLElement>(null);
  const [folded, setFolded] = useState(() => localStorage.getItem(FOLDED_KEY) === "1");

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
    // How far the strip's top edge is from the bottom of the screen (it floats up on desktop).
    const top = ref.current?.getBoundingClientRect().top;
    const h = top === undefined ? 0 : Math.max(0, innerHeight - top);
    document.documentElement.style.setProperty("--strip-h", `${Math.round(h)}px`);
  });

  const toggle = () => {
    localStorage.setItem(FOLDED_KEY, folded ? "0" : "1");
    setFolded(!folded);
  };

  return (
    <section
      ref={ref}
      className="lf-strip"
      aria-labelledby="strip-title"
      data-folded={folded ? "" : undefined}
    >
      <div className="lf-strip-bar lf-kraft">
        <button
          type="button"
          className="lf-fold"
          onClick={toggle}
          aria-expanded={!folded}
          aria-controls="strip-cards"
          aria-label={folded ? "Show the nearest boxes" : "Fold the nearest boxes away"}
        >
          {folded ? "+" : "–"}
        </button>
        <h2 id="strip-title">
          {near ? `Boxes near ${cityOf(first.vm.box.location)}` : "The nearest boxes"}
        </h2>
        {near ? (
          <span className="lf-phone-hide opacity-80">
            · {waiting ? `${waiting} with letters waiting` : "nothing waiting"}
          </span>
        ) : null}
        <Link to="/boxes" search={(s) => s}>
          All {boxes.length}
        </Link>
      </div>
      {folded ? null : (
        <div className="lf-cards" id="strip-cards">
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
        </div>
      )}
    </section>
  );
}
