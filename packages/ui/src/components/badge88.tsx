import { cn } from "../lib/utils";

interface Badge88Props extends React.ComponentProps<"a"> {
  left: string;
  right: string;
  tone?: "yellow" | "green" | "blue";
}

/** An 88×31 button, the kind sites put in their footer around 2005. */
function Badge88({ left, right, tone = "yellow", className, ...props }: Badge88Props) {
  return (
    <a
      data-slot="badge88"
      data-tone={tone}
      className={cn("lf-b88", className)}
      aria-label={`${left} ${right}`}
      {...props}
    >
      <span aria-hidden="true">{left}</span>
      <span aria-hidden="true">{right}</span>
    </a>
  );
}

export { Badge88 };
