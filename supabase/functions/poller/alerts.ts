// Alertas de preço: dispara quando um item cruza o alvo. A decisão de disparo é
// PURA e testável; a entrega (Discord/Telegram) é via fetch. Importável no Deno
// (poller) e no Vitest (Node) — sem APIs de runtime no escopo do módulo.

export interface PriceAlert {
  id: number;
  market_hash_name: string;
  target_price_cents: number;
  direction: "below" | "above";
  enabled: boolean;
  last_triggered_at: string | null;
  discord_webhook_url: string | null;
}

export interface AlertConfig {
  discord_webhook_url: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
}

export interface PriceInfo {
  price: number;
  displayName: string;
}

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // não re-disparar o mesmo alerta antes de 6h

function centsToUsd(cents: number): string {
  const abs = Math.abs(Math.trunc(cents));
  return `${cents < 0 ? "-" : ""}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function conditionMet(direction: string, priceCents: number, targetCents: number): boolean {
  return direction === "below" ? priceCents <= targetCents : priceCents >= targetCents;
}

export function shouldTrigger(
  alert: PriceAlert,
  priceCents: number,
  nowMs: number,
  cooldownMs: number = COOLDOWN_MS,
): boolean {
  if (!alert.enabled) return false;
  if (!conditionMet(alert.direction, priceCents, alert.target_price_cents)) return false;
  if (alert.last_triggered_at) {
    const last = new Date(alert.last_triggered_at).getTime();
    if (Number.isFinite(last) && nowMs - last < cooldownMs) return false;
  }
  return true;
}

export function formatAlertMessage(
  alert: PriceAlert,
  displayName: string,
  priceCents: number,
): string {
  const arrow = alert.direction === "below" ? "≤" : "≥";
  return `🔔 **${displayName}** ${arrow} ${centsToUsd(alert.target_price_cents)} — agora **${centsToUsd(priceCents)}** no Steam Market (TBH).`;
}

type Fetcher = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<Response>;

export async function postDiscord(
  webhookUrl: string,
  content: string,
  fetchImpl: Fetcher = fetch,
): Promise<void> {
  await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function postTelegram(
  token: string,
  chatId: string,
  text: string,
  fetchImpl: Fetcher = fetch,
): Promise<void> {
  await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// Forma mínima do client supabase que usamos (evita `any` sem puxar o tipo do JSR).
interface QueryResult {
  data: unknown;
}
interface QueryBuilder extends Promise<QueryResult> {
  select(cols: string): QueryBuilder;
  eq(col: string, value: unknown): QueryBuilder;
  maybeSingle(): Promise<QueryResult>;
  update(values: Record<string, unknown>): QueryBuilder;
}
interface Db {
  from(table: string): QueryBuilder;
}

/** Orquestra a checagem (I/O). `db` é o client supabase (service_role). Retorna nº enviados. */
export async function checkAlerts(
  db: Db,
  priceByName: Map<string, PriceInfo>,
  nowMs: number,
): Promise<number> {
  const { data: config } = await db.from("alert_config").select("*").eq("id", 1).maybeSingle();
  const cfg = (config as AlertConfig | null) ?? {
    discord_webhook_url: null,
    telegram_bot_token: null,
    telegram_chat_id: null,
  };

  const { data: alerts } = await db.from("price_alerts").select("*").eq("enabled", true);
  if (!alerts) return 0;

  let sent = 0;
  for (const alert of alerts as PriceAlert[]) {
    const info = priceByName.get(alert.market_hash_name);
    if (!info || !shouldTrigger(alert, info.price, nowMs)) continue;
    const message = formatAlertMessage(alert, info.displayName, info.price);

    // webhook do PRÓPRIO alerta (self-service) ou o global (fallback do seed).
    const webhook = alert.discord_webhook_url ?? cfg.discord_webhook_url;
    let delivered = false;
    if (webhook) {
      await postDiscord(webhook, message);
      delivered = true;
    }
    if (cfg.telegram_bot_token && cfg.telegram_chat_id) {
      await postTelegram(cfg.telegram_bot_token, cfg.telegram_chat_id, message);
      delivered = true;
    }
    if (!delivered) continue;

    await db
      .from("price_alerts")
      .update({
        last_triggered_at: new Date(nowMs).toISOString(),
        last_triggered_price: info.price,
      })
      .eq("id", alert.id);
    sent += 1;
  }
  return sent;
}
