import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useRef } from "react";
import { cn } from "../lib/utils";

interface WindowProps {
  open: boolean;
  /** Called when the window asks to close: Escape, a click on the backdrop, or the Close button. */
  onClose: () => void;
  /** Breadcrumbs shown in the title bar. */
  crumbs: React.ReactNode;
  /** Accessible name of the window, usually the page heading. */
  label: string;
  wide?: boolean;
  /** The Close control; pass a link to make closing a navigation. Defaults to a plain button. */
  closeControl?: React.ReactElement;
  closeLabel?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * A modal window over the map, dressed as a 2005 pop-up: cardboard title bar with breadcrumbs and
 * Close. Full screen on phones, centred on wider screens. Built on Base UI's Dialog (focus trap,
 * Escape, scroll lock).
 */
function Window({
  open,
  onClose,
  crumbs,
  label,
  wide,
  closeControl,
  closeLabel = "Close",
  className,
  children,
}: WindowProps) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="lf-backdrop" />
        <DialogPrimitive.Popup
          aria-label={label}
          className={cn("lf-win", className)}
          data-wide={wide ? "" : undefined}
          initialFocus={body}
        >
          <div className="lf-win-bar lf-kraft">
            <span className="lf-win-crumbs">{crumbs}</span>
            <DialogPrimitive.Close
              className="lf-btn lf-win-close"
              aria-label="Close and go back to the map"
              render={closeControl}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              {closeLabel}
            </DialogPrimitive.Close>
          </div>
          <div className="lf-win-body" ref={body} tabIndex={-1} data-scroll="">
            <div className="lf-win-in">{children}</div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Window };
