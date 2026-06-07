"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { createTeamMemberAction, deleteTeamMemberAction } from "@/lib/actions/settings";
import { SubmitButton } from "@/components/SubmitButton";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const roleLabels: Record<string, string> = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  STAFF: "Cajero",
};

export function TeamManager({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createTeamMemberAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-gray-100">
        {members.map((m) => {
          const del = async () => {
            await deleteTeamMemberAction(m.id);
          };
          return (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(vos)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-gray-100 text-gray-600">{roleLabels[m.role] ?? m.role}</span>
                {m.role !== "OWNER" && m.id !== currentUserId && (
                  <form
                    action={del}
                    onSubmit={(e) => {
                      if (!window.confirm(`¿Eliminar a ${m.name}?`)) e.preventDefault();
                    }}
                  >
                    <button className="text-sm text-red-600 hover:underline" type="submit">
                      Eliminar
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="mb-3 font-semibold">Agregar miembro</h3>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre</label>
              <input className="input" name="name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" name="email" type="email" required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" name="password" type="password" minLength={6} required />
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" name="role" defaultValue="STAFF">
                <option value="STAFF">Cajero (carga y canjea puntos)</option>
                <option value="ADMIN">Administrador (acceso total)</option>
              </select>
            </div>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          {state?.ok && <p className="text-sm text-brand-700">Miembro agregado ✅</p>}

          <SubmitButton pendingText="Agregando…">Agregar miembro</SubmitButton>
        </form>
      </div>
    </div>
  );
}
