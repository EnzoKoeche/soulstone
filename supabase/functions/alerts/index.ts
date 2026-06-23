// API pública de alertas (self-service): create / list / delete. Valida +
// rate-limita + insere via service_role. CORS liberado. Discord ou Telegram.
// Gerenciar (list/delete) é por webhook do Discord (você precisa conhecê-lo).
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const DISCORD_RE = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
const TG_TOKEN_RE = /^\d+:[A-Za-z0-9_-]+$/;
const MAX_PER_CONTACT = 10;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function env(name: string): string {
  return Deno.env.get(name) ?? "";
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "use POST" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? "create");
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const webhook = String(body.discord_webhook_url ?? "").trim();

    if (action === "list") {
      if (!DISCORD_RE.test(webhook)) return json({ error: "Webhook inválido." }, 400);
      const { data } = await supabase
        .from("price_alerts")
        .select("id, market_hash_name, target_price_cents, direction, enabled, last_triggered_at")
        .eq("discord_webhook_url", webhook)
        .order("id");
      return json({ alerts: data ?? [] });
    }

    if (action === "delete") {
      const id = Math.trunc(Number(body.id));
      if (!DISCORD_RE.test(webhook) || !Number.isFinite(id)) {
        return json({ error: "Parâmetros inválidos." }, 400);
      }
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", id)
        .eq("discord_webhook_url", webhook);
      if (error) throw error;
      return json({ ok: true });
    }

    // create
    const marketHashName = String(body.market_hash_name ?? "").trim();
    const targetCents = Math.trunc(Number(body.target_price_cents));
    const direction = String(body.direction ?? "");
    const channel = String(body.channel ?? "discord");
    const tgToken = String(body.telegram_bot_token ?? "").trim();
    const tgChat = String(body.telegram_chat_id ?? "").trim();

    if (!marketHashName) return json({ error: "Escolha um item." }, 400);
    if (!Number.isFinite(targetCents) || targetCents <= 0) {
      return json({ error: "Preço-alvo inválido." }, 400);
    }
    if (direction !== "below" && direction !== "above") {
      return json({ error: "Direção inválida." }, 400);
    }

    let discordWebhook: string | null = null;
    let telegramToken: string | null = null;
    let telegramChat: string | null = null;
    let contactCol = "discord_webhook_url";
    let contactVal = "";

    if (channel === "discord") {
      if (!DISCORD_RE.test(webhook)) return json({ error: "Webhook do Discord inválido." }, 400);
      discordWebhook = webhook;
      contactVal = webhook;
    } else if (channel === "telegram") {
      if (!TG_TOKEN_RE.test(tgToken) || !tgChat) {
        return json({ error: "Bot token / chat id do Telegram inválido." }, 400);
      }
      telegramToken = tgToken;
      telegramChat = tgChat;
      contactCol = "telegram_chat_id";
      contactVal = tgChat;
    } else {
      return json({ error: "Canal inválido." }, 400);
    }

    const { data: item } = await supabase
      .from("items")
      .select("market_hash_name")
      .eq("market_hash_name", marketHashName)
      .maybeSingle();
    if (!item) return json({ error: "Item não encontrado." }, 400);

    const { count } = await supabase
      .from("price_alerts")
      .select("id", { count: "exact", head: true })
      .eq(contactCol, contactVal);
    if ((count ?? 0) >= MAX_PER_CONTACT) {
      return json({ error: `Limite de ${MAX_PER_CONTACT} alertas por canal.` }, 429);
    }

    const { error } = await supabase.from("price_alerts").insert({
      market_hash_name: marketHashName,
      target_price_cents: targetCents,
      direction,
      discord_webhook_url: discordWebhook,
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChat,
      enabled: true,
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
