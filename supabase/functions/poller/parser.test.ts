import { describe, expect, it } from "vitest";
import fixture from "../../../fixtures/steam-search-render-sample.json";
import { centsToUsd, hasMorePages, parseResult, parseSearchRenderPage } from "./parser.ts";

describe("centsToUsd", () => {
  it("converte 279 → $2.79 (caso canônico do spec)", () => {
    expect(centsToUsd(279)).toBe("$2.79");
  });
  it("formata centavos < 10 com zero à esquerda", () => {
    expect(centsToUsd(6)).toBe("$0.06");
    expect(centsToUsd(8)).toBe("$0.08");
  });
  it("formata valores grandes", () => {
    expect(centsToUsd(6495)).toBe("$64.95");
    expect(centsToUsd(1003)).toBe("$10.03");
  });
});

describe("parseSearchRenderPage (fixture REAL da Steam)", () => {
  const page = parseSearchRenderPage(fixture);

  it("parseia os 10 itens da fixture", () => {
    expect(page.items).toHaveLength(10);
  });
  it("expõe a paginação real: pagesize 10 (< count 100 pedido), total 153", () => {
    expect(page.pagesize).toBe(10);
    expect(page.totalCount).toBe(153);
    expect(page.rawCount).toBe(10);
  });
  it("extrai os campos de 'Soulstone - Normal' (279 → $2.79)", () => {
    const soul = page.items.find((i) => i.marketHashName === "Soulstone - Normal");
    expect(soul).toBeDefined();
    expect(soul?.sellPriceCents).toBe(279);
    expect(centsToUsd(soul?.sellPriceCents ?? 0)).toBe("$2.79");
    expect(soul?.rarityColor).toBeTruthy(); // name_color é proxy de raridade
  });
  it("todo item parseado tem chave não-vazia e preço inteiro", () => {
    for (const item of page.items) {
      expect(item.marketHashName.length).toBeGreaterThan(0);
      expect(Number.isInteger(item.sellPriceCents)).toBe(true);
    }
  });
});

describe("parseResult (resiliência — NFR-04)", () => {
  it("ignora item sem market_hash_name (não quebra)", () => {
    const bad = { name: "Sem hash", sell_price: 100, asset_description: { name: "Sem hash" } };
    expect(parseResult(bad)).toBeNull();
  });
  it("ignora item sem preço", () => {
    const bad = { hash_name: "Algo", asset_description: { market_hash_name: "Algo" } };
    expect(parseResult(bad)).toBeNull();
  });
  it("usa hash_name do topo quando asset_description.market_hash_name falta", () => {
    const r = { hash_name: "Wood", sell_price: 6, sell_listings: 10, asset_description: {} };
    expect(parseResult(r)?.marketHashName).toBe("Wood");
  });
});

describe("hasMorePages (pagina até cobrir total_count)", () => {
  it("continua enquanto não cobriu o total", () => {
    expect(hasMorePages(10, 153, 10)).toBe(true);
    expect(hasMorePages(150, 153, 10)).toBe(true);
  });
  it("para ao cobrir o total", () => {
    expect(hasMorePages(153, 153, 3)).toBe(false);
  });
  it("para se a última página veio vazia (evita loop infinito)", () => {
    expect(hasMorePages(50, 153, 0)).toBe(false);
  });
  it("16 páginas de 10 cobrem os 153 itens", () => {
    let start = 0;
    let pages = 0;
    let remaining = 153;
    do {
      const count = Math.min(10, remaining);
      start += count;
      remaining -= count;
      pages += 1;
      if (!hasMorePages(start, 153, count)) break;
    } while (remaining > 0);
    expect(pages).toBe(16);
    expect(start).toBe(153);
  });
});
