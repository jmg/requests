"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { planConfig } from "@/lib/plans";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const customerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

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
        error: `Alcanzaste el límite de ${limit} clientes del plan ${business!.plan}. Mejorá tu plan para sumar más.`,
      };
    }
  }

  const phone = parsed.data.phone?.trim() || null;

  if (phone) {
    const dup = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId: session.businessId, phone } },
    });
    if (dup) {
      return { error: "Ya existe un cliente con ese teléfono" };
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
  if (!customer) return { error: "Cliente no encontrado" };

  const phone = parsed.data.phone?.trim() || null;
  if (phone && phone !== customer.phone) {
    const dup = await prisma.customer.findUnique({
      where: { businessId_phone: { businessId: session.businessId, phone } },
    });
    if (dup) return { error: "Ya existe un cliente con ese teléfono" };
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

export async function deleteCustomerAction(customerId: string): Promise<void> {
  const session = await requireSession();
  await prisma.customer.deleteMany({
    where: { id: customerId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
