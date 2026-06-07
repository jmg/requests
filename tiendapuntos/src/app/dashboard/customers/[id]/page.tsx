import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { formatNumber, formatDate } from "@/lib/utils";
import { PointsPanel } from "@/components/customer/PointsPanel";
import { ConfirmButton } from "@/components/ConfirmButton";

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
  const session = (await getSession())!;

  const [customer, business, rewards] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: params.id, businessId: session.businessId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 50, include: { user: true } },
        redemptions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.reward.findMany({
      where: { businessId: session.businessId },
      orderBy: { pointsCost: "asc" },
    }),
  ]);

  if (!customer || !business) notFound();

  const pointsName = business.pointsName;
  const deleteAction = deleteCustomerAction.bind(null, customer.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:underline">
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-gray-500">
            {[customer.phone, customer.email].filter(Boolean).join(" · ") || t("noContact")}
          </p>
          {customer.notes && <p className="mt-1 text-sm text-gray-400">{customer.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${customer.id}/edit`} className="btn-secondary">
            {tc("edit")}
          </Link>
          <ConfirmButton
            action={deleteAction}
            confirm={t("confirmDelete")}
            pendingText={t("deleting")}
          >
            {tc("delete")}
          </ConfirmButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card bg-brand-600 text-white">
            <p className="text-sm text-brand-100">{t("currentBalance")}</p>
            <p className="mt-1 text-4xl font-extrabold">{formatNumber(customer.points)}</p>
            <p className="text-sm text-brand-100">{pointsName}</p>
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
                          <p className="text-gray-700">{tx.note || label}</p>
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
