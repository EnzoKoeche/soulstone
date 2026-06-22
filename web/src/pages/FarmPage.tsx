import { Link } from "react-router-dom";
import { CenterMessage, Panel, Spinner } from "../components/common";
import { useFarm } from "../hooks/useFarm";
import { centsToUsd } from "../lib/format";
import { useHead } from "../lib/head";
import type { StageDrop, StageFarmValue } from "../lib/types";

function StageCard({
  stage,
  drops,
  best,
}: {
  stage: StageFarmValue;
  drops: StageDrop[];
  best: boolean;
}) {
  return (
    <Panel className={`p-4 ${best ? "border-violet-500/60" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100">
            {best ? (
              <span className="mr-2 rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">
                ⭐ Melhor agora
              </span>
            ) : null}
            {stage.name}
          </h3>
          <p className="text-xs text-zinc-500">
            {stage.difficulty} · ~{stage.clears_per_hour} clears/h · {stage.note}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-emerald-300">
            {centsToUsd(stage.value_per_hour_cents)}
          </span>
          <span className="text-xs text-zinc-500">/h est.</span>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        {drops.map((d) => (
          <li key={d.market_hash_name}>
            {d.market_hash_name} <span className="text-zinc-600">×{d.drops_per_run}/run</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function FarmPage() {
  const { stages, drops, loading, error } = useFarm();

  useHead({
    title: "Melhor stage pra farmar agora — valor/hora | Soulstone (TBH)",
    description:
      "Ranking de stages do TBH: Task Bar Hero por valor estimado por hora, usando os preços ao vivo do Steam Market. Reordena conforme o mercado.",
    path: "/farm",
  });

  const dropsByStage = new Map<string, StageDrop[]>();
  for (const d of drops) {
    const arr = dropsByStage.get(d.stage_id) ?? [];
    arr.push(d);
    dropsByStage.set(d.stage_id, arr);
  }

  function body() {
    if (loading) return <Spinner label="Calculando valor/hora…" />;
    if (error) return <CenterMessage title="Erro ao carregar" detail={error} />;
    if (stages.length === 0) {
      return <CenterMessage title="Sem stages ainda" detail="As drop tables não foram semeadas." />;
    }
    return (
      <div className="flex flex-col gap-3">
        {stages.map((s, i) => (
          <StageCard
            key={s.stage_id}
            stage={s}
            drops={dropsByStage.get(s.stage_id) ?? []}
            best={i === 0}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-violet-400 hover:underline">
        ← voltar ao dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-zinc-100">Valor de farm por hora</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Stages ranqueados por <strong>valor estimado/hora</strong>, usando os{" "}
        <strong>preços ao vivo</strong> do Steam Market — reordena sozinho quando o mercado muda.
      </p>
      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/80">
        ⚠️ <strong>Estimativa.</strong> As taxas de drop e clears/hora são da comunidade (não
        oficiais); os <strong>preços</strong> são reais e ao vivo. Use como direção, não como número
        exato.{" "}
        <a
          href="https://www.lagofast.com/en/blog/tbh-task-bar-hero-farming-guide/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          fontes ↗
        </a>
      </div>
      <div className="mt-5">{body()}</div>
    </div>
  );
}
