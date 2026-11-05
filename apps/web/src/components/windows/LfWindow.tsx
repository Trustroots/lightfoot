import { Badge88 } from "@lightfoot/ui/components/badge88";
import { Window } from "@lightfoot/ui/components/dialog";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment } from "react";
import { useApp } from "../../app-context";
import { sourceText } from "../sourceText";

interface LfWindowProps {
  crumbs: string[];
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}

/** A route's window over the map. Closing it goes back to the bare map. */
export function LfWindow({ crumbs, label, wide, children }: LfWindowProps) {
  const navigate = useNavigate();
  const app = useApp();
  const source = sourceText(app);
  return (
    <Window
      open
      onClose={() => navigate({ to: "/", search: (s) => s })}
      label={label}
      wide={wide}
      crumbs={
        <>
          <Link to="/" search={(s) => s}>
            Map
          </Link>
          {crumbs.map((c) => (
            <Fragment key={c}> › {c}</Fragment>
          ))}
        </>
      }
    >
      {children}
      <footer className="lf-win-foot">
        <p>
          Lightfoot is made by a few people from the Trustroots community, because we like letters.
          No sign-up, no cookies, no tracking. Your letters never go online; only the boxes are on
          the map.
        </p>
        <p>{app.usingSample && !app.loading ? `${source}, so these are example boxes.` : source}</p>
        <div className="lf-b88s">
          <Badge88 left="SRC" right="GitHub" href="https://github.com/Trustroots/lightfoot" />
          <Badge88 left="NOSTR" right="inside" tone="green" href="https://nostr.com/" />
          <Badge88 left="TR" right="friends" tone="blue" href="https://www.trustroots.org/" />
        </div>
      </footer>
    </Window>
  );
}
