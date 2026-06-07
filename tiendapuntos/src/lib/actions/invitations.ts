"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, hashPassword, createSession } from "@/lib/auth";
import { planConfig } from "@/lib/plans";
import { sendEmail, inviteEmail } from "@/lib/email";
import { inviteUrl } from "@/lib/app-url";

export type ActionState = { error?: string; ok?: boolean; link?: string } | undefined;

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "STAFF"]),
});

const INVITE_TTL_DAYS = 7;

export async function createInvitationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (session.role === "STAFF") return { error: "No tenés permisos para esto" };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Ya existe un usuario con ese email" };

  // El cupo de equipo del plan cuenta usuarios actuales + invitaciones pendientes.
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const teamLimit = business ? planConfig(business.plan).teamLimit : null;
  if (teamLimit !== null) {
    const [users, pending] = await Promise.all([
      prisma.user.count({ where: { businessId: session.businessId } }),
      prisma.invitation.count({
        where: { businessId: session.businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);
    if (users + pending >= teamLimit) {
      return {
        error: `Tu plan ${business!.plan} permite hasta ${teamLimit} miembros (incluyendo invitaciones pendientes). Mejorá tu plan para sumar más.`,
      };
    }
  }

  // Reemplazamos cualquier invitación previa al mismo email.
  await prisma.invitation.deleteMany({
    where: { businessId: session.businessId, email, acceptedAt: null },
  });

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: { businessId: session.businessId, email, role: parsed.data.role, token, expiresAt },
  });

  const link = inviteUrl(token);
  const mail = inviteEmail(business?.name ?? "tu negocio", link);
  await sendEmail({ to: email, subject: mail.subject, text: mail.text });

  revalidatePath("/dashboard/settings");
  return { ok: true, link };
}

export async function revokeInvitationAction(invitationId: string): Promise<void> {
  const session = await requireSession();
  if (session.role === "STAFF") return;
  await prisma.invitation.deleteMany({
    where: { id: invitationId, businessId: session.businessId },
  });
  revalidatePath("/dashboard/settings");
}

const acceptSchema = z.object({
  name: z.string().min(2, "Ingresá tu nombre"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function acceptInvitationAction(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = acceptSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return { error: "La invitación no es válida o expiró" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) return { error: "Ya existe una cuenta con ese email" };

  const user = await prisma.user.create({
    data: {
      businessId: invitation.businessId,
      email: invitation.email,
      name: parsed.data.name.trim(),
      password: await hashPassword(parsed.data.password),
      role: invitation.role,
    },
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  await createSession({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  redirect("/dashboard");
}
