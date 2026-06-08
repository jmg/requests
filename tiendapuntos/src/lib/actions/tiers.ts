"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

export async function createTierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  const schema = z.object({
    name: z.string().min(1, t("nameShort")),
    threshold: z.coerce.number().int().min(0),
    multiplier: z.coerce.number().min(1, t("multiplierMin")),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t("invalidColor")),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    threshold: formData.get("threshold") || 0,
    multiplier: formData.get("multiplier") || 1,
    color: formData.get("color") || "#64748b",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.tier.create({
    data: {
      businessId: session.businessId,
      name: parsed.data.name.trim(),
      threshold: parsed.data.threshold,
      multiplier: parsed.data.multiplier,
      color: parsed.data.color,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteTierAction(tierId: string): Promise<void> {
  const session = await requireSession();
  if (session.role === "STAFF") return;
  await prisma.tier.deleteMany({
    where: { id: tierId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/settings");
}
