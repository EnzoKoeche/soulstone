import { describe, expect, it } from "vitest";
import { baseCategory, centsToUsd, priceChange, rarityOf } from "./format";

describe("centsToUsd", () => {
  it("formata positivos com zero à esquerda", () => {
    expect(centsToUsd(279)).toBe("$2.79");
    expect(centsToUsd(6)).toBe("$0.06");
    expect(centsToUsd(156876)).toBe("$1568.76");
  });
  it("trata negativos sem duplicar o sinal", () => {
    expect(centsToUsd(-5)).toBe("-$0.05");
  });
});

describe("priceChange", () => {
  it("retorna — sem base (null/0/undefined), sem dividir por zero", () => {
    expect(priceChange(100, null).label).toBe("—");
    expect(priceChange(100, 0).label).toBe("—");
    expect(priceChange(100, undefined).tone).toBe("none");
  });
  it("calcula alta e baixa", () => {
    expect(priceChange(110, 100)).toEqual({ label: "+10.0%", tone: "up" });
    expect(priceChange(90, 100)).toEqual({ label: "-10.0%", tone: "down" });
    expect(priceChange(100, 100).tone).toBe("none");
  });
});

describe("baseCategory", () => {
  it("remove o nível do equipamento e mantém materiais", () => {
    expect(baseCategory("Bow - Lv. 30")).toBe("Bow");
    expect(baseCategory("Helmet - Lv. 65")).toBe("Helmet");
    expect(baseCategory("Crafting Material")).toBe("Crafting Material");
  });
  it("trata null", () => {
    expect(baseCategory(null)).toBe("Outros");
  });
});

describe("rarityOf", () => {
  it("extrai a raridade do parêntese, ou null", () => {
    expect(rarityOf("Dusk Bow (Legendary) A")).toBe("Legendary");
    expect(rarityOf("Iron Ingot")).toBeNull();
  });
});
