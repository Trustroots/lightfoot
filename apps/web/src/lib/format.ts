const DAY = 86_400;

/** "350 m", "1.4 km", "1,528 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round((km * 1000) / 50) * 50} m`;
  if (km < 20) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en")} km`;
}

/** "13 Apr 2027". */
export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "today", "yesterday", "5 days ago", "3 weeks ago", "3 months ago". */
export function ago(ts: number, now: number): string {
  const days = Math.round((now - ts) / DAY);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** The city is the last part of a box's human address. */
export function cityOf(location: string | undefined): string {
  const city = (location ?? "").split(",").pop()?.trim();
  return city || "Somewhere";
}

export function shortKey(pubkey: string): string {
  return `${pubkey.slice(0, 8)}…`;
}
