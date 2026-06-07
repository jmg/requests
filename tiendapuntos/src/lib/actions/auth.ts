"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string } | undefined;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("errors");

  const registerSchema = z.object({
    businessName: z.string().min(2, t("businessNameShort")),
    name: z.string().min(2, t("enterYourName")),
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(6, t("passwordMin")),
  });

  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { businessName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: t("emailTaken") };
  }

  // Generamos un slug único para el negocio.
  const base = slugify(businessName) || "negocio";
  let slug = base;
  let i = 1;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      password: passwordHash,
      role: "OWNER",
      business: {
        create: {
          name: businessName,
          slug,
        },
      },
    },
    include: { business: true },
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

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("errors");

  const loginSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("enterPassword")),
  });

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return { error: t("invalidCredentials") };
  }

  await createSession({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  destroySession();
  redirect("/login");
}
