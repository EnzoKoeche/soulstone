import { describe, expect, it } from "vitest";
import { availableFeatures, compMatch } from "./build";

describe("availableFeatures", () => {
  it("Cube 0 → só Synthesis + Alchemy", () => {
    expect(availableFeatures(0).map((f) => f.name)).toEqual(["Synthesis", "Alchemy"]);
  });
  it("Cube 10 → libera até Extraction (5 features)", () => {
    const names = availableFeatures(10).map((f) => f.name);
    expect(names).toContain("Extraction");
    expect(names).toHaveLength(5);
  });
  it("Cube 25 → tudo desbloqueado (8)", () => {
    expect(availableFeatures(25)).toHaveLength(8);
  });
});

describe("compMatch", () => {
  it("reconhece Knight + Ranger", () => {
    expect(compMatch(["knight", "ranger"])?.classes).toEqual(["knight", "ranger"]);
  });
  it("ordem não importa", () => {
    expect(compMatch(["ranger", "knight"])).not.toBeNull();
  });
  it("subconjunto/comp desconhecida → null", () => {
    expect(compMatch(["knight"])).toBeNull();
    expect(compMatch(["sorcerer"])).toBeNull();
  });
});
