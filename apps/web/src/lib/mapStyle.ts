import type { StyleSpecification } from "maplibre-gl";

export const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

type Theme = "light" | "dark";
type Lch = readonly [number, number, number];

/** OKLCH → sRGB, so the tiles can share the site's OKLCH palette. */
export function oklchToRgb([L, C, h]: Lch, alpha = 1): string {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const [r, g, bl] = linear.map((x) => {
    const v = Math.max(0, Math.min(1, x));
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
  });
  return `rgba(${r},${g},${bl},${alpha})`;
}

const COLORS: Record<Theme, Record<string, Lch>> = {
  light: {
    land: [0.95, 0.012, 85],
    water: [0.82, 0.05, 225],
    park: [0.9, 0.05, 135],
    building: [0.915, 0.01, 75],
    road: [1, 0, 0],
    roadCase: [0.84, 0.015, 75],
    minor: [0.975, 0.005, 85],
    rail: [0.82, 0.01, 75],
    boundary: [0.6, 0.03, 60],
    label: [0.3, 0.02, 60],
    halo: [0.98, 0.006, 85],
    waterLabel: [0.42, 0.07, 235],
  },
  dark: {
    land: [0.22, 0.01, 65],
    water: [0.27, 0.04, 235],
    park: [0.25, 0.035, 135],
    building: [0.25, 0.01, 65],
    road: [0.35, 0.01, 65],
    roadCase: [0.28, 0.01, 65],
    minor: [0.3, 0.008, 65],
    rail: [0.34, 0.01, 65],
    boundary: [0.5, 0.03, 65],
    label: [0.84, 0.02, 80],
    halo: [0.21, 0.01, 65],
    waterLabel: [0.72, 0.05, 230],
  },
};

export function landColor(theme: Theme): string {
  return oklchToRgb(COLORS[theme].land ?? [0.5, 0, 0]);
}

/** Recolours the OpenFreeMap positron style to the site's palette. */
export function themedStyle(base: StyleSpecification, theme: Theme): StyleSpecification {
  const P = COLORS[theme];
  const c = (key: string, alpha?: number) => oklchToRgb(P[key] ?? [0.5, 0, 0], alpha);
  const style = structuredClone(base);
  for (const layer of style.layers) {
    const id = layer.id;
    const paint = ((layer as { paint?: Record<string, unknown> }).paint ??= {});
    const set = (prop: string, value: string) => {
      paint[prop] = value;
    };
    if (layer.type === "background") set("background-color", c("land"));
    else if (id === "water") set("fill-color", c("water"));
    else if (id === "waterway") set("line-color", c("water"));
    else if (id === "park" || id.startsWith("landcover_wood")) set("fill-color", c("park"));
    else if (id.startsWith("landcover_") || id === "landuse_residential")
      set("fill-color", c("land"));
    else if (id === "building") {
      set("fill-color", c("building"));
      set("fill-outline-color", c("roadCase"));
    } else if (/casing/.test(id)) set("line-color", c("roadCase"));
    else if (/inner|highway_major_subtle|highway_motorway_subtle/.test(id))
      set("line-color", c("road"));
    else if (/highway_minor|highway_path|road_pier|aeroway/.test(id))
      set(layer.type === "line" ? "line-color" : "fill-color", c("minor"));
    else if (/railway/.test(id)) set("line-color", c("rail"));
    else if (/boundary/.test(id)) set("line-color", c("boundary", 0.6));
    else if (layer.type === "symbol") {
      set("text-color", /water/.test(id) ? c("waterLabel") : c("label"));
      set("text-halo-color", c("halo", 0.9));
    }
  }
  return style;
}
