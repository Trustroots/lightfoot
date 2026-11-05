import { Notice } from "@lightfoot/ui/components/notice";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "../app-context";
import { sourceText } from "./sourceText";
import { FootIcon, MoonIcon, SunIcon } from "./icons";

const NOTICE_KEY = "lf-notice";

/** The site banner across the top, plus the yellow "example boxes" bar while there's no real data. */
export function SiteHeader() {
  const app = useApp();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem(NOTICE_KEY) === "hidden");
  const dark = app.theme === "dark";

  return (
    <header className="lf-head lf-kraft">
      <div className="lf-head-row">
        <Link to="/" search={(s) => s} className="lf-logo" aria-label="Lightfoot, the map">
          <FootIcon />
          <b>Lightfoot</b>
          <i>letters that travel by people</i>
        </Link>
        <nav className="lf-nav" aria-label="Site">
          <Link to="/hello" search={(s) => s}>
            About
          </Link>
          <span className="sep" aria-hidden="true">
            ·
          </span>
          <Link to="/guide/$key" params={{ key: "send" }} search={(s) => s}>
            Guides
          </Link>
          <span className="sep" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={app.toggleTheme}
            aria-label={dark ? "Lights on (light mode)" : "Lights off (dark mode)"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
            <span className="lf-phone-hide">{dark ? "Lights on" : "Lights off"}</span>
          </button>
        </nav>
      </div>
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
            className="ml-auto cursor-pointer border-0 bg-transparent p-0 text-[0.8125rem] underline"
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
