"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { createCampaignAction } from "@/lib/actions/campaigns";
import { SubmitButton } from "@/components/SubmitButton";
import { SEGMENTS } from "@/lib/segments-shared";

export function CampaignForm({ counts }: { counts: Record<string, number> }) {
  const t = useTranslations("campaigns");
  const [state, formAction] = useFormState(createCampaignAction, undefined);

  return (
    <form action={formAction} className="space-y-4" key={state?.ok ? "sent" : "form"}>
      <div>
        <label className="label">{t("segment")}</label>
        <select className="input" name="segment" defaultValue="ALL">
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {t(`seg${s}`)} ({counts[s] ?? 0})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t("message")}</label>
        <textarea
          className="input"
          name="message"
          rows={4}
          placeholder={t("messagePlaceholder")}
          required
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {t("sentOk", { count: state.count ?? 0 })}
        </p>
      )}

      <SubmitButton pendingText={t("sending")}>{t("send")}</SubmitButton>
      <p className="text-xs text-gray-400">{t("note")}</p>
    </form>
  );
}
