"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { birthdayBonusAction } from "@/lib/actions/points";

export function BirthdayBonusButton({ customerId }: { customerId: string }) {
  const t = useTranslations("customers");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        className="btn-secondary px-3 py-1 text-xs"
        disabled={pending || done}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await birthdayBonusAction(customerId);
            if (res?.error) return setError(res.error);
            setDone(true);
            router.refresh();
          })
        }
      >
        {done ? t("birthdayBonusApplied") : pending ? "…" : t("applyBirthdayBonus")}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
