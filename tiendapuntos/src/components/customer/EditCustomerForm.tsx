"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updateCustomerAction } from "@/lib/actions/customers";
import { SubmitButton } from "@/components/SubmitButton";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  const action = updateCustomerAction.bind(null, customer.id);
  const [state, formAction] = useFormState(action, undefined);

  useEffect(() => {
    if (state?.ok) router.push(`/dashboard/customers/${customer.id}`);
  }, [state, router, customer.id]);

  return (
    <form action={formAction} className="card space-y-4">
      <div>
        <label className="label" htmlFor="name">
          {t("fullName")} *
        </label>
        <input className="input" id="name" name="name" defaultValue={customer.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">
            {t("phone")}
          </label>
          <input className="input" id="phone" name="phone" defaultValue={customer.phone ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {t("email")}
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            defaultValue={customer.email ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">
          {t("notes")}
        </label>
        <textarea className="input" id="notes" name="notes" rows={3} defaultValue={customer.notes ?? ""} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/customers/${customer.id}`} className="btn-secondary">
          {tc("cancel")}
        </Link>
        <SubmitButton pendingText={tc("saving")}>{tc("saveChanges")}</SubmitButton>
      </div>
    </form>
  );
}
