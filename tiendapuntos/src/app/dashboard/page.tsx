import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate } from "@/lib/utils";
import { OnboardingChecklist, type OnboardingStep } from "@/components/OnboardingChecklist";
import { QuickFind } from "@/components/QuickFind";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const businessId = session.businessId;
  const t = await getTranslations("dashboard");
  const to = await getTranslations("onboarding");

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
      label: to("brandLabel"),
      desc: to("brandDesc"),
      href: "/dashboard/settings",
      cta: to("brandCta"),
    },
    {
      done: rewardCount > 0,
      label: to("rewardLabel"),
      desc: to("rewardDesc"),
      href: "/dashboard/rewards",
      cta: to("rewardCta"),
    },
    {
      done: customerCount > 0,
      label: to("customerLabel"),
      desc: to("customerDesc"),
      href: "/dashboard/customers/new",
      cta: to("customerCta"),
    },
  ];
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const stats = [
    { label: t("statCustomers"), value: formatNumber(customerCount), icon: "👥", href: "/dashboard/customers" },
    { label: t("statIssued", { points: pointsName }), value: formatNumber(pointsIssued), icon: "⭐" },
    { label: t("statRedeemed", { points: pointsName }), value: formatNumber(pointsRedeemed), icon: "🎁" },
    { label: t("statPending"), value: formatNumber(pendingRedemptions), icon: "🎟️", href: "/dashboard/redemptions" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("greeting", { name: session.name.split(" ")[0] })}</p>
        </div>
        <Link href="/dashboard/customers/new" className="btn-primary">
          {t("newCustomer")}
        </Link>
      </div>

      {!onboardingDone && <OnboardingChecklist steps={onboardingSteps} />}

      <QuickFind />

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
          <h2 className="text-lg font-semibold">{t("topCustomers")}</h2>
          {topCustomers.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">{t("noCustomers")}</p>
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
          <h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
          {recentTx.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">{t("noActivity")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {recentTx.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link
                      href={`/dashboard/customers/${tx.customerId}`}
                      className="font-medium hover:text-brand-700"
                    >
                      {tx.customer.name}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.points >= 0 ? "text-brand-700" : "text-red-600"
                    }`}
                  >
                    {tx.points >= 0 ? "+" : ""}
                    {formatNumber(tx.points)}
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
