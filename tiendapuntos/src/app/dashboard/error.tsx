"use client";

import { useTranslations } from "next-intl";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-4xl">😕</p>
      <p className="text-lg font-semibold">{t("error")}</p>
      <button type="button" className="btn-primary" onClick={() => reset()}>
        {t("retry")}
      </button>
    </div>
  );
}
