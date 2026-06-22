import { useEffect, useState } from "react";
import { fetchMarketStatus } from "../lib/queries";
import type { MarketStatus } from "../lib/types";

export function useMarketStatus() {
  const [data, setData] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchMarketStatus().then(
      (status) => {
        if (!active) return;
        setData(status);
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
