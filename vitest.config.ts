import { defineConfig } from "vitest/config";

// Roda os testes unitários do núcleo crítico (parser da Steam).
// O parser é TS puro, sem APIs de runtime, então roda no Node via Vitest
// e também é importável pela Edge Function (Deno). Nunca bate na Steam real (NFR-01).
export default defineConfig({
  test: {
    include: ["supabase/functions/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
