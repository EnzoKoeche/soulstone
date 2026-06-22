// Espelha centsToUsd do parser (testado em supabase/functions/poller/parser.ts).
// Duplicado de propósito: o browser e a Edge Function (Deno) não compartilham
// módulos. Lógica idêntica, sem float.
export function centsToUsd(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const ICON_BASE = "https://community.cloudflare.steamstatic.com/economy/image";

/** O icon_url da Steam é só um token; vira URL completa na CDN. */
export function steamIconUrl(token: string | null, size = "96fx96f"): string | null {
  return token ? `${ICON_BASE}/${token}/${size}` : null;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 60) return "agora mesmo";
  const min = Math.round(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}

export function shortTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
