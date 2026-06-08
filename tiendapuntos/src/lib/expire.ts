import { prisma } from "@/lib/prisma";
import { encodeNote } from "@/lib/tx-note";

// Vencimiento de puntos por inactividad (lazy): si el negocio tiene configurado
// `pointsExpireDays` y el cliente no tuvo movimientos en ese período, su saldo
// se pone en cero con un movimiento de tipo ADJUST. Los puntos acumulados de
// por vida (para el nivel VIP) NO se tocan.
export async function expireStalePoints(customerId: string, businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { pointsExpireDays: true },
  });
  const days = business?.pointsExpireDays ?? null;
  if (!days || days <= 0) return;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    select: { id: true, points: true, createdAt: true },
  });
  if (!customer || customer.points <= 0) return;

  const last = await prisma.pointsTransaction.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const lastActivity = last?.createdAt ?? customer.createdAt;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (lastActivity >= cutoff) return;

  await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        businessId,
        customerId,
        type: "ADJUST",
        points: -customer.points,
        note: encodeNote("expired"),
      },
    }),
    prisma.customer.update({ where: { id: customerId }, data: { points: 0 } }),
  ]);
}

// Fecha estimada de vencimiento del saldo actual (para mostrar en la UI).
export function expiryDate(lastActivity: Date, pointsExpireDays: number): Date {
  return new Date(lastActivity.getTime() + pointsExpireDays * 24 * 60 * 60 * 1000);
}
