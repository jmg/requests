"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { tierMultiplier } from "@/lib/tiers";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// Sumar puntos a un cliente.
// Se puede cargar por monto de compra (se calculan según pointsPerCurrency)
// o directamente por una cantidad fija de puntos.
export async function earnPointsAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const earnSchema = z.object({
    mode: z.enum(["amount", "points"]),
    amount: z.coerce.number().optional(),
    points: z.coerce.number().optional(),
    note: z.string().optional(),
  });

  const parsed = earnSchema.safeParse({
    mode: formData.get("mode"),
    amount: formData.get("amount") || undefined,
    points: formData.get("points") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: t("invalidData") };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: t("customerNotFound") };

  const business = await prisma.business.findUnique({
    where: { id: session.businessId },
    include: { tiers: true },
  });
  if (!business) return { error: t("businessNotFound") };

  let pointsToAdd = 0;
  let amount: number | null = null;

  if (parsed.data.mode === "amount") {
    amount = parsed.data.amount ?? 0;
    if (amount <= 0) return { error: t("invalidAmount") };
    // El nivel VIP del cliente multiplica los puntos por compra.
    const mult = tierMultiplier(business.tiers, customer.lifetimePoints);
    pointsToAdd = Math.floor(amount * business.pointsPerCurrency * mult);
    if (pointsToAdd <= 0) return { error: t("amountNoPoints") };
  } else {
    pointsToAdd = Math.floor(parsed.data.points ?? 0);
    if (pointsToAdd <= 0) return { error: t("invalidPoints") };
  }

  await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        businessId: session.businessId,
        customerId,
        type: "EARN",
        points: pointsToAdd,
        amount,
        note: parsed.data.note?.trim() || null,
        userId: session.userId,
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { increment: pointsToAdd },
        lifetimePoints: { increment: pointsToAdd },
      },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { ok: true };
}

// Ajuste manual de puntos (puede ser positivo o negativo).
export async function adjustPointsAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const adjustSchema = z.object({
    points: z.coerce.number().int(),
    note: z.string().optional(),
  });

  const parsed = adjustSchema.safeParse({
    points: formData.get("points"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) return { error: t("invalidNumber") };

  const delta = parsed.data.points;
  if (delta === 0) return { error: t("adjustNotZero") };

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: t("customerNotFound") };

  if (customer.points + delta < 0) {
    return { error: t("notEnoughForAdjust") };
  }

  await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        businessId: session.businessId,
        customerId,
        type: "ADJUST",
        points: delta,
        note: parsed.data.note?.trim() || null,
        userId: session.userId,
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { increment: delta },
        // Los ajustes positivos también suman a los puntos de por vida.
        lifetimePoints: { increment: Math.max(0, delta) },
      },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/transactions");
  return { ok: true };
}

// Aplica el bono de cumpleaños configurado por el negocio a un cliente.
export async function birthdayBonusAction(customerId: string): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: t("customerNotFound") };

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };
  if (business.birthdayBonus <= 0) return { error: t("noBirthdayBonus") };

  await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        businessId: session.businessId,
        customerId,
        type: "EARN",
        points: business.birthdayBonus,
        note: "Bono de cumpleaños 🎂",
        userId: session.userId,
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { increment: business.birthdayBonus },
        lifetimePoints: { increment: business.birthdayBonus },
      },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/transactions");
  return { ok: true };
}
