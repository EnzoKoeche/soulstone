import { useMarketStatus } from "../hooks/useMarketStatus";
import { relativeTime } from "../lib/format";

const STEAM_NEWS = "https://store.steampowered.com/news/app/3678970/view/717906943451071378";

function statusLabel(loading: boolean, open: boolean | null): string {
  if (loading) return "Verificando o mercado…";
  if (open === null) return "Status do mercado desconhecido";
  return open ? "Mercado aberto para novas listagens" : "Mercado fechado para novas listagens";
}

export function MarketStatusBanner({
  itemsCount,
  totalListings,
}: {
  itemsCount: number;
  totalListings: number;
}) {
  const { data, loading } = useMarketStatus();
  const open = data?.listings_open ?? null;
  const dotClass = open === null ? "bg-zinc-500" : open ? "bg-emerald-400" : "bg-rose-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`size-2.5 rounded-full ${dotClass}`} />
        <span className="font-medium text-zinc-200">{statusLabel(loading, open)}</span>
        {itemsCount > 0 ? (
          <span className="text-zinc-500">
            · {itemsCount} itens · {totalListings.toLocaleString("pt-BR")} listagens à venda
          </span>
        ) : null}
        {data?.updated_at ? (
          <span className="ml-auto text-xs text-zinc-600">
            atualizado {relativeTime(data.updated_at)}
          </span>
        ) : null}
      </div>

      {open === false ? (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Fechado para novas listagens desde 08/06/2026 (tráfego de bots e exploits de duplicação de
          itens). Compras de itens já listados seguem normalmente; reabre após a estabilização do
          servidor do jogo.{" "}
          <a
            href={STEAM_NEWS}
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 hover:underline"
          >
            anúncio oficial ↗
          </a>
          <br />
          <span className="text-zinc-600">
            📈 Especulação: itens farmados em massa pelos exploits podem desvalorizar; itens raros
            legítimos podem valorizar quando o mercado reabrir.
          </span>
        </p>
      ) : null}
    </div>
  );
}
