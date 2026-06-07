"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// Sumar puntos a un cliente.
// Se puede cargar por monto de compra (se calculan según pointsPerCurrency)
// o directamente por una cantidad fija de puntos.
const earnSchema = z.object({
  mode: z.enum(["amount", "points"]),
  amount: z.coerce.number().optional(),
  points: z.coerce.number().optional(),
  note: z.string().optional(),
});

export async function earnPointsAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = earnSchema.safeParse({
    mode: formData.get("mode"),
    amount: formData.get("amount") || undefined,
    points: formData.get("points") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: "Cliente no encontrado" };

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: "Negocio no encontrado" };

  let pointsToAdd = 0;
  let amount: number | null = null;

  if (parsed.data.mode === "amount") {
    amount = parsed.data.amount ?? 0;
    if (amount <= 0) return { error: "Ingresá un monto válido" };
    pointsToAdd = Math.floor(amount * business.pointsPerCurrency);
    if (pointsToAdd <= 0) return { error: "El monto no genera puntos" };
  } else {
    pointsToAdd = Math.floor(parsed.data.points ?? 0);
    if (pointsToAdd <= 0) return { error: "Ingresá una cantidad de puntos válida" };
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
      data: { points: { increment: pointsToAdd } },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { ok: true };
}

// Ajuste manual de puntos (puede ser positivo o negativo).
const adjustSchema = z.object({
  points: z.coerce.number().int(),
  note: z.string().optional(),
});

export async function adjustPointsAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = adjustSchema.safeParse({
    points: formData.get("points"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) return { error: "Ingresá un número válido (puede ser negativo)" };

  const delta = parsed.data.points;
  if (delta === 0) return { error: "El ajuste no puede ser 0" };

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: "Cliente no encontrado" };

  if (customer.points + delta < 0) {
    return { error: "El cliente no tiene suficientes puntos para ese ajuste" };
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
      data: { points: { increment: delta } },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/transactions");
  return { ok: true };
}
