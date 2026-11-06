import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/** The one button look: a slightly raised 2005 button. Use `buttonVariants` on links too. */
const buttonVariants = cva("lf-btn [&_svg]:size-[18px] [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "",
      go: "lf-btn-go",
    },
  },
  defaultVariants: { variant: "default" },
});

function Button({
  className,
  variant = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
