"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

export async function updateBusinessAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  const businessSchema = z.object({
    name: z.string().min(2, t("nameShort")),
    pointsName: z.string().min(1, t("pointsNameRequired")),
    pointsPerCurrency: z.coerce.number().positive(t("positiveNumber")),
    currency: z.string().min(1).max(5),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, t("invalidColor")),
    logoEmoji: z.string().min(1).max(4),
    referrerBonus: z.coerce.number().int().min(0),
    refereeBonus: z.coerce.number().int().min(0),
    birthdayBonus: z.coerce.number().int().min(0),
    welcomeBonus: z.coerce.number().int().min(0),
    // "" => null (no vencen)
    pointsExpireDays: z.union([z.literal(""), z.coerce.number().int().min(1)]),
    portalEnabled: z.union([z.literal("on"), z.null()]).optional(),
    contactPhone: z.string().max(40).optional(),
    address: z.string().max(120).optional(),
    website: z.string().max(120).optional(),
  });

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    pointsName: formData.get("pointsName"),
    pointsPerCurrency: formData.get("pointsPerCurrency"),
    currency: formData.get("currency"),
    brandColor: formData.get("brandColor"),
    logoEmoji: formData.get("logoEmoji"),
    referrerBonus: formData.get("referrerBonus") || 0,
    refereeBonus: formData.get("refereeBonus") || 0,
    birthdayBonus: formData.get("birthdayBonus") || 0,
    welcomeBonus: formData.get("welcomeBonus") || 0,
    pointsExpireDays: (formData.get("pointsExpireDays") as string) ?? "",
    portalEnabled: formData.get("portalEnabled"),
    contactPhone: formData.get("contactPhone") || undefined,
    address: formData.get("address") || undefined,
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.business.update({
    where: { id: session.businessId },
    data: {
      name: parsed.data.name.trim(),
      pointsName: parsed.data.pointsName.trim(),
      pointsPerCurrency: parsed.data.pointsPerCurrency,
      currency: parsed.data.currency.trim().toUpperCase(),
      brandColor: parsed.data.brandColor,
      logoEmoji: parsed.data.logoEmoji.trim(),
      referrerBonus: parsed.data.referrerBonus,
      refereeBonus: parsed.data.refereeBonus,
      birthdayBonus: parsed.data.birthdayBonus,
      welcomeBonus: parsed.data.welcomeBonus,
      pointsExpireDays: parsed.data.pointsExpireDays === "" ? null : parsed.data.pointsExpireDays,
      portalEnabled: formData.get("portalEnabled") === "on",
      contactPhone: parsed.data.contactPhone?.trim() || null,
      address: parsed.data.address?.trim() || null,
      website: parsed.data.website?.trim() || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Cambio de plan (simulado: sin pasarela de pago real).
export async function changePlanAction(plan: "FREE" | "PRO"): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  await prisma.business.update({
    where: { id: session.businessId },
    data: { plan, planSince: new Date() },
  });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Cambiar el rol de un miembro del equipo (admin <-> cajero).
export async function changeTeamMemberRoleAction(
  userId: string,
  role: "ADMIN" | "STAFF"
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };
  if (userId === session.userId) return { error: t("noPermission") };

  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: session.businessId },
  });
  if (!target) return { error: t("userNotFound") };
  if (target.role === "OWNER") return { error: t("cannotDeleteOwner") };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteTeamMemberAction(userId: string): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };
  if (userId === session.userId) return { error: t("cannotDeleteSelf") };

  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: session.businessId },
  });
  if (!target) return { error: t("userNotFound") };
  if (target.role === "OWNER") return { error: t("cannotDeleteOwner") };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
