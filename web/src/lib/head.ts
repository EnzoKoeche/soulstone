import { useEffect } from "react";

export const SITE_URL = "https://soulstone-sooty.vercel.app";

/** Atualiza title/description/canonical/og no client (navegação SPA entre itens). */
export function useHead(opts: { title: string; description: string; path?: string }): void {
  const { title, description, path } = opts;
  useEffect(() => {
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    if (path) {
      const url = SITE_URL + path;
      setMeta("property", "og:url", url);
      setCanonical(url);
    }
  }, [title, description, path]);
}

function setMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string): void {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
