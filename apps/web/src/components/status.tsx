import { Panel } from "@lightfoot/ui/components/panel";
import { useApp } from "../app-context";
import { ago } from "../lib/format";
import type { Report, StatusResult, Tier } from "../lib/status";
import { EmptyIcon, LetterIcon, QuestionIcon } from "./icons";

type State = StatusResult["state"];

export const TIER_LABEL: Record<Tier, string> = {
  host: "host",
  steward: "Lightfoot crew",
  visitor: "visitor",
};

/** The short status used in lists and the strip. */
export function StatusLine({ state, count }: { state: State; count?: number }) {
  return (
    <span className="lf-st" data-state={state}>
      {state === "letters-waiting" ? (
        <>
          <LetterIcon />
          {count ? letterCount(count) : "Letters waiting"}
        </>
      ) : state === "empty" ? (
        <>
          <EmptyIcon />
          Empty
        </>
      ) : state === "differs" ? (
        "Reports differ"
      ) : (
        "No reports yet"
      )}
    </span>
  );
}

export function letterCount(count: number): string {
  return `${count} ${count === 1 ? "letter" : "letters"} waiting`;
}

const TITLE: Record<State, string> = {
  "letters-waiting": "Letters waiting",
  empty: "Empty right now",
  differs: "Reports differ",
  unknown: "Nobody has reported yet",
};

/** The panel title: the count when letters are waiting, else the state. */
function titleFor({ state, count }: StatusResult): string {
  return state === "letters-waiting" && count ? letterCount(count) : TITLE[state];
}

function ReportLine({ report }: { report: Report }) {
  const { nameOf, now } = useApp();
  return (
    <span className="who">
      {nameOf(report.author)} ({TIER_LABEL[report.tier]}) · {ago(report.createdAt, now)}
    </span>
  );
}

/** The status box on a box's window. */
export function StatusPanel({ status }: { status: StatusResult }) {
  const { state, lead, dissent, reports } = status;
  const title = titleFor(status);
  const Icon =
    state === "letters-waiting" ? LetterIcon : state === "empty" ? EmptyIcon : QuestionIcon;
  return (
    <Panel
      title="Status"
      className="lf-status"
      data-state={state}
      barClassName={
        state === "letters-waiting"
          ? "bar-waiting"
          : state === "differs"
            ? "bar-differs"
            : undefined
      }
    >
      <div className="big">
        <span className="ico">
          <Icon />
        </span>
        {title}
      </div>
      {state === "differs" && lead && dissent ? (
        <>
          <p>Two recent reports don't agree. Go and have a look, it's a box after all.</p>
          <ul className="lf-reports">
            {[lead, dissent].map((r) => (
              <li key={r.event.id}>
                <StatusLine state={r.state} count={r.count} /> {r.content ? `“${r.content}”` : null}
                <br />
                <ReportLine report={r} />
              </li>
            ))}
          </ul>
        </>
      ) : lead ? (
        <>
          {lead.content ? <blockquote>“{lead.content}”</blockquote> : null}
          <p className="who">
            <ReportLine report={lead} />
            {reports.length > 1 ? ` · ${reports.length} people reported` : null}
          </p>
        </>
      ) : (
        <p className="who">Hosts and visitors tell the map when letters are waiting.</p>
      )}
    </Panel>
  );
}
