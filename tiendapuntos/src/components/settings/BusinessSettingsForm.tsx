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
  referrerBonus: number;
  refereeBonus: number;
  birthdayBonus: number;
  welcomeBonus: number;
  pointsExpireDays: number | null;
  portalEnabled: boolean;
  contactPhone: string | null;
  address: string | null;
  website: string | null;
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

      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("loyaltyTitle")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t("referrerBonus")}</label>
            <input
              className="input"
              name="referrerBonus"
              type="number"
              min="0"
              step="1"
              defaultValue={business.referrerBonus}
            />
          </div>
          <div>
            <label className="label">{t("refereeBonus")}</label>
            <input
              className="input"
              name="refereeBonus"
              type="number"
              min="0"
              step="1"
              defaultValue={business.refereeBonus}
            />
          </div>
          <div>
            <label className="label">{t("birthdayBonus")}</label>
            <input
              className="input"
              name="birthdayBonus"
              type="number"
              min="0"
              step="1"
              defaultValue={business.birthdayBonus}
            />
          </div>
          <div>
            <label className="label">{t("welcomeBonus")}</label>
            <input
              className="input"
              name="welcomeBonus"
              type="number"
              min="0"
              step="1"
              defaultValue={business.welcomeBonus}
            />
          </div>
          <div>
            <label className="label">{t("pointsExpire")}</label>
            <input
              className="input"
              name="pointsExpireDays"
              type="number"
              min="1"
              step="1"
              placeholder={t("pointsExpireNever")}
              defaultValue={business.pointsExpireDays ?? ""}
            />
            <p className="mt-1 text-xs text-gray-500">{t("pointsExpireHint")}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("portalSection")}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="portalEnabled"
            defaultChecked={business.portalEnabled}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t("portalEnabled")}
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t("contactPhone")}</label>
            <input className="input" name="contactPhone" defaultValue={business.contactPhone ?? ""} />
          </div>
          <div>
            <label className="label">{t("address")}</label>
            <input className="input" name="address" defaultValue={business.address ?? ""} />
          </div>
          <div>
            <label className="label">{t("website")}</label>
            <input
              className="input"
              name="website"
              placeholder="https://…"
              defaultValue={business.website ?? ""}
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-brand-700">{t("saved")}</p>}

      <SubmitButton pendingText={tc("saving")}>{t("saveConfig")}</SubmitButton>
    </form>
  );
}
