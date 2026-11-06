/** Lightfoot's small hand-drawn icon set (one style, one stroke weight). */
type IconProps = React.SVGProps<SVGSVGElement>;

function Icon({ children, viewBox = "0 0 24 24", ...props }: IconProps) {
  return (
    <svg
      viewBox={viewBox}
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** The Lightfoot mark: a footprint whose sole is an envelope. */
export function FootIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 48 48" {...props}>
      <g fill="currentColor" stroke="none">
        <circle cx="12.5" cy="9" r="3.6" />
        <circle cx="20" cy="6.2" r="3" />
        <circle cx="26.6" cy="6.6" r="2.6" />
        <circle cx="32.4" cy="8.8" r="2.3" />
        <circle cx="37" cy="12.4" r="2" />
      </g>
      <path
        strokeWidth="2.6"
        d="M8.5 17.5c6-2.6 22-3.3 29.4.4 2.7 1.3 3.3 4.4 2.7 8.6l-1.4 10.2c-.5 3.4-2.5 5.4-6 5.6-6.6.4-13.6.3-19.3-.4-3.4-.4-5.4-2.6-5.8-6L7 24.3c-.4-3.3-.4-5.6 1.5-6.8Z"
      />
      <path strokeWidth="2.4" d="M9.5 20.5 23 31.2l15-10.4" />
    </Icon>
  );
}

export function LetterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6.5h17v11h-17z" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function EmptyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5 12 5l8 4.5v9.5H4z" />
      <path d="M4 9.5h16" />
    </Icon>
  );
}

export function QuestionIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path strokeWidth="2.2" d="M9.2 9.3a2.9 2.9 0 1 1 4 2.7c-.8.4-1.2 1-1.2 1.9v.6" />
      <circle cx="12" cy="17.6" r="1.3" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" />
    </Icon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <path d="M8.3 17.2c5-1 1.2-6.6 6-8.6" strokeDasharray="2.5 3" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6.5h14V13" />
    </Icon>
  );
}

/** The drawn cardboard box, as an SVG string for map markers (MapLibre markers are plain DOM). */
export const BOX_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <path d="M5 14.5 20 8l15 6.5v15.8L20 36.5 5 30.3Z" fill="oklch(0.74 0.08 66)" stroke="oklch(0.27 0.04 58)" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M5 14.5 20 21l15-6.5M20 21v15.5" fill="none" stroke="oklch(0.27 0.04 58)" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M10.5 22.6 15.5 25" stroke="oklch(0.27 0.04 58)" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M12.5 11.2 27.5 17.6" stroke="oklch(0.92 0.03 95 / .85)" stroke-width="4"/>
</svg>`;

export function BoxIcon(props: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} dangerouslySetInnerHTML={{ __html: BOX_SVG }} />;
}
