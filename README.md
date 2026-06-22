# 🎮 Soulstone — TBH Companion

Companheiro web para **TBH: Task Bar Hero** (Steam, appid `3678970`) — um idle RPG free‑to‑play com economia de dinheiro real. Soulstone rastreia o **Steam Community Market**: preços ao vivo + um histórico de série temporal que **nós** construímos, para mostrar o que vale a pena farmar e como o mercado se move.

**[🇧🇷 Português](#-português) · [🇬🇧 English](#-english)**

---

> ## ⚠️ Princípio inegociável · Non‑negotiable principle
>
> **🇧🇷 Soulstone NÃO toca no jogo.** Nada de ler memória, injetar código ou automatizar input. Trabalhamos **exclusivamente com dados públicos do Steam Community Market** (requisições HTTP, sem login). É exatamente isso que separa este projeto de bots (que dão ban) e de iscas de malware — e é o que o torna defensável como peça de portfólio.
>
> **🇬🇧 Soulstone does NOT touch the game.** No memory reading, no code injection, no input automation. We work **exclusively with public Steam Community Market data** (HTTP requests, no login). That is precisely what separates this project from bots (which get you banned) and from malware bait — and what makes it defensible as a portfolio piece.

---

## 🇧🇷 Português

### O que é
TBH viralizou na Steam (~415 mil jogadores simultâneos de pico) por causa de uma economia real: você farma loot AFK e vende no Steam Market por saldo Steam. O jogo não explica **onde** vale a pena farmar nem como o mercado se move. Soulstone preenche essa lacuna com dados ao vivo — sem nunca tocar no processo do jogo (zero risco de ban).

### Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind v4 + Recharts → Vercel
- **Backend/dados:** Supabase (Postgres + Edge Functions + pg_cron)
- **Testes:** Vitest · **Lint/Format:** Biome

### Como os dados entram
A Steam **não tem webhooks de entrada**, então "auto‑atualizar" significa *polling agendado*. Um poller pagina o endpoint público `market/search/render` (appid `3678970`), grava um **snapshot** com timestamp por item e, ao longo do tempo, **constrói o histórico** que a Steam não expõe sem login. Esse histórico *é* o produto.

### Estrutura do repositório
```
soulstone/
├─ docs/PROJECT-SPEC.md     # spec local destilada (fonte de verdade versionada)
├─ fixtures/                # resposta real da Steam p/ testar o parser (nunca bate na Steam em CI)
├─ supabase/                # migrations + Edge Function (poller)
└─ web/                     # frontend Vite/React
```

### Rodar localmente (v0.1)
```bash
# Tooling da raiz (lint + testes do parser)
npm install
npm run lint
npm test

# Frontend
cd web && npm install && npm run dev
```
Copie `.env.example` → `.env` (raiz) e `web/.env` e preencha as chaves do Supabase.

### Roadmap (resumo)
| Versão | Entrega |
| --- | --- |
| **v0.1** ← *você está aqui* | Poller + banco + página única com gráfico dos top itens (snapshots a cada 30 min) |
| v0.2 | Lista completa filtrável dos 140 itens + variação 24h/7d + deploy público |
| v0.3 | Página por item + SEO básico |
| v0.4 | Drop tables + valor/hora de farm |
| v0.5 | Alertas Discord/Telegram |
| v1.0 | Build planner (Cube System) |

### Licença
Open‑source (licença a definir — provável MIT). Dados são públicos; sem revenda de dados crus (NFR‑06).

---

## 🇬🇧 English

### What it is
TBH went viral on Steam (~415k peak concurrent players) thanks to a real‑money economy: you farm loot AFK and sell it on the Steam Market for Steam balance. The game never tells you **where** it's worth farming or how the market moves. Soulstone fills that gap with live data — without ever touching the game process (zero ban risk).

### Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind v4 + Recharts → Vercel
- **Backend/data:** Supabase (Postgres + Edge Functions + pg_cron)
- **Tests:** Vitest · **Lint/Format:** Biome

### How data comes in
Steam has **no inbound webhooks**, so "auto‑refresh" means *scheduled polling*. A poller paginates the public `market/search/render` endpoint (appid `3678970`), writes a timestamped **snapshot** per item, and over time **builds the price history** Steam won't expose without a login. That history *is* the product.

### Repository layout
```
soulstone/
├─ docs/PROJECT-SPEC.md     # distilled local spec (versioned source of truth)
├─ fixtures/                # real Steam response to test the parser (never hits Steam in CI)
├─ supabase/                # migrations + Edge Function (poller)
└─ web/                     # Vite/React frontend
```

### Run locally (v0.1)
```bash
# Root tooling (lint + parser tests)
npm install
npm run lint
npm test

# Frontend
cd web && npm install && npm run dev
```
Copy `.env.example` → `.env` (root) and `web/.env`, then fill in your Supabase keys.

### Roadmap (summary)
| Version | Delivery |
| --- | --- |
| **v0.1** ← *you are here* | Poller + DB + single page with a chart of the top items (30‑min snapshots) |
| v0.2 | Full filterable list of 140 items + 24h/7d change + public deploy |
| v0.3 | Per‑item page + basic SEO |
| v0.4 | Drop tables + farm value/hour |
| v0.5 | Discord/Telegram alerts |
| v1.0 | Build planner (Cube System) |

### License
Open‑source (license TBD — likely MIT). Data is public; no reselling of raw data (NFR‑06).
