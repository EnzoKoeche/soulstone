-- ─────────────────────────────────────────────────────────────────────────
-- Soulstone v0.1 — schema inicial
-- Tabelas reproduzidas EXATAMENTE do §7 (Modelo de dados MVP) da spec.
-- Blocos marcados [além do §7] são adições mínimas e seguras (seed + RLS),
-- não alteram a estrutura das tabelas.
-- ─────────────────────────────────────────────────────────────────────────

-- ── §7: tabelas (verbatim) ───────────────────────────────────────────────

create table items (
  market_hash_name text primary key,
  display_name     text not null,
  type             text,
  rarity_color     text,
  icon_url         text,
  first_seen_at    timestamptz default now(),
  last_seen_at     timestamptz default now()
);

create table price_snapshots (
  id               bigserial primary key,
  market_hash_name text references items(market_hash_name),
  captured_at      timestamptz not null default now(),
  sell_price_cents integer not null,
  sell_listings    integer not null,
  currency         smallint not null default 1
);
create index on price_snapshots (market_hash_name, captured_at desc);

create table market_status (
  id            int primary key default 1,
  listings_open boolean not null,
  note          text,
  updated_at    timestamptz default now()
);

-- ── [além do §7] seed do singleton de status ─────────────────────────────
-- market_status guarda exatamente uma linha (id=1). O poller atualiza
-- updated_at/note a cada coleta; o frontend (FR-07) lê esta linha.
insert into market_status (id, listings_open, note)
values (1, true, 'seed inicial — atualizado pelo poller a cada coleta')
on conflict (id) do nothing;

-- ── [além do §7] Row Level Security ──────────────────────────────────────
-- Dados são públicos e o frontend lê via anon key (NFR-07). Habilitamos RLS
-- e liberamos só SELECT para anon/authenticated. Escrita fica restrita à
-- service_role (o poller), que ignora RLS. Sem isto, ou o anon poderia
-- escrever, ou o advisor do Supabase acusaria "RLS disabled on public table".

alter table items          enable row level security;
alter table price_snapshots enable row level security;
alter table market_status   enable row level security;

create policy "public read items"
  on items for select to anon, authenticated using (true);

create policy "public read price_snapshots"
  on price_snapshots for select to anon, authenticated using (true);

create policy "public read market_status"
  on market_status for select to anon, authenticated using (true);
