"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  createSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const schema = z.object({ name: z.string().min(2, t("enterYourName")) });
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data.name.trim() },
  });

  // Reemitimos la sesión para reflejar el nombre nuevo.
  await createSession({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");

  const schema = z.object({
    current: z.string().min(1, t("enterPassword")),
    next: z.string().min(6, t("passwordMin")),
  });
  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: t("userNotFound") };

  if (!(await verifyPassword(parsed.data.current, user.password))) {
    return { error: t("wrongCurrentPassword") };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(parsed.data.next) },
  });

  return { ok: true };
}
