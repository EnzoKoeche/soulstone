// Entry point da Edge Function (Deno) do poller.
//
// Composição: lê env → (freshness guard) → busca tudo da Steam (steam.ts →
// parser.ts) → upsert em `items` + insert em `price_snapshots` → carimba
// `market_status` → checa alertas (alerts.ts). Agendado via pg_cron a cada 30min
// (ver ../../README.md). NÃO é importado pelos testes: usa APIs do Deno e o
// supabase-js; a lógica testável vive em parser.ts/steam.ts/alerts.ts.
//
// supabase-js via JSR (recomendado no runtime atual). Alternativas equivalentes:
//   import { createClient } from "npm:@supabase/supabase-js@2";
//   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkAlerts } from "./alerts.ts";
import { fetchAllItems } from "./steam.ts";

function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (value === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

const FRESH_WINDOW_MS = 25 * 60 * 1000;

Deno.serve(async (): Promise<Response> => {
  try {
    const currency = Number(env("STEAM_CURRENCY", "1"));
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    // Freshness guard: o endpoint é público (verify_jwt=false), então qualquer um
    // pode dispará-lo. Se a última coleta foi há <25min, sai cedo SEM bater na
    // Steam nem inserir — limita o abuso a no máx. 1 coleta real por ~25min (NFR-01).
    const { data: last } = await supabase
      .from("price_snapshots")
      .select("captured_at")
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && Date.now() - new Date(last.captured_at).getTime() < FRESH_WINDOW_MS) {
      return Response.json({ ok: true, skipped: true, reason: "coleta recente (<25min)" });
    }

    const items = await fetchAllItems({
      appid: env("STEAM_APPID", "3678970"),
      currency,
      count: 100,
      pageDelayMs: Number(env("POLL_PAGE_DELAY_MS", "1200")),
      maxRetries: 5,
    });

    const now = new Date().toISOString();

    if (items.length === 0) {
      await supabase
        .from("market_status")
        .update({ note: "coleta retornou 0 itens", updated_at: now })
        .eq("id", 1);
      return Response.json({ ok: false, reason: "0 itens", items: 0 }, { status: 502 });
    }

    // upsert em items — sem first_seen_at (preserva o original; o default cobre o insert)
    const itemRows = items.map((i) => ({
      market_hash_name: i.marketHashName,
      display_name: i.displayName,
      type: i.type,
      rarity_color: i.rarityColor,
      icon_url: i.iconUrl,
      last_seen_at: now,
    }));
    const upsert = await supabase
      .from("items")
      .upsert(itemRows, { onConflict: "market_hash_name" });
    if (upsert.error) throw upsert.error;

    // insert em price_snapshots — captured_at usa o default now()
    const snapshotRows = items.map((i) => ({
      market_hash_name: i.marketHashName,
      sell_price_cents: i.sellPriceCents,
      sell_listings: i.sellListings,
      currency,
    }));
    const insert = await supabase.from("price_snapshots").insert(snapshotRows);
    if (insert.error) throw insert.error;

    // Atualiza só o carimbo de tempo. listings_open/note são CURADOS (política do
    // jogo — search/render não distingue "novas listagens fechadas"). FR-07.
    await supabase.from("market_status").update({ updated_at: now }).eq("id", 1);

    // Alertas: posta no Discord/Telegram se algum item cruzou o alvo.
    // Não pode derrubar a coleta → isolado em try/catch.
    let alertsSent = 0;
    try {
      const priceByName = new Map(
        items.map((i) => [
          i.marketHashName,
          { price: i.sellPriceCents, displayName: i.displayName },
        ]),
      );
      alertsSent = await checkAlerts(supabase, priceByName, Date.now());
    } catch (alertErr) {
      console.error("alertas falharam:", alertErr);
    }

    return Response.json({
      ok: true,
      items: items.length,
      alerts_sent: alertsSent,
      captured_at: now,
    });
  } catch (err) {
    console.error("poller falhou:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
