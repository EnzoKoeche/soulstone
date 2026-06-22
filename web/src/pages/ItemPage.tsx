import { Link, useParams } from "react-router-dom";
import { CenterMessage, Panel, Spinner } from "../components/common";
import { PriceChart } from "../components/PriceChart";
import { useTopItems } from "../hooks/useTopItems";
import {
  type ChangeTone,
  centsToUsd,
  priceChange,
  rarityOf,
  slugify,
  steamIconUrl,
} from "../lib/format";
import { useHead } from "../lib/head";
import type { ItemLatest } from "../lib/types";

function toneClass(tone: ChangeTone): string {
  return tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-zinc-300";
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: ChangeTone }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`font-mono font-semibold ${tone ? toneClass(tone) : "text-zinc-200"}`}>
        {value}
      </div>
    </div>
  );
}

function ItemDetail({ item }: { item: ItemLatest }) {
  const icon = steamIconUrl(item.icon_url, "128fx128f");
  const color = item.rarity_color ? `#${item.rarity_color}` : "#e4e4e7";
  const ch24 = priceChange(item.sell_price_cents, item.price_24h);
  const ch7 = priceChange(item.sell_price_cents, item.price_7d);
  const rarity = rarityOf(item.display_name);
  const steamUrl = `https://steamcommunity.com/market/listings/3678970/${encodeURIComponent(
    item.market_hash_name,
  )}`;

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {icon ? <img src={icon} alt="" className="size-20 shrink-0 rounded bg-zinc-800" /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold" style={{ color }}>
            {item.display_name}
          </h1>
          <p className="text-sm text-zinc-400">
            {item.type ?? "—"}
            {rarity ? ` · ${rarity}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-emerald-300">
            {centsToUsd(item.sell_price_cents)}
          </div>
          <div className="text-xs text-zinc-500">
            {item.sell_listings.toLocaleString("pt-BR")} à venda
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Preço" value={centsToUsd(item.sell_price_cents)} />
        <Stat label="Variação 24h" value={ch24.label} tone={ch24.tone} />
        <Stat label="Variação 7d" value={ch7.label} tone={ch7.tone} />
        <Stat label="À venda" value={item.sell_listings.toLocaleString("pt-BR")} />
      </div>

      <Panel className="h-96 overflow-hidden">
        <PriceChart item={item} />
      </Panel>

      <a
        href={steamUrl}
        target="_blank"
        rel="noreferrer"
        className="self-start rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-violet-500"
      >
        Ver no Steam Market ↗
      </a>

      <p className="text-xs leading-relaxed text-zinc-600">
        Preço público do Steam Community Market do jogo <strong>TBH: Task Bar Hero</strong> (appid
        3678970). Soulstone apenas lê dados públicos do mercado — não interage com o jogo.
      </p>
    </div>
  );
}

export function ItemPage() {
  const { slug } = useParams();
  const { data, loading, error } = useTopItems();
  const item = data?.find((i) => slugify(i.market_hash_name) === slug) ?? null;

  useHead({
    title: item
      ? `${item.display_name} — preço no Steam Market (TBH) | Soulstone`
      : "Item — Soulstone",
    description: item
      ? `Preço de ${item.display_name} no Steam Market do TBH: ${centsToUsd(item.sell_price_cents)}, ${item.sell_listings} à venda. Histórico e variação de preço.`
      : "Preço de item do Steam Market do TBH: Task Bar Hero.",
    path: slug ? `/item/${slug}` : undefined,
  });

  function body() {
    if (loading) return <Spinner label="Carregando item…" />;
    if (error) return <CenterMessage title="Erro ao carregar" detail={error} />;
    if (!item) {
      return (
        <CenterMessage
          title="Item não encontrado"
          detail="Esse item pode não estar listado no mercado agora."
        />
      );
    }
    return <ItemDetail item={item} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-violet-400 hover:underline">
        ← voltar ao dashboard
      </Link>
      <div className="mt-4">{body()}</div>
    </div>
  );
}
