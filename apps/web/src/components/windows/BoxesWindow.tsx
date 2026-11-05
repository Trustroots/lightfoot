import { Link } from "@tanstack/react-router";
import { useApp } from "../../app-context";
import { cityOf, formatDistance } from "../../lib/format";
import { distanceKm } from "../../lib/geohash";
import { StatusLine } from "../status";
import { LfWindow } from "./LfWindow";

/** Every box as a list, nearest first, with the "everyone" toggle. */
export function BoxesWindow() {
  const app = useApp();
  const sorted = app.boxes
    .map((vm) => ({ vm, km: distanceKm(app.center, vm.position) }))
    .sort((a, b) => a.km - b.km);

  return (
    <LfWindow crumbs={["All boxes"]} label="All boxes">
      <h1>
        All boxes <span className="text-[0.875rem] text-ink-2">({app.boxes.length})</span>
      </h1>
      <p>Nearest first, from the middle of the map.</p>
      <label className="lf-check">
        <input
          type="checkbox"
          checked={app.showEveryone}
          onChange={(e) => app.setShowEveryone(e.target.checked)}
        />
        <span>
          Show boxes from everyone
          <small>Off: only boxes put up by people the Lightfoot crew knows.</small>
        </span>
      </label>
      <table className="lf-tbl">
        <thead>
          <tr>
            <th scope="col">Box</th>
            <th scope="col">Status</th>
            <th scope="col" className="num">
              Distance
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ vm, km }) => (
            <tr key={vm.box.coord}>
              <td>
                <Link to="/box/$d" params={{ d: vm.box.d }} search={(s) => s}>
                  {vm.box.name}
                </Link>
                <span className="lf-sub">
                  {cityOf(vm.box.location)}
                  {vm.known ? "" : " · not checked by the crew"}
                </span>
              </td>
              <td>
                <StatusLine state={vm.status.state} />
              </td>
              <td className="num">{formatDistance(km)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </LfWindow>
  );
}
