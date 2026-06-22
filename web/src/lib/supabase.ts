import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Se faltar env, o app degrada com aviso em vez de quebrar (ver App). */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured && url && anonKey ? createClient(url, anonKey) : null;
