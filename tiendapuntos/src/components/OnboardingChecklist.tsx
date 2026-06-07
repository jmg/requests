import Link from "next/link";
import { useTranslations } from "next-intl";

export type OnboardingStep = {
  done: boolean;
  label: string;
  desc: string;
  href: string;
  cta: string;
};

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const t = useTranslations("onboarding");
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="card border-brand-200 bg-brand-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-gray-600">{t("subtitle")}</p>
        </div>
        <span className="badge bg-brand-100 text-brand-700">
          {doneCount}/{steps.length}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                  s.done ? "bg-brand-600 text-white" : "border-2 border-gray-300 text-transparent"
                }`}
              >
                ✓
              </span>
              <div>
                <p className={`text-sm font-medium ${s.done ? "text-gray-400 line-through" : ""}`}>
                  {s.label}
                </p>
                {!s.done && <p className="text-xs text-gray-500">{s.desc}</p>}
              </div>
            </div>
            {!s.done && (
              <Link href={s.href} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
