import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { BoxViewModel } from "../lib/boxes";
import type { LatLon } from "../lib/geohash";
import { STYLE_URL, landColor, themedStyle } from "../lib/mapStyle";
import type { Theme } from "../hooks/useTheme";
import { BOX_SVG } from "./icons";

interface MapViewProps {
  boxes: BoxViewModel[];
  theme: Theme;
  /** The box whose window is open, highlighted on the map. */
  current?: string;
  onSelect: (box: BoxViewModel) => void;
  onMove: (center: LatLon) => void;
  onReady: (map: maplibregl.Map) => void;
}

const STATUS_WORDS: Record<BoxViewModel["status"]["state"], string> = {
  "letters-waiting": "letters waiting",
  empty: "empty",
  differs: "reports differ",
  unknown: "no reports yet",
};

const LETTER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.5 6.5h17v11h-17z"/><path d="m4 7 8 6 8-6" stroke-linecap="round"/></svg>`;

function markerElement(vm: BoxViewModel): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "lf-marker";
  el.dataset.state = vm.status.state;
  el.setAttribute("aria-label", `${vm.box.name}: ${STATUS_WORDS[vm.status.state]}`);
  const badge =
    vm.status.state === "letters-waiting"
      ? `<span class="lf-marker-badge">${LETTER_SVG}</span>`
      : vm.status.state === "differs"
        ? `<span class="lf-marker-badge lf-marker-q" aria-hidden="true">?</span>`
        : "";
  el.innerHTML = `${BOX_SVG}${badge}<span class="lf-marker-label"></span>`;
  const label = el.querySelector(".lf-marker-label");
  if (label) label.textContent = vm.box.name;
  return el;
}

/** Full-screen map. It stays mounted for the life of the app; windows open over it. */
export function MapView({ boxes, theme, current, onSelect, onMove, onReady }: MapViewProps) {
  const container = useRef<HTMLElement>(null);
  const currentRef = useRef(current);
  const map = useRef<maplibregl.Map | null>(null);
  const base = useRef<StyleSpecification | null>(null);
  const markers = useRef<{ coord: string; marker: maplibregl.Marker }[]>([]);
  const handlers = useRef({ onSelect, onMove, onReady });
  const themeRef = useRef(theme);

  useEffect(() => {
    handlers.current = { onSelect, onMove, onReady };
  }, [onSelect, onMove, onReady]);

  useEffect(() => {
    if (!container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "bg",
            type: "background",
            paint: { "background-color": landColor(themeRef.current) },
          },
        ],
      },
      center: [13.44, 52.497],
      zoom: 11.6,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    map.current = instance;
    const syncLabels = () =>
      container.current?.classList.toggle("lf-show-labels", instance.getZoom() >= 11);
    instance.on("zoom", syncLabels);
    instance.on("moveend", () => {
      const c = instance.getCenter();
      handlers.current.onMove({ lat: c.lat, lon: c.lng });
    });
    syncLabels();
    handlers.current.onReady(instance);
    const abort = new AbortController();
    fetch(STYLE_URL, { signal: abort.signal })
      .then((r) => r.json() as Promise<StyleSpecification>)
      .then((style) => {
        base.current = style;
        instance.setStyle(themedStyle(style, themeRef.current));
      })
      .catch(() => {});
    return () => {
      abort.abort();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    themeRef.current = theme;
    if (map.current && base.current) map.current.setStyle(themedStyle(base.current, theme));
  }, [theme]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    for (const m of markers.current) m.marker.remove();
    markers.current = boxes.map((vm) => {
      const el = markerElement(vm);
      el.toggleAttribute("aria-current", vm.box.coord === currentRef.current);
      el.addEventListener("click", () => handlers.current.onSelect(vm));
      return {
        coord: vm.box.coord,
        marker: new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([vm.position.lon, vm.position.lat])
          .addTo(instance),
      };
    });
  }, [boxes]);

  useEffect(() => {
    currentRef.current = current;
    for (const m of markers.current) {
      m.marker.getElement().toggleAttribute("aria-current", m.coord === current);
    }
  }, [current]);

  return (
    <section ref={container} className="fixed inset-0 bg-kraft-dk" aria-label="Map of Lightfoot boxes" />
  );
}
