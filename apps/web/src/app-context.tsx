import { createContext, useContext } from "react";
import type { LatLon } from "./lib/geohash";
import type { BoxesState } from "./hooks/useBoxes";
import type { Theme } from "./hooks/useTheme";

export interface AppState extends BoxesState {
  showEveryone: boolean;
  setShowEveryone: (on: boolean) => void;
  /** The middle of the map: "nearest" is measured from here. */
  center: LatLon;
  /** Moves the map; `zoom` defaults to keeping the current zoom or 13, whichever is closer. */
  flyTo: (to: LatLon, zoom?: number) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside <AppContext>");
  return ctx;
}
