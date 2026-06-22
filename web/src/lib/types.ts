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
