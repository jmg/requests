"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { updateBusinessAction } from "@/lib/actions/settings";
import { SubmitButton } from "@/components/SubmitButton";

type Business = {
  name: string;
  pointsName: string;
  pointsPerCurrency: number;
  currency: string;
  brandColor: string;
  logoEmoji: string;
};

export function BusinessSettingsForm({ business }: { business: Business }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useFormState(updateBusinessAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">{t("businessName")}</label>
        <input className="input" name="name" defaultValue={business.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t("pointsName")}</label>
          <input className="input" name="pointsName" defaultValue={business.pointsName} required />
          <p className="mt-1 text-xs text-gray-500">{t("pointsNameHint")}</p>
        </div>
        <div>
          <label className="label">{t("currency")}</label>
          <input
            className="input"
            name="currency"
            defaultValue={business.currency}
            maxLength={5}
            required
          />
        </div>
        <div>
          <label className="label">{t("pointsPerUnit")}</label>
          <input
            className="input"
            name="pointsPerCurrency"
            type="number"
            min="0"
            step="0.01"
            defaultValue={business.pointsPerCurrency}
            required
          />
          <p className="mt-1 text-xs text-gray-500">{t("pointsPerUnitHint")}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("brandingTitle")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t("brandColor")}</label>
            <input
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300"
              name="brandColor"
              type="color"
              defaultValue={business.brandColor}
            />
          </div>
          <div>
            <label className="label">{t("brandIcon")}</label>
            <input
              className="input"
              name="logoEmoji"
              defaultValue={business.logoEmoji}
              maxLength={4}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {t("brandingHint")}
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-brand-700">{t("saved")}</p>}

      <SubmitButton pendingText={tc("saving")}>{t("saveConfig")}</SubmitButton>
    </form>
  );
}
