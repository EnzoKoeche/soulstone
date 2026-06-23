import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Panel, Spinner } from "../components/common";
import { useTopItems } from "../hooks/useTopItems";
import { centsToUsd } from "../lib/format";
import { useHead } from "../lib/head";
import { createAlert, deleteAlert, listAlerts, type MyAlert } from "../lib/queries";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none";
const inputClass =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none";

interface Status {
  kind: "idle" | "sending" | "ok" | "error";
  msg?: string;
}

export function AlertsPage() {
  const { data: items, loading } = useTopItems();
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState<"below" | "above">("below");
  const [channel, setChannel] = useState<"discord" | "telegram">("discord");
  const [webhook, setWebhook] = useState("");
  const [tgToken, setTgToken] = useState("");
  const [tgChat, setTgChat] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const [manageWebhook, setManageWebhook] = useState("");
  const [myAlerts, setMyAlerts] = useState<MyAlert[] | null>(null);
  const [manageStatus, setManageStatus] = useState<Status>({ kind: "idle" });

  useHead({
    title: "Alertas de preço (Discord/Telegram) — TBH | Soulstone",
    description:
      "Crie alertas de preço do Steam Market do TBH: item + alvo + Discord ou Telegram. Notifica quando o preço cruzar. Gerencie seus alertas.",
    path: "/alerts",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price) * 100);
    if (!item || !Number.isFinite(cents) || cents <= 0) {
      setStatus({ kind: "error", msg: "Preencha item e preço-alvo." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      await createAlert({
        market_hash_name: item,
        target_price_cents: cents,
        direction,
        channel,
        discord_webhook_url: channel === "discord" ? webhook.trim() : undefined,
        telegram_bot_token: channel === "telegram" ? tgToken.trim() : undefined,
        telegram_chat_id: channel === "telegram" ? tgChat.trim() : undefined,
      });
      setStatus({
        kind: "ok",
        msg: "Alerta criado! Você é notificado quando o preço cruzar (checa a cada 30 min).",
      });
      setPrice("");
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
  }

  async function loadMine() {
    setManageStatus({ kind: "sending" });
    try {
      setMyAlerts(await listAlerts(manageWebhook.trim()));
      setManageStatus({ kind: "ok" });
    } catch (err) {
      setMyAlerts(null);
      setManageStatus({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
  }

  async function remove(id: number) {
    try {
      await deleteAlert(id, manageWebhook.trim());
      setMyAlerts((cur) => (cur ?? []).filter((a) => a.id !== id));
    } catch (err) {
      setManageStatus({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-violet-400 hover:underline">
        ← voltar ao dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-zinc-100">Alertas de preço</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Escolha um item, o preço‑alvo e o canal. O poller te notifica quando o preço cruzar.
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
              Canal
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as "discord" | "telegram")}
                className={fieldClass}
              >
                <option value="discord">Discord (webhook)</option>
                <option value="telegram">Telegram (bot)</option>
              </select>
            </label>

            {channel === "discord" && (
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
            )}
            {channel === "telegram" && (
              <>
                <label className="text-sm text-zinc-300">
                  Bot token (@BotFather)
                  <input
                    type="text"
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    placeholder="123456:ABC-DEF..."
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm text-zinc-300">
                  Chat ID
                  <input
                    type="text"
                    value={tgChat}
                    onChange={(e) => setTgChat(e.target.value)}
                    placeholder="123456789"
                    className={fieldClass}
                  />
                </label>
                <p className="text-xs text-zinc-500">
                  Crie um bot no @BotFather (pega o token), mande uma msg pro bot e veja o chat id
                  em api.telegram.org/bot&lt;token&gt;/getUpdates.
                </p>
              </>
            )}

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

      <Panel className="mt-4 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Meus alertas (Discord)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cole o webhook do Discord pra ver e remover os alertas dele.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={manageWebhook}
            onChange={(e) => setManageWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className={inputClass}
          />
          <button
            type="button"
            onClick={loadMine}
            disabled={manageStatus.kind === "sending"}
            className="shrink-0 rounded-md border border-zinc-700 px-3 text-sm text-zinc-200 hover:border-violet-500 disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
        {manageStatus.kind === "error" && (
          <p className="mt-2 text-sm text-rose-400">⚠️ {manageStatus.msg}</p>
        )}
        {myAlerts && myAlerts.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500">Nenhum alerta nesse webhook.</p>
        )}
        {myAlerts && myAlerts.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {myAlerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-300">
                  {a.market_hash_name} {a.direction === "below" ? "≤" : "≥"}{" "}
                  {centsToUsd(a.target_price_cents)}
                  {a.last_triggered_at ? " · já disparou" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="ml-3 shrink-0 text-xs text-rose-400 hover:underline"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="mt-4 text-xs text-zinc-600">
        Webhook/token ficam privados (RLS bloqueia leitura anon). Máx. 10 alertas por canal.
      </p>
    </div>
  );
}
