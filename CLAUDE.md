# CLAUDE.md — guia para sessões do Claude Code

Contexto e regras para trabalhar neste repositório. Leia junto com **`docs/PROJECT-SPEC.md`** (fonte de verdade local, destilada do Notion).

## 🚫 Princípio inegociável (acima de tudo)
**NUNCA tocar no jogo.** Nada de ler memória, injetar código ou automatizar input. Apenas **dados públicos do Steam Community Market** via HTTP, sem login. Qualquer ideia que envolva o processo do jogo está fora de escopo — é o que separa o projeto de bots/malware.

## O que é
Companheiro web para **TBH: Task Bar Hero** (Steam appid `3678970`). Rastreador de preços do Steam Market que constrói seu **próprio histórico** snapshotando `market/search/render` ao longo do tempo. Evolui depois para wiki e build planner.

## Stack & estrutura
- **Frontend** `web/` — React 18 + TS + Vite + Tailwind v4 + Recharts (deploy Vercel).
- **Dados** `supabase/` — Postgres (migrations) + Edge Function `poller` (Deno) + pg_cron.
- **Testes** Vitest (raiz) · **Lint/Format** Biome (raiz, config única `biome.json`).
- **Monorepo sem workspaces:** a raiz gerencia tooling (Biome + Vitest); `web/` tem seu próprio `package.json`. Instale separadamente.

## Comandos
```bash
npm install            # tooling da raiz (Biome, Vitest, TS)
npm run lint           # biome check .
npm run lint:fix       # biome check --write .
npm test               # vitest run  (testa o parser)
cd web && npm install && npm run dev   # frontend
```

## Disciplina de escopo (IMPORTANTE)
Construa **apenas a versão atual do roadmap** (ver §9 da spec). Não puxe features de versões futuras sem o autor pedir. Estado atual: **v0.1** = poller + banco + página única com 1 gráfico dos top itens.

## Convenções não‑óbvias
- **Parser isolado e puro** (`supabase/functions/poller/parser.ts`): sem I/O, sem APIs de runtime — importável tanto pela Edge Function (Deno) quanto pelo Vitest (Node). É o núcleo crítico testado (NFR‑04).
- **Nunca bater na Steam real em CI/testes** — usar `fixtures/steam-search-render-sample.json` (NFR‑01).
- **Preços em centavos**: `sell_price` 279 → US$2,79. Sempre requisitar `currency=1` (USD).
- **Rate limit**: delay entre páginas + backoff em 429. Nunca martelar a Steam.
- **`name_color`** (hex) é proxy de raridade → coluna `rarity_color`.
- **Frontend lê do nosso banco**, nunca faz proxy ao vivo da Steam (NFR‑07).

## Fonte de verdade
1. `docs/PROJECT-SPEC.md` (local, versionado)
2. Notion (master): https://app.notion.com/p/387b731e18158151acffd34ce82ac655

## Git
Branch atual `master`. Não commitar/pushar sem o autor pedir. Não commitar segredos (só `.env.example`).
