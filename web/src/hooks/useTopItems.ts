import { useEffect, useState } from "react";
import { fetchTopItems } from "../lib/queries";
import type { ItemLatest } from "../lib/types";

export function useTopItems() {
  const [data, setData] = useState<ItemLatest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTopItems().then(
      (items) => {
        if (!active) return;
        setData(items);
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

  return { data, loading, error };
}
