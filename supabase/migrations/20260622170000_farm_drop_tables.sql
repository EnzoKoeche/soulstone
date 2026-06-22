-- v0.4 — drop tables + valor/hora de farm (FR-08).
-- `stages` e `stage_drops` modelam onde cada item dropa; `stage_farm_value`
-- calcula valor/hora = clears/hora × Σ(drops_por_run × preço ao vivo).
-- ⚠️ As taxas de drop e clears/hora são ESTIMATIVAS da comunidade (não oficiais);
-- só os preços (item_latest) são reais. Documentado na UI.

create table stages (
  id              text primary key,
  name            text not null,
  act             int,
  difficulty      text,
  clears_per_hour numeric not null default 120,
  note            text,
  source          text
);

create table stage_drops (
  stage_id         text not null references stages(id) on delete cascade,
  market_hash_name text not null,
  drops_per_run    numeric not null,
  primary key (stage_id, market_hash_name)
);

alter table stages enable row level security;
alter table stage_drops enable row level security;
create policy "public read stages" on stages for select to anon, authenticated using (true);
create policy "public read stage_drops" on stage_drops for select to anon, authenticated using (true);

create view stage_farm_value
with (security_invoker = on)
as
select
  s.id as stage_id, s.name, s.act, s.difficulty, s.clears_per_hour, s.note, s.source,
  coalesce(sum(d.drops_per_run * il.sell_price_cents), 0)::numeric as value_per_run_cents,
  coalesce(sum(d.drops_per_run * il.sell_price_cents) * s.clears_per_hour, 0)::numeric
    as value_per_hour_cents
from stages s
left join stage_drops d on d.stage_id = s.id
left join item_latest il on il.market_hash_name = d.market_hash_name
group by s.id, s.name, s.act, s.difficulty, s.clears_per_hour, s.note, s.source;

grant select on stage_farm_value to anon, authenticated;

-- seed (estimativas da comunidade — ver fontes na UI / Notion)
insert into stages (id, name, act, difficulty, clears_per_hour, note, source) values
  ('1-5',  'Floresta inicial (1-5)', 1, 'Torment', 165, 'Materiais comuns + chance baixa de Soulstone', 'estimativa da comunidade'),
  ('1-8',  'Boss 1-8',               1, 'Torment', 120, 'Boss chest — alvo clássico de Soulstone',      'estimativa da comunidade'),
  ('1-10', 'Fim do Ato 1 (1-10)',    1, 'Torment', 110, 'Ouro + gear de tier maior',                    'estimativa da comunidade'),
  ('2-4',  'Giant''s Valley (2-4)',  2, 'Torment', 130, 'Farm de Soulstone (Act 2-4)',                  'estimativa da comunidade'),
  ('2-10', 'Fim do Ato 2 (2-10)',    2, 'Torment', 100, 'Gear melhor; escala por nível do stage',       'estimativa da comunidade'),
  ('3-10', 'Fim do Ato 3 (3-10)',    3, 'Torment',  90, 'Gear de alto nível',                           'estimativa da comunidade')
on conflict (id) do nothing;

insert into stage_drops (stage_id, market_hash_name, drops_per_run) values
  ('1-5','Wood',1.0),('1-5','Stone',0.7),('1-5','Goblin Hide',0.4),('1-5','Minor Sapphire',0.12),
  ('1-8','Wood',0.8),('1-8','Stone',0.6),('1-8','Leather',0.3),('1-8','Soulstone - Normal',0.004),
  ('1-10','Stone',0.8),('1-10','Lapis Lazuli',0.08),('1-10','Dusk Bow (Legendary) A',0.0008),
  ('2-4','Jade Stone',0.3),('2-4','Lapis Lazuli',0.06),('2-4','Soulstone - Normal',0.006),('2-4','Soulstone - Nightmare',0.0012),
  ('2-10','Lapis Lazuli',0.1),('2-10','Minor Amethyst',0.2),('2-10','Iron Boots (Immortal) A',0.0006),
  ('3-10','Lapis Lazuli',0.12),('3-10','Dusk Bow (Legendary) A',0.0011),('3-10','Iron Boots (Immortal) A',0.0011)
on conflict (stage_id, market_hash_name) do nothing;
