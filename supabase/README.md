# Supabase — Soulstone

Banco (migrations) + Edge Function `poller`.

## Estrutura
- `migrations/` — schema do §7 (`items`, `price_snapshots`, `market_status`) + índice + RLS de leitura pública + a view `item_latest` (último preço por item, com `price_24h`/`price_7d`).
- `functions/poller/`
  - `parser.ts` — **puro, testado** (Vitest). Converte a resposta da Steam em itens. Núcleo crítico (NFR-04).
  - `steam.ts` — fetch paginado + delay + **backoff em 429** + timeout (NFR-01). Testado.
  - `index.ts` — entry Deno: **freshness guard** → coleta → `upsert items` / `insert price_snapshots` → carimba `market_status`.
  - `*.test.ts` — rodam da **raiz** com `npm test`.

## Variáveis / secrets da função
A função lê (com defaults no código): `STEAM_APPID` (3678970), `STEAM_CURRENCY` (1 = USD), `POLL_PAGE_DELAY_MS` (**1200**). `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas no runtime — não precisa setá-las.

> A Steam devolve **`pagesize` 10** mesmo pedindo `count=100`; o poller pagina pelo tamanho real (~16 req/ciclo, com delay).

## Segurança do endpoint
A função tem `verify_jwt=false` (é disparada por cron, sem usuário). Como a URL é descobrível (o ref do projeto vai no bundle público), o `index.ts` tem um **freshness guard**: se a última coleta foi há menos de ~25 min, ele sai cedo **sem** bater na Steam nem inserir. Isso limita qualquer disparo externo a no máximo 1 coleta real por ~25 min (protege contra martelar a Steam / inflar o banco). **Não** use a `service_role` key como token do cron — ela não dá controle de acesso aqui (verify_jwt está off) e só aumenta a superfície de ataque; a `service_role` fica restrita ao client supabase-js **dentro** da função.

## Status do mercado (`listings_open`)
É **curado manualmente** — a política de "novas listagens abertas/fechadas" vem de anúncios do jogo e **não** dá pra inferir de `search/render` (itens já listados seguem à venda mesmo com o mercado fechado). Hoje está `false` (fechado desde 08/06/2026). Quando o mercado reabrir, atualize:
```sql
update market_status set listings_open = true, updated_at = now() where id = 1;
```

## Rodar localmente (requer o [Supabase CLI](https://supabase.com/docs/guides/cli))
```bash
supabase start
supabase db reset                   # aplica as migrations
supabase functions serve poller --env-file ../.env --no-verify-jwt
curl -X POST http://localhost:54321/functions/v1/poller
```

## Deploy (quando for a hora)
```bash
supabase link --project-ref <REF>
supabase db push
supabase functions deploy poller --no-verify-jwt
```

## Agendamento via pg_cron a cada 30 min
Requer `pg_cron` e `pg_net`. O header `Authorization` leva a **publishable key** (pública) só para passar o gateway de Functions — o controle real é o freshness guard acima.
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'soulstone-poller',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/poller',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <PUBLISHABLE_KEY>'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- inspecionar / remover:
--   select * from cron.job;
--   select cron.unschedule('soulstone-poller');
```
