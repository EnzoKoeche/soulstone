import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Panel, Spinner } from "../components/common";
import { useTopItems } from "../hooks/useTopItems";
import { useHead } from "../lib/head";
import { createAlert } from "../lib/queries";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none";

interface Status {
  kind: "idle" | "sending" | "ok" | "error";
  msg?: string;
}

export function AlertsPage() {
  const { data: items, loading } = useTopItems();
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState<"below" | "above">("below");
  const [webhook, setWebhook] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useHead({
    title: "Criar alerta de preço (Discord) — TBH | Soulstone",
    description:
      "Crie um alerta de preço do Steam Market do TBH: escolha o item, o preço-alvo e cole o webhook do seu Discord. Notifica quando o preço cruzar.",
    path: "/alerts",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price) * 100);
    if (!item || !Number.isFinite(cents) || cents <= 0 || !webhook.trim()) {
      setStatus({ kind: "error", msg: "Preencha item, preço-alvo e webhook." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      await createAlert({
        market_hash_name: item,
        target_price_cents: cents,
        direction,
        discord_webhook_url: webhook.trim(),
      });
      setStatus({
        kind: "ok",
        msg: "Alerta criado! Você é notificado no Discord quando o preço cruzar (checa a cada 30 min).",
      });
      setPrice("");
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-violet-400 hover:underline">
        ← voltar ao dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-zinc-100">Criar alerta de preço</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Escolha um item, o preço‑alvo e cole o <strong>webhook do seu Discord</strong>. O poller te
        notifica quando o preço cruzar.
      </p>

      {loading ? (
        <Spinner label="Carregando itens…" />
      ) : (
        <Panel className="mt-5 p-4">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm text-zinc-300">
              Item
              <select value={item} onChange={(e) => setItem(e.target.value)} className={fieldClass}>
                <option value="">Selecione…</option>
                {(items ?? []).map((i) => (
                  <option key={i.market_hash_name} value={i.market_hash_name}>
                    {i.display_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <label className="min-w-32 flex-1 text-sm text-zinc-300">
                Preço‑alvo (US$)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2.50"
                  className={fieldClass}
                />
              </label>
              <label className="min-w-32 flex-1 text-sm text-zinc-300">
                Quando
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "below" | "above")}
                  className={fieldClass}
                >
                  <option value="below">cair até/abaixo</option>
                  <option value="above">subir até/acima</option>
                </select>
              </label>
            </div>

            <label className="text-sm text-zinc-300">
              Webhook do Discord
              <input
                type="url"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className={fieldClass}
              />
            </label>
            <p className="text-xs text-zinc-500">
              Como pegar: no Discord, Editar Canal → Integrações → Webhooks → Novo Webhook → Copiar
              URL.
            </p>

            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {status.kind === "sending" ? "Criando…" : "Criar alerta"}
            </button>

            {status.kind === "ok" && <p className="text-sm text-emerald-400">✅ {status.msg}</p>}
            {status.kind === "error" && <p className="text-sm text-rose-400">⚠️ {status.msg}</p>}
          </form>
        </Panel>
      )}

      <p className="mt-4 text-xs text-zinc-600">
        O webhook fica privado (não é exposto publicamente). Máx. 10 alertas por webhook.
      </p>
    </div>
  );
}
