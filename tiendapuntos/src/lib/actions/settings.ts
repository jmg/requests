"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, hashPassword } from "@/lib/auth";
import { planConfig } from "@/lib/plans";

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

// Invitar / crear un usuario adicional para el negocio (equipo).
export async function createTeamMemberAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  const teamSchema = z.object({
    name: z.string().min(2, t("enterYourName")),
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(6, t("passwordMin")),
    role: z.enum(["ADMIN", "STAFF"]),
  });

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: t("userExists") };

  // Límite de equipo del plan
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const teamLimit = business ? planConfig(business.plan).teamLimit : null;
  if (teamLimit !== null) {
    const count = await prisma.user.count({ where: { businessId: session.businessId } });
    if (count >= teamLimit) {
      return {
        error: t("teamLimit", { limit: teamLimit, plan: business!.plan }),
      };
    }
  }

  await prisma.user.create({
    data: {
      businessId: session.businessId,
      name: parsed.data.name.trim(),
      email,
      password: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    },
  });

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
