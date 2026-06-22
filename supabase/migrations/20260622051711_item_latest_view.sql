-- [além do §7] View de conveniência para o dashboard da v0.1.
-- "Último preço por item" = base da lista de itens de maior valor e dos cards.
-- É a query que o frontend NÃO consegue fazer bem no client (distinct on).
-- security_invoker=on → a view respeita o RLS de leitura pública das tabelas-base
-- (anon lê items/price_snapshots, então lê a view).

create view item_latest
with (security_invoker = on)
as
select distinct on (s.market_hash_name)
  s.market_hash_name,
  i.display_name,
  i.type,
  i.rarity_color,
  i.icon_url,
  s.sell_price_cents,
  s.sell_listings,
  s.currency,
  s.captured_at
from price_snapshots s
join items i on i.market_hash_name = s.market_hash_name
order by s.market_hash_name, s.captured_at desc;

grant select on item_latest to anon, authenticated;
