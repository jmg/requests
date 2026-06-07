"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { planConfig } from "@/lib/plans";

export type ActionState = { error?: string; ok?: boolean } | undefined;

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
  const limit = business ? planConfig(business.plan).customerLimit : null;
  if (limit !== null) {
    const count = await prisma.customer.count({ where: { businessId: session.businessId } });
    if (count >= limit) {
      return {
        error: t("customerLimit", { limit, plan: business!.plan }),
      };
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

  const customer = await prisma.customer.create({
    data: {
      businessId: session.businessId,
      name: parsed.data.name.trim(),
      email: parsed.data.email?.trim() || null,
      phone,
      notes: parsed.data.notes?.trim() || null,
    },
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
  await prisma.customer.deleteMany({
    where: { id: customerId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
