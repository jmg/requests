"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { planConfig } from "@/lib/plans";
import { generateReferralCode } from "@/lib/utils";
import { encodeNote } from "@/lib/tx-note";

export type ActionState = { error?: string; ok?: boolean } | undefined;

function parseBirthday(raw: FormDataEntryValue | null): Date | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateReferralCode();
    const exists = await prisma.customer.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
  return generateReferralCode() + Date.now().toString(36).slice(-3).toUpperCase();
}

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const customerSchema = z.object({
    name: z.string().min(2, t("nameShort")),
    email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  });

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Límite del plan
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };
  const limit = planConfig(business.plan).customerLimit;
  if (limit !== null) {
    const count = await prisma.customer.count({ where: { businessId: session.businessId } });
    if (count >= limit) {
      return { error: t("customerLimit", { limit, plan: business.plan }) };
    }
  }

  const phone = parsed.data.phone?.trim() || null;

  if (phone) {
    const dup = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId: session.businessId, phone } },
    });
    if (dup) {
      return { error: t("phoneTaken") };
    }
  }

  // Referido: buscamos el cliente que refiere por su código, dentro del negocio.
  const referralInput = String(formData.get("referralCode") ?? "").trim().toUpperCase();
  const referrer = referralInput
    ? await prisma.customer.findFirst({
        where: { businessId: session.businessId, referralCode: referralInput },
      })
    : null;

  const birthday = parseBirthday(formData.get("birthday"));
  const referralCode = await uniqueReferralCode();

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        businessId: session.businessId,
        name: parsed.data.name.trim(),
        email: parsed.data.email?.trim() || null,
        phone,
        notes: parsed.data.notes?.trim() || null,
        birthday,
        referralCode,
        referredById: referrer?.id ?? null,
      },
    });

    // Bono de bienvenida al referido nuevo.
    if (referrer && business.refereeBonus > 0) {
      await tx.pointsTransaction.create({
        data: {
          businessId: session.businessId,
          customerId: created.id,
          type: "EARN",
          points: business.refereeBonus,
          note: encodeNote("referredFrom", referrer.name),
          userId: session.userId,
        },
      });
      await tx.customer.update({
        where: { id: created.id },
        data: {
          points: { increment: business.refereeBonus },
          lifetimePoints: { increment: business.refereeBonus },
        },
      });
    }

    // Bono para quien refirió.
    if (referrer && business.referrerBonus > 0) {
      await tx.pointsTransaction.create({
        data: {
          businessId: session.businessId,
          customerId: referrer.id,
          type: "EARN",
          points: business.referrerBonus,
          note: encodeNote("referredTo", created.name),
          userId: session.userId,
        },
      });
      await tx.customer.update({
        where: { id: referrer.id },
        data: {
          points: { increment: business.referrerBonus },
          lifetimePoints: { increment: business.referrerBonus },
        },
      });
    }

    return created;
  });

  revalidatePath("/dashboard/customers");
  redirect(`/dashboard/customers/${customer.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const customerSchema = z.object({
    name: z.string().min(2, t("nameShort")),
    email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  });

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: session.businessId },
  });
  if (!customer) return { error: t("customerNotFound") };

  const phone = parsed.data.phone?.trim() || null;
  if (phone && phone !== customer.phone) {
    const dup = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId: session.businessId, phone } },
    });
    if (dup) return { error: t("phoneTaken") };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email?.trim() || null,
      phone,
      notes: parsed.data.notes?.trim() || null,
      birthday: parseBirthday(formData.get("birthday")),
    },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
  return { ok: true };
}

// Búsqueda rápida por teléfono (para cargar puntos ágil en el mostrador).
// Devuelve el id del cliente si hay coincidencia exacta o única por nombre/email.
export async function findCustomerAction(query: string): Promise<{ id: string } | { id: null }> {
  const session = await requireSession();
  const q = query.trim();
  if (!q) return { id: null };

  const exactPhone = await prisma.customer.findFirst({
    where: { businessId: session.businessId, phone: q },
    select: { id: true },
  });
  if (exactPhone) return { id: exactPhone.id };

  const matches = await prisma.customer.findMany({
    where: {
      businessId: session.businessId,
      OR: [
        { phone: { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true },
    take: 2,
  });
  return matches.length === 1 ? { id: matches[0].id } : { id: null };
}

export async function deleteCustomerAction(customerId: string): Promise<void> {
  const session = await requireSession();
  if (session.role === "STAFF") return; // sólo dueño/admin elimina clientes
  await prisma.customer.deleteMany({
    where: { id: customerId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
