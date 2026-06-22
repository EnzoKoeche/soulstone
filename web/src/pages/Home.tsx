import { useState } from "react";
import { Link } from "react-router-dom";
import { CenterMessage, Panel, Spinner } from "../components/common";
import { ListControls, type SortKey } from "../components/ListControls";
import { MarketStatusBanner } from "../components/MarketStatusBanner";
import { PriceChart } from "../components/PriceChart";
import { TopItemsList } from "../components/TopItemsList";
import { useTopItems } from "../hooks/useTopItems";
import { baseCategory, rarityOf, slugify } from "../lib/format";
import { useHead } from "../lib/head";

function isConfigError(message: string): boolean {
  return /não configurado/i.test(message);
}

export function Home() {
  const top = useTopItems();
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("price_desc");
  const [category, setCategory] = useState("");
  const [rarity, setRarity] = useState("");

  useHead({
    title: "Soulstone — preços do Steam Market do TBH (Task Bar Hero)",
    description:
      "Rastreador de preços do Steam Market para TBH: itens de maior valor, histórico de preço e status do mercado. Só dados públicos — não toca no jogo.",
    path: "/",
  });

  const items = top.data ?? [];
  const totalListings = items.reduce((sum, i) => sum + i.sell_listings, 0);
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
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/build"
            className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 hover:bg-violet-500/20"
          >
            🧊 Builds →
          </Link>
          <Link
            to="/farm"
            className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 hover:bg-violet-500/20"
          >
            💰 Valor de farm →
          </Link>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
            🔌 Só dados públicos · não toca no jogo
          </span>
        </div>
      </header>

      <div className="mt-4">
        <MarketStatusBanner itemsCount={items.length} totalListings={totalListings} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <Panel className="flex flex-col overflow-hidden">
          <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300">
            Itens do mercado
          </h2>
          {itemsBody()}
        </Panel>

        <Panel className="overflow-hidden">
          <PriceChart
            item={selectedItem}
            pageHref={selectedItem ? `/item/${slugify(selectedItem.market_hash_name)}` : undefined}
          />
        </Panel>
      </div>

      <footer className="mt-8 border-t border-zinc-900 pt-4 text-center text-xs text-zinc-600">
        Dados públicos do Steam Community Market · Soulstone não interage com o jogo · v0.3
      </footer>
    </div>
  );
}
