// Parser ISOLADO da resposta do Steam Community Market (search/render?norender=1).
//
// PURO: sem I/O e sem APIs de runtime (Deno/Node) — por isso é importável tanto
// pela Edge Function (Deno) quanto pelos testes Vitest (Node). É o núcleo crítico:
// resiliente a mudanças de formato e nunca lança em payload inesperado (NFR-04).

export interface ParsedItem {
  marketHashName: string;
  displayName: string;
  type: string | null;
  rarityColor: string | null;
  iconUrl: string | null;
  sellPriceCents: number;
  sellListings: number;
}

export interface ParsedPage {
  items: ParsedItem[];
  start: number;
  pagesize: number;
  totalCount: number;
  /** Nº de results BRUTOS (antes de filtrar). Guia a paginação real. */
  rawCount: number;
}

// Formas mínimas da resposta da Steam — só o que realmente lemos.
interface RawAssetDescription {
  market_hash_name?: unknown;
  name?: unknown;
  market_name?: unknown;
  type?: unknown;
  name_color?: unknown;
  icon_url?: unknown;
}
interface RawResult {
  name?: unknown;
  hash_name?: unknown;
  sell_listings?: unknown;
  sell_price?: unknown;
  asset_description?: RawAssetDescription;
}
interface RawPage {
  start?: unknown;
  pagesize?: unknown;
  total_count?: unknown;
  results?: unknown;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null;
}

/**
 * Converte um result bruto em ParsedItem, ou null se faltar o essencial para
 * gravar (chave market_hash_name ou preço). Não lança — itens malformados são
 * simplesmente ignorados (ver teste "ignora item sem market_hash_name").
 */
export function parseResult(raw: RawResult): ParsedItem | null {
  const ad = raw.asset_description ?? {};
  const marketHashName = asString(ad.market_hash_name) ?? asString(raw.hash_name);
  const sellPriceCents = asInt(raw.sell_price);
  if (marketHashName === null || sellPriceCents === null) return null;

  return {
    marketHashName,
    displayName:
      asString(ad.name) ?? asString(ad.market_name) ?? asString(raw.name) ?? marketHashName,
    type: asString(ad.type),
    rarityColor: asString(ad.name_color), // name_color (hex) é proxy de raridade
    iconUrl: asString(ad.icon_url),
    sellPriceCents,
    sellListings: asInt(raw.sell_listings) ?? 0,
  };
}

/** Parseia uma página inteira do search/render. Tolerante a payload inesperado. */
export function parseSearchRenderPage(raw: unknown): ParsedPage {
  const page = (raw ?? {}) as RawPage;
  const results = Array.isArray(page.results) ? (page.results as RawResult[]) : [];

  const items: ParsedItem[] = [];
  for (const r of results) {
    const parsed = parseResult(r);
    if (parsed !== null) items.push(parsed);
  }

  return {
    items,
    start: asInt(page.start) ?? 0,
    pagesize: asInt(page.pagesize) ?? results.length,
    totalCount: asInt(page.total_count) ?? results.length,
    rawCount: results.length,
  };
}

/** Formata centavos (inteiro) em USD sem usar float: 279 → "$2.79", 6 → "$0.06". */
export function centsToUsd(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars}.${String(rem).padStart(2, "0")}`;
}

/**
 * Ainda há páginas a buscar? `nextStart` = start + nº de results da última
 * página. Para quando cobriu `totalCount` ou a última página veio vazia.
 * Pagina pelo tamanho REAL devolvido pela Steam (que pode ser menor que o
 * `count` pedido — ela devolve 10 mesmo pedindo 100), evitando loop infinito.
 */
export function hasMorePages(
  nextStart: number,
  totalCount: number,
  lastPageCount: number,
): boolean {
  return lastPageCount > 0 && nextStart < totalCount;
}
