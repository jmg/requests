import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate } from "@/lib/utils";

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const t = await getTranslations("customers");
  const tc = await getTranslations("common");
  const tt = await getTranslations("transactions");
  const locale = await getLocale();
  const session = (await getSession())!;
  const q = searchParams.q?.trim() || "";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const where = {
    businessId: session.businessId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

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
                  <td className="px-4 py-3 text-gray-500">{c.phone || c.email || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-700">
                    {formatNumber(c.points, locale)}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/dashboard/customers${qs(page - 1)}`}
            className={`btn-secondary ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            {tt("prev")}
          </Link>
          <span className="text-gray-500">{tt("page", { page, total: totalPages })}</span>
          <Link
            href={`/dashboard/customers${qs(page + 1)}`}
            className={`btn-secondary ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            {tt("next")}
          </Link>
        </div>
      )}
    </div>
  );
}
