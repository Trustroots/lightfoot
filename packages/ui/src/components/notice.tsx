import { cn } from "../lib/utils";

/** The yellow notice bar. */
function Notice({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="notice" aria-live="polite" className={cn("lf-notice", className)} {...props} />
  );
}

export { Notice };
