"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, hashPassword } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const businessSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  pointsName: z.string().min(1, "Ingresá el nombre de los puntos"),
  pointsPerCurrency: z.coerce.number().positive("Debe ser un número mayor a 0"),
  currency: z.string().min(1).max(5),
});

export async function updateBusinessAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (session.role === "STAFF") return { error: "No tenés permisos para esto" };

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    pointsName: formData.get("pointsName"),
    pointsPerCurrency: formData.get("pointsPerCurrency"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.business.update({
    where: { id: session.businessId },
    data: {
      name: parsed.data.name.trim(),
      pointsName: parsed.data.pointsName.trim(),
      pointsPerCurrency: parsed.data.pointsPerCurrency,
      currency: parsed.data.currency.trim().toUpperCase(),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Invitar / crear un usuario adicional para el negocio (equipo).
const teamSchema = z.object({
  name: z.string().min(2, "Ingresá el nombre"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function createTeamMemberAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (session.role === "STAFF") return { error: "No tenés permisos para esto" };

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe un usuario con ese email" };

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
  if (session.role === "STAFF") return { error: "No tenés permisos para esto" };
  if (userId === session.userId) return { error: "No podés eliminar tu propio usuario" };

  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: session.businessId },
  });
  if (!target) return { error: "Usuario no encontrado" };
  if (target.role === "OWNER") return { error: "No se puede eliminar al dueño" };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
