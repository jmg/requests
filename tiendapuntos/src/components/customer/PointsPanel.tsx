"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pointsPanel");
  const [tab, setTab] = useState<Tab>("earn");

  const tabs: { id: Tab; label: string }[] = [
    { id: "earn", label: t("earn") },
    { id: "redeem", label: t("redeem") },
    { id: "adjust", label: t("adjust") },
  ];

  return (
    <div className="card">
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === item.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
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
  const t = useTranslations("pointsPanel");
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
          {t("byAmount", { currency })}
        </button>
        <button
          type="button"
          onClick={() => setMode("points")}
          className={`flex-1 rounded-lg border px-3 py-2 ${
            mode === "points" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200"
          }`}
        >
          {t("directPoints")}
        </button>
      </div>

      {mode === "amount" ? (
        <div>
          <label className="label">{t("purchaseAmount")}</label>
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
              {t("willAdd", { points: previewPoints, pointsName })}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="label">{t("pointsQuantity", { points: pointsName })}</label>
          <input className="input" name="points" type="number" min="1" step="1" placeholder="0" />
        </div>
      )}

      <div>
        <label className="label">{t("noteOptional")}</label>
        <input className="input" name="note" placeholder={t("notePlaceholder")} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">{t("pointsAdded")}</p>}

      <SubmitButton className="btn-primary w-full" pendingText={t("earning")}>
        {t("earnSubmit", { points: pointsName })}
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
  const t = useTranslations("pointsPanel");
  const action = redeemRewardAction.bind(null, customerId);
  const [state, formAction] = useFormState(action, undefined);
  const available = rewards.filter((r) => r.active && (r.stock === null || r.stock > 0));

  if (available.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        {t("noRewardsAvailable")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" key={state?.code ?? "form"}>
      <div>
        <label className="label">{t("rewardToRedeem")}</label>
        <select className="input" name="rewardId" defaultValue="">
          <option value="" disabled>
            {t("chooseReward")}
          </option>
          {available.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.pointsCost} {pointsName}
              {r.stock !== null ? ` (${t("stock")}: ${r.stock})` : ""}
            </option>
          ))}
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && state.code && (
        <div className="rounded-lg bg-brand-50 p-3 text-center">
          <p className="text-sm text-brand-700">{t("redeemDone")}</p>
          <p className="text-2xl font-bold tracking-widest text-brand-800">{state.code}</p>
        </div>
      )}

      <SubmitButton className="btn-primary w-full" pendingText={t("redeeming")}>
        {t("redeemSubmit")}
      </SubmitButton>
    </form>
  );
}

function AdjustForm({ customerId, pointsName }: { customerId: string; pointsName: string }) {
  const t = useTranslations("pointsPanel");
  const action = adjustPointsAction.bind(null, customerId);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-4" key={state?.ok ? "ok" : "form"}>
      <div>
        <label className="label">{t("adjustLabel", { points: pointsName })}</label>
        <input className="input" name="points" type="number" step="1" placeholder={t("adjustPlaceholder")} />
        <p className="mt-1 text-xs text-gray-500">
          {t("adjustHint", { points: pointsName })}
        </p>
      </div>
      <div>
        <label className="label">{t("reasonOptional")}</label>
        <input className="input" name="note" placeholder={t("reasonPlaceholder")} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">{t("adjustDone")}</p>}

      <SubmitButton className="btn-secondary w-full" pendingText={t("applying")}>
        {t("adjustSubmit")}
      </SubmitButton>
    </form>
  );
}
