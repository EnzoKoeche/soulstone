// Prerender pós-build (SEO básico, v0.3): gera um HTML real por item com
// title/description/canonical/og + um bloco de conteúdo que o crawler lê (o React
// substitui ao montar). Também escreve sitemap.xml e robots.txt. Roda da pasta web/
// depois do `vite build`. Se faltar rede/creds, sai sem falhar o build.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://soulstone-sooty.vercel.app";
const DIST = "dist";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function centsToUsd(c) {
  const n = Math.trunc(Number(c) || 0);
  const abs = Math.abs(n);
  return `${n < 0 ? "-" : ""}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function readEnv() {
  try {
    const lines = readFileSync(".env.production", "utf8").split("\n");
    const out = {};
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return out;
  } catch {
    return {};
  }
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.warn("prerender: sem creds Supabase em .env.production — pulando SEO de itens.");
  process.exit(0);
}

let items = [];
try {
  const res = await fetch(
    `${url}/rest/v1/item_latest?select=market_hash_name,display_name,type,rarity_color,sell_price_cents,sell_listings&order=sell_price_cents.desc&limit=500`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  items = await res.json();
} catch (e) {
  console.warn(`prerender: fetch falhou (${e.message}) — pulando SEO de itens.`);
  process.exit(0);
}

const shell = readFileSync(join(DIST, "index.html"), "utf8");
const urls = ["/"];

for (const it of items) {
  const slug = slugify(it.market_hash_name);
  if (!slug) continue;
  const path = `/item/${slug}`;
  urls.push(path);
  const title = `${it.display_name} — preço no Steam Market (TBH) | Soulstone`;
  const desc = `Preço de ${it.display_name} no Steam Market do TBH: ${centsToUsd(it.sell_price_cents)}, ${it.sell_listings} à venda. Histórico e variação — só dados públicos.`;
  const canonical = `${SITE}${path}`;
  const seo = `<main style="padding:1rem"><h1>${esc(it.display_name)}</h1><p>${esc(it.type || "")}</p><p>Preço no Steam Market (TBH): <strong>${centsToUsd(it.sell_price_cents)}</strong> — ${it.sell_listings} à venda.</p><p>Soulstone rastreia o preço público do Steam Community Market do TBH: Task Bar Hero. Carregando histórico…</p></main>`;
  const meta =
    `<meta name="description" content="${esc(desc)}">` +
    `<link rel="canonical" href="${esc(canonical)}">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="${esc(canonical)}">` +
    `<meta property="og:type" content="website">`;
  const html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace('<div id="root"></div>', `<div id="root">${seo}</div>`)
    .replace("</head>", `${meta}</head>`);
  const dir = join(DIST, "item", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

// home: canonical + og (já tem <title> e description no index.html)
const homeDesc =
  "Rastreador de preços do Steam Market para TBH: Task Bar Hero. Itens de maior valor, histórico de preço e status do mercado — só dados públicos, não toca no jogo.";
const homeHtml = shell.replace(
  "</head>",
  `<link rel="canonical" href="${SITE}/">` +
    `<meta property="og:title" content="Soulstone — rastreador de preços do Steam Market (TBH)">` +
    `<meta property="og:description" content="${esc(homeDesc)}">` +
    `<meta property="og:type" content="website"></head>`,
);
writeFileSync(join(DIST, "index.html"), homeHtml);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`prerender: ${items.length} páginas de item + sitemap (${urls.length} URLs).`);
