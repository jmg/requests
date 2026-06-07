import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, planConfig } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";
import { formatNumber, formatDate } from "@/lib/utils";
import { UpgradeButton, DowngradeButton } from "@/components/billing/BillingActions";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {formatNumber(used)} / {limit === null ? "∞" : formatNumber(limit)}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const t = await getTranslations("billing");
  const tp = await getTranslations("plans");
  const session = (await getSession())!;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return null;

  const isStaff = session.role === "STAFF";
  const current = planConfig(business.plan);
  const stripeOn = stripeEnabled();

  // Datos de presentación de cada plan, traducidos (la lógica/los límites
  // siguen viniendo de PLANS en lib/plans.ts).
  const planDisplay = {
    FREE: {
      name: tp("freeName"),
      price: tp("freePrice"),
      detail: t("forever"),
      features: [tp("free1"), tp("free2"), tp("free3"), tp("free4")],
    },
    PRO: {
      name: tp("proName"),
      price: tp("proPrice"),
      detail: t("perMonth"),
      features: [tp("pro1"), tp("pro2"), tp("pro3"), tp("pro4"), tp("pro5"), tp("pro6")],
    },
  } as const;

  const [customerCount, rewardCount, teamCount] = await Promise.all([
    prisma.customer.count({ where: { businessId: business.id } }),
    prisma.reward.count({ where: { businessId: business.id } }),
    prisma.user.count({ where: { businessId: business.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-500">
          {t("currentPlan", {
            plan: planDisplay[business.plan].name,
            date: formatDate(business.planSince),
          })}
        </p>
      </div>

      {searchParams.success && (
        <div className="card bg-brand-50 text-sm text-brand-800">{t("successMsg")}</div>
      )}
      {searchParams.canceled && (
        <div className="card bg-amber-50 text-sm text-amber-800">{t("canceledMsg")}</div>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">{t("usage")}</h2>
        <UsageBar label={t("usageCustomers")} used={customerCount} limit={current.customerLimit} />
        <UsageBar label={t("usageRewards")} used={rewardCount} limit={current.rewardLimit} />
        <UsageBar label={t("usageTeam")} used={teamCount} limit={current.teamLimit} />
      </div>

      {isStaff && <div className="card text-sm text-gray-500">{t("staffNote")}</div>}

      <div className="grid gap-5 sm:grid-cols-2">
        {Object.values(PLANS).map((p) => {
          const isCurrent = p.id === business.plan;
          const d = planDisplay[p.id];
          return (
            <div
              key={p.id}
              className={`card flex flex-col ${isCurrent ? "ring-2 ring-brand-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{d.name}</h3>
                {isCurrent && <span className="badge bg-brand-100 text-brand-700">{t("yourPlan")}</span>}
              </div>
              <p className="mt-2">
                <span className="text-3xl font-extrabold">{d.price}</span>{" "}
                <span className="text-sm text-gray-500">{d.detail}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
                {d.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!isStaff && (
                <div className="mt-5">
                  {isCurrent ? (
                    <button className="btn-secondary w-full" disabled>
                      {t("currentButton")}
                    </button>
                  ) : p.id === "PRO" ? (
                    <UpgradeButton className="btn-primary w-full" />
                  ) : (
                    <DowngradeButton className="btn-secondary w-full" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">{stripeOn ? t("stripeOn") : t("stripeOff")}</p>
    </div>
  );
}
