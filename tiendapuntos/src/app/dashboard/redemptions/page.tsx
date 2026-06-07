import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillRedemptionAction, cancelRedemptionAction } from "@/lib/actions/redemptions";
import { formatNumber, formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const t = await getTranslations("redemptions");
  const ts = await getTranslations("redemptionStatus");
  const statusMeta: Record<string, { label: string; cls: string }> = {
    PENDING: { label: ts("PENDING"), cls: "bg-amber-100 text-amber-700" },
    FULFILLED: { label: ts("FULFILLED"), cls: "bg-brand-100 text-brand-700" },
    CANCELLED: { label: ts("CANCELLED"), cls: "bg-red-100 text-red-700" },
  };

  const session = (await getSession())!;
  const status = searchParams.status;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const redemptions = await prisma.redemption.findMany({
    where: {
      businessId: session.businessId,
      ...(status === "PENDING" || status === "FULFILLED" || status === "CANCELLED"
        ? { status }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true },
  });

  const filters = [
    { key: "", label: t("filterAll") },
    { key: "PENDING", label: t("filterPending") },
    { key: "FULFILLED", label: t("filterFulfilled") },
    { key: "CANCELLED", label: t("filterCancelled") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key ? `/dashboard/redemptions?status=${f.key}` : "/dashboard/redemptions"}
              className={`badge border ${
                active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden p-0">
        {redemptions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">{t("empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("colCode")}</th>
                <th className="px-4 py-3">{t("colCustomer")}</th>
                <th className="px-4 py-3">{t("colReward")}</th>
                <th className="px-4 py-3 text-right">{pointsName}</th>
                <th className="px-4 py-3">{t("colStatus")}</th>
                <th className="px-4 py-3">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {redemptions.map((r) => {
                const fulfill = fulfillRedemptionAction.bind(null, r.id);
                const cancel = cancelRedemptionAction.bind(null, r.id);
                const meta = statusMeta[r.status];
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold tracking-wider">{r.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/customers/${r.customerId}`}
                        className="font-medium hover:text-brand-700"
                      >
                        {r.customer.name}
                      </Link>
                      <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">{r.rewardName}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(r.pointsCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <form action={fulfill}>
                            <button className="btn-primary px-2.5 py-1 text-xs" type="submit">
                              {t("deliver")}
                            </button>
                          </form>
                          <ConfirmButton
                            action={cancel}
                            confirm={t("confirmCancel")}
                            className="btn-secondary px-2.5 py-1 text-xs"
                          >
                            {t("cancel")}
                          </ConfirmButton>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
