import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { PortalLookup } from "@/components/portal/PortalLookup";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  return { title: business ? `${business.name} — Puntos` : "Portal de puntos" };
}

export default async function PortalPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations("portal");
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) notFound();

  const rewards = business.portalEnabled
    ? await prisma.reward.findMany({
        where: { businessId: business.id, active: true },
        orderBy: { pointsCost: "asc" },
      })
    : [];

  const websiteHref = business.website
    ? business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-10 text-center text-white" style={{ backgroundColor: business.brandColor }}>
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
            {business.logoEmoji}
          </span>
          <h1 className="mt-4 text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm opacity-90">{t("subtitle", { points: business.pointsName })}</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-6 py-8">
        {!business.portalEnabled ? (
          <div className="card text-center text-sm text-gray-500">{t("portalDisabled")}</div>
        ) : (
          <>
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold">{t("myAccount")}</h2>
              <PortalLookup
                slug={business.slug}
                pointsName={business.pointsName}
                brandColor={business.brandColor}
              />
              {business.pointsExpireDays && (
                <p className="mt-3 text-xs text-gray-400">
                  {t("expiryNote", { points: business.pointsName, days: business.pointsExpireDays })}
                </p>
              )}
            </div>

            <div className="card">
              <h2 className="mb-3 text-lg font-semibold">{t("availableRewards")}</h2>
              {rewards.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noRewards")}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {rewards.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
                      </div>
                      <span
                        className="badge shrink-0 text-white"
                        style={{ backgroundColor: business.brandColor }}
                      >
                        {formatNumber(r.pointsCost)} {business.pointsName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {(business.contactPhone || business.address || websiteHref) && (
          <div className="card space-y-1 text-sm text-gray-600">
            {business.contactPhone && <p>📞 {business.contactPhone}</p>}
            {business.address && <p>📍 {business.address}</p>}
            {websiteHref && (
              <p>
                🔗{" "}
                <a href={websiteHref} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                  {business.website}
                </a>
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          {t("footer", { business: business.name })}
        </p>
      </main>
    </div>
  );
}
