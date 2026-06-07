"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startUpgradeAction, cancelSubscriptionAction } from "@/lib/actions/billing";

export function UpgradeButton({ className }: { className: string }) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
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
        {pending ? tc("processing") : t("upgrade")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function DowngradeButton({ className }: { className: string }) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("downgradeConfirm"))) return;
        start(async () => {
          await cancelSubscriptionAction();
          router.refresh();
        });
      }}
    >
      {pending ? tc("processing") : t("downgrade")}
    </button>
  );
}
