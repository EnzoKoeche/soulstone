import { useState } from "react";
import { CenterMessage, Panel, Spinner } from "./components/common";
import { ListControls, type SortKey } from "./components/ListControls";
import { MarketStatusBanner } from "./components/MarketStatusBanner";
import { PriceChart } from "./components/PriceChart";
import { TopItemsList } from "./components/TopItemsList";
import { useTopItems } from "./hooks/useTopItems";
import { baseCategory, rarityOf } from "./lib/format";

function isConfigError(message: string): boolean {
  return /não configurado/i.test(message);
}

export default function App() {
  const top = useTopItems();
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("price_desc");
  const [category, setCategory] = useState("");
  const [rarity, setRarity] = useState("");

  const items = top.data ?? [];
  const categories = [...new Set(items.map((i) => baseCategory(i.type)))].sort();
  const rarities = [
    ...new Set(items.map((i) => rarityOf(i.display_name)).filter((r): r is string => r !== null)),
  ].sort();

  const query = search.trim().toLowerCase();
  const filtered = items
    .filter((i) => (query ? i.display_name.toLowerCase().includes(query) : true))
    .filter((i) => (category ? baseCategory(i.type) === category : true))
    .filter((i) => (rarity ? rarityOf(i.display_name) === rarity : true))
    .sort((a, b) => {
      if (sort === "price_asc") return a.sell_price_cents - b.sell_price_cents;
      if (sort === "listings_desc") return b.sell_listings - a.sell_listings;
      return b.sell_price_cents - a.sell_price_cents;
    });

  const selectedName =
    picked ?? filtered.at(0)?.market_hash_name ?? items.at(0)?.market_hash_name ?? null;
  const selectedItem = items.find((i) => i.market_hash_name === selectedName) ?? null;

  function itemsBody() {
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
    if (items.length === 0) {
      return <CenterMessage title="Nenhum item ainda" detail="O poller vai popular o banco." />;
    }
    return (
      <>
        <ListControls
          search={search}
          onSearch={setSearch}
          sort={sort}
          onSort={setSort}
          category={category}
          onCategory={setCategory}
          categories={categories}
          rarity={rarity}
          onRarity={setRarity}
          rarities={rarities}
          shown={filtered.length}
          total={items.length}
        />
        {filtered.length === 0 ? (
          <CenterMessage title="Nada com esses filtros" detail="Ajuste a busca ou os filtros." />
        ) : (
          <TopItemsList items={filtered} selected={selectedName} onSelect={setPicked} />
        )}
      </>
    );
  }

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
            Itens do mercado
          </h2>
          {itemsBody()}
        </Panel>

        <Panel className="overflow-hidden">
          <PriceChart item={selectedItem} />
        </Panel>
      </div>

      <footer className="mt-8 border-t border-zinc-900 pt-4 text-center text-xs text-zinc-600">
        Dados públicos do Steam Community Market · Soulstone não interage com o jogo · v0.2
      </footer>
    </div>
  );
}
