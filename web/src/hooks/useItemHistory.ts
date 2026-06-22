import { useEffect, useState } from "react";
import { fetchItemHistory } from "../lib/queries";
import type { PricePoint } from "../lib/types";

export function useItemHistory(marketHashName: string | null) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketHashName) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchItemHistory(marketHashName).then(
      (points) => {
        if (!active) return;
        setData(points);
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
  }, [marketHashName]);

  return { data, loading, error };
}
