"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startUpgradeAction, cancelSubscriptionAction } from "@/lib/actions/billing";

export function UpgradeButton({ className }: { className: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await startUpgradeAction();
            if (res.error) return setError(res.error);
            if (res.url) {
              window.location.href = res.url; // Checkout de Stripe
              return;
            }
            router.refresh(); // modo simulado
          })
        }
      >
        {pending ? "Procesando…" : "Mejorar a Pro"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function DowngradeButton({ className }: { className: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (!window.confirm("¿Volver al plan Free? Se aplicarán los límites del plan.")) return;
        start(async () => {
          await cancelSubscriptionAction();
          router.refresh();
        });
      }}
    >
      {pending ? "Procesando…" : "Cambiar a Free"}
    </button>
  );
}
