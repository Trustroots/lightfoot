import { Notice } from "@lightfoot/ui/components/notice";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "../app-context";
import { sourceText } from "./sourceText";
import { FootIcon, MoonIcon, SunIcon } from "./icons";

const NOTICE_KEY = "lf-notice";

/** The places the nav bar links to. Add a page here and it shows up in the bar. */
const NAV = [
  { to: "/", label: "Map", exact: true },
  { to: "/hello", label: "About" },
  { to: "/guide/$key", params: { key: "send" }, label: "Guides" },
  { to: "/going", label: "Going somewhere?", short: "Trips" },
  { to: "/boxes", label: "All boxes", short: "List" },
] as const;

/**
 * The top of the page, the way 2000s community sites did it: a banner with the name and a tagline,
 * a nav bar with a little counter, and the yellow "example boxes" bar while there's no real data.
 */
export function SiteHeader() {
  const app = useApp();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem(NOTICE_KEY) === "hidden");
  const dark = app.theme === "dark";
  const waiting = app.boxes.filter((b) => b.status.state === "letters-waiting").length;

  return (
    <header className="lf-head">
      <div className="lf-head-row lf-kraft">
        <Link to="/" search={(s) => s} className="lf-logo" aria-label="Lightfoot, the map">
          <FootIcon />
          <b>Lightfoot</b>
          <i>letters that travel by people</i>
        </Link>
        <button
          type="button"
          className="lf-lights"
          onClick={app.toggleTheme}
          aria-label={dark ? "Lights on (light mode)" : "Lights off (dark mode)"}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
          <span className="lf-phone-hide">{dark ? "Lights on" : "Lights off"}</span>
        </button>
      </div>
      <nav className="lf-navbar" aria-label="Site">
        <ul>
          {NAV.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                params={"params" in item ? item.params : undefined}
                search={(s) => s}
                activeOptions={{ exact: "exact" in item }}
                activeProps={{ "aria-current": "page" }}
              >
                {"short" in item ? (
                  <>
                    <span className="lf-phone-only" aria-hidden="true">
                      {item.short}
                    </span>
                    <span className="lf-phone-hide">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </Link>
            </li>
          ))}
        </ul>
        <span className="lf-counter" title="Boxes on the map right now">
          {app.boxes.length} boxes · {waiting} with letters
        </span>
      </nav>
      {app.usingSample && !hidden ? (
        <Notice data-notice="">
          <b className="whitespace-nowrap">Example boxes.</b>
          <span>
            {app.loading
              ? "Asking the relays for boxes…"
              : "The relays have none yet, so these are made up."}{" "}
            <span className="lf-phone-hide">({sourceText(app)})</span>
          </span>
          <button
            type="button"
            className="ml-auto cursor-pointer border-0 bg-transparent p-0 underline"
            onClick={() => {
              sessionStorage.setItem(NOTICE_KEY, "hidden");
              setHidden(true);
            }}
          >
            hide
          </button>
        </Notice>
      ) : null}
    </header>
  );
}
