"use client";

import { useFormState } from "react-dom";
import { lookupCustomerAction } from "@/lib/actions/portal";
import { SubmitButton } from "@/components/SubmitButton";

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  FULFILLED: "Entregado",
  CANCELLED: "Cancelado",
};

export function PortalLookup({
  slug,
  pointsName,
  brandColor,
}: {
  slug: string;
  pointsName: string;
  brandColor: string;
}) {
  const action = lookupCustomerAction.bind(null, slug);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="phone"
          className="input flex-1"
          placeholder="Tu teléfono (ej: +54 11 5555-1111)"
          required
        />
        <SubmitButton
          className="btn text-white"
          style={{ backgroundColor: brandColor }}
          pendingText="Buscando…"
        >
          Ver mis {pointsName}
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
            <p className="text-sm opacity-90">Hola {state.customer.name} 👋</p>
            <p className="mt-1 text-5xl font-extrabold">{state.customer.points}</p>
            <p className="text-sm opacity-90">{pointsName} disponibles</p>
          </div>

          {state.redemptions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Tus canjes</h3>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {state.redemptions.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{r.rewardName}</p>
                      <p className="text-xs text-gray-400">Código {r.code}</p>
                    </div>
                    <span className="text-xs text-gray-500">{statusLabels[r.status] ?? r.status}</span>
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
