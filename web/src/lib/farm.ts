// Motor de "valor por hora de farm" (puro, testável). É a mesma conta da view
// stage_farm_value no Postgres; mantido aqui como referência testada (NFR-08).

export interface DropEstimate {
  dropsPerRun: number;
  priceCents: number;
}

/** Valor/hora estimado (centavos) = clears/hora × Σ(drops_por_run × preço). */
export function farmValuePerHourCents(clearsPerHour: number, drops: DropEstimate[]): number {
  const perRun = drops.reduce((sum, d) => sum + d.dropsPerRun * d.priceCents, 0);
  return Math.round(perRun * clearsPerHour);
}
