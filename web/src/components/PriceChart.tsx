import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { useItemHistory } from "../hooks/useItemHistory";
import { centsToUsd, shortTime } from "../lib/format";
import type { ItemLatest } from "../lib/types";
import { CenterMessage, Spinner } from "./common";

interface ChartPoint {
  t: number;
  price: number;
  iso: string;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <div className="font-mono font-semibold text-emerald-300">{centsToUsd(point.price)}</div>
      <div className="text-zinc-400">{shortTime(point.iso)}</div>
    </div>
  );
}

function ChartBody({
  loading,
  error,
  series,
}: {
  loading: boolean;
  error: string | null;
  series: ChartPoint[];
}) {
  if (loading) return <Spinner label="Carregando histórico…" />;
  if (error) return <CenterMessage title="Erro ao carregar histórico" detail={error} />;
  if (series.length === 0) {
    return (
      <CenterMessage
        title="Sem histórico ainda"
        detail="A série de preço × tempo se forma conforme o poller roda (a cada 30 min)."
      />
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={272}>
      <AreaChart data={series} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(t: number) => shortTime(new Date(t).toISOString())}
          stroke="#52525b"
          fontSize={11}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(v: number) => centsToUsd(v)}
          stroke="#52525b"
          fontSize={11}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#priceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PriceChart({ item }: { item: ItemLatest | null }) {
  const { data, loading, error } = useItemHistory(item?.market_hash_name ?? null);

  if (!item) {
    return (
      <CenterMessage
        title="Selecione um item"
        detail="Escolha um item na lista para ver o histórico de preço."
      />
    );
  }

  const series: ChartPoint[] = data.map((p) => ({
    t: new Date(p.captured_at).getTime(),
    price: p.sell_price_cents,
    iso: p.captured_at,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <h2
          className="truncate text-sm font-semibold"
          style={{ color: item.rarity_color ? `#${item.rarity_color}` : "#e4e4e7" }}
        >
          {item.display_name}
        </h2>
        <span className="font-mono font-semibold text-emerald-300">
          {centsToUsd(item.sell_price_cents)}
        </span>
      </div>
      <div className="min-h-72 flex-1 p-2">
        <ChartBody loading={loading} error={error} series={series} />
      </div>
    </div>
  );
}
