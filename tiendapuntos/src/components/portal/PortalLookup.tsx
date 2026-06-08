"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { lookupCustomerAction } from "@/lib/actions/portal";
import { SubmitButton } from "@/components/SubmitButton";

export function PortalLookup({
  slug,
  pointsName,
  brandColor,
}: {
  slug: string;
  pointsName: string;
  brandColor: string;
}) {
  const t = useTranslations("portal");
  const ts = useTranslations("redemptionStatus");
  const action = lookupCustomerAction.bind(null, slug);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="phone"
          className="input flex-1"
          placeholder={t("phonePlaceholder")}
          required
        />
        <SubmitButton
          className="btn text-white"
          style={{ backgroundColor: brandColor }}
          pendingText={t("searching")}
        >
          {t("lookup", { points: pointsName })}
        </SubmitButton>
      </form>

      {state && !state.ok && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      {state?.ok && (
        <div className="mt-6 space-y-5">
          <div
            className="rounded-xl p-6 text-center text-white"
            style={{ backgroundColor: brandColor }}
          >
            <p className="text-sm opacity-90">{t("greeting", { name: state.customer.name })}</p>
            <p className="mt-1 text-5xl font-extrabold">{state.customer.points}</p>
            <p className="text-sm opacity-90">{t("pointsAvailable", { points: pointsName })}</p>
            {state.customer.tier && (
              <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                {t("yourTier")}: ★ {state.customer.tier.name}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500">{t("yourReferralCode")}</p>
            <p className="my-1 text-2xl font-bold tracking-widest" style={{ color: brandColor }}>
              {state.customer.referralCode}
            </p>
            <p className="text-xs text-gray-400">{t("shareReferral")}</p>
          </div>

          {state.redemptions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t("yourRedemptions")}</h3>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {state.redemptions.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{r.rewardName}</p>
                      <p className="text-xs text-gray-400">{t("code", { code: r.code })}</p>
                    </div>
                    <span className="text-xs text-gray-500">{ts(r.status)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
