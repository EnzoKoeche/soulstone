# Soulstone — Especificação do Projeto (spec local)

Destilado da engenharia no Notion (master): https://app.notion.com/p/387b731e18158151acffd34ce82ac655
Numeração estável — outras partes do repo referenciam seções por número (ex.: **§7 = modelo de dados**).

---

## §1 — Visão geral & princípio inegociável
**Produto:** companheiro web para *TBH: Task Bar Hero* (Steam, appid `3678970`). Começa como rastreador de preços do Steam Market + "valor por hora de farm"; evolui para wiki e build planner.

🚫 **Princípio inegociável:** nunca tocar no jogo — nada de ler memória, injetar código ou automatizar input. Apenas **dados públicos do Steam Community Market**. É o que separa o projeto de bots (ban) e de iscas de malware, e o que o torna defensável como portfólio.

**Objetivos (os três juntos):** peça de portfólio (dados/backend/IA aplicada) · stars/tração no GitHub · ferramenta de uso próprio (ganhar saldo Steam com eficiência).

## §2 — Módulos (ordem de construção)
1. **Market Dashboard** (MVP) — preços ao vivo + histórico (série temporal que nós construímos) + variação + volume.
2. **Farm Value** — drop tables × preço → "valor estimado por hora" por stage.
3. **Item Database / Wiki** — núcleo durável; motor de SEO.
4. **Build Planner** — classes, skills, Cube System, pets.
5. **Alertas** — Discord/Telegram.

## §3 — Requisitos Funcionais (FR)
**MVP (v0.1–v0.3):**
- **FR‑01** Coletar periodicamente preço e nº de listagens dos ~140 itens via `search/render` paginado.
- **FR‑02** Gravar cada coleta como snapshot com timestamp (série temporal por `market_hash_name`).
- **FR‑03** Expor API com lista de itens: último preço, variação 24h/7d, volume.
- **FR‑04** Expor histórico de preço de um item (range configurável).
- **FR‑05** Frontend lista itens, ordenáveis por preço/variação/volume, filtro por tipo/raridade.
- **FR‑06** Frontend exibe gráfico de preço × tempo por item.
- **FR‑07** Frontend mostra status do mercado (aberto/fechado para novas listagens).

**Pós‑MVP:** FR‑08 valor/hora · FR‑09 wiki/SEO · FR‑10 build planner · FR‑11 alertas · FR‑12 contribuição da comunidade.

## §4 — Requisitos Não‑Funcionais (NFR)
- **NFR‑01** Respeitar rate limit da Steam: polling lento, cache, backoff em 429. Nunca martelar.
- **NFR‑02** Snapshot a cada 15–30 min no MVP.
- **NFR‑03** Rodar em free tier (Supabase + Vercel), sem VPS.
- **NFR‑04** Parser da Steam **isolado** (resiliência a mudança de formato).
- **NFR‑05** Camadas modulares: catálogo de itens independe de preço vivo.
- **NFR‑06** Legal/ToS: dados públicos, uso respeitoso; sem revenda de dados crus.
- **NFR‑07** Frontend serve do nosso banco (não proxy ao vivo) → rápido e independente da Steam.
- **NFR‑08** Código limpo, testes no parser e no cálculo, README PT+EN, deploy público.

## §5 — Regras de negócio (domínio do jogo)
- Mercado só libera ao atingir **Cube nível 10** (anti‑bot).
- Equipamento só tradeable de **Legendary** pra cima; materiais isentos.
- `sell_price` vem em **centavos** (279 = US$2,79).
- `name_color` (hex) é **proxy de raridade**.

## §6 — Arquitetura & fonte de dados (pull only)
A Steam não tem webhooks de entrada → "auto‑atualizar" = polling agendado.

```
Steam Market (appid 3678970, pull only)
   │  search/render paginado
   ▼
Poller (Supabase Edge Function, pg_cron 15–30min)
   │  upsert items + insert price_snapshots
   ▼
Postgres / Supabase ──► API REST/RPC ──► Frontend (React+Vite, Vercel)
                                          (pós‑MVP) ──► Alertas Discord/Telegram
```

| Endpoint | Uso | Auth | Limite |
| --- | --- | --- | --- |
| `market/search/render/?appid=3678970&norender=1&count=100&start=N` | Lista itens + preço + listagens. **Principal** | Não | Moderado; paginar via `start` |
| `market/priceoverview/?appid=3678970&market_hash_name=...` | Menor preço, mediana, volume de 1 item | Não | ~20/min (duro) |
| `market/pricehistory/...` | Histórico completo | Cookie logado | Frágil — **evitar** |

> Como `pricehistory` exige login, **nós construímos o histórico** snapshotando `search/render` ao longo do tempo. Isso *é* o produto.

**Scheduler:** Supabase pg_cron + Edge Function (recomendado). Plano B: GitHub Actions cron.

## §7 — Modelo de dados (MVP)
```sql
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
```

## §8 — Estratégia de testes
Pirâmide: muitos unitários (baratos), poucos E2E. **Parser** e **cálculo de valor/hora** são os alvos críticos — é onde bug custa dinheiro real ao usuário.

| Camada | Caso | Critério |
| --- | --- | --- |
| Unit | Parser converte `sell_price` 279 → US$2,79 | Exato |
| Unit | Parser lida com `pagesize` menor que `count` | Pagina até cobrir `total_count` |
| Unit | Parser ignora item sem `market_hash_name` | Não quebra |
| Unit | Cálculo valor/hora com drop table mock | Resultado esperado |
| Unit | Variação 24h com série vazia/parcial | Sem divisão por zero |
| Integração | Poller grava snapshot no Supabase | Linha persistida |
| Integração | Backoff dispara em 429 simulado | Não martela |
| E2E | Dashboard → lista + gráfico renderizam | Sem erro |
| E2E | Filtrar por tipo Soulstone | Lista filtra |

**Dados de teste:** fixture real `fixtures/steam-search-render-sample.json`. Nunca bater na Steam real em CI (NFR‑01). Cobertura alta no parser/cálculo; UI só smoke.

## §9 — Roadmap & riscos
| Versão | Entrega | Critério de pronto |
| --- | --- | --- |
| **v0.1** | Poller + banco + página única com gráfico dos top itens | Snapshots a cada 30min; 1 gráfico funcional |
| v0.2 | Lista completa filtrável + variação 24h/7d + status do mercado | 140 itens, ordenação, deploy público |
| v0.3 | Página por item (rota) + SEO básico | URLs indexáveis por item |
| v0.4 | Drop tables seed + valor/hora de farm | "melhor stage agora" calculado |
| v0.5 | Alertas Discord/Telegram | Webhook posta quando item cruza alvo |
| v1.0 | Build planner (Cube System) | Planejador interativo |

**Riscos principais:** mercado morre (mitig.: núcleo wiki/planner independe de preço — NFR‑05) · Steam muda formato/limita IP (parser isolado NFR‑04, polling lento, cache) · concorrente lança antes (mover rápido no MVP).

**Decisões em aberto:** nome final · linguagem do poller (TS/Deno escolhido p/ v0.1) · alertas em n8n vs código próprio.
