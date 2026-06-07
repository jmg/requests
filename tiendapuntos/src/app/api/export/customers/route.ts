import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planConfig } from "@/lib/plans";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return new Response("No encontrado", { status: 404 });

  // La exportación es una funcionalidad del plan Pro.
  if (planConfig(business.plan).id !== "PRO") {
    return new Response("La exportación está disponible en el plan Pro", { status: 403 });
  }

  const customers = await prisma.customer.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Nombre", "Email", "Telefono", "Puntos", "Alta"];
  const rows = customers.map((c) => [
    c.name,
    c.email ?? "",
    c.phone ?? "",
    c.points,
    c.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${business.slug}.csv"`,
    },
  });
}
