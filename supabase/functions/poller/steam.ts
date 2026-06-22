// Camada de I/O do poller: busca o search/render paginado respeitando o rate
// limit da Steam (delay entre páginas + backoff em 429). NÃO usa APIs do Deno
// no escopo do módulo e aceita `fetch`/`sleep` injetados → é testável no Vitest.
// Mantém a rede FORA do parser (NFR-01, NFR-04).

import { hasMorePages, type ParsedItem, parseSearchRenderPage } from "./parser.ts";

const SEARCH_RENDER_URL = "https://steamcommunity.com/market/search/render/";
const USER_AGENT = "Soulstone/0.1 (Steam Market price tracker; respects rate limits)";
// Trava de segurança: o catálogo tem ~16 páginas (×10). Teto baixo para que um
// total_count adulterado/grande não vire dezenas de hits na Steam (NFR-01).
const MAX_PAGES = 25;
// Aborta um fetch travado em vez de prender a invocação até o limite da função.
const FETCH_TIMEOUT_MS = 15_000;

/** Mínimo que precisamos de um fetch — facilita injetar mock nos testes. */
export type Fetcher = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<Response>;

export interface PollerConfig {
  appid: string;
  currency: number;
  /** Hint à Steam; ela pode capar p/ 10 — paginamos pelo tamanho real. */
  count: number;
  /** Delay entre páginas, em ms (NFR-01). */
  pageDelayMs: number;
  /** Tentativas extras em 429 antes de desistir. */
  maxRetries: number;
  fetchImpl?: Fetcher;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function pageUrl(cfg: PollerConfig, start: number): string {
  const params = new URLSearchParams({
    appid: cfg.appid,
    norender: "1",
    count: String(cfg.count),
    start: String(start),
    currency: String(cfg.currency),
  });
  return `${SEARCH_RENDER_URL}?${params.toString()}`;
}

/**
 * GET com backoff exponencial em 429 (respeita o header Retry-After). Faz no
 * máximo `maxRetries` repetições e nunca martela a Steam.
 */
export async function fetchWithBackoff(url: string, cfg: PollerConfig): Promise<Response> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const sleep = cfg.sleep ?? defaultSleep;

  let attempt = 0;
  while (attempt <= cfg.maxRetries) {
    const res = await doFetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status !== 429) {
      if (!res.ok) throw new Error(`Steam respondeu HTTP ${res.status}`);
      return res;
    }
    if (attempt >= cfg.maxRetries) break;

    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(2 ** attempt * 1000, 30_000); // backoff exponencial, teto 30s
    await sleep(waitMs);
    attempt += 1;
  }

  throw new Error(`Steam 429 (rate limited) após ${cfg.maxRetries} tentativas`);
}

/**
 * Busca TODAS as páginas até cobrir total_count, com delay entre elas.
 * Avança o `start` pelo nº de results realmente devolvidos (não pelo count
 * pedido), então funciona quer a Steam devolva 10 ou 100 por página.
 */
export async function fetchAllItems(cfg: PollerConfig): Promise<ParsedItem[]> {
  const sleep = cfg.sleep ?? defaultSleep;
  const all: ParsedItem[] = [];
  let start = 0;

  for (let pageNum = 0; pageNum < MAX_PAGES; pageNum += 1) {
    const res = await fetchWithBackoff(pageUrl(cfg, start), cfg);
    const page = parseSearchRenderPage(await res.json());
    all.push(...page.items);
    start += page.rawCount;

    if (!hasMorePages(start, page.totalCount, page.rawCount)) break;
    await sleep(cfg.pageDelayMs);
  }

  // O mercado vivo re-ordena entre as páginas (a coleta leva ~20s), então o
  // mesmo item pode cair em duas páginas. Dedup por marketHashName (last-wins)
  // evita "ON CONFLICT DO UPDATE command cannot affect row a second time" no upsert.
  const byKey = new Map<string, ParsedItem>();
  for (const item of all) byKey.set(item.marketHashName, item);
  return [...byKey.values()];
}
