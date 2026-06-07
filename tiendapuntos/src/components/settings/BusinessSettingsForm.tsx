"use client";

import { useFormState } from "react-dom";
import { updateBusinessAction } from "@/lib/actions/settings";
import { SubmitButton } from "@/components/SubmitButton";

type Business = {
  name: string;
  pointsName: string;
  pointsPerCurrency: number;
  currency: string;
};

export function BusinessSettingsForm({ business }: { business: Business }) {
  const [state, formAction] = useFormState(updateBusinessAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">Nombre del negocio</label>
        <input className="input" name="name" defaultValue={business.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Nombre de los puntos</label>
          <input className="input" name="pointsName" defaultValue={business.pointsName} required />
          <p className="mt-1 text-xs text-gray-500">Ej: puntos, estrellas, monedas.</p>
        </div>
        <div>
          <label className="label">Moneda</label>
          <input
            className="input"
            name="currency"
            defaultValue={business.currency}
            maxLength={5}
            required
          />
        </div>
        <div>
          <label className="label">Puntos por unidad</label>
          <input
            className="input"
            name="pointsPerCurrency"
            type="number"
            min="0"
            step="0.01"
            defaultValue={business.pointsPerCurrency}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Puntos otorgados por cada $1.</p>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-brand-700">Configuración guardada ✅</p>}

      <SubmitButton pendingText="Guardando…">Guardar configuración</SubmitButton>
    </form>
  );
}
