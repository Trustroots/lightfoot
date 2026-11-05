import { buttonVariants } from "@lightfoot/ui/components/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { useApp } from "../../app-context";
import type { BoxViewModel } from "../../lib/boxes";
import { cityOf } from "../../lib/format";
import { StatusLine } from "../status";
import { LfWindow } from "./LfWindow";

interface City {
  city: string;
  boxes: BoxViewModel[];
  waiting: number;
}

export function citiesOf(boxes: BoxViewModel[]): City[] {
  const byCity = new Map<string, City>();
  for (const vm of boxes) {
    const city = cityOf(vm.box.location);
    const entry = byCity.get(city) ?? { city, boxes: [], waiting: 0 };
    entry.boxes.push(vm);
    if (vm.status.state === "letters-waiting") entry.waiting++;
    byCity.set(city, entry);
  }
  return [...byCity.values()].sort((a, b) => b.waiting - a.waiting || a.city.localeCompare(b.city));
}

/** "I'm going on a trip": look up a city and see whether letters wait there. */
export function GoingWindow() {
  const app = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const listId = useId();
  const cities = useMemo(() => citiesOf(app.boxes), [app.boxes]);
  const q = query.trim().toLowerCase();
  const shown = q ? cities.filter((c) => c.city.toLowerCase().includes(q)) : cities;

  const go = (c: City) => {
    const lat = c.boxes.reduce((s, b) => s + b.position.lat, 0) / c.boxes.length;
    const lon = c.boxes.reduce((s, b) => s + b.position.lon, 0) / c.boxes.length;
    navigate({ to: "/", search: (s) => s });
    app.flyTo({ lat, lon }, c.boxes.length > 1 ? 12 : 13.5);
  };

  return (
    <LfWindow crumbs={["Going somewhere?"]} label="Going somewhere?">
      <h1>Going somewhere?</h1>
      <p className="text-[1.0625rem]">
        Look up where you're going. If a box there has letters waiting, you could carry some along,
        or find one going your way.
      </p>
      <form
        className="mt-1.5 mb-4 flex gap-2"
        aria-label="Look up a city"
        onSubmit={(e) => {
          e.preventDefault();
          const hit = cities.find((c) => c.city.toLowerCase().startsWith(q));
          if (hit) go(hit);
        }}
      >
        <label className="sr-only" htmlFor={`${listId}-input`}>
          City
        </label>
        <input
          id={`${listId}-input`}
          className="lf-input"
          list={listId}
          placeholder="Lisbon, Kraków, Prague…"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <datalist id={listId}>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </datalist>
        <button type="submit" className={buttonVariants({ variant: "go" })}>
          Look
        </button>
      </form>
      <table className="lf-tbl">
        <thead>
          <tr>
            <th scope="col">City</th>
            <th scope="col" className="num">
              Boxes
            </th>
            <th scope="col">Letters</th>
          </tr>
        </thead>
        <tbody>
          {shown.length ? (
            shown.map((c) => (
              <tr key={c.city}>
                <td>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      go(c);
                    }}
                  >
                    {c.city}
                  </a>
                </td>
                <td className="num">{c.boxes.length}</td>
                <td>
                  {c.waiting ? (
                    <StatusLine state="letters-waiting" />
                  ) : (
                    <span className="lf-st" data-state="empty">
                      none waiting
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>
                No box in “{query}” yet.{" "}
                <Link to="/guide/$key" params={{ key: "setup" }} search={(s) => s}>
                  Maybe you'll put up the first one?
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </LfWindow>
  );
}
