import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate } from "@/lib/utils";
import { OnboardingChecklist, type OnboardingStep } from "@/components/OnboardingChecklist";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const businessId = session.businessId;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const [
    customerCount,
    earnAgg,
    redeemAgg,
    pendingRedemptions,
    topCustomers,
    recentTx,
  ] = await Promise.all([
    prisma.customer.count({ where: { businessId } }),
    prisma.pointsTransaction.aggregate({
      where: { businessId, type: "EARN" },
      _sum: { points: true },
    }),
    prisma.pointsTransaction.aggregate({
      where: { businessId, type: "REDEEM" },
      _sum: { points: true },
    }),
    prisma.redemption.count({ where: { businessId, status: "PENDING" } }),
    prisma.customer.findMany({
      where: { businessId },
      orderBy: { points: "desc" },
      take: 5,
    }),
    prisma.pointsTransaction.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
  ]);

  const rewardCount = await prisma.reward.count({ where: { businessId } });

  const pointsIssued = earnAgg._sum.points ?? 0;
  const pointsRedeemed = Math.abs(redeemAgg._sum.points ?? 0);

  const brandingDone =
    !!business && (business.brandColor !== "#1d783f" || business.logoEmoji !== "★");
  const onboardingSteps: OnboardingStep[] = [
    {
      done: brandingDone,
      label: "Personalizá tu marca",
      desc: "Elegí el color e ícono que verán tus clientes en el portal.",
      href: "/dashboard/settings",
      cta: "Configurar",
    },
    {
      done: rewardCount > 0,
      label: "Creá tu primer premio",
      desc: "Definí qué pueden canjear tus clientes con sus puntos.",
      href: "/dashboard/rewards",
      cta: "Crear premio",
    },
    {
      done: customerCount > 0,
      label: "Cargá tu primer cliente",
      desc: "Registrá a un cliente para empezar a sumarle puntos.",
      href: "/dashboard/customers/new",
      cta: "Nuevo cliente",
    },
  ];
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const stats = [
    { label: "Clientes", value: formatNumber(customerCount), icon: "👥", href: "/dashboard/customers" },
    { label: `${pointsName} emitidos`, value: formatNumber(pointsIssued), icon: "⭐" },
    { label: `${pointsName} canjeados`, value: formatNumber(pointsRedeemed), icon: "🎁" },
    { label: "Canjes pendientes", value: formatNumber(pendingRedemptions), icon: "🎟️", href: "/dashboard/redemptions" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resumen</h1>
          <p className="text-sm text-gray-500">Hola {session.name.split(" ")[0]}, así va tu programa.</p>
        </div>
        <Link href="/dashboard/customers/new" className="btn-primary">
          + Nuevo cliente
        </Link>
      </div>

      {!onboardingDone && <OnboardingChecklist steps={onboardingSteps} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const content = (
            <div className="card h-full">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{s.label}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="transition hover:opacity-80">
              {content}
            </Link>
          ) : (
            <div key={s.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Mejores clientes</h2>
          {topCustomers.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Todavía no cargaste clientes.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {topCustomers.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="flex items-center gap-3 hover:text-brand-700"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {i + 1}
                    </span>
                    <span className="font-medium">{c.name}</span>
                  </Link>
                  <span className="font-semibold text-brand-700">
                    {formatNumber(c.points)} {pointsName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Últimos movimientos</h2>
          {recentTx.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin movimientos aún.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {recentTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link
                      href={`/dashboard/customers/${t.customerId}`}
                      className="font-medium hover:text-brand-700"
                    >
                      {t.customer.name}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
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
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
