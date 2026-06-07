"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/">
        <Logo className="mb-8 text-2xl" />
      </Link>
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">Administrá los puntos de tus clientes</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input className="input" id="password" name="password" type="password" required />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton className="btn-primary w-full" pendingText="Ingresando…">
            Ingresar
          </SubmitButton>
        </form>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Creá una gratis
        </Link>
      </p>
    </div>
  );
}
