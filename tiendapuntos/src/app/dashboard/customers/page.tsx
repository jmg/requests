import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const t = await getTranslations("customers");
  const tc = await getTranslations("common");
  const session = (await getSession())!;
  const q = searchParams.q?.trim() || "";

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const customers = await prisma.customer.findMany({
    where: {
      businessId: session.businessId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/dashboard/customers/new" className="btn-primary">
          {t("new")}
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="input max-w-md"
        />
        <button type="submit" className="btn-secondary">
          {tc("search")}
        </button>
        {q && (
          <Link href="/dashboard/customers" className="btn-secondary">
            {tc("clear")}
          </Link>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        {customers.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {q ? t("emptyFiltered") : t("empty")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("colCustomer")}</th>
                <th className="px-4 py-3">{t("colContact")}</th>
                <th className="px-4 py-3 text-right">{pointsName}</th>
                <th className="px-4 py-3">{t("colCreated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-medium text-gray-900 hover:text-brand-700"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-700">
                    {formatNumber(c.points)}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
