"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createRewardAction, updateRewardAction } from "@/lib/actions/rewards";
import { SubmitButton } from "@/components/SubmitButton";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number | null;
  active: boolean;
};

export function RewardForm({
  reward,
  pointsName,
  onDone,
}: {
  reward?: Reward;
  pointsName: string;
  onDone?: string; // ruta a la que redirigir al guardar (modo edición)
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(reward);

  const action = isEdit
    ? updateRewardAction.bind(null, reward!.id)
    : createRewardAction;
  const [state, formAction] = useFormState(action, undefined);

  useEffect(() => {
    if (state?.ok) {
      if (onDone) router.push(onDone);
      else formRef.current?.reset();
    }
  }, [state, onDone, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="label">Nombre del premio *</label>
        <input className="input" name="name" defaultValue={reward?.name} required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input" name="description" rows={2} defaultValue={reward?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Costo en {pointsName} *</label>
          <input
            className="input"
            name="pointsCost"
            type="number"
            min="1"
            step="1"
            defaultValue={reward?.pointsCost}
            required
          />
        </div>
        <div>
          <label className="label">Stock</label>
          <input
            className="input"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={reward?.stock ?? ""}
            placeholder="Ilimitado"
          />
          <p className="mt-1 text-xs text-gray-500">Dejá vacío para stock ilimitado.</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={reward ? reward.active : true}
          className="h-4 w-4 rounded border-gray-300"
        />
        Activo (visible para canje)
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && !onDone && <p className="text-sm text-brand-700">¡Premio creado! ✅</p>}

      <SubmitButton pendingText="Guardando…">
        {isEdit ? "Guardar cambios" : "Crear premio"}
      </SubmitButton>
    </form>
  );
}
