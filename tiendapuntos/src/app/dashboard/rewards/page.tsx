import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleRewardAction, deleteRewardAction } from "@/lib/actions/rewards";
import { formatNumber } from "@/lib/utils";
import { RewardForm } from "@/components/reward/RewardForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function RewardsPage() {
  const t = await getTranslations("rewards");
  const tc = await getTranslations("common");
  const session = (await getSession())!;
  const isStaff = session.role === "STAFF";
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const pointsName = business?.pointsName ?? "puntos";

  const rewards = await prisma.reward.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className={`grid gap-6 ${isStaff ? "" : "lg:grid-cols-3"}`}>
        {!isStaff && (
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">{t("newReward")}</h2>
              <RewardForm pointsName={pointsName} />
            </div>
          </div>
        )}

        <div className={`space-y-3 ${isStaff ? "" : "lg:col-span-2"}`}>
          {rewards.length === 0 ? (
            <div className="card text-center text-sm text-gray-500">
              {t("emptyList")}
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
                        {r.active ? tc("active") : tc("inactive")}
                      </span>
                    </div>
                    {r.description && <p className="mt-1 text-sm text-gray-500">{r.description}</p>}
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold text-brand-700">
                        {formatNumber(r.pointsCost)} {pointsName}
                      </span>{" "}
                      · {t("stockLabel", { value: r.stock === null ? t("unlimited") : formatNumber(r.stock) })} ·{" "}
                      {t("redemptionsCount", { count: r._count.redemptions })}
                    </p>
                  </div>
                  {!isStaff && (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Link href={`/dashboard/rewards/${r.id}/edit`} className="btn-secondary px-3 py-1 text-xs">
                        {tc("edit")}
                      </Link>
                      <form action={toggle}>
                        <button className="btn-secondary px-3 py-1 text-xs" type="submit">
                          {r.active ? t("deactivate") : t("activate")}
                        </button>
                      </form>
                      <ConfirmButton
                        action={del}
                        confirm={t("confirmDelete")}
                        className="btn-danger px-3 py-1 text-xs"
                      >
                        {tc("delete")}
                      </ConfirmButton>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
