"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/password-reset";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";
import { CopyField } from "@/components/CopyField";

export default function ForgotPage() {
  const t = useTranslations("forgot");
  const [state, formAction] = useFormState(requestPasswordResetAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/">
        <Logo className="mb-8 text-2xl" />
      </Link>
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>

        {state?.ok ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{t("sent")}</p>
            {state.link && (
              <div>
                <p className="mb-2 text-xs text-gray-500">{t("devLink")}</p>
                <CopyField value={state.link} />
              </div>
            )}
            <Link href="/login" className="btn-secondary mt-2">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                {t("email")}
              </label>
              <input className="input" id="email" name="email" type="email" required autoFocus />
            </div>
            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}
            <SubmitButton className="btn-primary w-full" pendingText={t("sending")}>
              {t("submit")}
            </SubmitButton>
          </form>
        )}
      </div>
      <Link href="/login" className="mt-6 text-sm text-brand-600 hover:underline">
        {t("backToLogin")}
      </Link>
    </div>
  );
}
