"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { createCustomerAction } from "@/lib/actions/customers";
import { SubmitButton } from "@/components/SubmitButton";

export default function NewCustomerPage() {
  const [state, formAction] = useFormState(createCustomerAction, undefined);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:underline">
          ← Volver a clientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo cliente</h1>
      </div>

      <form action={formAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Nombre y apellido *
          </label>
          <input className="input" id="name" name="name" required autoFocus />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">
              Teléfono
            </label>
            <input className="input" id="phone" name="phone" placeholder="+54 11 …" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Notas
          </label>
          <textarea className="input" id="notes" name="notes" rows={3} />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/customers" className="btn-secondary">
            Cancelar
          </Link>
          <SubmitButton pendingText="Guardando…">Crear cliente</SubmitButton>
        </div>
      </form>
    </div>
  );
}
