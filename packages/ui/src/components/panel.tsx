import { cn } from "../lib/utils";

interface PanelProps extends Omit<React.ComponentProps<"section">, "title"> {
  title: React.ReactNode;
  /** Small text on the right of the title bar. */
  aside?: React.ReactNode;
  /** Title bar on cardboard (default) or a custom class, e.g. for a status colour. */
  barClassName?: string;
  /** Render children straight into the panel, without the padded content box (for tables). */
  flush?: boolean;
}

/** A 1px-bordered box with a title bar. */
function Panel({ title, aside, barClassName, flush, className, children, ...props }: PanelProps) {
  return (
    <section data-slot="panel" className={cn("lf-panel", className)} {...props}>
      <div className={cn("lf-panel-t", barClassName ?? "lf-kraft")}>
        {title}
        {aside ? <span className="lf-panel-r">{aside}</span> : null}
      </div>
      {flush ? children : <div className="lf-panel-c">{children}</div>}
    </section>
  );
}

export { Panel };
