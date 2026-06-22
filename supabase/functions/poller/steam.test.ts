import { describe, expect, it, vi } from "vitest";
import { fetchAllItems, fetchWithBackoff, type PollerConfig } from "./steam.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function rateLimited(retryAfter?: string): Response {
  const headers: Record<string, string> = {};
  if (retryAfter) headers["retry-after"] = retryAfter;
  return new Response("", { status: 429, headers });
}

const baseCfg: PollerConfig = {
  appid: "3678970",
  currency: 1,
  count: 100,
  pageDelayMs: 0,
  maxRetries: 3,
  sleep: async () => {}, // testes não esperam de verdade
};

describe("fetchWithBackoff (backoff em 429 — NFR-01)", () => {
  it("repete após 429 e retorna quando vem 200", async () => {
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const res = await fetchWithBackoff("https://x", { ...baseCfg, fetchImpl, sleep });

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2); // esperou entre as tentativas — não martelou
  });

  it("desiste após maxRetries 429s seguidos", async () => {
    const fetchImpl = vi.fn(async () => rateLimited());
    await expect(
      fetchWithBackoff("https://x", {
        ...baseCfg,
        maxRetries: 2,
        fetchImpl,
        sleep: async () => {},
      }),
    ).rejects.toThrow(/429/);
    expect(fetchImpl).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
  });

  it("respeita o header Retry-After", async () => {
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(rateLimited("5"))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await fetchWithBackoff("https://x", { ...baseCfg, fetchImpl, sleep });

    expect(sleep).toHaveBeenCalledWith(5000);
  });
});

describe("fetchAllItems (pagina até cobrir total_count)", () => {
  it("pagina pelo pagesize REAL (10), não pelo count pedido (100)", async () => {
    const total = 25; // 10 + 10 + 5 → 3 páginas
    const fetchImpl = vi.fn(async (url: string) => {
      const start = Number(new URL(url).searchParams.get("start"));
      const n = Math.min(10, total - start);
      const results = Array.from({ length: n }, (_, i) => ({
        hash_name: `item-${start + i}`,
        sell_price: 100 + start + i,
        sell_listings: 1,
        asset_description: { market_hash_name: `item-${start + i}`, name: `Item ${start + i}` },
      }));
      return jsonResponse({ success: true, start, pagesize: 10, total_count: total, results });
    });

    const items = await fetchAllItems({ ...baseCfg, fetchImpl, sleep: async () => {} });

    expect(items).toHaveLength(25);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const starts = fetchImpl.mock.calls.map((c) => Number(new URL(c[0]).searchParams.get("start")));
    expect(starts).toEqual([0, 10, 20]);
  });

  it("dedup itens repetidos entre páginas (mercado re-ordena durante a coleta)", async () => {
    // "dup" aparece na página 0 E na página 1 — sem dedup, o upsert quebraria
    // com "ON CONFLICT DO UPDATE command cannot affect row a second time".
    const mk = (name: string) => ({
      hash_name: name,
      sell_price: 100,
      sell_listings: 1,
      asset_description: { market_hash_name: name, name },
    });
    const fetchImpl = vi.fn(async (url: string) => {
      const start = Number(new URL(url).searchParams.get("start"));
      const results = start === 0 ? [mk("dup"), mk("a")] : [mk("dup"), mk("b")];
      return jsonResponse({ success: true, start, pagesize: 2, total_count: 4, results });
    });

    const items = await fetchAllItems({ ...baseCfg, fetchImpl, sleep: async () => {} });

    expect(items.map((i) => i.marketHashName).sort()).toEqual(["a", "b", "dup"]);
  });
});
