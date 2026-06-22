// Formas que o frontend lê do Supabase. Espelham o §7 + a view item_latest.

export interface ItemLatest {
  market_hash_name: string;
  display_name: string;
  type: string | null;
  rarity_color: string | null;
  icon_url: string | null;
  sell_price_cents: number;
  sell_listings: number;
  currency: number;
  captured_at: string;
  /** Preço ~24h/7d atrás (null se ainda não há histórico tão antigo). */
  price_24h: number | null;
  price_7d: number | null;
}

export interface PricePoint {
  captured_at: string;
  sell_price_cents: number;
}

export interface MarketStatus {
  id: number;
  listings_open: boolean;
  note: string | null;
  updated_at: string;
}

export interface StageFarmValue {
  stage_id: string;
  name: string;
  act: number | null;
  difficulty: string | null;
  clears_per_hour: number;
  note: string | null;
  source: string | null;
  value_per_run_cents: number;
  value_per_hour_cents: number;
}

export interface StageDrop {
  stage_id: string;
  market_hash_name: string;
  drops_per_run: number;
}
