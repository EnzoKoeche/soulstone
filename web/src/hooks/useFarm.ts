import { useEffect, useState } from "react";
import { fetchStageDrops, fetchStageFarmValue } from "../lib/queries";
import type { StageDrop, StageFarmValue } from "../lib/types";

export function useFarm() {
  const [stages, setStages] = useState<StageFarmValue[]>([]);
  const [drops, setDrops] = useState<StageDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchStageFarmValue(), fetchStageDrops()]).then(
      ([s, d]) => {
        if (!active) return;
        setStages(s);
        setDrops(d);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return { stages, drops, loading, error };
}
