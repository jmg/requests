"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const rewardSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  pointsCost: z.coerce.number().int().positive("El costo en puntos debe ser mayor a 0"),
  stock: z.string().optional(),
  active: z.union([z.literal("on"), z.null()]).optional(),
});

function parseStock(raw?: string): number | null {
  if (!raw || raw.trim() === "") return null; // ilimitado
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.floor(n);
}

export async function createRewardAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    pointsCost: formData.get("pointsCost"),
    stock: formData.get("stock") || undefined,
    active: formData.get("active"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.reward.create({
    data: {
      businessId: session.businessId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      pointsCost: parsed.data.pointsCost,
      stock: parseStock(parsed.data.stock),
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/dashboard/rewards");
  return { ok: true };
}

export async function updateRewardAction(
  rewardId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    pointsCost: formData.get("pointsCost"),
    stock: formData.get("stock") || undefined,
    active: formData.get("active"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, businessId: session.businessId },
  });
  if (!reward) return { error: "Premio no encontrado" };

  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      pointsCost: parsed.data.pointsCost,
      stock: parseStock(parsed.data.stock),
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/dashboard/rewards");
  return { ok: true };
}

export async function toggleRewardAction(rewardId: string): Promise<void> {
  const session = await requireSession();
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, businessId: session.businessId },
  });
  if (!reward) return;
  await prisma.reward.update({
    where: { id: rewardId },
    data: { active: !reward.active },
  });
  revalidatePath("/dashboard/rewards");
}

export async function deleteRewardAction(rewardId: string): Promise<void> {
  const session = await requireSession();
  await prisma.reward.deleteMany({
    where: { id: rewardId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/rewards");
}
