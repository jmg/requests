"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function RegisterPage() {
  const t = useTranslations("register");
  const [state, formAction] = useFormState(registerAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-4">
        <Link href="/">
          <Logo className="text-2xl" />
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="businessName">
              {t("businessName")}
            </label>
            <input
              className="input"
              id="businessName"
              name="businessName"
              placeholder={t("businessNamePlaceholder")}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="name">
              {t("yourName")}
            </label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="email">
              {t("email")}
            </label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t("password")}
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500">{t("passwordHint")}</p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton className="btn-primary w-full" pendingText={t("submitting")}>
            {t("submit")}
          </SubmitButton>
        </form>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
