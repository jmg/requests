"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createTierAction, deleteTierAction } from "@/lib/actions/tiers";
import { SubmitButton } from "@/components/SubmitButton";
import { TierBadge } from "@/components/TierBadge";

type Tier = {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
  color: string;
};

export function TiersManager({ tiers }: { tiers: Tier[] }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createTierAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <div className="space-y-5">
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noTiers")}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sorted.map((tier) => {
            const del = async () => {
              await deleteTierAction(tier.id);
            };
            return (
              <li key={tier.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <TierBadge name={tier.name} color={tier.color} />
                  <span className="text-sm text-gray-500">
                    {t("tierThresholdValue", { points: tier.threshold })} ·{" "}
                    {t("tierMultiplierValue", { value: tier.multiplier })}
                  </span>
                </div>
                <form action={del}>
                  <button className="text-sm text-red-600 hover:underline" type="submit">
                    {tc("delete")}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="border-t border-gray-100 pt-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">{t("tierName")}</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="label">{t("tierThreshold")}</label>
            <input className="input" name="threshold" type="number" min="0" step="1" defaultValue={0} />
          </div>
          <div>
            <label className="label">{t("tierMultiplier")}</label>
            <input
              className="input"
              name="multiplier"
              type="number"
              min="1"
              step="0.1"
              defaultValue={1}
            />
          </div>
          <div>
            <label className="label">{t("tierColor")}</label>
            <input
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300"
              name="color"
              type="color"
              defaultValue="#64748b"
            />
          </div>
        </div>

        {state?.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="mt-3">
          <SubmitButton>{t("addTier")}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
