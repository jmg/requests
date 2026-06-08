import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { formatNumber, formatDate, intlLocale } from "@/lib/utils";
import { currentTier, nextTier } from "@/lib/tiers";
import { PointsPanel } from "@/components/customer/PointsPanel";
import { ConfirmButton } from "@/components/ConfirmButton";
import { TierBadge } from "@/components/TierBadge";
import { BirthdayBonusButton } from "@/components/customer/BirthdayBonusButton";
import { CopyField } from "@/components/CopyField";
import { renderNote } from "@/lib/tx-note";
import { expireStalePoints } from "@/lib/expire";

const txCls: Record<string, string> = {
  EARN: "bg-brand-100 text-brand-700",
  REDEEM: "bg-amber-100 text-amber-700",
  ADJUST: "bg-gray-100 text-gray-600",
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const t = await getTranslations("customers");
  const tc = await getTranslations("common");
  const tt = await getTranslations("txType");
  const tr = await getTranslations("redemptionStatus");
  const tn = await getTranslations("txNote");
  const locale = await getLocale();
  const session = (await getSession())!;

  // Aplica el vencimiento por inactividad antes de mostrar el saldo.
  await expireStalePoints(params.id, session.businessId);

  const [customer, business, rewards] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: params.id, businessId: session.businessId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 50, include: { user: true } },
        redemptions: { orderBy: { createdAt: "desc" }, take: 20 },
        referredBy: { select: { name: true } },
        _count: { select: { referrals: true } },
      },
    }),
    prisma.business.findUnique({
      where: { id: session.businessId },
      include: { tiers: true },
    }),
    prisma.reward.findMany({
      where: { businessId: session.businessId },
      orderBy: { pointsCost: "asc" },
    }),
  ]);

  if (!customer || !business) notFound();

  const pointsName = business.pointsName;
  const deleteAction = deleteCustomerAction.bind(null, customer.id);

  const tier = currentTier(business.tiers, customer.lifetimePoints);
  const next = nextTier(business.tiers, customer.lifetimePoints);
  const birthdayText = customer.birthday
    ? new Intl.DateTimeFormat(intlLocale(locale), { day: "2-digit", month: "long" }).format(
        customer.birthday
      )
    : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:underline">
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            {tier && <TierBadge name={tier.name} color={tier.color} />}
          </div>
          <p className="text-sm text-gray-500">
            {[customer.phone, customer.email].filter(Boolean).join(" · ") || t("noContact")}
          </p>
          {customer.notes && <p className="mt-1 text-sm text-gray-400">{customer.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${customer.id}/edit`} className="btn-secondary">
            {tc("edit")}
          </Link>
          {session.role !== "STAFF" && (
            <ConfirmButton
              action={deleteAction}
              confirm={t("confirmDelete")}
              pendingText={t("deleting")}
            >
              {tc("delete")}
            </ConfirmButton>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card bg-brand-600 text-white">
            <p className="text-sm text-brand-100">{t("currentBalance")}</p>
            <p className="mt-1 text-4xl font-extrabold">{formatNumber(customer.points, locale)}</p>
            <p className="text-sm text-brand-100">{pointsName}</p>
            <p className="mt-2 text-xs text-brand-100">
              {t("lifetime", { points: formatNumber(customer.lifetimePoints, locale) })}
            </p>
            {next && (
              <p className="text-xs text-brand-100">
                {t("nextTier", {
                  points: formatNumber(next.threshold - customer.lifetimePoints, locale),
                  tier: next.name,
                })}
              </p>
            )}
          </div>

          {/* Referidos y cumpleaños */}
          <div className="card space-y-3">
            <div>
              <p className="text-sm font-semibold">{t("referralTitle")}</p>
              <p className="mb-2 text-xs text-gray-500">{t("referralCodeLabel")}</p>
              <CopyField value={customer.referralCode} />
            </div>
            <p className="text-sm text-gray-600">
              {t("referredCount", { count: customer._count.referrals })}
              {customer.referredBy && (
                <> · {t("referredBy", { name: customer.referredBy.name })}</>
              )}
            </p>
            {birthdayText && (
              <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <span className="text-sm text-gray-600">
                  🎂 {t("birthdayLabel", { date: birthdayText })}
                </span>
                {business.birthdayBonus > 0 && <BirthdayBonusButton customerId={customer.id} />}
              </div>
            )}
          </div>

          <PointsPanel
            customerId={customer.id}
            pointsName={pointsName}
            currency={business.currency}
            pointsPerCurrency={business.pointsPerCurrency}
            rewards={rewards}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          {customer.redemptions.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold">{t("redemptionsTitle")}</h2>
              <ul className="divide-y divide-gray-100">
                {customer.redemptions.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{r.rewardName}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(r.createdAt)} · {t("codeLabel", { code: r.code })}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        r.status === "FULFILLED"
                          ? "bg-brand-100 text-brand-700"
                          : r.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status === "FULFILLED"
                        ? tr("FULFILLED")
                        : r.status === "CANCELLED"
                        ? tr("CANCELLED")
                        : tr("PENDING")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">{t("historyTitle", { points: pointsName })}</h2>
            {customer.transactions.length === 0 ? (
              <p className="text-sm text-gray-500">{t("noMovements")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {customer.transactions.map((tx) => {
                  const label = tt(tx.type);
                  return (
                    <li key={tx.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`badge ${txCls[tx.type] ?? ""}`}>{label}</span>
                        <div className="text-sm">
                          <p className="text-gray-700">{renderNote(tx.note, tn) || label}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(tx.createdAt)}
                            {tx.user ? ` · ${tx.user.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          tx.points >= 0 ? "text-brand-700" : "text-red-600"
                        }`}
                      >
                        {tx.points >= 0 ? "+" : ""}
                        {formatNumber(tx.points)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
