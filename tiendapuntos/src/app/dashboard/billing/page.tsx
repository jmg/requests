import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, planConfig } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";
import { formatNumber, formatDate } from "@/lib/utils";
import { UpgradeButton, DowngradeButton } from "@/components/billing/BillingActions";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {formatNumber(used)} / {limit === null ? "∞" : formatNumber(limit)}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const session = (await getSession())!;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return null;

  const isStaff = session.role === "STAFF";
  const current = planConfig(business.plan);
  const stripeOn = stripeEnabled();

  const [customerCount, rewardCount, teamCount] = await Promise.all([
    prisma.customer.count({ where: { businessId: business.id } }),
    prisma.reward.count({ where: { businessId: business.id } }),
    prisma.user.count({ where: { businessId: business.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plan y suscripción</h1>
        <p className="text-sm text-gray-500">
          Estás en el plan <span className="font-semibold text-brand-700">{current.name}</span> desde{" "}
          {formatDate(business.planSince)}.
        </p>
      </div>

      {searchParams.success && (
        <div className="card bg-brand-50 text-sm text-brand-800">
          ¡Pago confirmado! Tu plan Pro ya está activo. 🎉
        </div>
      )}
      {searchParams.canceled && (
        <div className="card bg-amber-50 text-sm text-amber-800">
          El pago se canceló. Seguís en tu plan actual.
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Uso actual</h2>
        <UsageBar label="Clientes" used={customerCount} limit={current.customerLimit} />
        <UsageBar label="Premios" used={rewardCount} limit={current.rewardLimit} />
        <UsageBar label="Usuarios del equipo" used={teamCount} limit={current.teamLimit} />
      </div>

      {isStaff && (
        <div className="card text-sm text-gray-500">
          Sólo el dueño o administradores pueden cambiar el plan.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {Object.values(PLANS).map((p) => {
          const isCurrent = p.id === business.plan;
          return (
            <div
              key={p.id}
              className={`card flex flex-col ${isCurrent ? "ring-2 ring-brand-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {isCurrent && <span className="badge bg-brand-100 text-brand-700">Tu plan</span>}
              </div>
              <p className="mt-2">
                <span className="text-3xl font-extrabold">{p.price}</span>{" "}
                <span className="text-sm text-gray-500">{p.priceDetail}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!isStaff && (
                <div className="mt-5">
                  {isCurrent ? (
                    <button className="btn-secondary w-full" disabled>
                      Plan actual
                    </button>
                  ) : p.id === "PRO" ? (
                    <UpgradeButton className="btn-primary w-full" />
                  ) : (
                    <DowngradeButton className="btn-secondary w-full" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        {stripeOn
          ? "Pagos procesados con Stripe Checkout. La gestión de la suscripción se sincroniza por webhook."
          : "Stripe no está configurado: el cambio de plan funciona en modo simulado (sin cobro real). Configurá STRIPE_SECRET_KEY y STRIPE_PRICE_PRO para activar pagos."}
      </p>
    </div>
  );
}
