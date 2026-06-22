import { useState } from "react";
import { CenterMessage, Panel, Spinner } from "./components/common";
import { MarketStatusBanner } from "./components/MarketStatusBanner";
import { PriceChart } from "./components/PriceChart";
import { TopItemsList } from "./components/TopItemsList";
import { useTopItems } from "./hooks/useTopItems";
import type { ItemLatest } from "./lib/types";

interface TopState {
  data: ItemLatest[] | null;
  loading: boolean;
  error: string | null;
}

function isConfigError(message: string): boolean {
  return /não configurado/i.test(message);
}

function ItemsPanelBody({
  top,
  selected,
  onSelect,
}: {
  top: TopState;
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  if (top.loading) return <Spinner label="Carregando itens…" />;
  if (top.error) {
    if (isConfigError(top.error)) {
      return (
        <CenterMessage
          title="Configure o Supabase"
          detail="Copie web/.env.example para web/.env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
        />
      );
    }
    return <CenterMessage title="Erro ao carregar" detail={top.error} />;
  }
  if (!top.data || top.data.length === 0) {
    return (
      <CenterMessage
        title="Nenhum item ainda"
        detail="Rode o poller para popular o banco de dados."
      />
    );
  }
  return <TopItemsList items={top.data} selected={selected} onSelect={onSelect} />;
}

export default function App() {
  const top = useTopItems();
  const [picked, setPicked] = useState<string | null>(null);

  const items = top.data ?? [];
  const selectedName = picked ?? items.at(0)?.market_hash_name ?? null;
  const selectedItem = items.find((i) => i.market_hash_name === selectedName) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-violet-300 to-emerald-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Soulstone
          </h1>
          <p className="text-sm text-zinc-400">Rastreador de preços do Steam Market · TBH</p>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
          🔌 Só dados públicos · não toca no jogo
        </span>
      </header>

      <div className="mt-4">
        <MarketStatusBanner />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <Panel className="flex flex-col overflow-hidden">
          <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300">
            Itens de maior valor
          </h2>
          <ItemsPanelBody top={top} selected={selectedName} onSelect={setPicked} />
        </Panel>

        <Panel className="overflow-hidden">
          <PriceChart item={selectedItem} />
        </Panel>
      </div>

      <footer className="mt-8 border-t border-zinc-900 pt-4 text-center text-xs text-zinc-600">
        Dados públicos do Steam Community Market · Soulstone não interage com o jogo · v0.1
      </footer>
    </div>
  );
}
