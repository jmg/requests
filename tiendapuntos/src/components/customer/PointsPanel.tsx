"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { earnPointsAction, adjustPointsAction } from "@/lib/actions/points";
import { redeemRewardAction } from "@/lib/actions/redemptions";
import { SubmitButton } from "@/components/SubmitButton";

type Reward = {
  id: string;
  name: string;
  pointsCost: number;
  stock: number | null;
  active: boolean;
};

type Tab = "earn" | "redeem" | "adjust";

export function PointsPanel({
  customerId,
  pointsName,
  currency,
  pointsPerCurrency,
  rewards,
}: {
  customerId: string;
  pointsName: string;
  currency: string;
  pointsPerCurrency: number;
  rewards: Reward[];
}) {
  const [tab, setTab] = useState<Tab>("earn");

  const tabs: { id: Tab; label: string }[] = [
    { id: "earn", label: "Sumar" },
    { id: "redeem", label: "Canjear" },
    { id: "adjust", label: "Ajustar" },
  ];

  return (
    <div className="card">
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "earn" && (
        <EarnForm
          customerId={customerId}
          pointsName={pointsName}
          currency={currency}
          pointsPerCurrency={pointsPerCurrency}
        />
      )}
      {tab === "redeem" && (
        <RedeemForm customerId={customerId} pointsName={pointsName} rewards={rewards} />
      )}
      {tab === "adjust" && <AdjustForm customerId={customerId} pointsName={pointsName} />}
    </div>
  );
}

function EarnForm({
  customerId,
  pointsName,
  currency,
  pointsPerCurrency,
}: {
  customerId: string;
  pointsName: string;
  currency: string;
  pointsPerCurrency: number;
}) {
  const action = earnPointsAction.bind(null, customerId);
  const [state, formAction] = useFormState(action, undefined);
  const [mode, setMode] = useState<"amount" | "points">("amount");
  const [amount, setAmount] = useState("");

  const previewPoints = mode === "amount" && amount ? Math.floor(Number(amount) * pointsPerCurrency) : null;

  return (
    <form action={formAction} className="space-y-4" key={state?.ok ? "ok" : "form"}>
      <input type="hidden" name="mode" value={mode} />
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("amount")}
          className={`flex-1 rounded-lg border px-3 py-2 ${
            mode === "amount" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200"
          }`}
        >
          Por monto ({currency})
        </button>
        <button
          type="button"
          onClick={() => setMode("points")}
          className={`flex-1 rounded-lg border px-3 py-2 ${
            mode === "points" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200"
          }`}
        >
          Puntos directos
        </button>
      </div>

      {mode === "amount" ? (
        <div>
          <label className="label">Monto de la compra</label>
          <input
            className="input"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          {previewPoints !== null && previewPoints > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Sumará <span className="font-semibold text-brand-700">{previewPoints}</span> {pointsName}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="label">Cantidad de {pointsName}</label>
          <input className="input" name="points" type="number" min="1" step="1" placeholder="0" />
        </div>
      )}

      <div>
        <label className="label">Nota (opcional)</label>
        <input className="input" name="note" placeholder="Ej: compra en mostrador" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">¡Puntos sumados! ✅</p>}

      <SubmitButton className="btn-primary w-full" pendingText="Sumando…">
        Sumar {pointsName}
      </SubmitButton>
    </form>
  );
}

function RedeemForm({
  customerId,
  pointsName,
  rewards,
}: {
  customerId: string;
  pointsName: string;
  rewards: Reward[];
}) {
  const action = redeemRewardAction.bind(null, customerId);
  const [state, formAction] = useFormState(action, undefined);
  const available = rewards.filter((r) => r.active && (r.stock === null || r.stock > 0));

  if (available.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No hay premios disponibles. Cargá premios en la sección Premios.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" key={state?.code ?? "form"}>
      <div>
        <label className="label">Premio a canjear</label>
        <select className="input" name="rewardId" defaultValue="">
          <option value="" disabled>
            Elegí un premio…
          </option>
          {available.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.pointsCost} {pointsName}
              {r.stock !== null ? ` (stock: ${r.stock})` : ""}
            </option>
          ))}
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && state.code && (
        <div className="rounded-lg bg-brand-50 p-3 text-center">
          <p className="text-sm text-brand-700">¡Canje realizado! Código:</p>
          <p className="text-2xl font-bold tracking-widest text-brand-800">{state.code}</p>
        </div>
      )}

      <SubmitButton className="btn-primary w-full" pendingText="Canjeando…">
        Canjear premio
      </SubmitButton>
    </form>
  );
}

function AdjustForm({ customerId, pointsName }: { customerId: string; pointsName: string }) {
  const action = adjustPointsAction.bind(null, customerId);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-4" key={state?.ok ? "ok" : "form"}>
      <div>
        <label className="label">Ajuste de {pointsName}</label>
        <input className="input" name="points" type="number" step="1" placeholder="Ej: 50 o -20" />
        <p className="mt-1 text-xs text-gray-500">
          Usá un número negativo para descontar {pointsName}.
        </p>
      </div>
      <div>
        <label className="label">Motivo (opcional)</label>
        <input className="input" name="note" placeholder="Ej: corrección de carga" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">Ajuste aplicado ✅</p>}

      <SubmitButton className="btn-secondary w-full" pendingText="Aplicando…">
        Aplicar ajuste
      </SubmitButton>
    </form>
  );
}
