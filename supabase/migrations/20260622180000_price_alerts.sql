-- v0.5 — alertas de preço (FR-11). O poller checa após cada coleta e posta no
-- Discord/Telegram quando um item cruza o alvo. Lógica de disparo testada em
-- supabase/functions/poller/alerts.ts.

create table price_alerts (
  id                   bigserial primary key,
  market_hash_name     text not null,
  target_price_cents   integer not null,
  direction            text not null check (direction in ('below', 'above')),
  enabled              boolean not null default true,
  last_triggered_at    timestamptz,
  last_triggered_price integer,
  created_at           timestamptz not null default now()
);

-- Config de entrega (webhook/bot). PRIVADO: RLS habilitado SEM policy de leitura
-- pública → anon não lê; só a service_role (dentro do poller) acessa.
create table alert_config (
  id                  int primary key default 1,
  discord_webhook_url text,
  telegram_bot_token  text,
  telegram_chat_id    text,
  updated_at          timestamptz default now()
);
insert into alert_config (id) values (1) on conflict (id) do nothing;

alter table price_alerts enable row level security;
alter table alert_config enable row level security;

create policy "public read price_alerts" on price_alerts
  for select to anon, authenticated using (true);
-- alert_config: nenhuma policy de propósito (webhook/token ficam privados).
