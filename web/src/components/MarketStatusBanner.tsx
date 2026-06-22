import { useMarketStatus } from "../hooks/useMarketStatus";
import { relativeTime } from "../lib/format";

function statusLabel(loading: boolean, error: string | null, open: boolean | null): string {
  if (loading) return "Verificando o mercado…";
  if (error) return "Status do mercado indisponível";
  if (open === null) return "Status do mercado desconhecido";
  return open ? "Mercado aberto para novas listagens" : "Mercado fechado para novas listagens";
}

export function MarketStatusBanner() {
  const { data, loading, error } = useMarketStatus();
  const open = data?.listings_open ?? null;

  const dotClass = open === null ? "bg-zinc-500" : open ? "bg-emerald-400" : "bg-rose-400";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm">
      <span className={`size-2.5 rounded-full ${dotClass}`} />
      <span className="font-medium text-zinc-200">{statusLabel(loading, error, open)}</span>
      {data?.note ? <span className="text-zinc-500">· {data.note}</span> : null}
      {data?.updated_at ? (
        <span className="ml-auto text-xs text-zinc-600">
          atualizado {relativeTime(data.updated_at)}
        </span>
      ) : null}
    </div>
  );
}
