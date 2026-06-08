"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { stripeEnabled, getStripe } from "@/lib/stripe";
import { mpEnabled, createMpPreference } from "@/lib/mercadopago";
import { changePlanAction } from "@/lib/actions/settings";
import { appUrl } from "@/lib/app-url";

export type UpgradeResult = { error?: string; url?: string; simulated?: boolean };

// Inicia el upgrade a Pro con Mercado Pago (Checkout Pro). Sin token, simula.
export async function startMercadoPagoUpgradeAction(): Promise<UpgradeResult> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  if (!mpEnabled()) {
    await changePlanAction("PRO");
    return { simulated: true };
  }

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };

  const url = await createMpPreference({
    businessId: business.id,
    title: "TiendaPuntos Pro",
    successUrl: `${appUrl()}/dashboard/billing?success=1`,
  });
  return { url };
}

// Inicia el upgrade a Pro. Con Stripe configurado devuelve la URL del Checkout;
// sin Stripe, cambia el plan en modo simulado.
export async function startUpgradeAction(): Promise<UpgradeResult> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  if (!stripeEnabled()) {
    await changePlanAction("PRO");
    return { simulated: true };
  }

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };

  const stripe = getStripe();

  // Aseguramos un customer de Stripe asociado al negocio.
  let customerId = business.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: business.name,
      metadata: { businessId: business.id },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
    success_url: `${appUrl()}/dashboard/billing?success=1`,
    cancel_url: `${appUrl()}/dashboard/billing?canceled=1`,
    metadata: { businessId: business.id },
  });

  return { url: checkout.url ?? undefined };
}

// Cancela la suscripción (o baja a Free en modo simulado).
export async function cancelSubscriptionAction(): Promise<UpgradeResult> {
  const session = await requireSession();
  const t = await getTranslations("errors");
  if (session.role === "STAFF") return { error: t("noPermission") };

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return { error: t("businessNotFound") };

  if (stripeEnabled() && business.stripeSubscriptionId) {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(business.stripeSubscriptionId);
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { plan: "FREE", planSince: new Date(), stripeSubscriptionId: null },
  });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return { simulated: !stripeEnabled() };
}
