import { getTranslations, getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { segmentCounts } from "@/lib/segments";
import { formatNumber, formatDate } from "@/lib/utils";
import { CampaignForm } from "@/components/campaigns/CampaignForm";

export default async function CampaignsPage() {
  const t = await getTranslations("campaigns");
  const locale = await getLocale();
  const session = (await getSession())!;
  const isStaff = session.role === "STAFF";

  if (isStaff) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="card text-sm text-gray-500">{t("staffNote")}</div>
      </div>
    );
  }

  const [counts, campaigns] = await Promise.all([
    segmentCounts(session.businessId),
    prisma.campaign.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <CampaignForm counts={counts} />
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">{t("history")}</h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">{t("empty")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {campaigns.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="badge bg-gray-100 text-gray-600">{t(`seg${c.segment}`)}</span>
                    <span className="text-gray-500">
                      {t("recipients", { count: formatNumber(c.recipientCount, locale) })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{c.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(c.createdAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
