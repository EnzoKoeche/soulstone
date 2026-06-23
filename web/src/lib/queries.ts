import { supabase } from "./supabase";
import type { ItemLatest, MarketStatus, PricePoint, StageDrop, StageFarmValue } from "./types";

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

/** Valor/hora estimado por stage (view stage_farm_value, com preços ao vivo). */
export async function fetchStageFarmValue(): Promise<StageFarmValue[]> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase
    .from("stage_farm_value")
    .select("*")
    .order("value_per_hour_cents", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    stage_id: r.stage_id,
    name: r.name,
    act: r.act,
    difficulty: r.difficulty,
    clears_per_hour: Number(r.clears_per_hour),
    note: r.note,
    source: r.source,
    value_per_run_cents: Number(r.value_per_run_cents),
    value_per_hour_cents: Number(r.value_per_hour_cents),
  }));
}

/** Drops por stage (estimativas da comunidade). */
export async function fetchStageDrops(): Promise<StageDrop[]> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase.from("stage_drops").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    stage_id: r.stage_id,
    market_hash_name: r.market_hash_name,
    drops_per_run: Number(r.drops_per_run),
  }));
}

export interface MyAlert {
  id: number;
  market_hash_name: string;
  target_price_cents: number;
  direction: string;
  enabled: boolean;
  last_triggered_at: string | null;
}

interface AlertsResponse {
  error?: string;
  alerts?: MyAlert[];
}

async function alertsFn(body: Record<string, unknown>): Promise<AlertsResponse> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!url) throw new Error(NOT_CONFIGURED);
  const res = await fetch(`${url}/functions/v1/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as AlertsResponse;
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data;
}

/** Cria um alerta (Discord ou Telegram) via a função pública alerts. */
export async function createAlert(payload: {
  market_hash_name: string;
  target_price_cents: number;
  direction: "below" | "above";
  channel: "discord" | "telegram";
  discord_webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}): Promise<void> {
  await alertsFn({ action: "create", ...payload });
}

/** Lista os alertas de um webhook do Discord. */
export async function listAlerts(discordWebhookUrl: string): Promise<MyAlert[]> {
  const data = await alertsFn({ action: "list", discord_webhook_url: discordWebhookUrl });
  return data.alerts ?? [];
}

/** Remove um alerta (só se pertencer ao webhook). */
export async function deleteAlert(id: number, discordWebhookUrl: string): Promise<void> {
  await alertsFn({ action: "delete", id, discord_webhook_url: discordWebhookUrl });
}
