import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleRewardAction, deleteRewardAction } from "@/lib/actions/rewards";
import { formatNumber } from "@/lib/utils";
import { RewardForm } from "@/components/reward/RewardForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function RewardsPage() {
  const session = (await getSession())!;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const rewards = await prisma.reward.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Premios</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Nuevo premio</h2>
            <RewardForm pointsName={pointsName} />
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {rewards.length === 0 ? (
            <div className="card text-center text-sm text-gray-500">
              Todavía no creaste premios. Cargá el primero a la izquierda.
            </div>
          ) : (
            rewards.map((r) => {
              const toggle = toggleRewardAction.bind(null, r.id);
              const del = deleteRewardAction.bind(null, r.id);
              return (
                <div key={r.id} className="card flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{r.name}</h3>
                      <span
                        className={`badge ${
                          r.active ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {r.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {r.description && <p className="mt-1 text-sm text-gray-500">{r.description}</p>}
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold text-brand-700">
                        {formatNumber(r.pointsCost)} {pointsName}
                      </span>{" "}
                      · Stock: {r.stock === null ? "ilimitado" : formatNumber(r.stock)} ·{" "}
                      {r._count.redemptions} canjes
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Link href={`/dashboard/rewards/${r.id}/edit`} className="btn-secondary px-3 py-1 text-xs">
                      Editar
                    </Link>
                    <form action={toggle}>
                      <button className="btn-secondary px-3 py-1 text-xs" type="submit">
                        {r.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <ConfirmButton
                      action={del}
                      confirm="¿Eliminar este premio?"
                      className="btn-danger px-3 py-1 text-xs"
                    >
                      Eliminar
                    </ConfirmButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
