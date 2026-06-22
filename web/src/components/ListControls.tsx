export type SortKey = "price_desc" | "price_asc" | "listings_desc";

const selectClass =
  "rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-zinc-300 focus:border-violet-500 focus:outline-none";

export function ListControls({
  search,
  onSearch,
  sort,
  onSort,
  category,
  onCategory,
  categories,
  rarity,
  onRarity,
  rarities,
  shown,
  total,
}: {
  search: string;
  onSearch: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  category: string;
  onCategory: (v: string) => void;
  categories: string[];
  rarity: string;
  onRarity: (v: string) => void;
  rarities: string[];
  shown: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-zinc-800 p-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar item…"
        aria-label="Buscar item"
        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2 text-xs">
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          aria-label="Ordenar por"
          className={selectClass}
        >
          <option value="price_desc">Maior preço</option>
          <option value="price_asc">Menor preço</option>
          <option value="listings_desc">Mais listagens</option>
        </select>
        <select
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          aria-label="Filtrar por tipo"
          className={selectClass}
        >
          <option value="">Todos os tipos</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={rarity}
          onChange={(e) => onRarity(e.target.value)}
          aria-label="Filtrar por raridade"
          className={selectClass}
        >
          <option value="">Todas as raridades</option>
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <span className="text-xs text-zinc-500">
        {shown} de {total} itens
      </span>
    </div>
  );
}
