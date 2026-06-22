import { useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "../components/common";
import {
  availableFeatures,
  CLASSES,
  CUBE_FEATURES,
  compMatch,
  MARKET_UNLOCK_LEVEL,
  RECOMMENDED_COMPS,
} from "../lib/build";
import { useHead } from "../lib/head";

const SOURCE =
  "https://games.gg/tbh-task-bar-hero/guides/tbh-task-bar-hero-complete-guide-cube-runes-and-pets-explained/";

export function BuildPage() {
  const [selected, setSelected] = useState<string[]>(["knight", "ranger"]);
  const [cubeLevel, setCubeLevel] = useState(10);

  useHead({
    title: "Build planner (Cube System) — TBH | Soulstone",
    description:
      "Planejador de build do TBH: Task Bar Hero — monte a party (classes), veja o que o Cube System libera por nível e as comps recomendadas.",
    path: "/build",
  });

  const comp = compMatch(selected);
  const unlockedCount = availableFeatures(cubeLevel).length;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-violet-400 hover:underline">
        ← voltar ao dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-zinc-100">Build planner — Cube System</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Monte a party e veja o que o <strong>Cube System</strong> libera por nível.
      </p>
      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
        ⚠️ Referência das guias da comunidade (não oficial).{" "}
        <a href={SOURCE} target="_blank" rel="noreferrer" className="underline">
          fontes ↗
        </a>
      </div>

      <Panel className="mt-5 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Party</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CLASSES.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  on
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60"
                }`}
              >
                <span className="block font-medium text-zinc-100">{c.name}</span>
                <span className="block text-xs text-zinc-500">
                  {c.role} · {c.weapon}
                </span>
              </button>
            );
          })}
        </div>
        {comp && (
          <p className="mt-3 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            ✅ Comp reconhecida: {comp.note}
          </p>
        )}
        {!comp && selected.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Comp livre ({selected.length} classe{selected.length > 1 ? "s" : ""}). Veja as
            recomendadas abaixo.
          </p>
        )}
      </Panel>

      <Panel className="mt-4 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">Cube — nível {cubeLevel}</h2>
          <span className="text-xs text-zinc-500">
            {unlockedCount}/{CUBE_FEATURES.length} features
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={25}
          value={cubeLevel}
          aria-label="Nível do Cube"
          onChange={(e) => setCubeLevel(Number(e.target.value))}
          className="mt-2 w-full accent-violet-500"
        />
        <p
          className={`mt-1 text-xs ${cubeLevel >= MARKET_UNLOCK_LEVEL ? "text-emerald-300" : "text-zinc-500"}`}
        >
          {cubeLevel >= MARKET_UNLOCK_LEVEL
            ? `🔓 Cube ${MARKET_UNLOCK_LEVEL}: Steam Market liberado (anti-bot).`
            : `🔒 Steam Market libera no Cube ${MARKET_UNLOCK_LEVEL}.`}
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {CUBE_FEATURES.map((f) => {
            const unlocked = cubeLevel >= f.unlockLevel;
            return (
              <li
                key={f.name}
                className={`rounded-lg border px-3 py-2 ${
                  unlocked
                    ? "border-zinc-700 bg-zinc-900/60"
                    : "border-zinc-900 bg-zinc-950 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">{f.name}</span>
                  <span className={`text-xs ${unlocked ? "text-emerald-400" : "text-zinc-600"}`}>
                    {unlocked ? "✓ " : ""}Lv {f.unlockLevel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{f.description}</p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="mt-4 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Comps recomendadas</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {RECOMMENDED_COMPS.map((c) => (
            <li key={c.classes.join("-")}>
              <button
                type="button"
                onClick={() => setSelected(c.classes)}
                className="font-medium text-violet-300 hover:underline"
              >
                {c.classes.map((id) => CLASSES.find((x) => x.id === id)?.name).join(" + ")}
              </button>
              <span className="text-zinc-500"> — {c.note}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
