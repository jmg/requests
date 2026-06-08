import { prisma } from "@/lib/prisma";
import { SEGMENTS, type Segment } from "@/lib/segments-shared";

export { SEGMENTS, isSegment } from "@/lib/segments-shared";
export type { Segment } from "@/lib/segments-shared";

type Recipient = { id: string; name: string; email: string | null };

// Devuelve los clientes que entran en un segmento dado.
export async function getSegmentCustomers(
  businessId: string,
  segment: Segment
): Promise<Recipient[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId },
    select: { id: true, name: true, email: true, birthday: true, createdAt: true },
  });

  if (segment === "ALL") {
    return customers.map(({ id, name, email }) => ({ id, name, email }));
  }

  if (segment === "HAS_EMAIL") {
    return customers
      .filter((c) => !!c.email)
      .map(({ id, name, email }) => ({ id, name, email }));
  }

  if (segment === "BIRTHDAYS") {
    const month = new Date().getMonth();
    return customers
      .filter((c) => c.birthday && c.birthday.getMonth() === month)
      .map(({ id, name, email }) => ({ id, name, email }));
  }

  // Inactividad: sin movimientos desde hace N días.
  const days = segment === "INACTIVE_30" ? 30 : segment === "INACTIVE_60" ? 60 : 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const last = await prisma.pointsTransaction.groupBy({
    by: ["customerId"],
    where: { businessId },
    _max: { createdAt: true },
  });
  const lastMap = new Map(last.map((r) => [r.customerId, r._max.createdAt]));

  return customers
    .filter((c) => {
      const lastActivity = lastMap.get(c.id) ?? c.createdAt;
      return lastActivity < cutoff;
    })
    .map(({ id, name, email }) => ({ id, name, email }));
}

// Cantidad de clientes por segmento (para mostrar en el selector).
export async function segmentCounts(businessId: string): Promise<Record<Segment, number>> {
  const entries = await Promise.all(
    SEGMENTS.map(async (s) => [s, (await getSegmentCustomers(businessId, s)).length] as const)
  );
  return Object.fromEntries(entries) as Record<Segment, number>;
}
