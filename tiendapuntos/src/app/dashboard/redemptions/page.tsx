import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillRedemptionAction, cancelRedemptionAction } from "@/lib/actions/redemptions";
import { formatNumber, formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ConfirmButton";

const statusMeta: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
  FULFILLED: { label: "Entregado", cls: "bg-brand-100 text-brand-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = (await getSession())!;
  const status = searchParams.status;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const redemptions = await prisma.redemption.findMany({
    where: {
      businessId: session.businessId,
      ...(status === "PENDING" || status === "FULFILLED" || status === "CANCELLED"
        ? { status }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true },
  });

  const filters = [
    { key: "", label: "Todos" },
    { key: "PENDING", label: "Pendientes" },
    { key: "FULFILLED", label: "Entregados" },
    { key: "CANCELLED", label: "Cancelados" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Canjes</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key ? `/dashboard/redemptions?status=${f.key}` : "/dashboard/redemptions"}
              className={`badge border ${
                active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden p-0">
        {redemptions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No hay canjes para mostrar.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Premio</th>
                <th className="px-4 py-3 text-right">{pointsName}</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {redemptions.map((r) => {
                const fulfill = fulfillRedemptionAction.bind(null, r.id);
                const cancel = cancelRedemptionAction.bind(null, r.id);
                const meta = statusMeta[r.status];
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold tracking-wider">{r.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/customers/${r.customerId}`}
                        className="font-medium hover:text-brand-700"
                      >
                        {r.customer.name}
                      </Link>
                      <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">{r.rewardName}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(r.pointsCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <form action={fulfill}>
                            <button className="btn-primary px-2.5 py-1 text-xs" type="submit">
                              Entregar
                            </button>
                          </form>
                          <ConfirmButton
                            action={cancel}
                            confirm="¿Cancelar el canje y devolver los puntos?"
                            className="btn-secondary px-2.5 py-1 text-xs"
                          >
                            Cancelar
                          </ConfirmButton>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
