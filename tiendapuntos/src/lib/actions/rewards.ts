"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { planConfig } from "@/lib/plans";

export type ActionState = { error?: string; ok?: boolean } | undefined;

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
  const t = await getTranslations("errors");

  const rewardSchema = z.object({
    name: z.string().min(2, t("nameShort")),
    description: z.string().optional(),
    pointsCost: z.coerce.number().int().positive(t("pointsCostPositive")),
    stock: z.string().optional(),
    active: z.union([z.literal("on"), z.null()]).optional(),
  });

  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    pointsCost: formData.get("pointsCost"),
    stock: formData.get("stock") || undefined,
    active: formData.get("active"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Límite del plan
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const limit = business ? planConfig(business.plan).rewardLimit : null;
  if (limit !== null) {
    const count = await prisma.reward.count({ where: { businessId: session.businessId } });
    if (count >= limit) {
      return {
        error: t("rewardLimit", { limit, plan: business!.plan }),
      };
    }
  }

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
  const t = await getTranslations("errors");

  const rewardSchema = z.object({
    name: z.string().min(2, t("nameShort")),
    description: z.string().optional(),
    pointsCost: z.coerce.number().int().positive(t("pointsCostPositive")),
    stock: z.string().optional(),
    active: z.union([z.literal("on"), z.null()]).optional(),
  });

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
  if (!reward) return { error: t("rewardNotFound") };

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
