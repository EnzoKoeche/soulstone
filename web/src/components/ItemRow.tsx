import { centsToUsd, priceChange, steamIconUrl } from "../lib/format";
import type { ItemLatest } from "../lib/types";

export function ItemRow({
  item,
  rank,
  selected,
  onSelect,
}: {
  item: ItemLatest;
  rank: number;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const icon = steamIconUrl(item.icon_url);
  const nameColor = item.rarity_color ? `#${item.rarity_color}` : "#e4e4e7";
  const change = priceChange(item.sell_price_cents, item.price_24h);
  const changeClass =
    change.tone === "up"
      ? "text-emerald-400"
      : change.tone === "down"
        ? "text-rose-400"
        : "text-zinc-600";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.market_hash_name)}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
        selected
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-transparent hover:bg-zinc-800/60"
      }`}
    >
      <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-500">{rank}</span>
      {icon ? (
        <img src={icon} alt="" loading="lazy" className="size-9 shrink-0 rounded bg-zinc-800" />
      ) : (
        <span className="size-9 shrink-0 rounded bg-zinc-800" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" style={{ color: nameColor }}>
          {item.display_name}
        </span>
        {item.type ? (
          <span className="block truncate text-xs text-zinc-500">{item.type}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono font-semibold text-emerald-300">
          {centsToUsd(item.sell_price_cents)}
        </span>
        <span className="block text-xs text-zinc-500">
          {item.sell_listings.toLocaleString("pt-BR")} à venda
        </span>
        <span className={`block text-xs ${changeClass}`}>24h {change.label}</span>
      </span>
    </button>
  );
}
