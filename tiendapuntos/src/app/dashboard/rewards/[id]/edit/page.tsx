import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RewardForm } from "@/components/reward/RewardForm";

export default async function EditRewardPage({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const [reward, business] = await Promise.all([
    prisma.reward.findFirst({ where: { id: params.id, businessId: session.businessId } }),
    prisma.business.findUnique({ where: { id: session.businessId } }),
  ]);

  if (!reward || !business) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard/rewards" className="text-sm text-gray-500 hover:underline">
          ← Volver a premios
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Editar premio</h1>
      </div>
      <div className="card">
        <RewardForm reward={reward} pointsName={business.pointsName} onDone="/dashboard/rewards" />
      </div>
    </div>
  );
}
