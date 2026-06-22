import { describe, expect, it } from "vitest";
import { conditionMet, formatAlertMessage, type PriceAlert, shouldTrigger } from "./alerts";

const base: PriceAlert = {
  id: 1,
  market_hash_name: "Soulstone - Normal",
  target_price_cents: 250,
  direction: "above",
  enabled: true,
  last_triggered_at: null,
};

const NOW = 1_700_000_000_000;

describe("conditionMet", () => {
  it("above dispara quando preço >= alvo", () => {
    expect(conditionMet("above", 279, 250)).toBe(true);
    expect(conditionMet("above", 200, 250)).toBe(false);
  });
  it("below dispara quando preço <= alvo", () => {
    expect(conditionMet("below", 240, 250)).toBe(true);
    expect(conditionMet("below", 260, 250)).toBe(false);
  });
});

describe("shouldTrigger", () => {
  it("dispara: habilitado + condição + sem cooldown", () => {
    expect(shouldTrigger(base, 279, NOW)).toBe(true);
  });
  it("não dispara desabilitado", () => {
    expect(shouldTrigger({ ...base, enabled: false }, 279, NOW)).toBe(false);
  });
  it("não dispara se a condição falha", () => {
    expect(shouldTrigger(base, 200, NOW)).toBe(false);
  });
  it("respeita o cooldown (não re-dispara em <6h)", () => {
    const recent = new Date(NOW - 60 * 60 * 1000).toISOString();
    expect(shouldTrigger({ ...base, last_triggered_at: recent }, 279, NOW)).toBe(false);
  });
  it("re-dispara após o cooldown", () => {
    const old = new Date(NOW - 7 * 60 * 60 * 1000).toISOString();
    expect(shouldTrigger({ ...base, last_triggered_at: old }, 279, NOW)).toBe(true);
  });
});

describe("formatAlertMessage", () => {
  it("inclui nome, alvo e preço atual", () => {
    const msg = formatAlertMessage(base, "Soulstone - Normal", 279);
    expect(msg).toContain("Soulstone - Normal");
    expect(msg).toContain("$2.50");
    expect(msg).toContain("$2.79");
  });
});
