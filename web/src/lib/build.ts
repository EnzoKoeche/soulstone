// Dados de referência do TBH (classes, Cube System, comps) — das guias da
// comunidade, não oficiais. Estáticos (não são dados de mercado). O motor
// (availableFeatures / compMatch) é puro e testado.

export interface HeroClass {
  id: string;
  name: string;
  role: string;
  weapon: string;
}

export interface CubeFeature {
  name: string;
  unlockLevel: number;
  description: string;
}

export interface Comp {
  classes: string[];
  note: string;
}

export const CLASSES: HeroClass[] = [
  { id: "knight", name: "Knight", role: "Tank / linha de frente", weapon: "Espada" },
  { id: "ranger", name: "Ranger", role: "Dano à distância", weapon: "Arco" },
  { id: "sorcerer", name: "Sorcerer", role: "Burst mágico", weapon: "Cajado" },
  { id: "priest", name: "Priest", role: "Suporte / cura", weapon: "Cetro" },
  { id: "hunter", name: "Hunter", role: "Precisão à distância", weapon: "Besta" },
  { id: "slayer", name: "Slayer", role: "Melee pesado", weapon: "Machado" },
];

export const CUBE_FEATURES: CubeFeature[] = [
  {
    name: "Synthesis",
    unlockLevel: 0,
    description: "Combina 9 itens do mesmo grau num tier acima.",
  },
  { name: "Alchemy", unlockLevel: 0, description: "Converte equipamento em ouro + Cube EXP." },
  {
    name: "Crafting",
    unlockLevel: 5,
    description: "Gera item aleatório dentro de um range de nível.",
  },
  {
    name: "Decoration",
    unlockLevel: 8,
    description: "Encaixa melhorias de stat (sistema de slots).",
  },
  {
    name: "Extraction",
    unlockLevel: 10,
    description: "Remove modificadores do Cube (custa ouro).",
  },
  { name: "Engraving", unlockLevel: 15, description: "Aplica afixos via Engraving Materials." },
  {
    name: "Offering",
    unlockLevel: 20,
    description: "Troca commemorative coins por itens (loot box).",
  },
  {
    name: "Inscription",
    unlockLevel: 25,
    description: "Atributos utilitários + customização high-tier.",
  },
];

export const RECOMMENDED_COMPS: Comp[] = [
  {
    classes: ["knight", "ranger"],
    note: "Melhor base early — Knight segura a frente, Ranger dá dano seguro.",
  },
  {
    classes: ["knight", "priest", "ranger"],
    note: "Sustain pra farm idle — adiciona a cura do Priest.",
  },
];

/** Cube 10 libera o Steam Market (regra anti-bot do jogo) — amarra com o resto do app. */
export const MARKET_UNLOCK_LEVEL = 10;

/** Features do Cube disponíveis num dado nível. */
export function availableFeatures(cubeLevel: number): CubeFeature[] {
  return CUBE_FEATURES.filter((f) => cubeLevel >= f.unlockLevel);
}

/** A party selecionada bate com alguma comp recomendada? (ordem não importa) */
export function compMatch(selected: string[]): Comp | null {
  const set = new Set(selected);
  return (
    RECOMMENDED_COMPS.find(
      (c) => c.classes.length === set.size && c.classes.every((cl) => set.has(cl)),
    ) ?? null
  );
}
