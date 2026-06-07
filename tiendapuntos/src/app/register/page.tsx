"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <Link href="/">
        <Logo className="mb-8 text-2xl" />
      </Link>
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Empezá tu programa de fidelización en minutos
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="businessName">
              Nombre del negocio
            </label>
            <input
              className="input"
              id="businessName"
              name="businessName"
              placeholder="Ej: Café Central"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="name">
              Tu nombre
            </label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton className="btn-primary w-full" pendingText="Creando cuenta…">
            Crear cuenta
          </SubmitButton>
        </form>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
