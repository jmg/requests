"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { findCustomerAction } from "@/lib/actions/customers";

// Búsqueda rápida de cliente para cargar puntos en el mostrador.
export function QuickFind() {
  const t = useTranslations("quickFind");
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
        setError(t("noMatch"));
      }
    });
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{t("title")}</p>
        <p className="text-xs text-gray-500">{t("subtitle")}</p>
      </div>
      <div className="flex gap-2">
        <input
          className="input sm:w-64"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
        />
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("searching") : t("search")}
        </button>
      </div>
      {error && <p className="text-xs text-amber-600 sm:hidden">{error}</p>}
    </form>
  );
}
