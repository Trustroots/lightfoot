import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Shell } from "./components/Shell";
import { BoxWindow } from "./components/windows/BoxWindow";
import { BoxesWindow } from "./components/windows/BoxesWindow";
import { GoingWindow } from "./components/windows/GoingWindow";
import { GuideWindow } from "./components/windows/GuideWindow";
import { HelloWindow } from "./components/windows/HelloWindow";

export interface RootSearch {
  /** `?everyone=1` shows boxes from everyone, not only stewards. */
  everyone?: 1;
}

const rootRoute = createRootRoute({
  component: Shell,
  // Old links used `allowUnverified=true`; accept it as an alias.
  validateSearch: (search: Record<string, unknown>): RootSearch =>
    Number(search.everyone) === 1 || String(search.allowUnverified) === "true"
      ? { everyone: 1 }
      : {},
});

// `/` is the bare map: no window.
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });

const boxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/box/$d",
  component: function BoxRoute() {
    const { d } = boxRoute.useParams();
    return <BoxWindow key={d} d={d} />;
  },
});

const guideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guide/$key",
  component: function GuideRoute() {
    const { key } = guideRoute.useParams();
    return <GuideWindow guideKey={key} />;
  },
});

const helloRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hello",
  component: HelloWindow,
});

const goingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/going",
  component: GoingWindow,
});

const boxesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/boxes",
  component: BoxesWindow,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  boxRoute,
  guideRoute,
  helloRoute,
  goingRoute,
  boxesRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
