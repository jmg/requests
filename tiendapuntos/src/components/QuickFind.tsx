"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findCustomerAction } from "@/lib/actions/customers";

// Búsqueda rápida de cliente para cargar puntos en el mostrador.
export function QuickFind() {
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setError(null);
    start(async () => {
      const res = await findCustomerAction(q);
      if (res.id) {
        router.push(`/dashboard/customers/${res.id}`);
      } else {
        // Sin coincidencia única: mandamos al listado filtrado.
        router.push(`/dashboard/customers?q=${encodeURIComponent(q.trim())}`);
        setError("No hubo una coincidencia exacta, revisá los resultados.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">⚡ Carga rápida</p>
        <p className="text-xs text-gray-500">
          Buscá un cliente por teléfono, nombre o email para sumarle puntos.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          className="input sm:w-64"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Teléfono del cliente…"
        />
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {error && <p className="text-xs text-amber-600 sm:hidden">{error}</p>}
    </form>
  );
}
