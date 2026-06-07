import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";
import { TeamManager } from "@/components/settings/TeamManager";

export default async function SettingsPage() {
  const session = (await getSession())!;
  const isStaff = session.role === "STAFF";

  const [business, members] = await Promise.all([
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.user.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!business) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="card">
        <h2 className="text-lg font-semibold">Portal público</h2>
        <p className="mt-1 text-sm text-gray-500">
          Compartí este link con tus clientes para que consulten sus {business.pointsName}:
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm">
            /p/{business.slug}
          </code>
          <a href={`/p/${business.slug}`} target="_blank" rel="noreferrer" className="btn-secondary">
            Abrir ↗
          </a>
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
              Sumá usuarios para que tu equipo cargue y canjee puntos.
            </p>
            <TeamManager members={members} currentUserId={session.userId} />
          </div>
        </>
      )}
    </div>
  );
}
