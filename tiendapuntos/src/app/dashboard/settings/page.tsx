import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalUrl } from "@/lib/app-url";
import { qrDataUrl } from "@/lib/qr";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";
import { TeamManager } from "@/components/settings/TeamManager";
import { CopyField } from "@/components/CopyField";

export default async function SettingsPage() {
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
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="card">
        <h2 className="text-lg font-semibold">Portal público</h2>
        <p className="mt-1 text-sm text-gray-500">
          Compartí este link o el QR con tus clientes para que consulten sus {business.pointsName}:
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <CopyField value={url} />
            <a href={`/p/${business.slug}`} target="_blank" rel="noreferrer" className="btn-secondary mt-2">
              Abrir portal ↗
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="QR del portal"
            width={120}
            height={120}
            className="rounded-lg border border-gray-200"
          />
        </div>
      </div>

      {isStaff ? (
        <div className="card text-sm text-gray-500">
          Tu rol de cajero no tiene acceso a la configuración del negocio.
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Datos del programa</h2>
            <BusinessSettingsForm business={business} />
          </div>

          <div className="card">
            <h2 className="mb-1 text-lg font-semibold">Equipo</h2>
            <p className="mb-4 text-sm text-gray-500">
              Invitá usuarios por email para que tu equipo cargue y canjee puntos.
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
