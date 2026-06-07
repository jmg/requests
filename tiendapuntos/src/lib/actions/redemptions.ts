"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

export type ActionState = { error?: string; ok?: boolean; code?: string } | undefined;

const redeemSchema = z.object({
  rewardId: z.string().min(1, "Elegí un premio"),
});

// Canjea un premio para un cliente: descuenta puntos, descuenta stock,
// crea la transacción REDEEM y el registro de canje con un código.
export async function redeemRewardAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = redeemSchema.safeParse({ rewardId: formData.get("rewardId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const code = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, businessId: session.businessId },
      });
      if (!customer) throw new Error("Cliente no encontrado");

      const reward = await tx.reward.findFirst({
        where: { id: parsed.data.rewardId, businessId: session.businessId },
      });
      if (!reward) throw new Error("Premio no encontrado");
      if (!reward.active) throw new Error("El premio no está disponible");
      if (reward.stock !== null && reward.stock <= 0) throw new Error("Premio sin stock");
      if (customer.points < reward.pointsCost) {
        throw new Error("El cliente no tiene puntos suficientes");
      }

      const code = generateCode();

      await tx.pointsTransaction.create({
        data: {
          businessId: session.businessId,
          customerId,
          type: "REDEEM",
          points: -reward.pointsCost,
          note: `Canje: ${reward.name}`,
          userId: session.userId,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { points: { decrement: reward.pointsCost } },
      });

      if (reward.stock !== null) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { stock: { decrement: 1 } },
        });
      }

      await tx.redemption.create({
        data: {
          businessId: session.businessId,
          customerId,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          code,
          status: "PENDING",
        },
      });

      return code;
    });

    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath("/dashboard/redemptions");
    revalidatePath("/dashboard/rewards");
    revalidatePath("/dashboard");
    return { ok: true, code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo realizar el canje" };
  }
}

export async function fulfillRedemptionAction(redemptionId: string): Promise<void> {
  const session = await requireSession();
  await prisma.redemption.updateMany({
    where: { id: redemptionId, businessId: session.businessId, status: "PENDING" },
    data: { status: "FULFILLED" },
  });
  revalidatePath("/dashboard/redemptions");
}

// Cancela un canje pendiente y devuelve los puntos al cliente.
export async function cancelRedemptionAction(redemptionId: string): Promise<void> {
  const session = await requireSession();

  await prisma.$transaction(async (tx) => {
    const redemption = await tx.redemption.findFirst({
      where: { id: redemptionId, businessId: session.businessId, status: "PENDING" },
    });
    if (!redemption) return;

    await tx.redemption.update({
      where: { id: redemption.id },
      data: { status: "CANCELLED" },
    });

    await tx.pointsTransaction.create({
      data: {
        businessId: session.businessId,
        customerId: redemption.customerId,
        type: "ADJUST",
        points: redemption.pointsCost,
        note: `Reintegro por canje cancelado (${redemption.code})`,
        userId: session.userId,
      },
    });

    await tx.customer.update({
      where: { id: redemption.customerId },
      data: { points: { increment: redemption.pointsCost } },
    });

    // Devolvemos el stock si el premio aún existe y maneja stock.
    const reward = await tx.reward.findUnique({ where: { id: redemption.rewardId } });
    if (reward && reward.stock !== null) {
      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { increment: 1 } },
      });
    }
  });

  revalidatePath("/dashboard/redemptions");
  revalidatePath("/dashboard/rewards");
}
