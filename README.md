<div align="center">

# 🎮 Soulstone

**Live Steam Market price tracker & companion for [*TBH: Task Bar Hero*](https://store.steampowered.com/app/3678970/)**

[![CI](https://github.com/EnzoKoeche/soulstone/actions/workflows/ci.yml/badge.svg)](https://github.com/EnzoKoeche/soulstone/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://soulstone-sooty.vercel.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)

### 🚀 [**Live Demo →**](https://soulstone-sooty.vercel.app/)

[English](#english) · [Português](#português)

</div>

---

> ## 🚫 Non‑negotiable principle · Princípio inegociável
> **EN —** Soulstone **never touches the game**: no memory reading, no code injection, no input automation. It works **exclusively with public Steam Community Market data** (HTTP, no login). That's what separates it from bots (which get you banned) and from malware bait — and what makes it defensible as a portfolio piece.
>
> **PT —** Soulstone **nunca toca no jogo**: nada de ler memória, injetar código ou automatizar input. Trabalha **exclusivamente com dados públicos do Steam Community Market** (HTTP, sem login). É isso que o separa de bots (que dão ban) e de iscas de malware.

---

## English

**TBH: Task Bar Hero** is a free‑to‑play idle RPG that went viral on Steam (~415k peak concurrent players) thanks to a real‑money economy: you farm loot AFK and sell it on the Steam Market for Steam balance. The game never tells you **where** it's worth farming or how the market moves. **Soulstone fills that gap with live data** — without ever touching the game process (zero ban risk).

Steam has **no inbound webhooks**, and its full price history requires a login. So Soulstone **builds the history itself** by snapshotting the public `search/render` endpoint on a schedule. That time series *is* the product.

### ✨ Features (v0.1)
- ⏱️ **Poller** (Supabase Edge Function) — paginates the Steam Market, respects rate limits (delay + 429 backoff), with an **isolated, unit‑tested parser**.
- 🗄️ **Postgres time series** — every poll is a timestamped snapshot; RLS keeps it public‑read.
- 📊 **Single‑page dashboard** — highest‑value items, a **price × time chart**, and live market status. Rarity‑colored, dark, fast.

### 🧱 Tech stack
React 18 · TypeScript · Vite · Tailwind v4 · Recharts · Supabase (Postgres + Edge Functions + pg_cron) · Vitest · Biome · GitHub Actions

### 🚀 Run locally
```bash
npm install            # root tooling (Biome + Vitest)
npm run lint
npm test               # parser + poller unit tests

cd web && npm install && npm run dev   # frontend
```
Copy `.env.example` → `.env` (root, for the poller) and `web/.env` (frontend) and fill in your Supabase keys.

### 🗺️ Roadmap
| Version | Delivery |
| --- | --- |
| **v0.1** ✅ | Poller + DB + single page with a chart of the top items |
| v0.2 | Full filterable list of ~150 items + 24h/7d change + sortable |
| v0.3 | Per‑item page + basic SEO |
| v0.4 | Drop tables + farm value/hour ("best stage right now") |
| v0.5 | Discord/Telegram price alerts |
| v1.0 | Build planner (Cube System) |

---

## Português

O **TBH: Task Bar Hero** é um idle RPG free‑to‑play que viralizou na Steam (~415 mil jogadores simultâneos de pico) por causa de uma economia de **dinheiro real**: você farma loot AFK e vende no Steam Market por saldo Steam. O jogo não explica **onde** vale a pena farmar nem como o mercado se move. **Soulstone preenche essa lacuna com dados ao vivo** — sem nunca tocar no processo do jogo (zero risco de ban).

A Steam **não tem webhooks de entrada**, e o histórico completo exige login. Então o Soulstone **constrói o histórico sozinho**, snapshotando o endpoint público `search/render` de tempos em tempos. Essa série temporal *é* o produto.

### ✨ Funcionalidades (v0.1)
- ⏱️ **Poller** (Supabase Edge Function) — pagina o Steam Market, respeita rate limit (delay + backoff em 429), com um **parser isolado e testado**.
- 🗄️ **Série temporal no Postgres** — cada coleta é um snapshot com timestamp; RLS mantém leitura pública.
- 📊 **Dashboard de página única** — itens de maior valor, **gráfico de preço × tempo** e status do mercado ao vivo. Dark, rápido, com cores de raridade.

### 🧱 Stack
React 18 · TypeScript · Vite · Tailwind v4 · Recharts · Supabase (Postgres + Edge Functions + pg_cron) · Vitest · Biome · GitHub Actions

### 🚀 Rodar localmente
```bash
npm install            # tooling da raiz (Biome + Vitest)
npm run lint
npm test               # testes do parser + poller

cd web && npm install && npm run dev   # frontend
```
Copie `.env.example` → `.env` (raiz, p/ o poller) e `web/.env` (frontend) e preencha as chaves do Supabase.

---

<div align="center">

Built by [Enzo Koeche Castagna](https://github.com/EnzoKoeche) · Public Steam Market data only · MIT License

**If this is useful, drop a ⭐ — it helps the project reach the TBH community.**

</div>
