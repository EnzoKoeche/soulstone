// Endpoint PÚBLICO de criação de alertas (self-service). Valida + rate-limita +
// insere via service_role. CORS liberado (chamado pelo frontend cross-origin).
// Só aceita webhook do discord.com (evita usar o poller como proxy SSRF).
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const WEBHOOK_RE = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
const MAX_PER_WEBHOOK = 10;

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
    const marketHashName = String(body.market_hash_name ?? "").trim();
    const targetCents = Math.trunc(Number(body.target_price_cents));
    const direction = String(body.direction ?? "");
    const webhook = String(body.discord_webhook_url ?? "").trim();

    if (!marketHashName) return json({ error: "Escolha um item." }, 400);
    if (!Number.isFinite(targetCents) || targetCents <= 0) {
      return json({ error: "Preço-alvo inválido." }, 400);
    }
    if (direction !== "below" && direction !== "above") {
      return json({ error: "Direção inválida." }, 400);
    }
    if (!WEBHOOK_RE.test(webhook)) {
      return json(
        { error: "Webhook do Discord inválido (https://discord.com/api/webhooks/...)." },
        400,
      );
    }

    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    const { data: item } = await supabase
      .from("items")
      .select("market_hash_name")
      .eq("market_hash_name", marketHashName)
      .maybeSingle();
    if (!item) return json({ error: "Item não encontrado." }, 400);

    const { count } = await supabase
      .from("price_alerts")
      .select("id", { count: "exact", head: true })
      .eq("discord_webhook_url", webhook);
    if ((count ?? 0) >= MAX_PER_WEBHOOK) {
      return json({ error: `Limite de ${MAX_PER_WEBHOOK} alertas por webhook.` }, 429);
    }

    const { error } = await supabase.from("price_alerts").insert({
      market_hash_name: marketHashName,
      target_price_cents: targetCents,
      direction,
      discord_webhook_url: webhook,
      enabled: true,
    });
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
