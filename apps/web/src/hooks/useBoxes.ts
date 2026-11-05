import { useEffect, useMemo, useState } from "react";
import { project, type BoxViewModel } from "../lib/boxes";
import { shortKey } from "../lib/format";
import { loadLive, type LiveData } from "../lib/relays";
import { SAMPLE_PEOPLE, buildSample } from "../lib/sampleData";
import { getWhitelist, type Whitelist } from "../lib/whitelist";

export interface BoxesState {
  boxes: BoxViewModel[];
  /** True while the example boxes are shown instead of relay data. */
  usingSample: boolean;
  loading: boolean;
  /** Relays that answered. */
  answered: string[];
  whitelist: Whitelist;
  /** A display name for a pubkey: a steward label, a sample name, or a short key. */
  nameOf: (pubkey: string) => string;
  /** Unix seconds, fixed for the session so relative dates don't jitter. */
  now: number;
}

/** Reads the relays once on load (read-only) and falls back to the example boxes. */
export function useBoxes(showEveryone: boolean): BoxesState {
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let cancelled = false;
    loadLive()
      .then((data) => {
        if (!cancelled) setLive(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const answered = live?.answered ?? [];
    if (live && live.boxes.length > 0) {
      const whitelist = getWhitelist();
      return {
        boxes: project(live.boxes, live.comments, {
          showEveryone,
          whitelist: whitelist.pubkeys,
          now,
        }),
        usingSample: false,
        loading,
        answered,
        whitelist,
        nameOf: (pk: string) => whitelist.labels.get(pk) ?? shortKey(pk),
        now,
      };
    }
    const sample = buildSample(now);
    return {
      boxes: project(sample.boxes, sample.comments, {
        showEveryone,
        whitelist: sample.whitelist.pubkeys,
        now,
        sample: true,
      }),
      usingSample: true,
      loading,
      answered,
      whitelist: sample.whitelist,
      nameOf: (pk: string) => SAMPLE_PEOPLE[pk] ?? shortKey(pk),
      now,
    };
  }, [live, loading, showEveryone, now]);
}
