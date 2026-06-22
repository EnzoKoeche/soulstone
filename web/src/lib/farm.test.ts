import { describe, expect, it } from "vitest";
import { farmValuePerHourCents } from "./farm";

describe("farmValuePerHourCents (cálculo valor/hora — drop table mock)", () => {
  it("multiplica clears/h pela soma de drops × preço", () => {
    // 100 clears/h × (2×50 + 0.01×279) = 100 × 102.79 = 10279
    const v = farmValuePerHourCents(100, [
      { dropsPerRun: 2, priceCents: 50 },
      { dropsPerRun: 0.01, priceCents: 279 },
    ]);
    expect(v).toBe(10279);
  });

  it("retorna 0 sem drops", () => {
    expect(farmValuePerHourCents(120, [])).toBe(0);
  });

  it("um item raro mas caro contribui proporcionalmente", () => {
    // 110 × (0.0008 × 156876) ≈ 110 × 125.5 ≈ 13805
    expect(farmValuePerHourCents(110, [{ dropsPerRun: 0.0008, priceCents: 156876 }])).toBe(13805);
  });
});
