import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate, formatCurrency } from "@/lib/utils";
import { renderNote } from "@/lib/tx-note";

const PAGE_SIZE = 50;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const tt = await getTranslations("transactions");
  const tType = await getTranslations("txType");
  const tn = await getTranslations("txNote");
  const locale = await getLocale();
  const txMeta: Record<string, { label: string; cls: string }> = {
    EARN: { label: tType("EARN"), cls: "bg-brand-100 text-brand-700" },
    REDEEM: { label: tType("REDEEM"), cls: "bg-amber-100 text-amber-700" },
    ADJUST: { label: tType("ADJUST"), cls: "bg-gray-100 text-gray-600" },
  };

  const session = (await getSession())!;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const currency = business?.currency ?? "ARS";

  const [transactions, total] = await Promise.all([
    prisma.pointsTransaction.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true, user: true },
    }),
    prisma.pointsTransaction.count({ where: { businessId: session.businessId } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tt("title")}</h1>
        <p className="text-sm text-gray-500">{tt("count", { count: formatNumber(total, locale) })}</p>
      </div>

      <div className="card overflow-hidden p-0">
        {transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">{tt("empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{tt("colDate")}</th>
                <th className="px-4 py-3">{tt("colCustomer")}</th>
                <th className="px-4 py-3">{tt("colType")}</th>
                <th className="px-4 py-3">{tt("colDetail")}</th>
                <th className="px-4 py-3">{tt("colBy")}</th>
                <th className="px-4 py-3 text-right">{tt("colPoints")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => {
                const meta = txMeta[t.type];
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                      {formatDate(t.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/customers/${t.customerId}`}
                        className="font-medium hover:text-brand-700"
                      >
                        {t.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {renderNote(t.note, tn) || "—"}
                      {t.amount ? (
                        <span className="text-gray-400"> · {formatCurrency(t.amount, currency, locale)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.user?.name ?? "—"}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        t.points >= 0 ? "text-brand-700" : "text-red-600"
                      }`}
                    >
                      {t.points >= 0 ? "+" : ""}
                      {formatNumber(t.points, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/dashboard/transactions?page=${page - 1}`}
            className={`btn-secondary ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            {tt("prev")}
          </Link>
          <span className="text-gray-500">
            {tt("page", { page, total: totalPages })}
          </span>
          <Link
            href={`/dashboard/transactions?page=${page + 1}`}
            className={`btn-secondary ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            {tt("next")}
          </Link>
        </div>
      )}
    </div>
  );
}
