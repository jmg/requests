"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function LoginPage() {
  const t = useTranslations("login");
  const [justReset, setJustReset] = useState(false);
  const [state, formAction] = useFormState(loginAction, undefined);

  useEffect(() => {
    setJustReset(new URLSearchParams(window.location.search).get("reset") === "1");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 flex flex-col items-center gap-4">
        <Link href="/">
          <Logo className="text-2xl" />
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>

        {justReset && (
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {t("resetDone")}
          </p>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              {t("email")}
            </label>
            <input className="input" id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t("password")}
            </label>
            <input className="input" id="password" name="password" type="password" required />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton className="btn-primary w-full" pendingText={t("submitting")}>
            {t("submit")}
          </SubmitButton>
        </form>

        <Link
          href="/forgot"
          className="mt-4 block text-center text-sm text-brand-600 hover:underline"
        >
          {t("forgot")}
        </Link>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          {t("createFree")}
        </Link>
      </p>
    </div>
  );
}
