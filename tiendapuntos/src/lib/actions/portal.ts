"use server";

import { prisma } from "@/lib/prisma";

export type PortalResult =
  | {
      ok: true;
      customer: { name: string; points: number };
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
  const phone = String(formData.get("phone") || "").trim();
  if (!phone) return { ok: false, error: "Ingresá tu teléfono" };

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return { ok: false, error: "Negocio no encontrado" };

  const customer = await prisma.customer.findUnique({
    where: { businessId_phone: { businessId: business.id, phone } },
    include: {
      redemptions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!customer) {
    return {
      ok: false,
      error: "No encontramos una cuenta con ese teléfono. Pedí en el local que te registren.",
    };
  }

  return {
    ok: true,
    customer: { name: customer.name, points: customer.points },
    redemptions: customer.redemptions.map((r) => ({
      rewardName: r.rewardName,
      code: r.code,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
