import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { PortalLookup } from "@/components/portal/PortalLookup";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  return { title: business ? `${business.name} — Puntos` : "Portal de puntos" };
}

export default async function PortalPage({ params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) notFound();

  const rewards = await prisma.reward.findMany({
    where: { businessId: business.id, active: true },
    orderBy: { pointsCost: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-10 text-center text-white" style={{ backgroundColor: business.brandColor }}>
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
            {business.logoEmoji}
          </span>
          <h1 className="mt-4 text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm opacity-90">Consultá tus {business.pointsName} y premios</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-6 py-8">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Mi cuenta</h2>
          <PortalLookup
            slug={business.slug}
            pointsName={business.pointsName}
            brandColor={business.brandColor}
          />
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Premios disponibles</h2>
          {rewards.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay premios cargados.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
                  </div>
                  <span
                    className="badge shrink-0 text-white"
                    style={{ backgroundColor: business.brandColor }}
                  >
                    {formatNumber(r.pointsCost)} {business.pointsName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Programa de fidelización de {business.name}
        </p>
      </main>
    </div>
  );
}
