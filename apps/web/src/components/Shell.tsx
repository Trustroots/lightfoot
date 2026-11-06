import { Outlet, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import type maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppContext, type AppState } from "../app-context";
import { useBoxes } from "../hooks/useBoxes";
import { useTheme } from "../hooks/useTheme";
import type { LatLon } from "../lib/geohash";
import { MapView } from "./MapView";
import { NearestStrip } from "./NearestStrip";
import { SiteHeader } from "./SiteHeader";
import { SEEN_HELLO_KEY } from "./windows/HelloWindow";

declare global {
  interface Window {
    /** For screenshot scripts: the map instance and whether the relay read finished. */
    lfMap?: maplibregl.Map;
    lfLiveDone?: boolean;
  }
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One page: the map, with the strip and header on it, and route windows opening over it. */
export function Shell() {
  const { everyone } = useSearch({ from: "__root__" });
  const showEveryone = everyone === 1;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = useBoxes(showEveryone);
  const { theme, toggle } = useTheme();
  const [center, setCenter] = useState<LatLon>({ lat: 52.497, lon: 13.44 });
  const map = useRef<maplibregl.Map | null>(null);

  // First visit: open the newcomer intro over the map (skip with ?hello=0).
  useEffect(() => {
    const skip = new URLSearchParams(location.search).get("hello") === "0";
    if (pathname === "/" && !skip && !localStorage.getItem(SEEN_HELLO_KEY)) {
      navigate({ to: "/hello", search: (s) => s, replace: true });
    }
    // Only on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data.loading) window.lfLiveDone = true;
  }, [data.loading]);

  const flyTo = useCallback((to: LatLon, zoom?: number) => {
    const m = map.current;
    if (!m) return;
    m.flyTo({
      center: [to.lon, to.lat],
      zoom: zoom ?? Math.max(m.getZoom(), 13),
      duration: reducedMotion() ? 0 : 1200,
    });
  }, []);

  const setShowEveryone = useCallback(
    (on: boolean) =>
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, everyone: on ? (1 as const) : undefined }),
      }),
    [navigate],
  );

  const app: AppState = useMemo(
    () => ({ ...data, showEveryone, setShowEveryone, center, flyTo, theme, toggleTheme: toggle }),
    [data, showEveryone, setShowEveryone, center, flyTo, theme, toggle],
  );

  const currentBox = pathname.startsWith("/box/")
    ? data.boxes.find((b) => `/box/${encodeURIComponent(b.box.d)}` === pathname)?.box.coord
    : undefined;

  return (
    <AppContext.Provider value={app}>
      <MapView
        boxes={data.boxes}
        theme={theme}
        current={currentBox}
        onSelect={(vm) => navigate({ to: "/box/$d", params: { d: vm.box.d }, search: (s) => s })}
        onMove={setCenter}
        onReady={(m) => {
          map.current = m;
          window.lfMap = m;
        }}
      />
      <SiteHeader />
      <NearestStrip />
      <Outlet />
    </AppContext.Provider>
  );
}
