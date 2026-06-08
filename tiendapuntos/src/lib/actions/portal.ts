"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { currentTier } from "@/lib/tiers";

export type PortalResult =
  | {
      ok: true;
      customer: {
        name: string;
        points: number;
        referralCode: string;
        tier: { name: string; color: string } | null;
      };
      redemptions: { rewardName: string; code: string; status: string; createdAt: string }[];
    }
  | { ok: false; error: string }
  | undefined;

// Consulta pública: un cliente busca su saldo por teléfono dentro de un negocio.
export async function lookupCustomerAction(
  slug: string,
  _prev: PortalResult,
  formData: FormData
): Promise<PortalResult> {
  const t = await getTranslations("errors");

  const phone = String(formData.get("phone") || "").trim();
  if (!phone) return { ok: false, error: t("enterPhone") };

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { tiers: true },
  });
  if (!business) return { ok: false, error: t("businessNotFound") };

  const customer = await prisma.customer.findUnique({
    where: { businessId_phone: { businessId: business.id, phone } },
    include: {
      redemptions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!customer) {
    return {
      ok: false,
      error: t("portalCustomerNotFound"),
    };
  }

  const tier = currentTier(business.tiers, customer.lifetimePoints);

  return {
    ok: true,
    customer: {
      name: customer.name,
      points: customer.points,
      referralCode: customer.referralCode,
      tier: tier ? { name: tier.name, color: tier.color } : null,
    },
    redemptions: customer.redemptions.map((r) => ({
      rewardName: r.rewardName,
      code: r.code,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
