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
