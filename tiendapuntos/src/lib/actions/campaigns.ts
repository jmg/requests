"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { getSegmentCustomers, isSegment } from "@/lib/segments";

export type ActionState = { error?: string; ok?: boolean; count?: number } | undefined;

export async function createCampaignAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  const schema = z.object({
    segment: z.string().refine(isSegment, t("invalidData")),
    message: z.string().min(3, t("messageShort")),
  });

  const parsed = schema.safeParse({
    segment: formData.get("segment"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const segment = parsed.data.segment;
  if (!isSegment(segment)) return { error: t("invalidData") };

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };

  const recipients = await getSegmentCustomers(session.businessId, segment);
  if (recipients.length === 0) return { error: t("noRecipients") };

  // Envío stub: a cada cliente con email se le manda el mensaje (se loguea).
  for (const r of recipients) {
    if (r.email) {
      await sendEmail({
        to: r.email,
        subject: `${business.name}`,
        text: parsed.data.message,
      });
    }
  }

  await prisma.campaign.create({
    data: {
      businessId: session.businessId,
      segment,
      message: parsed.data.message.trim(),
      recipientCount: recipients.length,
    },
  });

  revalidatePath("/dashboard/campaigns");
  return { ok: true, count: recipients.length };
}
