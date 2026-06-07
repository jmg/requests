import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { formatNumber, formatDate } from "@/lib/utils";
import { PointsPanel } from "@/components/customer/PointsPanel";
import { ConfirmButton } from "@/components/ConfirmButton";

const txLabels: Record<string, { label: string; cls: string }> = {
  EARN: { label: "Suma", cls: "bg-brand-100 text-brand-700" },
  REDEEM: { label: "Canje", cls: "bg-amber-100 text-amber-700" },
  ADJUST: { label: "Ajuste", cls: "bg-gray-100 text-gray-600" },
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = (await getSession())!;

  const [customer, business, rewards] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: params.id, businessId: session.businessId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 50, include: { user: true } },
        redemptions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.reward.findMany({
      where: { businessId: session.businessId },
      orderBy: { pointsCost: "asc" },
    }),
  ]);

  if (!customer || !business) notFound();

  const pointsName = business.pointsName;
  const deleteAction = deleteCustomerAction.bind(null, customer.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:underline">
        ← Volver a clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-gray-500">
            {[customer.phone, customer.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
          {customer.notes && <p className="mt-1 text-sm text-gray-400">{customer.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${customer.id}/edit`} className="btn-secondary">
            Editar
          </Link>
          <ConfirmButton
            action={deleteAction}
            confirm="¿Eliminar este cliente y todo su historial?"
            pendingText="Eliminando…"
          >
            Eliminar
          </ConfirmButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card bg-brand-600 text-white">
            <p className="text-sm text-brand-100">Saldo actual</p>
            <p className="mt-1 text-4xl font-extrabold">{formatNumber(customer.points)}</p>
            <p className="text-sm text-brand-100">{pointsName}</p>
          </div>

          <PointsPanel
            customerId={customer.id}
            pointsName={pointsName}
            currency={business.currency}
            pointsPerCurrency={business.pointsPerCurrency}
            rewards={rewards}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          {customer.redemptions.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold">Canjes</h2>
              <ul className="divide-y divide-gray-100">
                {customer.redemptions.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{r.rewardName}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(r.createdAt)} · código {r.code}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        r.status === "FULFILLED"
                          ? "bg-brand-100 text-brand-700"
                          : r.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status === "FULFILLED"
                        ? "Entregado"
                        : r.status === "CANCELLED"
                        ? "Cancelado"
                        : "Pendiente"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Historial de {pointsName}</h2>
            {customer.transactions.length === 0 ? (
              <p className="text-sm text-gray-500">Sin movimientos todavía.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {customer.transactions.map((t) => {
                  const meta = txLabels[t.type];
                  return (
                    <li key={t.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        <div className="text-sm">
                          <p className="text-gray-700">{t.note || meta.label}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(t.createdAt)}
                            {t.user ? ` · ${t.user.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          t.points >= 0 ? "text-brand-700" : "text-red-600"
                        }`}
                      >
                        {t.points >= 0 ? "+" : ""}
                        {formatNumber(t.points)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
