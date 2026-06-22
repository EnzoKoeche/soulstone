import type { ItemLatest } from "../lib/types";
import { ItemRow } from "./ItemRow";

export function TopItemsList({
  items,
  selected,
  onSelect,
}: {
  items: ItemLatest[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <ul className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto p-2">
      {items.map((item, index) => (
        <li key={item.market_hash_name}>
          <ItemRow
            item={item}
            rank={index + 1}
            selected={item.market_hash_name === selected}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
