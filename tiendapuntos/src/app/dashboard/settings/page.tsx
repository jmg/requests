import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalUrl } from "@/lib/app-url";
import { qrDataUrl } from "@/lib/qr";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";
import { TeamManager } from "@/components/settings/TeamManager";
import { CopyField } from "@/components/CopyField";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const session = (await getSession())!;
  const isStaff = session.role === "STAFF";

  const [business, members, invitations] = await Promise.all([
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.user.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.invitation.findMany({
      where: { businessId: session.businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  if (!business) return null;

  const url = portalUrl(business.slug);
  const qr = await qrDataUrl(url);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="card">
        <h2 className="text-lg font-semibold">{t("portalTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("portalShare", { points: business.pointsName })}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <CopyField value={url} />
            <a href={`/p/${business.slug}`} target="_blank" rel="noreferrer" className="btn-secondary mt-2">
              {t("openPortal")}
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={t("qrAlt")}
            width={120}
            height={120}
            className="rounded-lg border border-gray-200"
          />
        </div>
      </div>

      {isStaff ? (
        <div className="card text-sm text-gray-500">
          {t("staffNote")}
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">{t("programData")}</h2>
            <BusinessSettingsForm business={business} />
          </div>

          <div className="card">
            <h2 className="mb-1 text-lg font-semibold">{t("teamTitle")}</h2>
            <p className="mb-4 text-sm text-gray-500">
              {t("teamSubtitle")}
            </p>
            <TeamManager
              members={members}
              invitations={invitations.map((i) => ({ ...i, expiresAt: i.expiresAt.toISOString() }))}
              currentUserId={session.userId}
            />
          </div>
        </>
      )}
    </div>
  );
}
