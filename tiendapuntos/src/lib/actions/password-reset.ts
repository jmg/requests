"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";

export type RequestState = { ok?: boolean; error?: string; link?: string } | undefined;
export type ResetState = { error?: string } | undefined;

const RESET_TTL_MIN = 60;

export async function requestPasswordResetAction(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const t = await getTranslations("errors");
  const schema = z.object({ email: z.string().email(t("invalidEmail")) });
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Respondemos siempre ok (no revelamos si el email existe).
  if (!user) return { ok: true };

  const token = randomBytes(24).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60 * 1000),
    },
  });

  const link = `${appUrl()}/reset/${token}`;
  await sendEmail({
    to: email,
    subject: "TiendaPuntos — Restablecer contraseña",
    text: `Restablecé tu contraseña con este link (vence en ${RESET_TTL_MIN} minutos): ${link}`,
  });

  // El email está stubbeado: devolvemos el link para poder probar en la demo.
  return { ok: true, link };
}

export async function resetPasswordAction(
  token: string,
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const t = await getTranslations("errors");
  const schema = z.object({ password: z.string().min(6, t("passwordMin")) });
  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { error: t("resetInvalid") };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { password: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}
