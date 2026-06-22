# Supabase — Soulstone

Banco (migrations) + Edge Function `poller`. **Nada precisa rodar em produção na v0.1** — estes são os artefatos.

## Estrutura
- `migrations/` — schema do §7 da spec (`items`, `price_snapshots`, `market_status` + índice + RLS de leitura pública).
- `functions/poller/`
  - `parser.ts` — **puro, testado** (Vitest). Converte a resposta da Steam em itens. Núcleo crítico (NFR-04).
  - `steam.ts` — fetch paginado + delay entre páginas + **backoff em 429** (NFR-01). Testado.
  - `index.ts` — entry Deno: orquestra coleta → `upsert items` / `insert price_snapshots` → atualiza `market_status`.
  - `*.test.ts` — rodam da **raiz** com `npm test` (não da pasta `supabase/`).

## Variáveis / secrets da função
Ver `.env.example` na raiz. A função lê: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STEAM_APPID` (3678970), `STEAM_CURRENCY` (1 = USD), `POLL_PAGE_DELAY_MS` (2500).

> A Steam devolve **`pagesize` 10** mesmo pedindo `count=100`; o poller pagina pelo tamanho real, então cobrir ~153 itens = ~16 requisições por ciclo, com delay entre elas.

## Rodar localmente (requer o [Supabase CLI](https://supabase.com/docs/guides/cli))
```bash
supabase start                      # sobe Postgres + stack local
supabase db reset                   # aplica as migrations de migrations/
supabase functions serve poller --env-file ../.env --no-verify-jwt
# em outro terminal, dispara uma coleta:
curl -X POST http://localhost:54321/functions/v1/poller
```

## Deploy (quando for a hora — não agora)
```bash
supabase link --project-ref <REF>
supabase db push                    # aplica migrations no projeto remoto
supabase secrets set STEAM_APPID=3678970 STEAM_CURRENCY=1 POLL_PAGE_DELAY_MS=2500
supabase functions deploy poller
```
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas no runtime da função; não precisa setá-las como secret.

## Agendamento via pg_cron a cada 30 min  ⚠️ NÃO rodar agora
Documentado para a v0.1; só executar quando o projeto estiver no ar. Requer as extensões `pg_cron` e `pg_net` e a service role key guardada no Vault.

```sql
-- 1) extensões (uma vez)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) guardar a service role key no Vault (uma vez)
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');

-- 3) agendar a coleta a cada 30 min (NFR-02)
select cron.schedule(
  'soulstone-poller',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/poller',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
      )
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- inspecionar / remover:
--   select * from cron.job;
--   select cron.unschedule('soulstone-poller');
```
