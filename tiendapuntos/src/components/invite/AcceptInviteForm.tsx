"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { acceptInvitationAction } from "@/lib/actions/invitations";
import { SubmitButton } from "@/components/SubmitButton";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const t = useTranslations("invite");
  const action = acceptInvitationAction.bind(null, token);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="label">{t("email")}</label>
        <input className="input bg-gray-50" value={email} disabled readOnly />
      </div>
      <div>
        <label className="label" htmlFor="name">
          {t("yourName")}
        </label>
        <input className="input" id="name" name="name" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t("choosePassword")}
        </label>
        <input className="input" id="password" name="password" type="password" minLength={6} required />
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
