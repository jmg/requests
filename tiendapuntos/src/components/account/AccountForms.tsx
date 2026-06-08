"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/account";
import { SubmitButton } from "@/components/SubmitButton";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations("account");
  const [state, formAction] = useFormState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">{t("email")}</label>
        <input className="input bg-gray-50" value={email} disabled readOnly />
      </div>
      <div>
        <label className="label" htmlFor="name">
          {t("name")}
        </label>
        <input className="input" id="name" name="name" defaultValue={name} required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-brand-700">{t("profileSaved")}</p>}

      <SubmitButton>{t("saveProfile")}</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("account");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(changePasswordAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="current">
          {t("currentPassword")}
        </label>
        <input className="input" id="current" name="current" type="password" required />
      </div>
      <div>
        <label className="label" htmlFor="next">
          {t("newPassword")}
        </label>
        <input className="input" id="next" name="next" type="password" minLength={6} required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-brand-700">{t("passwordChanged")}</p>}

      <SubmitButton>{t("changePassword")}</SubmitButton>
    </form>
  );
}
