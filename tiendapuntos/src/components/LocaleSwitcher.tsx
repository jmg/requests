"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/actions/locale";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const [pending, start] = useTransition();
  const router = useRouter();

  const switchTo = (next: "es" | "en") => {
    if (next === locale || pending) return;
    start(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <div className={`inline-flex overflow-hidden rounded-lg border border-gray-300 text-xs ${className}`}>
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          className={`px-2.5 py-1 font-medium uppercase transition ${
            locale === l ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
