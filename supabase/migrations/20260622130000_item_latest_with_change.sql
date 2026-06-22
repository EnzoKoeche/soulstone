-- [além do §7] v0.2.1 — variação 24h/7d.
-- Reescreve a view item_latest para incluir o preço de ~24h e ~7d atrás por item
-- (o mais recente snapshot <= aquele ponto no tempo). NULL quando ainda não há
-- histórico tão antigo → o frontend mostra "—". O cron vai preenchendo com o tempo.

create or replace view item_latest
with (security_invoker = on)
as
with latest as (
  select distinct on (market_hash_name)
    market_hash_name, sell_price_cents, sell_listings, currency, captured_at
  from price_snapshots
  order by market_hash_name, captured_at desc
),
p24 as (
  select distinct on (market_hash_name)
    market_hash_name, sell_price_cents as price_24h
  from price_snapshots
  where captured_at <= now() - interval '24 hours'
  order by market_hash_name, captured_at desc
),
p7 as (
  select distinct on (market_hash_name)
    market_hash_name, sell_price_cents as price_7d
  from price_snapshots
  where captured_at <= now() - interval '7 days'
  order by market_hash_name, captured_at desc
)
select
  l.market_hash_name,
  i.display_name,
  i.type,
  i.rarity_color,
  i.icon_url,
  l.sell_price_cents,
  l.sell_listings,
  l.currency,
  l.captured_at,
  p24.price_24h,
  p7.price_7d
from latest l
join items i on i.market_hash_name = l.market_hash_name
left join p24 on p24.market_hash_name = l.market_hash_name
left join p7 on p7.market_hash_name = l.market_hash_name;

grant select on item_latest to anon, authenticated;
