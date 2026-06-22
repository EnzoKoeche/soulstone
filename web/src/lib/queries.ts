import { supabase } from "./supabase";
import type { ItemLatest, MarketStatus, PricePoint } from "./types";

const NOT_CONFIGURED = "Supabase não configurado";

/** Itens de maior valor: último preço por item (view item_latest), ordenado. */
export async function fetchTopItems(limit = 300): Promise<ItemLatest[]> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase
    .from("item_latest")
    .select("*")
    .order("sell_price_cents", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Série de preço × tempo de um item (FR-06). */
export async function fetchItemHistory(marketHashName: string, limit = 500): Promise<PricePoint[]> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase
    .from("price_snapshots")
    .select("captured_at, sell_price_cents")
    .eq("market_hash_name", marketHashName)
    .order("captured_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Status do mercado (FR-07) — singleton id=1. */
export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase
    .from("market_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
