import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planConfig } from "@/lib/plans";
import { formatNumber } from "@/lib/utils";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function ReportsPage() {
  const session = (await getSession())!;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return null;

  const isPro = planConfig(business.plan).id === "PRO";
  const pointsName = business.pointsName;

  // Ventana de 6 meses.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const txs = await prisma.pointsTransaction.findMany({
    where: { businessId: business.id, createdAt: { gte: start } },
    select: { type: true, points: true, createdAt: true },
  });

  // Buckets por mes.
  const buckets: { key: string; label: string; earned: number; redeemed: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS[d.getMonth()],
      earned: 0,
      redeemed: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));

  for (const t of txs) {
    const d = t.createdAt;
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i === undefined) continue;
    if (t.points >= 0) buckets[i].earned += t.points;
    else buckets[i].redeemed += Math.abs(t.points);
  }

  const max = Math.max(1, ...buckets.flatMap((b) => [b.earned, b.redeemed]));
  const totalEarned = buckets.reduce((s, b) => s + b.earned, 0);
  const totalRedeemed = buckets.reduce((s, b) => s + b.redeemed, 0);

  // Geometría del gráfico SVG.
  const W = 720;
  const H = 240;
  const pad = { top: 16, right: 16, bottom: 28, left: 16 };
  const chartH = H - pad.top - pad.bottom;
  const groupW = (W - pad.left - pad.right) / buckets.length;
  const barW = groupW / 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          {isPro ? (
            <>
              <a href="/api/export/customers" className="btn-secondary">
                ⬇ Clientes (CSV)
              </a>
              <a href="/api/export/transactions" className="btn-secondary">
                ⬇ Movimientos (CSV)
              </a>
            </>
          ) : (
            <Link href="/dashboard/billing" className="btn-secondary">
              ⬇ Exportar CSV (Pro)
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-gray-500">{pointsName} emitidos (6 meses)</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">{formatNumber(totalEarned)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{pointsName} canjeados (6 meses)</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{formatNumber(totalRedeemed)}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actividad mensual</h2>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-brand-500" /> Emitidos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-400" /> Canjeados
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Actividad mensual">
          <line
            x1={pad.left}
            y1={pad.top + chartH}
            x2={W - pad.right}
            y2={pad.top + chartH}
            stroke="#e5e7eb"
          />
          {buckets.map((b, i) => {
            const gx = pad.left + i * groupW;
            const earnedH = (b.earned / max) * chartH;
            const redeemedH = (b.redeemed / max) * chartH;
            return (
              <g key={b.key}>
                <rect
                  x={gx + groupW / 2 - barW - 2}
                  y={pad.top + chartH - earnedH}
                  width={barW}
                  height={earnedH}
                  rx={3}
                  fill="#2b9550"
                />
                <rect
                  x={gx + groupW / 2 + 2}
                  y={pad.top + chartH - redeemedH}
                  width={barW}
                  height={redeemedH}
                  rx={3}
                  fill="#fbbf24"
                />
                <text
                  x={gx + groupW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize="12"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {!isPro && (
        <div className="card flex items-center justify-between bg-brand-50">
          <div>
            <p className="font-semibold text-brand-800">Exportá tus datos con el plan Pro</p>
            <p className="text-sm text-brand-700">
              Descargá clientes y movimientos en CSV para tu contabilidad o campañas.
            </p>
          </div>
          <Link href="/dashboard/billing" className="btn-primary">
            Ver planes
          </Link>
        </div>
      )}
    </div>
  );
}
