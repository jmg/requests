"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "@/lib/actions/password-reset";
import { SubmitButton } from "@/components/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("reset");
  const action = resetPasswordAction.bind(null, token);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">
          {t("newPassword")}
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
          autoFocus
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <SubmitButton className="btn-primary w-full" pendingText={t("submitting")}>
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
